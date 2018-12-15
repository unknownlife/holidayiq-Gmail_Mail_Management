'use strict';

// Development specific configuration
// ==================================
module.exports = {    
	mysql: {
		HOST: 'hiqdb',
		PORT: 3306,
		MYSQL_USER: 'root',
		MYSQL_PASS: 'root123',
		POOL_SIZE: 10,
		MYSQL_DELIMITER: ';'
	},
	mysqlData: {
		rawData: {
			NAME: 'indiaresorts',
			TABLES: {
				RAW_DATA_COLLECTION: 'attractions',
				ORDER_BY: 'attractionid',
				LIMIT: 30,
				RAW_DATA_COLLECTION_DEST: 'destination',
				RAW_DATA_COLLECTION_SUCCESS: 'attractions_geoloc_status'
			},
			HOTEL_NAME: 'indiaresorts',
			HOTEL_TABLES: {
				RAW_DATA_COLLECTION: 'resort',
				ORDER_BY: 'ResortID',
				LIMIT: 30,
				RAW_DATA_COLLECTION_DEST: 'destination',
				RAW_DATA_COLLECTION_SUCCESS: 'resorts_geoloc_status'
			}
   		}      
	},
	mongo: {
		HOST: '192.168.100.17',
		PORT: 27017,
		MONGO_USER: 'root',
		MONGO_PASS: '',	
		POOL_SIZE: 50	
	},
	mongoData: {
		rawData: {
			NAME: 'resort_geoloc',
			COLLECTIONS: {
				RAW_DATA_COLLECTION: 'dump'
			},
			HOTEL_NAME: 'hotel',
			HOTEL_COLLECTIONS: {
				RAW_DATA_COLLECTION: 'dump'
			}
		}      
	},
	solr: {
		HOST: '192.168.100.84',
		PORT: 8983,
		CORE: 'attractions',
		HOTEL_CORE: 'hotels',
		searchSettings: {
			DISTANCE: 50
		}
	},
	scheduler: {
		UPDATE_SIZE: 10
    },
	googleMaps: {
		geoCodingAPIKey: 'AIzaSyBxZkZfqAewxIxKfFfhVb8LYwuy2snsbiQ',
		geoCodingHotelAPIKey: 'AIzaSyDnAUAiTb4pUX2FvOphTmdGlEQd3LFrCT8'
	},
    emailService: {
        geoScheduler: [{
            "email": "akash.basabhat@holidayiq.com",
            "name" : "Akash",
            "type": "to"
        },
        {
            "email": "ankit@holidayiq.com",
            "name" : "Ankit",
            "type": "to"
        }]
	},
	vidmod:{
		regenAPI: "http://13.250.112.44:8088/videomorph/v1/getVideoFromImages"
	}
};
