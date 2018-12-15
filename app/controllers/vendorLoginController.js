var mysqlService = require('../services/mysqlService');
var mysql = require('mysql');
const bodyParser = require('body-parser');
var config;

var moment = require('moment');

const fs = require('fs');
const {google} = require('googleapis');
var googleAuth = require('google-auth-library');
const TOKEN_PATH = 'credentials.json';

config = require('../../config/development_mail');

const { spawn } = require('child_process');

// var req = require('req');

var DB_CONFIG = {
	host     : config.mysql.HOST,
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
	database : config.mysqlData.rawData.NAME
};

var DB_CONFIG123 = {
	host     : config.mysql.HOST,
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
	database : config.mysqlData123.rawData.NAME
};

var DB_CONFIG_ALL = {
	host     : config.mysql.HOST,
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
};

var mysql_connection;
var mysql_connection123;
var mysql_connection_all;
function handleDisconnect() {
	
	mysql_connection = mysql.createConnection(DB_CONFIG);
	mysql_connection123 = mysql.createConnection(DB_CONFIG123);
	mysql_connection_all = mysql.createConnection(DB_CONFIG_ALL);

	mysql_connection.connect(function(err) {
		if(err) {
			console.log('error when connecting to db', err);
			setTimeout(handleDisconnect, 2000);
		}
	});
	mysql_connection.on('error', function(err) {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		} else {
			throw err;
		}
	});

	mysql_connection123.connect(function(err) {
		if(err) {
			console.log('error when connecting to db', err);
			setTimeout(handleDisconnect, 2000);
		}
	});
	mysql_connection123.on('error', function(err) {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		} else {
			throw err;
		}
	});

	mysql_connection_all.connect(function(err) {
		if(err) {
			console.log('error when connecting to db', err);
			setTimeout(handleDisconnect, 2000);
		}
	});
	mysql_connection_all.on('error', function(err) {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		} else {
			throw err;
		}
	});
}

handleDisconnect();

exports.vendorAuth = function(req, res, next){
	res.render('../views/mail/intro',{});
}

exports.vendorLogin = function(req, res, next){
	var data = {};
	const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
	fs.readFile('client_secret.json', (err, content) => {
		if(err){
			console.log(err);
		}
		else{
			var credentials = JSON.parse(content);
			const {client_secret, client_id, redirect_uris} = credentials.installed;
			const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
			const authUrl = oAuth2Client.generateAuthUrl({access_type: 'offline',scope: SCOPES});
			data.url = authUrl;
		}
		res.render('../views/mail/url',{
			data : data
		});
		// console.log('Login reached');
	});

}

