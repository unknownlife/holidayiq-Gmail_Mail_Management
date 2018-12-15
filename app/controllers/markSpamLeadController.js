var mysqlService = require('../services/mysqlService');
var mysql = require('mysql');
var request = require('request');
var config;
if(process.env.NODE_ENV == 'production'){
    config = require('../../config/production');
}
else{
    config = require('../../config/development');
}

var DB_CONFIG = {
    host: config.mysql.HOST,
    database: config.mysqlData.rawData.NAME,
    user: config.mysql.MYSQL_USER,
    password: config.mysql.MYSQL_PASS
}

var mysql_connection;

function handleDisconnect(){
    mysql_connection = mysql.createConnection(DB_CONFIG);
    mysql_connection.connect(function(err){
        if(err){
            console.log('aaaaaaaaaa')
            console.log(err)
            console.log("error connect to database");
            setTimeout(handleDisconnect, 2000);
        }
    });
    mysql_connection.on('error', function(err){
        console.log("db error", err)
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            handleDisconnect();
        }
        else{
            throw err;
        }
    });
}

handleDisconnect();

exports.Index = function(req, res){
    var leadHashId = req.params.hashId;
    var query = "Select * from vendor_leads_data WHERE lead_assignment_id = '"+leadHashId+"' ";
    mysql_connection.query(query, function(error, rows){
        if(rows.length > 0){
            var leadDetailsQuery = "Select * from vendor_leads_data v inner join dest_leads_data d on d.destleadid = v.leadid where lead_assignment_id = '"+leadHashId+"' ";
            var data = {
                title: "Move your leads to spam"
                // result: rows
            };
            mysql_connection.query(leadDetailsQuery, function(err, rows){
                if(err){
                    console.log(err);
                }
                else{
                    data.result = rows;
                    res.render('../views/markleadspam/index', {
                        data: data
                    })
                }
            })
            // res.render('../views/markleadspam/index', {
            //     data: data
            // })
        }
        else{
            var data = {
                title: 'Error Page',
                leadHash: leadHashId
            }
            res.render('../views/commonViews/error',{
                data: data
            })
        }

    })
    // res.render('../views/markleadspam/index',{
    //     data: data
    // });
}