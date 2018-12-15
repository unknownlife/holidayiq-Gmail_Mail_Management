var mongoService = require('../services/mongoService');
var solrService = require('../services/solrService');
var mysqlService = require('../services/mysqlService');
var solr = require('solr-client');
var emailService = require('../services/emailService');
var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}

var solrClient = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.CORE);
var solrClientHotel = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.HOTEL_CORE);

var googleMapsClient = require('@google/maps').createClient({
	key: config.googleMaps.geoCodingAPIKey,
	"rate.limit": 50
});

var googleMapsClientHotel = require('@google/maps').createClient({
	key: config.googleMaps.geoCodingHotelAPIKey,
	"rate.limit": 50
});

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

exports.getLatLngWithPromise = function(row){
	// console.log(row);
	var attractionId = row['attractionid'];
	var attractionName = row['attractionname'] + ' ' + row['Destination_name'];
	var googleMapsResults; 
	console.log("About to hit google api: " + attractionId);
	return new Promise(function (resolve, reject){
		googleMapsClient.geocode({address: attractionName}, function(err, response){
			if(err){
				console.log("Google api call failed: " + attractionId);
				console.log(err);
			}
			else{
				// console.log(attractionId);
				googleMapsResults = response.json.results[0];
				// console.log('----------------'+ attractionId+'------------------');
				// console.log(googleMapsResults);
				console.log("Google api hit success: " + attractionId);
				if(googleMapsResults == undefined){
					var latitude = null;
					var longitude = null;
					var distOandN = null;
					var distAandD = null;
					row["id"] = parseInt(attractionId);
					row['distOandN'] = distOandN;
					row['distAandD'] = distAandD;
					row['status'] = "displayed";
					
					// delete row['attractionid'];
					delete row['destination_id'];
					delete row['destination_name'];
					delete row['attraction_id'];
					delete row['success'];
					// row["lat"] = latitude;
					// row["lon"] = longitude;

					row["latlon"] = null;
					// console.log(row);
					solrService.indexIntoSolr(row);
					console.log("Indexed into Solr:" + attractionId);
					resolve([attractionId, 0]);
				}
				else{

					mongoService.dumpIntoMongo(attractionId, googleMapsResults);
					console.log("Dumped into Mongo:" + attractionId);
					// mysqlService.markOneAttractionDoneInMySQL(attractionId);
					// var y=tmp[0];
					// console.log(row);
					var latitude = googleMapsResults.geometry.location.lat;
					var longitude = googleMapsResults.geometry.location.lng;
					var distOandN = exports.getDistanceFromLatLonInKm(parseFloat(row['latitude']), parseFloat(row['longitude']), latitude, longitude);
					var distAandD = exports.getDistanceFromLatLonInKm(latitude, longitude, parseFloat(row['d_latitude']), parseFloat(row['d_longitude']));
					row["id"] = parseInt(attractionId);
					row['distOandN'] = distOandN;
					row['distAandD'] = distAandD;
					row['status'] = "displayed";
					
					// delete row['attractionid'];
					delete row['destination_id'];
					delete row['destination_name'];
					delete row['attraction_id'];
					delete row['success'];
					// row["lat"] = latitude;
					// row["lon"] = longitude;

					row["latlon"] = latitude.toString() + "," + longitude.toString();
					// console.log(row);
					solrService.indexIntoSolr(row);

					console.log("Indexed into Solr:" + attractionId);
					resolve([attractionId, 1]);

				}
			}
		})
	});
}

