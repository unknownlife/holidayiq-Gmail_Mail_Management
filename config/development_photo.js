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
				RAW_DATA_COLLECTION_PU: 'photo_upload',
				ORDER_BY: 'attractionid',
				LIMIT: 200,
				RAW_DATA_COLLECTION_DEST_PUMD: 'photo_upload_meta_data',
			},
		}    
	},
};