This tool is used to add Government of BC employee ArcGIS Online accounts to a specific group. 

The tool is intended to be run by a Jenkins job, but can be run from a command line using Python associated with an ArcGIS Pro installation.
## Usage

### Basic Usage - Report includes all publicly shared webmaps
```bash

python ago-group-update.py -user {admin_username} -pwd {password} -group {itemId_of_group_to_update}}

```
Note the username and password are both case sensitive!

## Strategy
The script first retrieves a list of the users currently in the group. The script then retrieves a list of all users in the governmentofbc ArcGIS Online organization and filters the list to only include those with a username that includes '_governmentofbc' and with an email address ending with '@gov.bc.ca'. This filtered list is compared to the group list and users missing from the group list are then added to it in batches of 25 (AGO REST API limit).