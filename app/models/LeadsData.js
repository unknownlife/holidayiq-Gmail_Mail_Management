//var config = require('../../config');
var mysqlService = require('../services/mysqlService');
var mysql = require('mysql');
if(process.env.NODE_ENV == 'production'){
    config = require('../../config/production');
}
else{
    console.log('qqqqqqqqqq')
    config = require('../../config/development');
}

var leadResultCtrl = require('../controllers/LeadResultController');

var pool  = mysql.createPool({
    host: config.mysql.HOST,
    port: config.mysql.PORT,
    user: config.mysql.MYSQL_USER,
    password: config.mysql.MYSQL_PASS,
    connectionLimit : 2
});

var executeQuery = function(query, callback) {
    pool.getConnection(function(err, connection) {
        // Use the connection
        connection.query(query, function (error, results, fields) {
            if(callback != null) {
                callback(JSON.parse(JSON.stringify(results)));
            }
            connection.release();
        });
    });
};

var executeUpdateQuery = function(query, callback) {
    pool.getConnection(function(err, connection) {
        // Use the connection
        connection.query(query, function (error, results, fields) {
            if(callback != null) {
                callback(results);
            }
            connection.release();
        });
    });
};


exports.getUserData = function(request, callback){
    var email = request.body.email
    var password = request.body.password

    var query="SELECT vu.vendoruserid,v.displayleads,v.vendorid, vu.password FROM indiaresorts.vendorusers vu,indiaresorts.vendors v WHERE vu.firstname = '"+email+"' AND (vu.PASSWORD = MD5('"+password+"')) AND vu.vendorid = v.vendorid AND v.displayleads=1 and vu.active='T'";
    executeQuery(query, callback);
};

exports.GetlLeads = function(request, callback){
    var vendorid=request.query.vendorid;
    var userid=request.query.userid;
    var startdate_res=request.query.startdate.split("/");
    var startdate=startdate_res[2]+'-'+startdate_res[1]+'-'+startdate_res[0]+' 00:00:00';
    var enddate_res=request.query.enddate.split("/");
    var enddate=enddate_res[2]+'-'+enddate_res[1]+'-'+enddate_res[0]+' 23:59:59';

    var query="SELECT leadList.* FROM ((SELECT sp.comment,sp.hiq_comment,sp.reason,sp.lead_status,p.trip_stage, lx.flightortrain, p.transport_arrangement, p.hotel_class, p.hot_lead_status,p.intent_id,p.email,p.channel,p.mobileno_verified AS verified,v.assignment_id AS leadid,'D' AS leadtypes, p.status,'' AS ResortName, d.Destination_id AS Did, d.Destination_name AS DName, '' AS resortid, t.tariffrange AS AVGTariff, p.nights AS NoOfNights, DATE_FORMAT(p.startdate,'%d/%m/%Y') AS CheckinDate, DATE_FORMAT(p.startdate,'%b') AS MONTH, (p.adults) AS noofpeople, p.expectedvalue, p.firstname AS FirstName, p.surname, p.cityid, p.cityname, p.countryid, p.phone, p.countryname,v.date_created as createddate,DATE_FORMAT(v.date_created,'%d/%m/%Y %h:%i %p') AS cdate, p.request AS requests,p.adults AS adults, p.seniors AS seniors, p.children AS children, p.infants AS infants,p.service_airport_pickup AS service_airport_pickup, p.service_taxi AS service_taxi, p.service_sightseeing AS service_sightseeing, p.service_airtickets AS service_airtickets, p.service_busortraintickets AS service_busortraintickets, p.service_none AS service_none, p.paymentmode AS paymentmode, p.number_of_rooms,p.is_calling, p.unmonetized_reason, p.domestic_international as domestic_international, p.themeid as themeid, p.accomodationbudgetid as accomodationbudgetid FROM indiaresorts.dest_leads_data p LEFT JOIN indiaresorts.lead_extra_data AS lx ON (lx.vdestleadid = p.destleadid) LEFT JOIN indiaresorts.tariffranges AS t ON (t.tariffrangeid=p.accomodationbudgetid) LEFT JOIN indiaresorts.facebook_trip_stages AS f ON (f.stage_id = p.trip_stage), indiaresorts.destination AS d,indiaresorts.vendor_leads_data as v LEFT JOIN indiaresorts.vendor_disposition_data as sp ON (v.assignment_id=sp.assignment_id) WHERE d.Destination_id = p.destinationid AND p.startdate!='0000-00-00' AND p.status='P' AND p.destleadid=v.leadid AND t.tariffrangeid = p.`accomodationbudgetid` AND v.pulledvendorid='"+vendorid+"' AND v.vendoruserid='"+userid+"' AND v.date_created>='"+startdate+"' AND v.date_created<='"+enddate+"') ORDER BY DATE_FORMAT(p.createddate,'%Y%m%d') DESC ) AS leadList";

    executeQuery(query, callback);
};

