var mysqlService = require('../services/mysqlService');
var mysql = require('mysql');
var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development_photo');
}
var request = require('request');

// var req = require('req');

var DB_CONFIG = {
	host     : config.mysql.HOST,
	user     : config.mysql.MYSQL_USER,
	password : config.mysql.MYSQL_PASS,
	database : config.mysqlData.rawData.NAME
};

var mysql_connection;
var numOfPhotos = 50;
function handleDisconnect() {
	
	mysql_connection = mysql.createConnection(DB_CONFIG);
  
	mysql_connection.connect(function(err) {
	  if(err) {
		console.log('error when connecting to db', err);
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

handleDisconnect();

exports.Index = function(req, res, next) {

    var selectedType = (req.query.type) || '0';
    var destination = (req.query.destination) || '0';
	var typeQuery = "SELECT distinct(video_type) FROM object_videos;";
	mysql_connection.query(typeQuery, function(err, rows, fields){
        if(err){
			console.log(err);
        }

        var types = [];
        for(var i = 0; i < rows.length; i++){
            types.push(rows[i].video_type);
        }

        var filters = {
            selectedType: selectedType,
            destination: destination,
            types: types
        };
        
        var videos = [];
        var filterQuery = `select * from object_videos where video_type = '${selectedType}' and object_id = ${destination} limit 1;`;
        mysql_connection.query(filterQuery, function(err, rows, fields){

            videos = rows;

            var images = [];
            var filterQuery2 = `select * from destination_video_detalis where video_type = '${selectedType}' and destination_id = ${destination};`;
            console.log(filterQuery2);
            mysql_connection.query(filterQuery2, function(err, rows2, fields){

                images = rows2;
                console.log(rows2);
                
                res.render('../views/vidmod/videomod', {
                    filters: filters,
                    videos: videos,
                    images: images
                });
            });
        });
	});
}

exports.getObjects = function(req, res, next){
    var type = String(req.query.type);
    console.log('TYPE1: ' + type);
	mysql_connection.query(`select distinct destination_id, destination_name from destination_video_detalis where video_type = '${type}' order by destination_name;`, function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.submit = function(req, res, next){
    var st = String(req.query.st);
    var et = String(req.query.et);
    var id = parseInt(req.query.id);
    // console.log('TYPE1: ' + type);
	mysql_connection.query(`update destination_video_detalis set start_time = '${st}', end_time = '${et}' where id = ${id};`, function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.replace = function(req, res, next){
    var replace = String(req.query.replace);
    var id = parseInt(req.query.id);
    // console.log(`update destination_video_detalis set url = '${replace}', review_id = 0 where id = ${id};`);
	mysql_connection.query(`update destination_video_detalis set url = '${replace}', review_id = 0, replaced = 'T' where id = ${id};`, function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.regenerate = function(req, res, next){
    var type = String(req.query.type);
    var obj = parseInt(req.query.obj);
    // console.log(`update destination_video_detalis set url = '${replace}', review_id = 0 where id = ${id};`);
    var url = config.vidmod.regenAPI;
    
    var options = { 
        method: 'POST',
        url: url,
        headers: { 
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json' 
        },
        json : {	
            "destIds": obj,
            "type": "D",
            "vidType": type
        }
    };

    request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Regen Failure");
        }
        else{
            console.log("Regen Success");
            res.send();
        }
    });
}

exports.remove = function(req, res, next){
    var id = parseInt(req.query.id);
    // console.log('TYPE1: ' + type);
	mysql_connection.query(`update destination_video_detalis set active = 0 where id = ${id};`, function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.add = function(req, res, next){
    var id = parseInt(req.query.id);
    console.log("Page reached");
    mysql_connection.query(`update destination_video_detalis set active = 1 where id = ${id};`, function(err, rows, fields){
        if(err){
            console.log(err);
        }
        res.send(rows);
    })
}

exports.getTypes = function(){
	mysql_connection.query("SELECT distinct(video_type) FROM object_videos;", function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		return rows;
	});
}