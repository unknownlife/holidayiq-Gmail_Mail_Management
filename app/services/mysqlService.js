var mysql = require('mysql');
var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}

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

exports.getRawMySQLData = function() {
    return new Promise(function (resolve, reject) {	
		var cursor;
		mysql_connection.query('SELECT * FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			resolve(rows);
		});
	});
};

exports.getJoinedMySQLData = function() {
    return new Promise(function (resolve, reject) {			
		mysql_connection.query('SELECT * FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + ' ON ' 
		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.destinationid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + '.destination_id' + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			resolve(rows);
		});
	});
};

exports.getJoinedMySQLDataWithLimit = function(offset) {
    return new Promise(function (resolve, reject) {		
		mysql_connection.query('SELECT * FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + ' ON ' 
		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.destinationid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + '.destination_id' + ' LIMIT ' + config.mysqlData.rawData.TABLES.LIMIT + 
		' OFFSET ' + offset.toString() + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			resolve(rows);
		});
	});
};

// 'SELECT Destination_name,attractionid,attractionname,attractions.best_photo,destination.latitude as d_latitude, destination.longitude as d_longitude, destinationid, attractions.latitude, attractions.longitude, attractions.url_slug FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + ' ON ' 
// 		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.destinationid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + '.destination_id' + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + ' ON ' 
// 		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.attractionid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + '.attraction_id' + ' WHERE '+config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS+'.SUCCESS = "not processed"' +' ORDER BY attractionid' +' LIMIT ' + config.mysqlData.rawData.TABLES.LIMIT + 
// 		config.mysql.MYSQL_DELIMITER

// 'SELECT attractions.Destination_name,attractionid,attractionname,attractions.best_photo, d_latitude, d_longitude, destinationid, attractions.latitude, attractions.longitude, attractions.url_slug FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + ' ON ' 
// 		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.destinationid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + '.destination_id' + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + ' ON ' 
// 		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.attractionid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + '.attraction_id' + ' WHERE '+config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS+'.SUCCESS = "not processed"' +' ORDER BY attractionid' +' LIMIT ' + config.mysqlData.rawData.TABLES.LIMIT + 
// 		config.mysql.MYSQL_DELIMITER
exports.getJoinedMySQLDataWithSuccess = function() {
	return new Promise(function (resolve, reject) {	

		mysql_connection.query('SELECT Destination_name,attractionid,attractionname,attractions.best_photo,destination.latitude as d_latitude, destination.longitude as d_longitude, destinationid, attractions.latitude, attractions.longitude, attractions.url_slug FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + ' ON ' 
		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.destinationid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_DEST + '.destination_id' + ' LEFT JOIN '+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + ' ON ' 
		+ config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + '.attractionid' + ' = ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + '.attraction_id' + ' WHERE '+config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS+'.SUCCESS = "not processed"' +' ORDER BY attractionid' +' LIMIT ' + config.mysqlData.rawData.TABLES.LIMIT + 
		config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			// console.log(rows);
			resolve(rows);
		});
	});
};

exports.getJoinedMySQLDataWithSuccessHotel = function() {
	return new Promise(function (resolve, reject) {	

		mysql_connection_hotel.query('SELECT Location, display_name, ResortID, ResortName, destination.latitude as d_latitude, destination.longitude as d_longitude, '+config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION+'.Destination_id, resort.latitude, resort.longitude FROM ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION + ' LEFT JOIN '+ config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_DEST + ' ON ' 
		+ config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION + '.Destination_id' + ' = ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_DEST + '.destination_id' + ' LEFT JOIN '+ config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS + ' ON ' 
		+ config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION + '.ResortID' + ' = ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS + '.Resort_ID' + ' WHERE '+config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS+'.SUCCESS = "not processed" and Active = "T"' +' ORDER BY ResortID' +' LIMIT ' + config.mysqlData.rawData.HOTEL_TABLES.LIMIT + 
		config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			// console.log(rows);
			resolve(rows);
		});
	});
};

