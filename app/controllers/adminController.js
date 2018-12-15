var mongoService = require('../services/mongoService');
var solrService = require('../services/solrService');
var mysqlService = require('../services/mysqlService');
var solr = require('solr-client');
var request = require('request');
var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}
var solrClient = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.CORE);

var solrClientHotel = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.HOTEL_CORE);
solrClientHotel.autoCommit = true;

var googleMapsClient = require('@google/maps').createClient({
	key: config.googleMaps.geoCodingAPIKey,
	"rate.limit": 50
});


// Returns the LatLon data of a place
exports.getLatLon = function(req, res, next){
	var place = (req.query.place) || '';

    if(place == ''){
        res.send([]);
    }
    googleMapsClient.geocode({address: place}, function(err, response){
        if(err){
            console.log("Google api call failed: " + attractionId);
            console.log(err);
        }
        else{
            // console.log(attractionId);
            googleMapsResults = response.json.results[0];
            // console.log('----------------'+ attractionId+'------------------');
            // console.log(googleMapsResults);
            console.log("Google api hit success: " + place);
            if(googleMapsResults == undefined){
                res.send([]);
            }
            else{

                var latitude = googleMapsResults.geometry.location.lat;
                var longitude = googleMapsResults.geometry.location.lng;

                res.send([latitude, longitude]);

            }
        }
    })
}

exports.image = function(req, res, next){
	var path = (req.query.path) || '';

    if(path == ''){
        res.send([]);
    }
    // console.log(path);
    request.get('http://127.0.0.1:5000/?path=' + path, function (error, response, body) {

        if (error) {
            // done();
            console.log("Image Failure");
        }
        else{
            console.log("Image Success");
            console.log(response);
            res.send(response);
        }
    });

}

// Returns the attraction data to the Admin Page.
exports.attractionLatLon = function(req, res, next){
	var pageNumber = parseInt(req.query.pageNumber) || 1;
    var offset = (pageNumber - 1) * 100;
	var query = solrClient.createQuery()
				.q('*:* NOT status:"not displayed"')
				.start(offset)
				.rows(100)
				.set("sort=attractionid%20asc")
				;

	solrClient.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
			// console.log(obj.response.docs);			
			res.send(obj.response);
		}
    });
}

exports.hotelLatLon = function(req, res, next){
	var pageNumber = parseInt(req.query.pageNumber) || 1;
    var offset = (pageNumber - 1) * 100;
	var query = solrClientHotel.createQuery()
				.q('*:* NOT status:"not displayed"')
				.start(offset)
				.rows(100)
				.set("sort=ResortID%20asc")
				;

	solrClientHotel.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
			// console.log(obj.response.docs);			
			res.send(obj.response);
		}
    });
}

// Returns the attraction data to the Admin Page.
exports.filterAttractionLatLon = function(req, res, next){
    var pageNumber = parseInt(req.query.pageNumber) || 1;
    var distOandN = req.query.distOandN;
    var distAandD = req.query.distAandD;

    var ONup, ONlow, ADup, ADlow;
    
    if(distOandN == 0){
        ONlow = 0;
        ONup = 100000;
    }
    else if(distOandN == '1'){
        ONlow = 0;
        ONup = 1;
    }
    else if(distOandN == '3000'){
        ONlow = 3000;
        ONup = 100000;
    }
    else{
        var temp = distOandN.split(",");
        ONlow = parseInt(temp[0]);
        ONup = parseInt(temp[1]);
    }

    if(distAandD == 0){
        ADlow = 0;
        ADup = 100000;
    }
    else if(distAandD == '5'){
        ADlow = 0;
        ADup = 5;
    }
    else if(distAandD == '3000'){
        ADlow = 3000;
        ADup = 100000;
    }
    else{
        var temp = distAandD.split(",");
        ADlow = parseInt(temp[0]);
        ADup = parseInt(temp[1]);
    }

    // console.log(distAandD);
    var offset = (pageNumber - 1) * 100;

	var query = solrClient.createQuery()
				.q('*:* NOT status:"not displayed"')
				.start(offset)
				.rows(100)
                .set(`fq=distOandN:[${ONlow}%20TO%20${ONup}]%20AND%20distAandD:[${ADlow}%20TO%20${ADup}]`)
                .set("sort=distOandN%20desc")
				;
    // console.log(query);
	solrClient.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
            // console.log(obj.response);			
			res.send(obj.response);
		}
    });
}

exports.getAttractionsWOLatLon = function(req, res, next){
    var pageNumber = parseInt(req.query.pageNumber) || 1;

    // console.log(distAandD);
    var offset = (pageNumber - 1) * 100;

	var query = solrClient.createQuery()
				.q('-latitude:[* TO *] AND latlon:[-90,-180 TO 90,180] NOT status:"not displayed"')
                .start(offset)
                .set("sort=attractionid%20asc")
				.rows(100)
				;
    // console.log(query);
	solrClient.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
            // console.log(obj.response);			
			res.send(obj.response);
		}
    });
}

