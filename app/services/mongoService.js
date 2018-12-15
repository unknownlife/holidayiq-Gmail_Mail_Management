// var mongoClient = require('mongodb').MongoClient;
// var util = require('../utils/util');
// var config;
// if (process.env.NODE_ENV == 'production') {
// 	config = require('../../config/production');
// }
// else{
// 	config = require('../../config/development');
// }

// var mongo_db_connection;
// mongoClient.connect(util.getMongoConnectionUrl(config.mongoData.rawData.NAME), function(err, db) {
//     if (err) throw err;
//     console.log("connected");
//     mongo_db_connection = db.db(config.mongoData.rawData.NAME);
// });

// var mongo_db_connection_hotel;
// mongoClient.connect(util.getMongoConnectionUrl(config.mongoData.rawData.HOTEL_NAME), function(err, db) {
//     if (err) throw err;
//     console.log("connected");
//     mongo_db_connection_hotel = db.db(config.mongoData.rawData.HOTEL_NAME);
// });

// exports.dumpIntoMongo = function(attractionId, response){
// 	var obj = {
// 		_id : parseInt(attractionId),
// 		data : response
// 	}
// 	mongo_db_connection.collection(config.mongoData.rawData.COLLECTIONS.RAW_DATA_COLLECTION).insertOne(obj, function(err, res) {
// 		if (err) console.log("READ " + err);
// 		// console.log("1 document inserted");
		
// 	});
// }

// exports.dumpIntoMongoHotel = function(attractionId, response){
// 	var obj = {
// 		_id : parseInt(attractionId),
// 		data : response
// 	}
// 	mongo_db_connection_hotel.collection(config.mongoData.rawData.HOTEL_COLLECTIONS.RAW_DATA_COLLECTION).insertOne(obj, function(err, res) {
// 		if (err) console.log("READ " + err);
// 		// console.log("1 document inserted");
		
// 	});
// }