exports.getMySQLData = function(offset) {
	return new Promise(function (resolve, reject) {	
		
		mysql_connection.query('SELECT * FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION +
		                    //    'ORDER BY ' + config.mysqlData.rawData.TABLES.ORDER_BY + 
							   ' LIMIT ' + config.mysqlData.rawData.TABLES.LIMIT + 
							   ' OFFSET ' + offset.toString() + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			resolve(rows);
		});
	});
};

exports.updateMySQLLatLonData = function(id, lat, lon) {
    return new Promise(function (resolve, reject) {	
		
		mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION +
							   ' SET ' + 'LATITUDE = ' + lat + ',' + ' LONGITUDE = ' + lon + 
							   ' WHERE ' + 'ATTRACTIONID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			resolve(result);
		});
	});
};

exports.updateOldLatLonColumns = function(id) {
    return new Promise(function (resolve, reject) {	
		
		mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION +
							   ' SET ' + 'OLD_LATITUDE = LATITUDE' + ',' + ' OLD_LONGITUDE = LONGITUDE' + 
							   ' WHERE ' + 'ATTRACTIONID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			resolve(result);
		});
	});
};

exports.updateMySQLLatLonDataHotel = function(id, lat, lon) {
    return new Promise(function (resolve, reject) {	
		
		mysql_connection_hotel.query('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION +
							   ' SET ' + 'LATITUDE = ' + lat + ',' + ' LONGITUDE = ' + lon + 
							   ' WHERE ' + 'RESORTID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			resolve(result);
		});
	});
};

exports.updateAttractionDisplay = function(id, checked) {
	if(checked == "true"){
		return new Promise(function (resolve, reject) {	
			
			mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS +
								' SET ' + 'SUCCESS = "updated"' + 
								' WHERE ' + 'ATTRACTION_ID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
				if(err){    
					reject(err);
				}
				resolve(result);
			});
		});
	}
	else if(checked == "false"){
		return new Promise(function (resolve, reject) {	
			
			mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS +
								' SET ' + 'SUCCESS = "not processed"' + 
								' WHERE ' + 'ATTRACTION_ID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
				if(err){    
					reject(err);
				}
				resolve(result);
			});
		});
	}
};

exports.updateHotelDisplay = function(id, checked) {
	if(checked == "true"){
		return new Promise(function (resolve, reject) {	
			
			mysql_connection_hotel.query('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS +
								' SET ' + 'SUCCESS = "updated"' + 
								' WHERE ' + 'RESORT_ID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
				if(err){    
					reject(err);
				}
				resolve(result);
			});
		});
	}
	else if(checked == "false"){
		return new Promise(function (resolve, reject) {	
			
			mysql_connection_hotel.query('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS +
								' SET ' + 'SUCCESS = "not processed"' + 
								' WHERE ' + 'RESORT_ID = ' + id + config.mysql.MYSQL_DELIMITER, function (err, result){
				if(err){    
					reject(err);
				}
				resolve(result);
			});
		});
	}
};

exports.markAttractionsDoneInMySQL = function(attractions) {
    return new Promise(function (resolve, reject) {	
		console.log('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS +
		' SET ' + 'SUCCESS = ' + '"processed"' +  
		' WHERE ' + 'ATTRACTION_ID IN (' + attractions.toString() + ')' + config.mysql.MYSQL_DELIMITER);
		mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS +
							   ' SET ' + 'SUCCESS = ' + '"processed"' +  
							   ' WHERE ' + 'ATTRACTION_ID IN (' + attractions.toString() + ')' + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			// console.log("SUCCESS");
			mysql_connection.commit();
			resolve(result);
		});
	});
};

exports.markHotelsDoneInMySQL = function(hotels) {
    return new Promise(function (resolve, reject) {	
		console.log('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS +
		' SET ' + 'SUCCESS = ' + '"processed"' +  
		' WHERE ' + 'RESORTID IN (' + hotels.toString() + ')' + config.mysql.MYSQL_DELIMITER);
		mysql_connection_hotel.query('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS +
							   ' SET ' + 'SUCCESS = ' + '"processed"' +  
							   ' WHERE ' + 'RESORT_ID IN (' + hotels.toString() + ')' + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			// console.log("SUCCESS");
			mysql_connection_hotel.commit();
			resolve(result);
		});
	});
};