exports.getLatLngWithPromiseHotel = function(row){
	// console.log(row);
	var hotelId = row['ResortID'];
	var hotelName = row['display_name'] + ' ' + row['Location'];
	var googleMapsResults; 
	console.log("About to hit google api: " + hotelId);
	return new Promise(function (resolve, reject){
		googleMapsClientHotel.geocode({address: hotelName}, function(err, response){
			if(err){
				console.log("Google api call failed: " + hotelId);
				console.log(err);
			}
			else{
				// console.log(attractionId);
				googleMapsResults = response.json.results[0];
				// console.log('----------------'+ attractionId+'------------------');
				// console.log(googleMapsResults);
				console.log("Google api hit success: " + hotelId);
				if(googleMapsResults == undefined){
					console.log('No data: ' + hotelId);
					var latitude = null;
					var longitude = null;
					var distOandN = null;
					var distAandD = null;
					row["id"] = parseInt(hotelId);
					row['distOandN'] = distOandN;
					row['distAandD'] = distAandD;
					row['status'] = "displayed";
					
					// delete row['attractionid'];
					delete row['Destination_id'];
					// delete row['Location'];
					// delete row['ResortID'];
					delete row['success'];
					// row["lat"] = latitude;
					// row["lon"] = longitude;

					row["latlon"] = null;
					// console.log(row);
					solrService.indexIntoSolrHotel(row);
					console.log("Indexed into Solr:" + hotelId);
					resolve([hotelId, 0]);
				}
				else{
					console.log('Data from Google: ' + hotelId);
					// mongoService.dumpIntoMongoHotel(hotelId, googleMapsResults);
					// console.log("Dumped into Mongo:" + hotelId);
					// mysqlService.markOneAttractionDoneInMySQL(attractionId);
					// var y=tmp[0];
					// console.log(row);
					var latitude = googleMapsResults.geometry.location.lat;
					var longitude = googleMapsResults.geometry.location.lng;
					var distOandN = exports.getDistanceFromLatLonInKm(parseFloat(row['latitude']), parseFloat(row['longitude']), latitude, longitude);
					var distAandD = exports.getDistanceFromLatLonInKm(latitude, longitude, parseFloat(row['d_latitude']), parseFloat(row['d_longitude']));
					row["id"] = parseInt(hotelId);
					row['distOandN'] = distOandN;
					row['distAandD'] = distAandD;
					row['status'] = "displayed";
					
					// delete row['attractionid'];
					delete row['Destination_id'];
					// delete row['Location'];
					// delete row['ResortID'];
					delete row['success'];
					// row["lat"] = latitude;
					// row["lon"] = longitude;

					row["latlon"] = latitude.toString() + "," + longitude.toString();
					// console.log(row);
					solrService.indexIntoSolrHotel(row);

					console.log("Indexed into Solr:" + hotelId);
					resolve([hotelId, 1]);

				}
			}
		})
	});
}

exports.correctAllAttractionData = function(){
	mysqlService.getJoinedMySQLData().then(function(result) {
		console.log(result) //will log results.
		var response;
		for(var pos = 0; pos < result.length; pos++){
			response = exports.getLatLng(result[pos]);
		}
	 });
};

exports.correctDataWOLatLng = function(){
	mysqlService.getMySQLDataWOLatLng().then(function(result) {
		console.log(result); //will log results.
		var response;
		for(var pos = 0; pos < result.length; pos++){
			response = exports.getLatLng(result[pos]['attractionid'], result[pos]['attractionname'] + ' ' + result[pos]['Destionation_name']);
		}
	});
	
};

exports.getNearbyAttractions = function(req, res, next) {
	var results;
	var attraction = req.query.attraction;
	var query;
	var subquery;
	var latlon;
	var noOfAttractions = parseInt(req.query.number) || 10;
	if(!isNaN(attraction)){
		// query = 'q=id:' + attraction.toString();
		query = solrClient.createQuery()
				   .q({id : attraction})
				   .start(0)
				   .rows(1)
				   ;
		solrClient.search(query, function(err, obj){
			if(err){
				console.log(err);
			}else{
				if(obj.response.docs[0]  == undefined){
					res.status(404).send("Oh uh, something went wrong! Attraction not found.");
				}
				else{
					latlon = obj.response.docs[0].latlon;
					subquery = solrClient.createQuery()
					.q("*:*")
					.start(1)
					.set("fq={!geofilt}&pt=" + latlon + "&sfield=latlon&d=" + config.solr.searchSettings.DISTANCE + "&sort=geodist()%20asc")
					.rows(noOfAttractions)
					;
					solrClient.search(subquery, function(err, obj2){
						if(err){
							console.log(err);
						}else{
							// console.log("RESPONSE");
							res.send(obj2.response.docs);
						}
					});
				}
				// console.log(obj.response.docs[0].latlon);
			}
		});
	}
	else {
		query = solrClient.createQuery()
				   .q({attractionname : '"' + attraction + '"'})
				   .start(0)
				   .rows(1)
				   ;
		solrClient.search(query, function(err, obj){
			if(err){
				console.log(err);
			}else{
				console.log(obj);
				if(obj.response.docs[0] == undefined){
					res.status(404).send("Oh uh, something went wrong! Attraction not found.");
				}
				else{
					latlon = obj.response.docs[0].latlon;
					subquery = solrClient.createQuery()
					.q("*:*")
					.start(1)
					.set("fq={!geofilt}&pt=" + latlon + "&sfield=latlon&d=" + config.solr.searchSettings.DISTANCE + "&sort=geodist()%20asc")
					.rows(noOfAttractions)
					;
					solrClient.search(subquery, function(err, obj2){
						if(err){
							console.log(err);
						}else{
							// console.log("RESPONSE");
							res.send(obj2.response.docs);
						}
					});
				}
				// console.log(obj.response.docs[0].latlon);
			}
		});
		// res.send("NaN");
	}
	
}

