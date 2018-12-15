#!/usr/bin/env python

from apiclient import discovery
from apiclient import errors
from httplib2 import Http
from oauth2client import file, client, tools


# Creating a storage.JSON file with authentication details
SCOPES = 'https://www.googleapis.com/auth/gmail.readonly' # different scopes available but best is modify
store = file.Storage('credentials.json') 
creds = store.get()
if not creds or creds.invalid:
    flow = client.flow_from_clientsecrets('client_secret.json', SCOPES)
    creds = tools.run_flow(flow, store)
GMAIL = discovery.build('gmail', 'v1', http=creds.authorize(Http()))