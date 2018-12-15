var mysqlService = require('../services/mysqlService');
var scheduler = require('node-schedule');
var geolocationController = require('../controllers/geolocationController');
var emailService = require('../services/emailService');
var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}

// '0 0 0 * * *' */5 * * * * *

// var geoCorrectionJob = scheduler.scheduleJob('0 */19 * * * *', geolocationController.geoScheduler);

var geoCorrectionJobHotel = scheduler.scheduleJob('0 */18 * * * *', geolocationController.geoSchedulerHotel);