exports.getHotelsWOLatLon = function(req, res, next){
    var pageNumber = parseInt(req.query.pageNumber) || 1;

    // console.log(distAandD);
    var offset = (pageNumber - 1) * 100;

	var query = solrClientHotel.createQuery()
				.q('-latitude:[* TO *] AND latlon:[-90,-180 TO 90,180] NOT status:"not displayed"')
                .start(offset)
                .set("sort=ResortID%20asc")
				.rows(100)
				;
    // console.log(query);
	solrClientHotel.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
            // console.log(obj.response);			
			res.send(obj.response);
		}
    });
}

exports.filterHotelLatLon = function(req, res, next){
    var pageNumber = parseInt(req.query.pageNumber) || 1;
    var distOandN = req.query.distOandN;
    var distAandD = req.query.distAandD;

    var ONup, ONlow, ADup, ADlow;
    
    if(distOandN == 0){
        ONlow = 0;
        ONup = 100000;
    }
    else if(distOandN == '1'){
        ONlow = 0;
        ONup = 1;
    }
    else if(distOandN == '15'){
        ONlow = 15;
        ONup = 100000;
    }
    else{
        var temp = distOandN.split(",");
        ONlow = parseInt(temp[0]);
        ONup = parseInt(temp[1]);
    }

    if(distAandD == 0){
        ADlow = 0;
        ADup = 100000;
    }
    else if(distAandD == '5'){
        ADlow = 0;
        ADup = 5;
    }
    else if(distAandD == '50'){
        ADlow = 50;
        ADup = 100000;
    }
    else{
        var temp = distAandD.split(",");
        ADlow = parseInt(temp[0]);
        ADup = parseInt(temp[1]);
    }

    // console.log(distAandD);
    var offset = (pageNumber - 1) * 100;

	var query = solrClientHotel.createQuery()
				.q('*:* NOT status:"not displayed"')
				.start(offset)
				.rows(100)
                .set(`fq=distOandN:[${ONlow}%20TO%20${ONup}]%20AND%20distAandD:[${ADlow}%20TO%20${ADup}]`)
                .set("sort=distOandN%20desc")
				;
    // console.log(query);
	solrClientHotel.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
            // console.log(obj.response);			
			res.send(obj.response);
		}
    });
}

// Sends the admin page as a response.
exports.correctLatLon = function(req, res, next){
	res.sendFile('html/correctlatlon.html', { root: 'public' });
}

exports.correctLatLonHotel = function(req, res, next){
	res.sendFile('html/correctlatlonhotel.html', { root: 'public' });
}

exports.demo = function(req, res, next){
	res.sendFile('html/home.html', { root: 'public' });
}

// Update LatLon data in MySQL and Solr.
exports.updateLatLon = function(req, res, next){
	var id = req.body.id;
	var lat = req.body.lat;
    var lon = req.body.lon;
    var checked = req.body.checked;

	mysqlService.updateOldLatLonColumns(id);
    mysqlService.updateAttractionDisplay(id, checked);
    solrService.updateAttractionStatus(id, checked);
    mysqlService.updateMySQLLatLonData(id, lat, lon);
    solrService.updateSolr(id, lat, lon);
    solrService.reloadSolrCore();
    // solrService.optimizeSolrCore();
	res.send();
}

// Update LatLon data in MySQL and Solr.
exports.updateLatLonHotel = function(req, res, next){
	var id = req.body.id;
	var lat = req.body.lat;
	var lon = req.body.lon;
    var checked = req.body.checked;

	mysqlService.updateMySQLLatLonDataHotel(id, lat, lon);
    solrService.updateSolrHotel(id, lat, lon);
    mysqlService.updateHotelDisplay(id, checked);
    solrService.updateHotelStatus(id, checked);
    solrService.reloadSolrCoreHotel();
    // solrService.optimizeSolrCoreHotel();
	res.send();
}

exports.updateAttractionDisplay = function(req, res, next){
	var id = parseInt(req.body.id);
	var checked = req.body.checked;
    // console.log(checked);
    mysqlService.updateAttractionDisplay(id, checked);
    solrService.updateAttractionStatus(id, checked);
    solrService.reloadSolrCore();
    // solrService.optimizeSolrCore();
	res.send();
}

exports.updateHotelDisplay = function(req, res, next){
	var id = parseInt(req.body.id);
	var checked = req.body.checked;
    // console.log(checked);
    mysqlService.updateHotelDisplay(id, checked);
    solrService.updateHotelStatus(id, checked);
    solrService.reloadSolrCoreHotel();
    // solrService.optimizeSolrCoreHotel();
	res.send();
}

// Returns total number of Docs present in Solr.
exports.getNoOfDocsInSolr = function(req, res, next){

	var query = solrClient.createQuery()
				.q('*:*')
				.start(0)
				.rows(0)
                ;
    
    solrClient.search(query, function(err, obj){
        if(err){
            console.log(err);
            // res.send(err);
        }else{
            // console.log(obj.response.numFound);
            res.send(obj.response.numFound.toString());
        }
    });
}

exports.getNoOfDocsInSolrHotel = function(req, res, next){

	var query = solrClientHotel.createQuery()
				.q('*:*')
				.start(0)
				.rows(0)
                ;
    
    solrClientHotel.search(query, function(err, obj){
        if(err){
            console.log(err);
            // res.send(err);
        }else{
            // console.log(obj.response.numFound);
            res.send(obj.response.numFound.toString());
        }
    });
}