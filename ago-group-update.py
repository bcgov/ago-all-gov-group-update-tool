import arcpy
import argparse
from arcgis.gis import GIS


# Adds users to the group in batches of 25 (the max allowed by the REST API)
def add_users_to_group(group_obj, users):
    counter = 1
    while len(users) > 0:
        user_subset = []
        if len(users) <= 25:
            user_subset = users
            users = []
        else:
            user_subset = users[:25]
            users = users[25:]
        group_obj.add_users(usernames=user_subset)
        

def main():
    # ----------
    # Constants
    # ----------
    AGO_URL = "https://governmentofbc.maps.arcgis.com"
    DEFAULT_USER = "Province.Of.British.Columbia"
    DEFAULT_GROUP = "23fe22d4f7c54475958319baecbd5b28"
    MAX_USERS = 1000

    # ----------
    # Parameters
    # ----------
    argParser = argparse.ArgumentParser(description='Adds government IDIR users to the specified group.')
    argParser.add_argument('-user', dest='user', action='store', default=DEFAULT_USER, required=False, help='the ArcGIS Online User to use')
    argParser.add_argument('-pwd', dest='password', action='store', default=None, required=True, help='the ArcGIS Online User password')
    argParser.add_argument('-group', dest='group', action='store', default=DEFAULT_GROUP, required=False, help='the ArcGIS Online User password')

    try:
       args = argParser.parse_args()
    except argparse.ArgumentError as e:
       argParser.print_help()
       sys.exit(1)

    print(f'\nConnecting to {AGO_URL}')
    arcpy.SignInToPortal(AGO_URL, username=args.user, password=args.password)
    gis = GIS(url=AGO_URL, username=args.user, password=args.password, verify_cert=False)

    # Get all users in the organization associated with IDIR based accounts
    print('\nRetrieving list of all BC Map Hub users')
    all_org_users = gis.users.search(max_users=MAX_USERS)
    govt_users = list(filter(lambda user: '_governmentofbc' in user.username and user.email.endswith('@gov.bc.ca'), all_org_users))
    print(f'\nNumber of users in BC MapHub: {len(all_org_users)}')
    print(f'\nNumber of government users in BC MapHub: {len(govt_users)}')

    print(f'\nSearching for group: {args.group}')
    group_search_result = gis.groups.search(query=f'id:{args.group}')

    if len(group_search_result) == 0:
        print
        print('\nCould not find the specified group.')

    target_group = group_search_result[0]
    target_group_members = target_group.get_members()
    target_group_users = target_group_members['users']

    print(f'\nNumber of users in target group: {len(target_group_users)}')
    users_to_add = []

    for user in govt_users:
        if user.username not in target_group_users:
            users_to_add.append(user.username)
          
    if (len(users_to_add) > 0):
        print(f'\nNumber of users to add: {len(users_to_add)}')
        print('\nAdding the following users to the group:')
        for user in users_to_add:
            print(user)
        add_users_to_group(target_group, users_to_add)
        
    else:
        print('\nNo new users to add')
    
    
# -----------------------------------------------------------------------------
# Main entry point
# -----------------------------------------------------------------------------

if __name__ == "__main__":
  main()
