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

var solrClient = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.CORE);
var solrClientHotel = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.HOTEL_CORE);

var DB_CONFIG = {
	host     : config.mysql.HOST,
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
    var query = solrClient.createQuery()
				.q("id:" + row['attraction_id'])
				.start(0)
				.rows(5)
				.set("sort=id%20asc")
				;

    solrClient.search(query, function(err, obj){
        if(err){
            console.log(err);
            resolve(0);
        }else{
            var data = obj.response.docs[0];
            var tmp = data.latlon;
            if(tmp != undefined){
                tmp = tmp.split(",");
                // console.log("test" + tmp);
                newLat = parseFloat(tmp[0]);
                newLon = parseFloat(tmp[1]);
            }
            else{
                newLat = NaN;
                newLon = NaN;
            }
            var distOandN = exports.getDistanceFromLatLonInKm(data.latitude, data.longitude, newLat, newLon);
            var distAandD = exports.getDistanceFromLatLonInKm(data.d_latitude, data.d_longitude, newLat, newLon);
            data.distOandN = {'set': distOandN};
            data.distAandD = {'set': distAandD};
            delete data['_version_'];
            // console.log(obj.response.docs[0]);
            // console.log(data);
            solrClient.add(data, function(err, obj) {
                if (err) {
                    console.log(err.stack);
                    resolve(0);
                } else {
                    // console.log("Solr success");
                    solrClient.softCommit();
                    // solrService.reloadSolrCore();
                    console.log(data.attractionid);
                    resolve(1);                                                           
                }
            });
        }
    });
});
}
function done(){

}
exports.correctDistanceData = function(){
    return new Promise(function (resolve, reject) {			
        mysql_connection.query('SELECT attraction_id FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + ' WHERE not success = "not processed" limit 17100' + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
            if(err){    
                reject(err);
            }
            console.log(rows[0]['attraction_id']);
            // jobs = []
            // for(var i = 0; i < rows.length; i++){
            //     // console.log(i);
            //     jobs.push(function(i, rows, correctDistanceForOne) {
            //         console.log('wefsdf' + i);
            //         correctDistanceForOne(i, rows[i]);
            //     });
            // }
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
                    solrService.reloadSolrCore();
                }
            );
        });
    });
}

this.correctDistanceData()