exports.vendorPySign = function(req, res, next){
	// console.log('pysign: ');
	// console.log(req.body.email);
	// var mail = req.body.email;
	const pyProg = spawn('python', ['fetch_sent.py']);
    pyProg.stdout.on('data', function(data) {

		console.log(' python :')
    	console.log(data.toString());
        // res.write(data);
		// res.end('end');
		// res.redirect('vendor/generate/list');
		});
	// var query = "SELECT *,sum(recv_hiq) as hrecv,sum(sent_user) as usent, sum(sent_vendor) as vsent FROM  raw_data GROUP BY lead_id order by msg_time desc";
	var query = "select * from (SELECT *,sum(recv_hiq) as hrecv,sum(sent_user) as usent, sum(sent_vendor) as vsent FROM  raw_data GROUP BY lead_id order by msg_date) as t join(select lead_id as li, msg_subject as ms, msg_date as mt from raw_data where msg_date in ( select max(msg_date) from raw_data GROUP BY lead_id) order by msg_date desc) t2 on t.lead_id = t2.li order by mt desc";
	mysql_connection.query(query, function(err, result){
		if(err){
				res.render('mail/list', {
					title: 'Vendor List', 
					data: ''
				})
		}
		else{
			var i = 0;
			result.forEach(async function(user){
				var leadid = user.lead_id.substring(1);
				var resul =  await test(leadid);
				console.log("resul");
				console.log(resul);
				  result[i].status = resul;
				  console.log(result[i].status);
					i=i+1;
			})
			var i = 0;
			result.forEach( function(user){
				result[i].time = moment(user.mt, "YYYY-MM-DD HH:mm:ss").fromNow();
				i=i+1;
				})
			
				// exports.test(leadid).then(function(resul){
				// 	console.log("resul");
				//  console.log(resul);
				//  result[i].status = resul;
				//  i=i+1;
				//  console.log("i");
				//  console.log(i);
				// });
				// console.log(i);

				//  console.log("resul");
				//  console.log(resul);
				// var query321 = "select * from indiaresorts.vendor_disposition_data where assignment_id="+mysql.escape(leadid);
				// var resul;
				// console.log("hello123");
				// console.log(leadid);
				// mysql_connection_all.query(query321, function(err, result321){
				// 	if(err){
				// 		resul = "New"
				// 		console.log('err');
				// 	}
				// 	else{
				// 		resul = result321.lead_status ;
				// 		console.log("hello")
				// 		console.log(resul);
				// 		// console.log(aaa);
				// 	}
				// });
				// resul = mysql_connection_all.query(query321);
				// console.log("Result");
				
				// var mail = user.user_mail;
				// var que = "SELECT destleadid FROM dest_leads_data where email = " + mysql.escape(mail);
				// mysql_connection123.query(que, function(err, res_lead){
				// 	if(err){
				// 		req.flash('error', err)
				// 	}
				// 	else{
						
				// 	}
				// });
				console.log(result[0].status);
			res.render('mail/list', {
				title: 'Vendor List', 
				data: result
			})
		}
	});
}

function test (leadid){
	return new Promise(function(resolve,reject) {
		var query321 = "select * from indiaresorts.vendor_disposition_data where assignment_id="+mysql.escape(leadid);
		var resul = "abc";
		// console.log("hello123");
		// console.log(leadid);
		mysql_connection_all.query(query321, function(err, result321){
			if(err){
				console.log('err');
			}
			else{
				try{
				resul = result321[0].lead_status ;
				
				}
				catch(error){
					resul = "New";
				}
				// console.log("hello")
				// console.log(query321);
				// console.log(result321);
				// console.log(resul);
				// console.log(aaa);
				resolve(resul);
			}
			
		});
	});
	
	// resul = mysql_connection_all.query(query321);
	// console.log("Result");	
	// console.log(resul);

}

exports.vendorGenerate = function(req, res, next){
	  // Load client secrets
	  console.log('body: ');
	  console.log(req.body);
	  var code = req.body.key;
	fs.readFile('client_secret.json', function(err, data) {
		if (err) return console.log('Error loading client secret file:', err);
		var credentials = JSON.parse(data);
		const {client_secret, client_id, redirect_uris} = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return callback(err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			  if (err) return console.error(err);
			  console.log('Token stored to', TOKEN_PATH);
			});
		  });
		res.render('../views/mail/home',{
			title : "successful"
		});
	});
}

exports.vendorHome = function(req,res,next){
	res.render('../views/mail/home',{
		title : "successful"
	});
}

