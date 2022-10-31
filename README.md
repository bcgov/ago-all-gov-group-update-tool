This tool is used to add Government of BC employee ArcGIS Online accounts to a specific group. 


## Usage

### Basic Usage - Report includes all publicly shared webmaps
```bash

npm i # install packages
node src/index.js --username={AGO_username} --password={AGO_password} --group={group_itemId}

```

### Alternate Usage - Report includes all publicly shared webmaps
```bash

npm i # install packages
npm run start -- --username={AGO_username} --password={AGO_password} --group={group_itemId}

```

## Strategy
The script first retrieves a list of the users currently in the group. The script then retrieves a list of all users in the governmentofbc ArcGIS Online organization and filters the list to only include those with a username that includes '_governmentofbc' and with an email address ending with '@gov.bc.ca'. This filtered list is compared to the group list and users missing from the group list are then added to it in batches of 25 (AGO REST API limit).