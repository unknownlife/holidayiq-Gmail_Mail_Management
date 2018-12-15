var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}
exports.getMongoConnectionUrl = function(dbName) {
    return "mongodb://" + config.mongo.HOST + ":" + config.mongo.PORT + "/" + dbName;
};