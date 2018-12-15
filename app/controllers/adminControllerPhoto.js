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
		console.log('error when connecting to db:', err);
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

var common = `select (CASE p.Type
	WHEN 'A' THEN (SELECT Destination_name FROM destination WHERE destination_id=p.type_id)
	WHEN 'D' THEN (SELECT Destination_name FROM destination WHERE destination_id=p.type_id)
	WHEN 'R' THEN (SELECT Destination_name FROM resort AS r,destination AS d WHERE r.destination_id=d.destination_id AND r.ResortID=p.type_id)
	WHEN 'J' THEN (SELECT Destination_name FROM destination WHERE destination_id=p.type_id)
	WHEN 'F' THEN (SELECT Destination_name FROM destination WHERE destination_id=p.type_id)
  END) AS Destination,
  (CASE p.Type
	WHEN 'A' THEN (SELECT Destination_id FROM destination WHERE destination_id=p.type_id)
	WHEN 'D' THEN (SELECT Destination_id FROM destination WHERE destination_id=p.type_id)
	WHEN 'R' THEN (SELECT r.Destination_id FROM resort AS r WHERE r.ResortID=p.type_id)
	WHEN 'J' THEN (SELECT Destination_id FROM destination WHERE destination_id=p.type_id)
	WHEN 'F' THEN (SELECT Destination_id FROM destination WHERE destination_id=p.type_id)
	END) AS Destination_id,
	(CASE p.Type
		WHEN 'A' THEN (SELECT attractionid FROM attractions WHERE attractionid=p.Attraction_id)
		WHEN 'R' THEN (SELECT p.Type_id FROM resort AS r WHERE r.ResortID=p.type_id)
	END) AS type_id,
	(CASE p.Type
		WHEN 'A' THEN (SELECT url_slug FROM attractions WHERE attractionid=p.Attraction_id)
		WHEN 'R' THEN (SELECT ResortName FROM resort AS r,destination AS d WHERE r.destination_id=d.destination_id AND r.ResortID=p.type_id)
	  END) AS link,
  (CASE p.Type
	WHEN 'A' THEN (SELECT attractionname FROM attractions WHERE attractionid=p.Attraction_id)
	WHEN 'R' THEN (SELECT display_name FROM resort AS r,destination AS d WHERE r.destination_id=d.destination_id AND r.ResortID=p.type_id)
  END) AS display_name, 
  pm.photo_id, pm.tpqi, pm.cpqi, pm.rpqi, p.image_name, p.type, p.caption, p.width, p.height, p.Photo_date, p.Reviewer_id, p.Review_id
  from photo_upload_meta_data pm 
 join photo_upload p on pm.photo_id = p.photo_id 
`;

var commonCount = `select count(*) from photo_upload_meta_data pm join photo_upload p on pm.photo_id = p.photo_id `;
// Sends the admin page as a response.
exports.photoQuality = function(req, res, next){
	res.sendFile('html/photoquality.html', { root: 'public' });
}

// select pm.photo_id,pm.width,pm.height, pm.facial_percentage,pm.count_of_faces,pm.upperbody_percentage,pm.lowerbody_percentage,pm.percentage_occupied_by_people,pm.blurred,pm.contrast,pm.dynamic_range,pm.noise, pm.tpqi, pm.cpqi, pm.rpqi, p.image_name, p.type, p.marks, p.Attraction_id, a.attractionname, a.url_slug, d.Destination_name, d.Destination_id
// Update LatLon data in MySQL and Solr.
exports.getPhotos = function(req, res, next){
	var pageNumber = parseInt(req.query.pageNumber) || 1;

	var offset = (pageNumber - 1) * numOfPhotos;

	mysql_connection.query(common+" where p.Status = 'N' order by pm.tpqi desc limit "+numOfPhotos+" offset "+offset+";", function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
			res.send(rows);
	});
}


