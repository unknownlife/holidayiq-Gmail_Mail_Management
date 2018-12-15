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
solrClient.autoCommit = true;

var solrClientHotel = solr.createClient(host = config.solr.HOST, port = config.solr.PORT, core = config.solr.HOTEL_CORE);
solrClientHotel.autoCommit = true;

exports.indexIntoSolr = function(row){
	// console.log(JSON.stringify(row));

	solrClient.add(row, function(err,obj){
		if(err){
		   console.log('Solr error:',err);
		}else{
		//    console.log('Solr response:', obj);
		}
	 });
}

exports.indexIntoSolrHotel = function(row){
	// console.log(JSON.stringify(row));

	solrClientHotel.add(row, function(err,obj){
		if(err){
		   console.log('Solr error:',err);
		}else{
		//    console.log('Solr response:', obj);
		}
	 });
}

exports.updateSolr = function(id, lat, lon){

	var query = solrClient.createQuery()
				.q("id:" + id)
				.start(0)
				.rows(5)
				.set("sort=id%20asc")
				;

	solrClient.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
			var data = obj.response.docs[0];
			data.latitude = {'set': lat};
			data.longitude = {'set': lon};
			data.distOandN = {'set': 0};
			delete data['_version_'];
			// console.log(obj.response.docs[0]);
			// console.log(data);
			solrClient.add(data, function(err, obj) {
				if (err) {
					console.log(err.stack);
				} else {
					// console.log("Solr success");
					solrClient.softCommit();
				}
			  });
		}
	});
	
}

exports.updateSolrHotel = function(id, lat, lon){

	var query = solrClientHotel.createQuery()
				.q("id:" + id)
				.start(0)
				.rows(5)
				.set("sort=id%20asc")
				;

	solrClientHotel.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
			var data = obj.response.docs[0];
			data.latitude = {'set': lat};
			data.longitude = {'set': lon};
			data.distOandN = {'set': 0};
			delete data['_version_'];
			// console.log(obj.response.docs[0]);
			// console.log(data);
			solrClientHotel.add(data, function(err, obj) {
				if (err) {
					console.log(err.stack);
				} else {
					// console.log("Solr success");
					solrClientHotel.softCommit();
				}
			  });
		}
	});
	
}

exports.updateAttractionStatus = function(id, checked){

	var query = solrClient.createQuery()
				.q("id:" + id)
				.start(0)
				.rows(5)
				.set("sort=id%20asc")
				;

	solrClient.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
			var data = obj.response.docs[0];
			if(checked == true){
				// console.log('not display');
				data.status = {'set': 'not displayed'};
			}
			else if(checked == false){
				data.status = {'set': 'displayed'};
			}
			delete data['_version_'];
			// console.log(obj.response.docs[0]);
			// console.log(data);
			solrClient.add(data, function(err, obj) {
				if (err) {
					console.log(err.stack);
				} else {
					// console.log("Solr success");
					solrClient.softCommit();
				}
			});
		}
	});
	
}

exports.updateHotelStatus = function(id, checked){

	var query = solrClientHotel.createQuery()
				.q("id:" + id)
				.start(0)
				.rows(5)
				.set("sort=id%20asc")
				;

	solrClientHotel.search(query, function(err, obj){
		if(err){
			console.log(err);
			res.send(err);
		}else{
			var data = obj.response.docs[0];
			if(checked == true){
				data.status = {'set': 'not displayed'};
			}
			else if(checked == false){
				data.status = {'set': 'displayed'};
			}
			delete data['_version_'];
			// console.log(obj.response.docs[0]);
			// console.log(data);
			solrClientHotel.add(data, function(err, obj) {
				if (err) {
					console.log(err.stack);
				} else {
					// console.log("Solr success");
					solrClientHotel.softCommit();
				}
			});
		}
	});
	
}

exports.getNoOfDocsInSolr = function(req, res, next){

	var query = solrClient.createQuery()
				.q('*:*')
				.start(0)
				.rows(0)
                ;
    
    solrClient.search(query, function(err, obj){
        if(err){
            console.log(err);
            return(err);
        }else{
            // console.log(obj.response.numFound);
            return(obj.response.numFound);
        }
    });
}

exports.reloadSolrCore = function(){
	var options = { 
		method: 'GET',
		url: 'http://localhost:8983/solr/admin/cores?action=RELOAD&core=' + config.solr.CORE,
	};

	request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Reload Failure");
        }
        else{
			// console.log(response.body);
			exports.optimizeSolrCore();
            console.log("Reload Success");
        }
    });
}

exports.reloadSolrCoreHotel = function(){
	var options = { 
		method: 'GET',
		url: 'http://localhost:8983/solr/admin/cores?action=RELOAD&core=' + config.solr.HOTEL_CORE,
	};

	request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Reload Failure");
        }
        else{
			// console.log(response.body);
			exports.optimizeSolrCoreHotel();
            console.log("Reload Success");
        }
    });
}

exports.optimizeSolrCore = function(){
	var options = { 
		method: 'GET',
		url: `http://localhost:8983/solr/${config.solr.CORE}/update?optimize=true`,
	};

	request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Reload Failure");
        }
        else{
            // console.log(response.body);
            console.log("Optimization Success");
        }
    });
}

exports.optimizeSolrCoreHotel = function(){
	var options = { 
		method: 'GET',
		url: `http://localhost:8983/solr/${config.solr.HOTEL_CORE}/update?optimize=true`,
	};

	request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Reload Failure");
        }
        else{
            // console.log(response.body);
            console.log("Optimization Success");
        }
    });
}

// this.optimizeSolrCore();