exports.GetlLeadsStatus= function(request, callback){
    var lead_id = request.body.leadid;
    var leadid = lead_id.substring(1);
    var leadtype = lead_id.substring(0,1);
    if (leadid == 0 || leadtype == '' ) {
        callback('0');
    }

    var query="select * from indiaresorts.vendor_disposition_data where assignment_id="+leadid;
    console.log(query);
    executeQuery(query, callback);

};

exports.leadInsert = function(request, callback){
    var lead_id = request.body.leadid;
    var leadid = lead_id.substring(1);
    var leadtype = lead_id.substring(0,1);
    if (leadid == 0 || leadtype == '' ) {
        callback('0');
    }

        var leadReason=request.body.newStatus;
        var closedReason=request.body.closedReason;
        var vendorId=request.body.vendorid;
        var vendorUserId=request.body.userid;
        var notes=request.body.notes;

    var query="insert into indiaresorts.vendor_disposition_data(id,assignment_id,vendorid,vendor_user_id,lead_status,reason,comment,leadhashid,created_date) values ('"+null+"','"+leadid+"','"+vendorId+"', '"+vendorUserId+"','"+leadReason+"','"+closedReason+"','"+notes+"','', NOW())";

        executeQuery(query, callback);

};

exports.leadUpdate = function(request, callback){
    var lead_id = request.body.leadid;
    var leadid = lead_id.substring(1);
    var leadtype = lead_id.substring(0,1);
    if (leadid == 0 || leadtype == '' ) {
        callback('0');
    }

    var leadReason=request.body.newStatus;
    var closedReason=request.body.closedReason;
    var vendorId=request.body.vendorid;
    var vendorUserId=request.body.userid;
    var notes=request.body.notes;

    var query="update indiaresorts.vendor_disposition_data set comment='"+notes+"',lead_status='"+leadReason+"',reason='"+closedReason+"', updated_date=now() where assignment_id="+leadid;
    executeQuery(query, callback);
};

exports.insertNotes = function(request, callback){
    var lead_id = request.body.leadid;
    var leadid = lead_id.substring(1);
    var leadtype = lead_id.substring(0,1);
    if (leadid == 0 || leadtype == '' ) {
        callback('0');
    }

    var leadReason=request.body.newStatus;
    var closedReason=request.body.closedReason;
    var notes=request.body.notes;
    var createdby=request.body.createdby;
    var vendorId=request.body.vendorid;
    var vendorUserId=request.body.userid;

    var query="insert into indiaresorts.vendor_disposition_comment(assignment_id,status,reason,comment,created_by,created_id,created_date) values ('"+leadid+"','"+leadReason+"', '"+closedReason+"','"+notes+"','"+createdby+"','"+vendorUserId+"', NOW())";
    executeQuery(query, callback);
};

exports.GetlLeadsCommentStatus= function(post, callback){
    var lead_id = post.leadid;
    var query="select * from indiaresorts.vendor_disposition_comment where assignment_id="+lead_id+" order by created_date DESC ";
    executeQuery(query, callback);

};