exports.getNearbyHotels = function(req, res, next) {
	var results;
	var hotel = req.query.hotel;
	var query;
	var subquery;
	var latlon;
	var noOfHotels = parseInt(req.query.number) || 10;
	if(!isNaN(hotel)){
		// query = 'q=id:' + attraction.toString();
		query = solrClientHotel.createQuery()
				   .q({ResortID : hotel})
				   .start(0)
				   .rows(1)
				   ;
		solrClientHotel.search(query, function(err, obj){
			if(err){
				console.log(err);
			}else{
				if(obj.response.docs[0]  == undefined){
					res.status(404).send("Oh uh, something went wrong! Hotel not found.");
				}
				else{
					latlon = obj.response.docs[0].latlon;
					subquery = solrClientHotel.createQuery()
					.q("*:*")
					.start(1)
					.set("fq={!geofilt}&pt=" + latlon + "&sfield=latlon&d=" + config.solr.searchSettings.DISTANCE + "&sort=geodist()%20asc")
					.rows(noOfHotels)
					;
					solrClientHotel.search(subquery, function(err, obj2){
						if(err){
							console.log(err);
						}else{
							// console.log("RESPONSE");
							res.send(obj2.response.docs);
						}
					});
				}
				// console.log(obj.response.docs[0].latlon);
			}
		});
	}
	else {
		query = solrClientHotel.createQuery()
				   .q({display_name : '"' + hotel + '"'})
				   .start(0)
				   .rows(1)
				   ;
		solrClientHotel.search(query, function(err, obj){
			if(err){
				console.log(err);
			}else{
				console.log(obj);
				if(obj.response.docs[0] == undefined){
					res.status(404).send("Oh uh, something went wrong! Hotel not found.");
				}
				else{
					latlon = obj.response.docs[0].latlon;
					subquery = solrClientHotel.createQuery()
					.q("*:*")
					.start(1)
					.set("fq={!geofilt}&pt=" + latlon + "&sfield=latlon&d=" + config.solr.searchSettings.DISTANCE + "&sort=geodist()%20asc")
					.rows(noOfHotels)
					;
					solrClientHotel.search(subquery, function(err, obj2){
						if(err){
							console.log(err);
						}else{
							// console.log("RESPONSE");
							res.send(obj2.response.docs);
						}
					});
				}
				// console.log(obj.response.docs[0].latlon);
			}
		});
		// res.send("NaN");
	}
	
}

exports.geoScheduler = function(){
	// console.log("Test Job");
	var attractionsDone = [];
	var promiseArr = [];
    mysqlService.getJoinedMySQLDataWithSuccess().then(function(result) {
		console.log("Retrieved MySQL data"); //will log results.
		var response, attractionId;
		for(var pos = 0; pos < result.length; pos++){
			// attractionid = result[pos].attractionid

			promiseArr.push(new Promise((resolve, reject) => {
				exports.getLatLngWithPromise(result[pos]).then(function(response) { // `delay` returns a promise
					// console.log(response[0]); // Log the value once it is resolved
					attractionId = response[0];
					console.log("Retrieved LatLng data: " + attractionId);
					if(response[1] == 1){
						attractionsDone.push(attractionId);
						if(attractionsDone.length == config.scheduler.UPDATE_SIZE){
							mysqlService.markAttractionsDoneInMySQL(attractionsDone).then(function(temp){
								console.log("Marked done in MySQL");
								var extra = attractionsDone.length % config.scheduler.UPDATE_SIZE;
								if(extra == 0){
									attractionsDone = [];
								}
								else{
									attractionsDone = attractionsDone.slice(-extra);
								}
								console.log("Marked done in MySQL resolved");
								resolve();
							})
							.catch((err) => {
								console.log("Catch 1");
								console.log(err);
								reject();
							});
						}
						else{
							resolve();
						}
					}
					else {
						mysqlService.markAttractionNotHavingDataInMySQL(attractionId).then(() => {
							console.log("Marked not done in MySQL");
							resolve();
						})
						.catch((err) => {
							console.log("Catch 2");
							console.log(err);
							reject();
						});
					}
				})
				.catch((err) => {
					console.log("Catch 3");
					console.log(err);
					reject();
				});	
			})
			.catch((err) => {
				console.log("Catch 4");
				console.log(err);
				reject();
			}));	
		}
		
		// console.log(promiseArr.length);
		Promise.all(promiseArr).then(() => {
			if(attractionsDone.length > 0){
				mysqlService.markAttractionsDoneInMySQL(attractionsDone).then(function(temp){
					console.log("Marked last batch done in MySQL");
					attractionsDone = [];
					mysqlService.getProcessStatusOfAttractions().then(function(status){
						// console.log(status);
						var processed = status[0].STATUS;
						var unprocessed = status[1].STATUS;
						var noData = status[2].STATUS;
						
						emailService.sendEmail(processed, noData, unprocessed);
					})
					.catch((err) => {
						console.log("Catch 5");
						console.log(err);
					});
					
				})
				.catch((err) => {
					console.log("Catch 6");
					console.log(err);
				});
			}
			else{
				mysqlService.getProcessStatusOfAttractions().then(function(status){
					// console.log(status);
					var processed = status[0].STATUS;
					var unprocessed = status[1].STATUS;
					var noData = status[2].STATUS;
					
					emailService.sendEmail(processed, noData, unprocessed);
				})
				.catch((err) => {
					console.log("Catch 7");
					console.log(err);
				});
			}
			
			solrService.reloadSolrCore();
			// solrService.optimizeSolrCore();
		})
		.catch((err) => {
			console.log("Catch 8");
			console.log(err);
		});
	})
	.catch((err) => {
		console.log("Catch 9");
		console.log(err);
	});

	// console.log(promiseArr);
	
}

