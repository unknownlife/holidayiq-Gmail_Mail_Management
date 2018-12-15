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
			NAME: 'message_track',
			TABLES: {
				RAW_DATA_COLLECTION_PU: 'raw_data',
				LIMIT: 200
			},
		}    
	},
	mysqlData123: {
		rawData: {
			NAME: 'indiaresorts',
			TABLES: {
				RAW_DATA_COLLECTION_PU: 'dest_leads_data',
				LIMIT: 200
			},
		}    
	},
};