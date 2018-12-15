'use strict';

// Development specific configuration
// ==================================
module.exports = {    
	mysql: {
		HOST: '172.16.100.50',
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
			LIMIT: 200,
			RAW_DATA_COLLECTION_DEST: 'dest',
			RAW_DATA_COLLECTION_SUCCESS: 'success'
		    },
		    HOTEL_NAME: 'Hotels',
		    HOTEL_TABLES: {
			RAW_DATA_COLLECTION: 'hotels',
			ORDER_BY: 'ResortID',
			LIMIT: 50,
			RAW_DATA_COLLECTION_DEST: 'dest',
			RAW_DATA_COLLECTION_SUCCESS: 'success'
		    }
		}    
	},
    mongo: {
	HOST: 'localhost',
	PORT: 27017,
	MONGO_USER: 'root',
	MONGO_PASS: '',	
	POOL_SIZE: 50	
	},
	mongoData: {
		rawData: {
			NAME: 'attrac_test',
			COLLECTIONS: {
				RAW_DATA_COLLECTION: 'dump'
			},
			HOTEL_NAME: 'hotel_test',
			HOTEL_COLLECTIONS: {
				RAW_DATA_COLLECTION: 'dump'
			}
		}      
	},
	solr: {
		HOST: '127.0.0.1',
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
		geoCodingAPIKey: 'AIzaSyDwYGMZbyO1MuTsl5Jdh2UAsRUCfH4osEk',
		geoCodingHotelAPIKey: 'AIzaSyAOZP0txBa5vGGb9ni_jj1xji-13so3OPw'
	},
	emailService: {
        geoScheduler: [{
            "email": "akash.basabhat@holidayiq.com",
            "name" : "Akash",
            "type": "to"
        }]
    },
	vidmod:{
		regenAPI: "http://13.250.112.44:8088/videomorph/v1/getVideoFromImages"
	}
};