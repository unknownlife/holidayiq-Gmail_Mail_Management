var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}
var mysql = require('mysql');
var solr = require('solr-client');
var solrService = require('../services/solrService');
var async = require('async');
var geoController = require('../controllers/geolocationController');
var mysqlService = require('../services/mysqlService');

var solrClient = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.CORE);
var solrClientHotel = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.HOTEL_CORE);

var DB_CONFIG = {
	host     : config.mysql.HOST,
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
	database : config.mysqlData.rawData.NAME
};

var DB_CONFIG = {
	host     : '172.16.100.50',
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
	database : config.mysqlData.rawData.NAME
};

var DB_CONFIG_HOTEL = {
	host     : config.mysql.HOST,
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
	database : config.mysqlData.rawData.HOTEL_NAME
};

var mysql_connection, mysql_connection_hotel;


function handleDisconnect() {
	
	mysql_connection = mysql.createConnection(DB_CONFIG);
  
	mysql_connection.connect(function(err) {
	  if(err) {
		console.log('error when connecting to db:', err);
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
}

function handleDisconnectHotel() {
	
	mysql_connection_hotel = mysql.createConnection(DB_CONFIG_HOTEL);
  
	mysql_connection_hotel.connect(function(err) {
	  if(err) {
		console.log('error when connecting to db:', err);
		setTimeout(handleDisconnectHotel, 2000);
	  }
	});
	mysql_connection_hotel.on('error', function(err) {
	  console.log('db error', err);
	  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
		handleDisconnectHotel();
	  } else {
		throw err;
	  }
	});
}


handleDisconnect();
handleDisconnectHotel();

exports.getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = exports.deg2rad(lat2 - lat1);  // deg2rad below
	var dLon = exports.deg2rad(lon2 - lon1); 
	var a = 
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(exports.deg2rad(lat1)) * Math.cos(exports.deg2rad(lat2)) * 
			Math.sin(dLon/2) * Math.sin(dLon/2)
			  ; 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d;
}
  
exports.deg2rad = function(deg) {
	return deg * (Math.PI / 180)
}

exports.correctDistanceForOne = function(row){
    // console.log(row['attraction_id']);
    return new Promise(function (resolve, reject){
        
        var id = row['Resort_ID'];
        mysql_connection_hotel.query(`SELECT r.ResortID, r.display_name, d.Destination_name as Location, r.latitude, r.longitude, d.Latitude as d_latitude, d.Longitude as d_longitude FROM indiaresorts.resort r join destination d on r.Destination_id = d.Destination_id where r.ResortID = ${id};`, function(err, rows, fields){
            var result = rows[0];
            geoController.getLatLngWithPromiseHotel(result).then(function(response){
                hotelId = response[0];
                console.log("Retrieved LatLng data: " + hotelId);
                if(response[1] == 1){
                    mysqlService.markHotelHavingDataInMySQL(hotelId).then(() => {
                        console.log("Marked done in MySQL");
                        resolve(1);
                    })
                    .catch((err) => {
                        console.log("Catch 1");
                        console.log(err);
                        resolve(0);
                    });
                }
                else {
                    mysqlService.markHotelNotHavingDataInMySQL(hotelId).then(() => {
                        console.log("Marked not done in MySQL");
                        resolve(1);
                    })
                    .catch((err) => {
                        console.log("Catch 2");
                        console.log(err);
                        resolve(0);
                    });
                }
            })
            .catch((err) => {
                console.log("Catch 3");
                console.log(err);
                resolve(0);
            });	
        });
        
    });
}

function done(){

}

exports.correctDistanceData = function(){
    return new Promise(function (resolve, reject) {			
        mysql_connection_hotel.query('SELECT Resort_ID FROM ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS + 
        ' where resort_id IN (select resortid from resort where (longitude is null or latitude is null) and Active="T" and CountryID = 1) and success = "not processed"' + 
        config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
            if(err){    
                reject(err);
            }

            async.forEachSeries(rows,
                function(row, done) {
                    // console.log(row['attraction_id']);
                    exports.correctDistanceForOne(row).then((res) => {
                        if(res == 1){
                            done();
                        }
                        else{
                            exports.correctDistanceForOne(row);
                            done();
                        }
                    })
                    .catch(()=> {
                        exports.correctDistanceForOne(row);
                        done();
                    })
                    
                }, 
                function(err, res) {
                    console.log("CRON DONE");
                    solrService.reloadSolrCoreHotel();
                }
            );
        });
    });
}

this.correctDistanceData()