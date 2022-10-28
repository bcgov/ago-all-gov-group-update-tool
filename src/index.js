const axios = require("axios");
const fs = require("fs");
const YAML = require("yaml");
const { URLSearchParams } = require("url");
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')


// The root/base URL used for making REST API requets to the governmentofbc AGOL organization
const BASE_URL = "https://governmentofbc.maps.arcgis.com/sharing/rest";

// The length of time the REST API token is valid for.
const TOKEN_EXPIRATION_MINUTES = 60;

// Global variable to hold the item Id of the group to add members to.
let groupItemId;

// Global variable to hold onto a token for accessing the AGOL REST API
let token;

/**
 * Get all user objects from the provided URL. The AGOL REST API
 * will only return 100 users per request, so this function pages
 * through all possible users and returns an array of user objects.
 */
async function getUsers(url) {
    let users = [];
    let page = 1;

    do {
        var result = await getPageOfUsers(url, page);
        users = [...users, ...result.users];
        page++;
        
    } while (~result.nextStart)

    return users;
}

/**
 * Gets a single page of users from the given URL. The 'page' parameter
 * is a multiplier used to calculate the starting point at which users
 * should be returned from. Eg. a page value of 3 will result in this
 * function returning users 201 - 300.
 */
async function getPageOfUsers(url, page) {
    if (page === 1) {
        console.log(`Fetching page 1 of users.`);
    } else {
        console.log(`Fetching page ${page} of users.`);
    }

    let params = new URLSearchParams({
        num: 100,
        start: page * 100 - 99,
        f: "json",
        token
    });

    const requestUrl = `${url}${params}`
    const response = await axios.get(requestUrl);

    return response.data;
}

/** 
 * Gets a token from ArcGIS Online using the supplied username and password.
 */
async function getToken(username, password) {
    const form = new URLSearchParams(
        {
            username,
            password,
            expiration: TOKEN_EXPIRATION_MINUTES,
            referer: BASE_URL,
            f: "json"
        }
    );
    
    const response = await axios({
        method: "post",
        url: `${BASE_URL}/generateToken`, 
        data: form.toString(),
        config: {
            headers: {
                "Content-Type": "multipart/form-data"
        }}
    });

    if (response.data && response.data.error) {
        console.error(response.data.error);
        throw Error("An error occurred. Unable to retrieve token. Note that your username and password are case sensitive.");
    }

    return response.data.token;
}

/**
 * Given an array of users in a group and an array of users in the
 * AGOL organization, returns all users in the organization that have a
 * name containing '_governmentofbc' and an email address ending in @gov.bc.ca
 * (ie. IDIR users) who are not present in the group.
 */
function getUsersToAdd(groupMembers, orgMembers) {
    const groupMemberUsernames = groupMembers.map(gm => gm.username);
    orgMembers = orgMembers.filter(om => om.username.indexOf("_governmentofbc") > -1 && om.email.indexOf("@gov.bc.ca") > -1);
    console.log(`There are ${orgMembers.length} IDIR users in the governmentofbc AGOL organization.`);

    const idirMemberUsernames = orgMembers.map(om => om.username);
    const usersToAdd = [];

    for (const name of idirMemberUsernames) {
        if (groupMemberUsernames.indexOf(name) === -1) {
            usersToAdd.push(name);
        }
    }

    return usersToAdd;
}

/**
 * Given an array of users to add to the group specified by the group
 * with itemId 'groupItemId', this function pages through the users in batches
 * of 25 (the max supported by the AGOL REST API) and adds them to the group.
 */
async function addUsersToGroup(usersToAdd) {
    let userNames;

    do {
        if (usersToAdd.length >= 25) {
            userNames = usersToAdd.slice(0, 25);
            usersToAdd = usersToAdd.splice(25, usersToAdd.length - 25);
        } else {
            userNames = usersToAdd.slice(0, usersToAdd.length);
            usersToAdd = []
        }

        await addUserNamesToGroup(userNames);
    } while (usersToAdd.length)
}

/**
 * Adds the provided usernames to the group identified by itemId 'groupItemId'.
 */
async function addUserNamesToGroup(userNames) {
    const form = new URLSearchParams({
        users: userNames.join(),
        f: "json"
    });

    const response = await axios({
        config: {
            headers: {
                "Content-Type": "multipart/form-data"
        }},
        data: form.toString(),
        method: "post",
        url: `${BASE_URL}/community/groups/${groupItemId}/addUsers?&token=${token}`
    });

    if (response.data.error) {
        console.error(response.data.error);
        throw Error("An error occurred while adding users to the group.");
    }
}

async function main() {
    const argv = yargs(hideBin(process.argv)).argv
    const username = argv.username;
    const password = argv.password;
    groupItemId = argv.group;
    token = await getToken(username, password);

    console.log(`Preparing to fetch users fron the group with itemId: ${groupItemId}`);
    const groupUserListUrl = `${BASE_URL}/community/groups/${groupItemId}/userList?`
    const groupMembers = await getUsers(groupUserListUrl);
    console.log(`There are ${groupMembers.length} users in the group with itemId ${groupItemId}.`);
    console.log("");

    console.log("Preparing to fetch all users in the governmentofbc AGOL organization.");
    const orgUsersUrl = `${BASE_URL}/portals/self/users?`;
    const orgMembers = await getUsers(orgUsersUrl);
    console.log(`There are ${orgMembers.length} users in your AGOL organization.`);
    console.log("");

    const usersToAdd = getUsersToAdd(groupMembers, orgMembers);

    if (!usersToAdd.length) {
        console.log(`There are no members to be added to the group with itemId ${groupItemId}.`);
        process.exit();
    } else if (usersToAdd.length === 1) {
        console.log(`There is 1 member to add to the group with itemId ${groupItemId}.`);
    } else {
        console.log(`There are ${usersToAdd.length} members to add to the group with itemId ${groupItemId}.`);
    }

    const timestamp = Date.now();
    const fileName = `users_${timestamp}.yml`;
    
    console.log(`Writing a list of the usernames that will be added to the group to a file called ${fileName}.`);
    
    if (usersToAdd && usersToAdd.length) {
        fs.writeFileSync(`./${fileName}`, YAML.stringify(usersToAdd));
    }

    console.log("********************");
    console.log(usersToAdd.join());
    console.log("********************");
    // addUsersToGroup(usersToAdd);

    console.log("Finished updating group members.");
}

// ----------
// Run script
// ----------
main();