exports.markOneAttractionDoneInMySQL = function(attractionId) {
    return new Promise(function (resolve, reject) {	
		mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS +
							   ' SET ' + 'SUCCESS = ' + '"processed"' +  
							   ' WHERE ' + 'ATTRACTION_ID = ' + attractionId.toString() + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			// console.log("SUCCESS");
			mysql_connection.commit();
			resolve(result);
		});
	});
};

exports.markAttractionNotHavingDataInMySQL = function(attractionId) {
    return new Promise(function (resolve, reject) {	
		
		mysql_connection.query('UPDATE ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS +
							   ' SET ' + 'SUCCESS = ' + '"no data"' +  
							   ' WHERE ' + 'ATTRACTION_ID = '+ attractionId.toString() + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			// console.log("SUCCESS");
			mysql_connection.commit();
			resolve(result);
		});
	});
};

exports.markHotelHavingDataInMySQL = function(attractionId) {
    return new Promise(function (resolve, reject) {	
		
		mysql_connection_hotel.query('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS +
							   ' SET ' + 'SUCCESS = ' + '"processed"' +  
							   ' WHERE ' + 'RESORT_ID = '+ attractionId.toString() + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			// console.log("SUCCESS");
			mysql_connection_hotel.commit();
			resolve(result);
		});
	});
};

exports.markHotelNotHavingDataInMySQL = function(attractionId) {
    return new Promise(function (resolve, reject) {	
		
		mysql_connection_hotel.query('UPDATE ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS +
							   ' SET ' + 'SUCCESS = ' + '"no data"' +  
							   ' WHERE ' + 'RESORT_ID = '+ attractionId.toString() + config.mysql.MYSQL_DELIMITER, function (err, result){
			if(err){    
				reject(err);
			}
			// console.log("SUCCESS");
			mysql_connection_hotel.commit();
			resolve(result);
		});
	});
};

exports.getMySQLDataWOLatLng = function(){

	return new Promise(function (resolve, reject) {	
		
		mysql_connection.query('SELECT * FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION + ' WHERE LATITUDE IS NULL AND LONGITUDE IS NULL' + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			resolve(rows);
		});
	});
};

exports.addIntoMySQL = function() {
    return new Promise(function (resolve, reject) {	

		mysql_connection.query('SELECT attractionid FROM attractions;', function(err, rows, fields){
			if(err){    
				reject(err);
			}
			// console.log(rows);
			for(var i = 0; i < rows.length; i++){
				// console.log('INSERT INTO success(attractionid, success) VALUES (' + rows[i].attractionId + ', ' + '0);');
				mysql_connection.query('INSERT INTO success(attraction_id, success) VALUES (' + rows[i]['attractionid'] + ', ' + '"not processed");', function (err, result) {
					if (err) throw err;
					// console.log("1 record inserted");
				});
			}
		});
	});
};

exports.getProcessStatusOfAttractions = function(){
	return new Promise(function (resolve, reject) {	
		mysql_connection.query('SELECT COUNT(success) AS STATUS' + ' FROM ' + config.mysqlData.rawData.TABLES.RAW_DATA_COLLECTION_SUCCESS + ' GROUP BY success' + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			// console.log(rows);
			resolve(rows);
		});
	});
}

exports.getProcessStatusOfHotels = function(){
	return new Promise(function (resolve, reject) {	
		mysql_connection_hotel.query('SELECT COUNT(success) AS STATUS' + ' FROM ' + config.mysqlData.rawData.HOTEL_TABLES.RAW_DATA_COLLECTION_SUCCESS + ' GROUP BY success' + config.mysql.MYSQL_DELIMITER, function(err, rows, fields){
			if(err){    
				reject(err);
			}
			// console.log(rows);
			resolve(rows);
		});
	});
}
// console.log(this.getProcessStatusOfAttractions());
// this.getJoinedMySQLDataWithSuccess();