exports.geoSchedulerHotel = function(){
	// console.log("Test Job");
	var hotelsDone = [];
	var promiseArr = [];
    mysqlService.getJoinedMySQLDataWithSuccessHotel().then(function(result) {
		console.log("Retrieved MySQL data"); //will log results.
		var response, hotelId;
		for(var pos = 0; pos < result.length; pos++){
			// attractionid = result[pos].attractionid

			promiseArr.push(new Promise((resolve, reject) => {
				exports.getLatLngWithPromiseHotel(result[pos]).then(function(response) { // `delay` returns a promise
					// console.log(response[0]); // Log the value once it is resolved
					hotelId = response[0];
					console.log("Retrieved LatLng data: " + hotelId);
					if(response[1] == 1){
						hotelsDone.push(hotelId);
						if(hotelsDone.length == config.scheduler.UPDATE_SIZE){
							mysqlService.markHotelsDoneInMySQL(hotelsDone).then(function(temp){
								console.log("Marked done in MySQL");
								var extra = hotelsDone.length % config.scheduler.UPDATE_SIZE;
								if(extra == 0){
									hotelsDone = [];
								}
								else{
									hotelsDone = hotelsDone.slice(-extra);
								}
								console.log("Marked done in MySQL resolved");
								resolve();
							})
							.catch((err) => {
								console.log("Catch 1");
								console.log(err);
								reject();
							});
						}
						else{
							resolve();
						}
					}
					else {
						mysqlService.markHotelNotHavingDataInMySQL(hotelId).then(() => {
							console.log("Marked not done in MySQL");
							resolve();
						})
						.catch((err) => {
							console.log("Catch 2");
							console.log(err);
							reject();
						});
					}
				})
				.catch((err) => {
					console.log("Catch 3");
					console.log(err);
					reject();
				});	
			})
			.catch((err) => {
				console.log("Catch 4");
				console.log(err);
				reject();
			}));	
		}
		
		// console.log(promiseArr.length);
		Promise.all(promiseArr).then(() => {
			if(hotelsDone.length > 0){
				mysqlService.markHotelsDoneInMySQL(hotelsDone).then(function(temp){
					console.log("Marked last batch done in MySQL");
					hotelsDone = [];
					mysqlService.getProcessStatusOfHotels().then(function(status){
						// console.log(status);
						var processed = status[0].STATUS;
						var unprocessed = status[1].STATUS;
						var noData = status[2].STATUS;
						
						emailService.sendEmailHotel(processed, noData, unprocessed);
					})
					.catch((err) => {
						console.log("Catch 5");
						console.log(err);
					});
					
				})
				.catch((err) => {
					console.log("Catch 6");
					console.log(err);
				});
			}
			else{
				mysqlService.getProcessStatusOfHotels().then(function(status){
					// console.log(status);
					var processed = status[0].STATUS;
					var unprocessed = status[1].STATUS;
					var noData = status[2].STATUS;
					
					emailService.sendEmailHotel(processed, noData, unprocessed);
				})
				.catch((err) => {
					console.log("Catch 7");
					console.log(err);
				});
			}
			
			solrService.reloadSolrCoreHotel();
			// solrService.optimizeSolrCoreHotel();
		})
		.catch((err) => {
			console.log("Catch 8");
			console.log(err);
		});
	})
	.catch((err) => {
		console.log("Catch 9");
		console.log(err);
	});

	// console.log(promiseArr);
	
}
// this.geoScheduler();