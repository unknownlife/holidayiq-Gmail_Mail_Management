from apiclient import discovery
from apiclient import errors
from httplib2 import Http
from oauth2client import file, client, tools
import base64
from bs4 import BeautifulSoup
import time
import dateutil.parser as parser
import csv
import os
from io import open
import cPickle as pickle
import json
#import MySQLdb
#import pyodbc
import pymysql
import sys


hostname='172.16.100.50'
username='root'
password='root123'
database='message_track'
myConnection = pymysql.connect( host=hostname, user=username, passwd=password, db=database ) #create connection
cur = myConnection.cursor()

#Creating a credentials.JSON file with authentication details
SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'
store = file.Storage('credentials.json') 
creds = store.get()
if not creds or creds.invalid:
    flow = client.flow_from_clientsecrets('client_secret.json', SCOPES)
    creds = tools.run_flow(flow, store)

GMAIL = discovery.build('gmail', 'v1', http=creds.authorize(Http()))

user_id =  'me'
label_id_one = 'INBOX'
#label_id_two = 'UNREAD'

# Getting all the unread messages from Inbox , label_id_two
unread_msgs = GMAIL.users().messages().list(userId='me',labelIds=[label_id_one], maxResults=6).execute()
#print ("unread_msgs: ", unread_msgs)
# We get a dictonary. Now reading values for the key 'messages'
mssg_list = unread_msgs['messages']

#print ("Total unread messages in inbox: ", str(len(mssg_list)))

final_list = [ ]


for mssg in mssg_list:
	temp_dict = { }
	temp_dict['lead_id']="NULL"
	temp_dict['Subject']="NULL"
	temp_dict['Date']="NULL"
	temp_dict['Time']="NULL"
	temp_dict['vend_detail']="NULL"
	temp_dict['Cc'] = "NULL"
	temp_dict['Message_body']="NULL"
	temp_dict['user_name']="NULL"
	temp_dict['user_mail']="NULL"
	temp_dict['recv']="0"
	m_id = mssg['id']
	m_thread_id = mssg['threadId']
	message = GMAIL.users().messages().get(userId=user_id, id=m_id).execute() # fetch the message
	user_profile = GMAIL.users().getProfile(userId='me').execute()
	user_email = user_profile['emailAddress'] 
	payld = message['payload'] # get payload of the message 
	headr = payld['headers'] # get header of the payload

	for one in headr: # getting the Subject
		if one['name'] == 'Subject':
			msg_subject = one['value']
			temp_dict['Subject'] = msg_subject
			try :
				msg_s = one['value']
				ind = msg_s.index("o:") + 3
				lead_id_full = msg_s[ind:] 
				ind2 = lead_id_full.index(" ")
				lead_id = lead_id_full[:ind2]
				temp_dict['lead_id']=lead_id
			except :
				pass
		else:
			pass


	for two in headr: # getting the date
		if two['name'] == 'Date':
			msg_date = two['value']
			date_parse = (parser.parse(msg_date))
			m_date = (date_parse.date())
			m_time = (date_parse.time())
			temp_dict['Date'] = str(m_date)
			temp_dict['Time'] = str(m_time)
		else:
			pass

	# for three in headr: # getting the Sender
	# 	if three['name'] == 'From':
	# 		msg_f = three['value']
	# 		for i in xrange(len(msg_f)):
	# 			if ( msg_f[i] == '<'):
	# 				msg_name = msg_f[0:i-1]
	# 				msg_from = msg_f[i+1:len(msg_f)-1]
	# 		temp_dict['Sender'] = msg_from
	# 		temp_dict['Sender_Name'] = msg_name
	# 	else:
	# 		pass
	for four in headr: # getting time of message
		if four['name'] == 'To':
			msg_to = four['value']
			temp_dict['vend_detail'] = msg_to
			if msg_to == user_email :
				temp_dict['recv'] = "1"
		else:
			pass

	for five in headr: # getting the CC
		if five['name'] == 'Cc':
			msg_from = five['value']
			temp_dict['Cc'] = msg_from
		else:
			temp_dict['Cc'] = "NULL"

	try:
		pd=message['payload']['parts'][1]['body']['data']
		co = pd.replace("-","+") # decoding from Base64 to UTF-8
		co = co.replace("_","/") # decoding from Base64 to UTF-8
		ct = base64.b64decode(bytes(co)).decode('UTF-8')
		sp = BeautifulSoup(ct, "lxml" )
		temp_dict['Message_body'] = unicode(sp)

		mssg_parts = payld['parts'] # fetching the message parts
		part_one  = mssg_parts[0] # fetching first element of the part 
		part_body = part_one['body'] # fetching body of the message
		part_data = part_body['data'] # fetching data from the body
		clean_one = part_data.replace("-","+") # decoding from Base64 to UTF-8
		clean_one = clean_one.replace("_","/") # decoding from Base64 to UTF-8
		print("\n")
		#print ("paylod parts",clean_one)
		print("\n")
		#clean_two = base64.b64decode (bytes(clean_one, 'UTF-8')) # decoding from Base64 to UTF-8
		clean_two = base64.b64decode(bytes(clean_one)).decode('UTF-8')
		#print ("test clean ",clean_two.splitlines())
		soup = BeautifulSoup(clean_two , "lxml" )
		#print ("soup", soup)
		mssg_body = soup.body() # mssg_body is a readible form of message body
		#print("msg body",r(mssg_body))
		mssg_body=str(mssg_body)
		# temp_dict['Message_body'] = mssg_body
		try :
			inde = mssg_body.index("Name") + 5
			x = mssg_body[inde:]
			index2 = x.index("\\r")
			u_name = x[:index2]
			temp_dict['user_name'] = u_name

			index3 = mssg_body.index("Email") + 6
			x = mssg_body[index3:]
			index2 = x.index("\\r")
			u_mail = x[:index2]
			temp_dict['user_mail'] = u_mail
		except :
			pass
	except :
		pass
	#print (temp_dict)
	myConnection = pymysql.connect( host=hostname, user=username, passwd=password, db=database ) #create connection
	cur = myConnection.cursor()
	sql = """INSERT INTO raw_data VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""" 
	arg = (m_id, m_thread_id, temp_dict['lead_id'], temp_dict['user_name'], temp_dict['user_mail'], temp_dict['vend_detail'], temp_dict['Cc'], temp_dict['Subject'], temp_dict['Date'], temp_dict['Time'], temp_dict['Message_body'],  temp_dict['recv'])

	#sql = "select * from raw_data"
	cur.execute(sql,arg)
	myConnection.commit()
	'''for sender, msg_subject, msg_date, msg_body in cur.fetchall() :
		print("\n")
		print (sender, msg_body)
		print("\n")
	'''
	#doQuery( myConnection )
	final_list.append(temp_dict) # This will create a dictonary item in the final list
	
	# This will mark the message from read to unread
	#GMAIL.users().messages().modify(userId=user_id, id=m_id,body={ 'removeLabelIds': ['UNREAD']}).execute() 
	



print ("Total messaged retrived: ", str(len(final_list)))

myConnection.close()