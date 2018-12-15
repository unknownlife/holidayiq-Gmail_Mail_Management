var mongoService = require('../services/mongoService');
var solrService = require('../services/solrService');
var mysqlService = require('../services/mysqlService');
var mysql = require('mysql'); 
var solr = require('solr-client');
var request = require('request');
var config;
if (process.env.NODE_ENV == 'production') {
    config = require('../../config/production');
}
else{
	config = require('../../config/development');
}

var DB_CONFIG = {
	host: config.mysql.HOST,
	user: config.mysql.MYSQL_USER,
	password: config.mysql.MYSQL_PASS,
	database: config.mysqlData.rawData.NAME
};
var mysql_connection;

function handleDisconnect() {
	mysql_connection = mysql.createConnection(DB_CONFIG);
	mysql_connection.connect(function (err) {
		if(err){
			console.log("error connecting to database");
			setTimeout(handleDisconnect, 2000);
		}
		
	});
	mysql_connection.on('error', function(err){
		console.log("db error", err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		}
		else{
			throw err;
		}
	});
}
handleDisconnect();

exports.Index = function(request, response) {
    var email  = (request.query.testmail != null)? request.query.testmail : request.cookies.hiqadmin_email;
	var testMail = request.query.testmail;
	var name = email.substring(0, email.indexOf('@'));
	var username =  name.charAt(0).toUpperCase() + name.slice(1);
	var d = new Date();
	var todaysDay = d.getDay();
	var emailquery = "SELECT * FROM sales WHERE emailid = '"+email+"' ";
	mysql_connection.query(emailquery, function(err, rows, fields){
		if(rows.length > 0){
			var query = "select vendors.salespersonid, vendors.vendorname,coalesce(vendorscore) as vendorscore, vendors.vendorid As vendor from vendors inner JOIN sales on sales.salesid = vendors.salespersonid left join vendor_salesperson_weekly_score on vendor_salesperson_weekly_score.vendorid = vendors.vendorid where sales.emailid = '"+email+"' and vendorscore is null ";
			var data = {
				username: username,
				title: "vendor",
				day: todaysDay,
				message: "The Page is closed. Please try again next Thursday",
				testMail: testMail,
				email: email
			}
			
			mysql_connection.query(query, function(err, rows,fields){

				if(err){
					console.log(err);
				}
				else if(rows.length > 0){
					data.result = rows;
					response.render('../views/index', {
						data: data
					});
				}
				else{
					data.errorMessage = "You have rated all your vendors.";
					response.render('../views/error', {
						data: data
					})
				}
			})
		}
		else{
			var data = {
				errorMessage: "You are not authorized to access this page.",
				title: "Error page"
			}
			response.render('../views/error',{
				data: data
			});
		}
	})
	console.log(emailquery);


}
exports.updateVendor = function (request, response){
	console.log("update page reached");
	console.log(request.body);

	var date = new Date();
	var todaysDate = String(date.getFullYear()+ '-' + (date.getMonth()+1)+ '-' + date.getDate());
	var time = String(date.getHours()+ ':' + date.getMinutes()+ ':'+ date.getSeconds());
	var vendorid = parseInt(request.body.vendorid);
	var rating = parseInt(request.body.rating);
	var salesid = parseInt(request.body.userid);
	var vendorname = request.body.vendorname;
	var comment = String(request.body.comment);
	var query = "INSERT INTO `vendor_salesperson_weekly_score` (`vendorid`, `vendorname`, `vendorscore`, `comments`, `date`, `time`, `salesid`) VALUES ('"+vendorid+"', '"+vendorname+"', '"+rating+"', '"+comment+"', '"+todaysDate+"', '"+time+"', '"+salesid+"')" ;
	mysql_connection.query(query, function(err, result){
		if(err){
			console.log(err);
		}
		else{
			console.log("query executed");
		}
	});
}