exports.vendorListFilter = function(req, res, next){

	var query = "select * from (select * from (SELECT *,sum(recv_hiq) as hrecv,sum(sent_user) as usent, sum(sent_vendor) as vsent FROM  raw_data GROUP BY lead_id order by msg_date) as t join(select lead_id as li, msg_subject as ms, msg_date as mt from raw_data where msg_date in ( select max(msg_date) from raw_data GROUP BY lead_id) order by msg_date desc) t2 on t.lead_id = t2.li order by mt desc) as tnew join(select * from indiaresorts.vendor_disposition_data) vdd on vdd.assignment_id" + mysql.escape("D") +"=tnew.li where vdd.lead_status = " +  mysql.escape(req.body.id);
	// var query = "select * from (SELECT *,sum(recv_hiq) as hrecv,sum(sent_user) as usent, sum(sent_vendor) as vsent FROM  raw_data GROUP BY lead_id order by msg_date) as t join(select lead_id as li, msg_subject as ms, msg_date as mt from raw_data where msg_date in ( select max(msg_date) from raw_data GROUP BY lead_id) order by msg_date desc) t2 on t.lead_id = t2.li where status="+ mysql.escape(req.body.id)+ "order by mt desc";
	mysql_connection_all.query(query, function(err, result){
		if(err){
				res.render('mail/list', {
					title: 'Vendor List', 
					data: ''
				})
		}
		else{
			var i = 0;
			result.forEach(function(user){
				result[i].time = moment(user.mt, "YYYY-MM-DD HH:mm:ss").fromNow();
				var leadid = user.lead_id.substring(1);
				var query321 = "select * from vendor_disposition_data where assignment_id="+leadid;
				mysql_connection123.query(query321, function(err, result321){
					if(err){
						result[i].status = "New"
					}
					else{
						result[i].status = result321.lead_status ;
					}
				});
				i=i+1;
				var mail = user.user_mail;
				var que = "SELECT destleadid FROM dest_leads_data where email = " + mysql.escape(mail);
				mysql_connection123.query(que, function(err, res_lead){
					if(err){
						req.flash('error', err)
					}
					else{
						
					}
				});
			})
			res.render('mail/list', {
				title: 'Vendor List', 
				data: result
			})
		}
	});
}

exports.vendorView = function(req, res, next){
	console.log(' lead : ');
	// console.log(req.params.id)
	console.log(req.body);
	var query = "SELECT * FROM raw_data where lead_id = " + mysql.escape(req.body.id) + "order by msg_date desc";
	// var query = "SELECT * FROM raw_data where lead_id = " + req.params.id;
	mysql_connection.query(query, function(err, result){
		if(err){
			req.flash('error', err)
				res.render('mail/lead_view', {
					title: 'Lead List Fail', 
					data: ''
				})
		}
		else{var i = 0;
			result.forEach(async function(user){
				result[i].time = moment(user.msg_date, "YYYY-MM-DD HH:mm:ss").fromNow();
				// var leadid = user.lead_id.substring(1);
				// var query321 = "select * from vendor_disposition_data where assignment_id="+leadid;
				// await mysql_connection123.query(query321, function(err, result321){
				// 	if(err){
				// 		result[i].status = "New"
				// 	}
				// 	else{
				// 		result[i].status = result321.lead_status ;
				// 	}
				// });

				i=i+1;
			})
			res.render('mail/lead_view', {
				title: 'Lead List', 
				data: result
			})
		}
	});
}

exports.vendorUpdate = function(req, res, next){
	console.log(' leadupdate : ');
	// console.log(req.params.id)
	console.log(req.body);
	var query123 = "update raw_data set status= " + mysql.escape(req.body.id2) + "where lead_id=" + mysql.escape(req.body.id);
	mysql_connection.query(query123, function(err, result){
	});
	var query = "SELECT * FROM raw_data where lead_id = " + mysql.escape(req.body.id) + "order by msg_date desc";
	// var query = "SELECT * FROM raw_data where lead_id = " + req.params.id;
	mysql_connection.query(query, function(err, result){
		if(err){
			req.flash('error', err)
				res.render('mail/lead_view', {
					title: 'Lead List Fail', 
					data: ''
				})
		}
		else{var i = 0;
			result.forEach(function(user){
				result[i].time = moment(user.msg_date, "YYYY-MM-DD HH:mm:ss").fromNow();
				var leadid = user.lead_id.substring(1);
				var query321 = "select * from vendor_disposition_data where assignment_id="+leadid;
				mysql_connection123.query(query321, function(err, result321){
					if(err){
						result[i].status = "New"
					}
					else{
						result[i].status = result321.lead_status ;
					}
				});

				i=i+1;
			})
			res.render('mail/lead_view', {
				title: 'Lead List', 
				data: result
			})
		}
	});
}



exports.vendorAdd = function(req, res, next){
}