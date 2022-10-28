This tool is used to add Government of BC employee ArcGIS Online accounts to a specific group. 


## Usage

### Basic Usage - Report includes all publicly shared webmaps
```bash

npm i # install packages
node src/index.js # or npm run start

```

1. Type your BC MapHub admin username and press Enteer.
2. Type your password and press Enter.

## Strategy
The script first retrieves a list of the user currently in the group. The script then retrieves a list of all users in our governmentofbc ArcGIS Online organization and filters the list to only include those ending with '_governmentofbc'. This filtered list is compared to the group list and users missing from the group list are then added to it.