exports.getFilterPhotos = function(req, res, next){
	var pageNumber = parseInt(req.query.pageNumber) || 1;
	var destination = parseInt(req.query.destination) || '';
	var attraction = parseInt(req.query.attraction) || '';
	var hotel = parseInt(req.query.hotel) || '';
	var status = (req.query.status) || '';
	var fdate = (req.query.fdate) || 'is not NULL';
	var tdate = (req.query.tdate) || 'is not NULL';
	var sysr = (req.query.sysr) || 'false';
	var sysrf = (req.query.sysrf) || 'false';
	var offset = (pageNumber - 1) * numOfPhotos;
	var type = (req.query.type) || 'is not NULL';
	var hf = req.query.hf || '';
	var uid = parseInt(req.query.uid) || '';
	var pid = parseInt(req.query.pid) || '';	
	var lp = req.query.lp;
	var qr = req.query.qr || 4;
	var fr = req.query.fr || 2;
	var pr = req.query.pr || 25;

	if(sysr == 'true'){
		tval = ` and pm.tpqi < ${qr} `;
	}
	else{
		tval = '';
	}
	if(sysrf == 'true'){
		faceCount = ` and (pm.facial_percentage >= ${fr} or pm.percentage_occupied_by_people >= ${pr}) `;
	}
	else{
		faceCount = '';
	}
	if(destination != ''){
		destination = " and p.Type_id =  "+destination;
	}
	if(attraction != ''){
		attraction = "= "+attraction;
	}
	if(hotel != ''){
		hotel = "= "+hotel;
	}
	console.log('BBBB:' + type);
	var statust = '';
	if(status != ''){
		statust = " and p.Status = '"+status+"'";

		if(type == 'A'){
			statust = " and p.Status = '"+status+"' and p.Type_id != 0 and p.Attraction_id != -1 and p.Attraction_id != 0";
		}
		else if(type == 'D'){
			statust = " and p.Status = '"+status+"' and p.Type_id != 0 and p.Type_id != -1";
		}
		else if(type == 'R'){
			statust = " and p.Status = '"+status+"' and p.Type_id != -1";
		}
		else if(type == 'J'){
			statust = " and p.Status = '"+status+"' and p.Type_id != 0";
		}
	}
	status = statust;
	console.log('status:'+status)
	if(fdate != 'is not NULL'){
		fdate = "'"+fdate+" 00:00:00'";
	}
	if(tdate != 'is not NULL'){
		tdate = "'"+tdate+" 23:59:59'";
	}
	if(hf == 'true'){
		hf = ' and pm.count_of_faces > 0 '
	}
	if(hf == 'false'){
		hf = ' and pm.count_of_faces = 0 '
	}
	console.log('Typeid:'+lp);
	if(lp == 'true'){
		// status = " and p.Status = '"+status+"'";
		if(status == 'N'){
			status = " and p.Status = '"+status+"'";
		}
		console.log('Typeid:'+type);
		if(type == 'A'){
			console.log('DAMN');
			status += " and p.Type_id = 0 and p.Attraction_id = -1 and p.Attraction_id = 0";
		}
		else if(type == 'D'){
			status += " and p.Type_id = 0 and p.Type_id = -1";
		}
		else if(type == 'R'){
			status += " and p.Type_id = -1";
		}
		else if(type == 'J'){
			status += " and p.Type_id = 0";
		}
	}
	if(type != 'is not NULL'){
		type = `= '${type}'`;
	}

	if(uid != ''){
		var query = `${common}  where p.Reviewer_id = ${uid} order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
	}
	else if(pid != ''){
		var query = `${common}  where p.Photo_id = ${pid}  order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
	}
	else if(attraction != ''){
		if(fdate != 'is not NULL' && tdate != 'is not NULL'){
			var query = `${common}  where p.Attraction_id ${attraction}  ${status} and p.Photo_date BETWEEN ${fdate} and ${tdate}  ${tval}  ${faceCount} ${hf} order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
		else{
			var query = `${common}  where p.Attraction_id ${attraction}  ${status}  ${tval}  ${faceCount}  ${hf}  order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
	}
	else if(hotel != ''){
		if(fdate != 'is not NULL' && tdate != 'is not NULL'){
			var query = `${common}  where p.Type_id ${hotel}  ${status} and p.Photo_date BETWEEN ${fdate} and ${tdate}  ${tval}  ${faceCount}  ${hf} order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
		else{
			var query = `${common}  where p.Type_id ${hotel}  ${status}  ${tval}  ${faceCount}  ${hf} order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
	}
	else {
		if(fdate != 'is not NULL' && tdate != 'is not NULL'){
			var query = `${common}  where p.Type ${type}  ${destination}  ${status} and p.Photo_date BETWEEN ${fdate} and ${tdate}  ${tval}  ${faceCount}  ${hf} order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
		else{
			var query = `${common}  where p.Type ${type}  ${destination}  ${status}  ${tval}  ${faceCount}  ${hf}  order by pm.tpqi desc limit ${numOfPhotos} offset ${offset};`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
	}
}

exports.arrayUnique = function(array){
	var a = array.concat();
	// console.log(a);
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i]['image_name'] === a[j]['image_name'])
                a.splice(j, 1);
        }
    }
	// console.log(a);
    return a;
}

exports.getHeroPhotos = function(req, res, next){
	var destination = parseInt(req.query.destination) || '';
	var attraction = parseInt(req.query.attraction) || '';
	var hotel = parseInt(req.query.hotel) || '';    

	if(attraction != ''){
		// var query = `select best_photo as image_name from attractions where attractionid = ${attraction};`;
		// console.log(query);
		// mysql_connection.query(query, function(err, rows, fields){
		// 	if(err){
		// 		console.log(err);
		// 	}
			// console.log(rows);
			// res.send(rows);
			var query2 = `select image_name from hiq_best_photos where type = 'A' and type_id = ${attraction} and status = 'A' and inspiration = 'F';`;
			console.log(query2);
			mysql_connection.query(query2, function(err, rows2, fields){
				if(err){
					console.log(err);
				}
				// rows = rows.concat(rows2);
				// // console.log(rows);
				// rows = exports.arrayUnique(rows);

				res.send(rows2);
			});
		// });
	}
	else if(hotel != ''){
		// var query = `select image_name from best_photo_mapping bpm join photo_upload pu on pu.Photo_id = bpm.photo_id where bpm.object_id = ${hotel};`;
		// console.log(query);
		// mysql_connection.query(query, function(err, rows, fields){
		// 	if(err){
		// 		console.log(err);
		// 	}
			// console.log(rows);
			var query2 = `select image_name from hiq_best_photos where type = 'R' and type_id = ${hotel} and status = 'A' and inspiration = 'F';`;
			console.log(query2);
			mysql_connection.query(query2, function(err, rows2, fields){
				if(err){
					console.log(err);
				}
				// rows = rows.concat(rows2);
				// // console.log(rows);
				// rows = exports.arrayUnique(rows);
				res.send(rows2);
			});
		// });
	}
	else if(destination != ''){
		// var query = `select best_photo as image_name from destination where Destination_id = ${destination};`;
		// console.log(query);
		// mysql_connection.query(query, function(err, rows, fields){
		// 	if(err){
		// 		console.log(err);
		// 	}
			// console.log(rows);
			var query2 = `select image_name from hiq_best_photos where type = 'D' and type_id = ${destination} and status = 'A' and inspiration = 'F';`;
			console.log(query2);
			mysql_connection.query(query2, function(err, rows2, fields){
				if(err){
					console.log(err);
				}
				// rows = rows.concat(rows2);
				// // console.log(rows);
				// rows = exports.arrayUnique(rows);
				res.send(rows2);
			});
		// });
	}
}

exports.getInspPhotos = function(req, res, next){
	var destination = parseInt(req.query.destination) || '';
	var attraction = parseInt(req.query.attraction) || '';
	var hotel = parseInt(req.query.hotel) || '';    

	if(attraction != ''){

			var query2 = `select image_name from hiq_best_photos where type = 'A' and type_id = ${attraction} and status = 'A' and inspiration = 'T';`;
			console.log(query2);
			mysql_connection.query(query2, function(err, rows2, fields){
				if(err){
					console.log(err);
				}
				// rows = rows.concat(rows2);
				// // console.log(rows);
				// rows = exports.arrayUnique(rows);

				res.send(rows2);
			});
		// });
	}
	else if(hotel != ''){
		// var query = `select image_name from best_photo_mapping bpm join photo_upload pu on pu.Photo_id = bpm.photo_id where bpm.object_id = ${hotel};`;
		// console.log(query);
		// mysql_connection.query(query, function(err, rows, fields){
		// 	if(err){
		// 		console.log(err);
		// 	}
			// console.log(rows);
			var query2 = `select image_name from hiq_best_photos where type = 'R' and type_id = ${hotel} and status = 'A'  and inspiration = 'T';`;
			console.log(query2);
			mysql_connection.query(query2, function(err, rows2, fields){
				if(err){
					console.log(err);
				}
				// rows = rows.concat(rows2);
				// // console.log(rows);
				// rows = exports.arrayUnique(rows);
				res.send(rows2);
			});
		// });
	}
	else if(destination != ''){
		// var query = `select best_photo as image_name from destination where Destination_id = ${destination};`;
		// console.log(query);
		// mysql_connection.query(query, function(err, rows, fields){
		// 	if(err){
		// 		console.log(err);
		// 	}
			// console.log(rows);
			var query2 = `select image_name from hiq_best_photos where type = 'D' and type_id = ${destination} and status = 'A'  and inspiration = 'T';`;
			console.log(query2);
			mysql_connection.query(query2, function(err, rows2, fields){
				if(err){
					console.log(err);
				}
				// rows = rows.concat(rows2);
				// // console.log(rows);
				// rows = exports.arrayUnique(rows);
				res.send(rows2);
			});
		// });
	}
}

exports.getCountOfPhotos = function(req, res, next){
	mysql_connection.query("select count(*) from photo_upload_meta_data pm left join photo_upload p on pm.photo_id = p.photo_id  where p.Status = 'N';", function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.getDestinations = function(req, res, next){
	mysql_connection.query("SELECT Destination_id,Destination_name  FROM destination where other_destination='0' and CountryID = 1 ORDER BY Destination_name;", function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.getAttractions = function(req, res, next){
	var destinationid = parseInt(req.query.destinationid);
	mysql_connection.query("SELECT attractionid,attractionname  FROM attractions where destinationid = "+destinationid+" and active = 1 and status = 'active' ORDER BY attractionname;", function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.getHotels = function(req, res, next){
	var destinationid = parseInt(req.query.destinationid);
	mysql_connection.query("SELECT ResortID, display_name  FROM resort where Destination_id = "+destinationid+" and Active = 'T' ORDER BY display_name;", function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
		res.send(rows);
	});
}

exports.approvePhotoStatus = function(req, res, next){

	var photo_ids = JSON.parse(req.body.data);
	var status = req.body.status;
	var email = req.cookies['hiqadmin_email'];
	// var str = list.toString();
	// str = str.replace('[', '(');
	// str = str.replace(']', ')');
	var date = req.body.date;
	var rotate = JSON.parse(req.body.rotate);
	var angle = JSON.parse(req.body.angle);
	var tpqi = JSON.parse(req.body.tpqi);

	// console.log(photo_ids);
	// console.log(tpqi);
	for(var i = 0; i < rotate.length; i++){
		// console.log("tee");
		// console.log(rotate[i]);
		exports.rotatePhotos(rotate[i], angle[i], email);
	}

	if(email == '-'){
		email = "NULL";
		mysql_connection.query("update photo_upload p set Approved_by = NULL, Approved_Date = NULL, Status = 'N', comments = NULL where Photo_id in "+str+";", function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
			res.send();
		});
	}
	else{
		mysql_connection.query("select EmpID from employee e where EmpEmailID = '"+email+"';", function(err, rows, fields){
			if(err){
				console.log(err);
			}
			
			var empId = rows[0]['EmpID'];
			// console.log(empId);
			for(var i = 0; i < photo_ids.length; i++){
				mysql_connection.query("update photo_upload p set Approved_by = "+empId+", Status = '"+status+"', Approved_Date = '"+date+"', comments = 'Photo modified using the Bulk edit tool', Marks = " + tpqi[i] +" where Photo_id = "+photo_ids[i]+";", function(err, rows, fields){
					if(err){
						console.log(err);
					}
					// console.log(rows);
					
				});
			}

			res.send();
		});
	}
}

exports.disapprovePhotoStatus = function(req, res, next){
	var photo_ids = JSON.parse(req.body.data);
	
	var status = req.body.status;
	var email = req.cookies['hiqadmin_email'];
	var date = req.body.date;
	// console.log(email);
	if(email == '-'){
		email = "NULL";
		mysql_connection.query("update photo_upload p set Approved_by = NULL, Approved_Date = NULL, Status = 'N', comments = NULL where Photo_id in "+str+";", function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
			res.send();
		});
	}
	else{
		mysql_connection.query("select EmpID from employee e where EmpEmailID = '"+email+"';", function(err, rows, fields){
			if(err){
				console.log(err);
			}
			
			var empId = rows[0]['EmpID'];
			console.log(empId);
			for(var i = 0; i < photo_ids.length; i++){
				mysql_connection.query("update photo_upload p set Approved_by = "+empId+", Status = '"+status+"', Approved_Date = '"+date+"', comments = 'Photo modified using the Bulk edit tool' where Photo_id = "+photo_ids[i]+";", function(err, rows, fields){
					if(err){
						console.log(err);
					}
					// console.log(rows);
					
				});
			}

			res.send();
		});
	}
}

exports.changeVertical = function(req, res, next){
	var list = JSON.parse(req.body.data);
	var types = JSON.parse(req.body.types);
	// console.log(email);
		
	for(var i = 0; i < list.length; i++){
		mysql_connection.query("update photo_upload p set Type = '"+types[i]+"' where Photo_id = "+list[i].toString() +";", function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
			else{
				console.log(rows);
			}			
		});
	}
	res.send();
}

exports.setHero = function(req, res, next){
	var list = req.body.data;
	var images = JSON.parse(list);
	var status = req.body.status;
	var date = req.body.date;
	var type = req.body.type;
	var type_id = req.body.type_id;
	var reviewers = JSON.parse(req.body.reviewers);
	var photoids = JSON.parse(req.body.photoids);
	var reviews = JSON.parse(req.body.reviews);	

	console.log("PHOTOID");
	console.log(photoids);
	for(var i = 0; i < images.length; i++){
		mysql_connection.query(`insert into hiq_best_photos(type, type_id, image_name, created_date, reviewerid, photo_id, reviewid) values ('${type}', ${type_id}, '${images[i]}', '${date}', ${reviewers[i]}, ${photoids[i]}, ${reviews[i]}); `, function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
		});
		// console.log(images[i]);
		mysql_connection.query(`select Photo_id from photo_upload where Image_name = '${images[i]}';`, function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
			
			var id = rows[0]['Photo_id'] || '';

			if(id != ''){

				mysql_connection.query(`update photo_upload_meta_data set tpqi = tpqi + 2 where photo_id = ${id};`, function(err, rows, fields){
					if(err){
						console.log(err);
					}
					
				});
			}
		});
		mysql_connection.query(`update hiq_best_photos set status = 'A' where photo_id = ${photoids[i]}; `, function(err, rows, fields){
			if(err){
				console.log(err);
				
			}
			// console.log(rows);
		});
	}

	res.send();
}

exports.setInsp = function(req, res, next){
	var list = req.body.data;
	var images = JSON.parse(list);
	var status = req.body.status;
	var date = req.body.date;
	var type = req.body.type;
	var type_id = req.body.type_id;
	var reviewers = JSON.parse(req.body.reviewers);
	var photoids = JSON.parse(req.body.photoids);
	var reviews = JSON.parse(req.body.reviews);

	console.log("PHOTOID");
	console.log(photoids);
	for(var i = 0; i < images.length; i++){
		mysql_connection.query(`insert into hiq_best_photos(type, type_id, image_name, created_date, reviewerid, photo_id, reviewid, inspiration) values ('${type}', ${type_id}, '${images[i]}', '${date}', ${reviewers[i]}, ${photoids[i]}, ${reviews[i]}, 'T'); `, function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
		});
		// console.log(images[i]);
		mysql_connection.query(`select Photo_id from photo_upload where Image_name = '${images[i]}';`, function(err, rows, fields){
			if(err){
				console.log(err);
			}
			// console.log(rows);
			
			var id = rows[0]['Photo_id'] || '';

			if(id != ''){

				mysql_connection.query(`update photo_upload_meta_data set tpqi = tpqi + 2 where photo_id = ${id};`, function(err, rows, fields){
					if(err){
						console.log(err);
					}
					
				});
			}
		});
		mysql_connection.query(`update hiq_best_photos set status = 'A' where photo_id = ${photoids[i]}; `, function(err, rows, fields){
			if(err){
				console.log(err);
				
			}
			// console.log(rows);
		});
	}

	res.send();
}

exports.removeHero = function(req, res, next){
	var list = req.body.data;
	var images = list.toString();
	images = images.replace('[', '(');
	images = images.replace(']', ')');
	var status = req.body.status;
	var date = req.body.date;
	var type = req.body.type;
	var type_id = req.body.type_id;

	var imageNames = JSON.parse(list);
	// console.log(images);
	mysql_connection.query(`update hiq_best_photos set status = 'I', updated_date = '${date}' where type = '${type}' and type_id = '${type_id}' and image_name in ${images}; `, function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
	});

	for(var i = 0; i < imageNames.length; i++){
		mysql_connection.query(`select Photo_id from photo_upload where Image_name = '${imageNames[i]}';`, function(err, rows, fields){
			if(err){
				console.log(err);
			}
			var id = rows[0]['Photo_id'];

			mysql_connection.query(`update photo_upload_meta_data set tpqi = tpqi - 2 where photo_id = ${id};`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				
			});
		});
	}
	res.send();
}

exports.removeInsp = function(req, res, next){
	var list = req.body.data;
	var images = list.toString();
	images = images.replace('[', '(');
	images = images.replace(']', ')');
	var status = req.body.status;
	var date = req.body.date;
	var type = req.body.type;
	var type_id = req.body.type_id;

	var imageNames = JSON.parse(list);
	// console.log(images);
	mysql_connection.query(`update hiq_best_photos set status = 'I', updated_date = '${date}' where type = '${type}' and type_id = '${type_id}' and image_name in ${images}; `, function(err, rows, fields){
		if(err){
			console.log(err);
		}
		// console.log(rows);
	});

	for(var i = 0; i < imageNames.length; i++){
		mysql_connection.query(`select Photo_id from photo_upload where Image_name = '${imageNames[i]}';`, function(err, rows, fields){
			if(err){
				console.log(err);
			}
			var id = rows[0]['Photo_id'];

			mysql_connection.query(`update photo_upload_meta_data set tpqi = tpqi - 2 where photo_id = ${id};`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				
			});
		});
	}
	res.send();
}

// SELECT * FROM indiaresorts.photo_upload where type = 'R' and review_id = 708;

// select rs.rate_sheet_id, r.resortid, r.display_name from rating_sheet rs join resort r on r.resortid = rs.resort_id where rate_sheet_id = 708;
exports.getCountOfFilterPhotos = function(req, res, next){
	var pageNumber = parseInt(req.query.pageNumber) || 1;
	var destination = parseInt(req.query.destination) || '';
	var attraction = parseInt(req.query.attraction) || '';
	var hotel = parseInt(req.query.hotel) || '';
	var status = (req.query.status) || '';
	var fdate = (req.query.fdate) || 'is not NULL';
	var tdate = (req.query.tdate) || 'is not NULL';
	var sysr = (req.query.sysr) || 'false';
	var sysrf = (req.query.sysrf) || 'false';
	var type = (req.query.type) || 'is not NULL';
	var offset = (pageNumber - 1) * numOfPhotos;
	var hf = req.query.hf || '';
	var qr = req.query.qr || 4;
	var fr = req.query.fr || 2;
	var pr = req.query.pr || 25;
	var uid = parseInt(req.query.uid) || '';
	var pid = parseInt(req.query.pid) || '';
	var lp = req.query.lp;

	if(sysr == 'true'){
		tval = ` and pm.tpqi < ${qr} `;
	}
	else{
		tval = '';
	}
	if(sysrf == 'true'){
		faceCount = ` and (pm.facial_percentage >= ${fr} or pm.percentage_occupied_by_people >= ${pr}) `;
	}
	else{
		faceCount = '';
	}
	if(destination != ''){
		destination = " and p.Type_id = "+destination ;
	}
	if(attraction != ''){
		attraction = "= "+attraction;
	}
	if(hotel != ''){
		hotel = "= "+hotel;
	}
	var statust = '';
	if(status != ''){
		statust = " and p.Status = '"+status+"'";

		if(type == 'A'){
			statust = " and p.Status = '"+status+"' and p.Type_id != 0 and p.Attraction_id != -1 and p.Attraction_id != 0";
		}
		else if(type == 'D'){
			statust = " and p.Status = '"+status+"' and p.Type_id != 0 and p.Type_id != -1";
		}
		else if(type == 'R'){
			statust = " and p.Status = '"+status+"' and p.Type_id != -1";
		}
		else if(type == 'J'){
			statust = " and p.Status = '"+status+"' and p.Type_id != 0";
		}
	}
	status = statust;
	if(fdate != 'is not NULL'){
		fdate = "'"+fdate+" 00:00:00'";
	}
	if(tdate != 'is not NULL'){
		tdate = "'"+tdate+" 23:59:59'";
	}
	if(hf == 'true'){
		hf = ' and pm.count_of_faces > 0 '
	}
	if(hf == 'false'){
		hf = ' and pm.count_of_faces = 0 '
	}
	if(lp == 'true'){
		// status = " and p.Status = '"+status+"'";
		console.log("BAD");
		if(status == 'N'){
			status = " and p.Status = '"+status+"'";
		}
		if(type == 'A'){
			status += " and p.Type_id = 0 and p.Attraction_id = -1 and p.Attraction_id = 0";
		}
		else if(type == 'D'){
			status += " and p.Type_id = 0 and p.Type_id = -1";
		}
		else if(type == 'R'){
			status += " and p.Type_id = -1";
		}
		else if(type == 'J'){
			status += " and p.Type_id = 0";
		}
	}
	if(type != 'is not NULL'){
		type = `= '${type}'`;
	}

	if(uid != ''){
		var query = `${commonCount}  where p.Reviewer_id = ${uid} ;`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
	}
	else if(pid != ''){
		var query = `${commonCount}  where p.Photo_id = ${pid} ;`;
			console.log(query);
			mysql_connection.query(query, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
	}
	else if(attraction != ''){
		if(fdate != 'is not NULL' && tdate != 'is not NULL'){
			mysql_connection.query(`${commonCount} where p.Attraction_id ${attraction}  ${status} and p.Photo_date BETWEEN ${fdate} and ${tdate}  ${tval}  ${faceCount} ${hf} ;`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
		else{
			mysql_connection.query(`${commonCount} where p.Attraction_id ${attraction}  ${status}  ${tval}  ${faceCount} ${hf} ;`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
	}
	else if(hotel != ''){
		if(fdate != 'is not NULL' && tdate != 'is not NULL'){
			mysql_connection.query(`${commonCount} where p.Type_id ${hotel}  ${status} and p.Photo_date BETWEEN ${fdate} and ${tdate}  ${tval}  ${faceCount}  ${hf} ;`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
		else{
			mysql_connection.query(`${commonCount} where p.Type_id ${hotel}  ${status}  ${tval}  ${faceCount} ${hf} ;`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
	}
	else{
		if(fdate != 'is not NULL' && tdate != 'is not NULL'){
			mysql_connection.query(`${commonCount} where p.Type ${type}  ${destination}  ${status} and p.Photo_date BETWEEN ${fdate} and ${tdate}  ${tval}  ${faceCount} ${hf} ;`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
		else{
			mysql_connection.query(`${commonCount} where p.Type ${type}  ${destination}  ${status}  ${tval}  ${faceCount} ${hf} ;`, function(err, rows, fields){
				if(err){
					console.log(err);
				}
				// console.log(rows);
				res.send(rows);
			});
		}
	}
}

exports.rotatePhotos = function(photo_id, rotation, email) {
	
	mysql_connection.query("select EmpID from employee e where EmpEmailID = '"+email+"';", function(err, rows, fields){
		if(err){
			console.log(err);
		}
		
		var empId = rows[0]['EmpID'];
		var url = `http://admin.holidayiq.com/admin-new/photoStatusUpdateApi.php?photoPos=${rotation}&photoid=${photo_id}&photoStatus=A&EmpID=${empId}&node=1`;
		request.get(url, (error, response, body) => {
			if(error){
				console.log("Rotate failure " + error);
			}
			else{
				console.log("Rotate success ");
			}
		});
	});
}

exports.movePhoto = function(req, res, next){
	var list = JSON.parse(req.body.data);
	var attraction_id = JSON.parse(req.body.attraction);
	var type_id = JSON.parse(req.body.type);
	for(var i = 0; i < list.length; i++){
		mysql_connection.query("update photo_upload SET Type_id = "+type_id[i]+", Attraction_id = "+attraction_id[i]+" where Photo_id = "+list[i]+" ", function(err, rows){
			if(err){
				console.log(err);
			}
			else{
				console.log("query executed");
			}
		})
	}
	res.send();
}

exports.updateMovedPhoto = function(req, res, next){
	var list = JSON.parse(req.body.data);
	var attraction_id = JSON.parse(req.body.attraction);
	var type_id = JSON.parse(req.body.type);
	var old_attraction = JSON.parse(req.body.oldAttracid);
	var old_type = JSON.parse(req.body.oldTypeid);
	var date = req.body.date;
	var email = req.cookies['hiqadmin_email'];
	console.log(email);

	mysql_connection.query("SELECT EmpID from employee WHERE EmpEmailID = '"+email+"';", function(err, row){
		if(err){
			console.log(err);
		}
		var empId = row[0].EmpID;
		console.log(empId); 
		for(var i = 0; i < list.length; i++){
			var query = "INSERT into updated_photo_log (photo_id, old_type_id, old_attraction_id, updated_type_id, updated_attraction_id, modification_date, modified_by) VALUES ("+list[i]+", "+old_type[i]+", "+old_attraction[i]+", "+type_id[i]+", "+attraction_id[i]+", '"+date+"', '"+empId+"')";	
			mysql_connection.query(query, function(err, rows){
				if(err){
					console.log(err);
				}
			});		
		}
		res.send();
	})
}