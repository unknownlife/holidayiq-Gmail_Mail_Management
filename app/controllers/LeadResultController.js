var request = require('request');
var session = require('express-session');
var LeadsDataModel = require('../models/LeadsData');

exports.loginSubmit = function (request, response){
    if (!(typeof request.body.email === 'undefined')) {
        LeadsDataModel.getUserData(request,function(rows){
             if (!(typeof rows[0] === 'undefined' || typeof rows[0].vendoruserid === 'undefined')) {
                 var extranumber=Math.random().toString(36).replace(/[^a-z 0-9]+/g, '').substr(0, 5);
                 var extranumber1=Math.random().toString(36).replace(/[^a-z 0-9]+/g, '').substr(0, 5);
                 request.session.vendoruserid = extranumber+rows[0].vendoruserid;
                 request.session.vendorid = extranumber1+rows[0].vendorid;
                 request.session.username = request.body.email;
                response.redirect('/partner/dashboard');return;
            } else{
                response.redirect('/partner/login?error=true');return;
            }
        });
    }

}



exports.Login = function(request, response){
    var error = request.param('error');
    response.render('../views/login', {
        title: 'Login',
        error: error
    });
};

exports.Logout = function(request, response){
    request.session = null
    response.redirect('/partner/login');return;
};

exports.Api = async (request, response) => {
    let p1 = new Promise(resolve =>LeadsDataModel.GetlLeads(request, resolve));
    let rows = await p1;

        var posts = [];
        if (typeof rows !== 'undefined' && rows.length > 0) {
            for(let post of rows)
             {
                var status = '';
                //if(post.leadtypes=='D'){
                if (post.status == 'V') {
                    status = "Fresh";
                } else if (post.status == 'H' && post.hot_lead_status == '0') {
                    status = "Fresh";
                } else if (post.status == 'G') {
                    status = "Regretted";
                } else if (post.status == 'P') {
                    status = "Pulled";
                } else if (post.status == 'F') {
                    status = "Hot Lead Follow Up";

                } else if (post.status == 'H' && post.hot_lead_status == '1') {
                    status = "Hot Lead";
                }
                //}
                var call_later_time = '';
                if ((post.call_later_time != null) && (post.call_later_time != '0000-00-00 00:00:00') && post.call_later_time) {
                    call_later_time = post.call_later_time;
                }

                var checkinDate = '';
                if (post.CheckinDate == '00/00/0000') {
                    checkinDate = '';
                } else {
                    checkinDate = post.CheckinDate;
                }


                var NoOfNights = post.NoOfNights;
                if (NoOfNights > 7) {
                    NoOfNights = '7';
                }

                var reason='';
                if(post.reason!= null){
                    reason=post.reason;
                }

                var lead_status='New';
                if((post.lead_status != null)){
                    lead_status=post.lead_status;
                }

                var commentdata='';

                /*let p2 = new Promise(resolve => LeadsDataModel.GetlLeadsCommentStatus(post, resolve));
                let notes = await p2;

                 notes.forEach(function (notesval, i) {
                     if(notesval.comment!=''){
                         commentdata=commentdata+notesval.comment+" <br>";
                     }

                });*/

                 var hiqnotes=post.hiq_comment;
                 var notes=post.comment;

                posts.push({
                    cdate: post.cdate,
                    leadid: post.leadtypes + post.leadid,
                    status: status,
                    source: post.cityname,
                    dname: post.DName,
                    channel: post.channel,
                    month: post.Month,
                    name: post.FirstName,
                    surname: post.surname,
                    phone: post.phone.replace('91', '0'),
                    CheckinDate: checkinDate,
                    NoOfNights: post.NoOfNights,
                    NoOfNightsNew: NoOfNights,
                    noofpeople: post.noofpeople,
                    AVGTariff: post.AVGTariff,
                    other: '',
                    unmonitized: post.unmonetized_reason,
                    assign_to: post.assign_to,
                    Emp: post.Emp,
                    EmpEmailID: post.EmpEmailID,
                    call_counter: post.call_counter,
                    call_later_time: call_later_time,
                    domestic_international: post.domestic_international,
                    themeid: post.themeid,
                    intent_id: post.intent_id,
                    accomodationbudgetid: post.accomodationbudgetid,
                    email: post.email,
                    Did: post.Did,
                    cityid: post.cityid,
                    flightortrain: post.flightortrain,
                    transport_arrangement: post.transport_arrangement,
                    hotel_class: post.hotel_class,
                    trip_stage: post.trip_stage,
                    lead_status: lead_status,
                    reason:reason,
                    notes: notes,
                    hiqnotes: hiqnotes
                });
            };
            response.json(posts);
        }

};

exports.dashboard = function(request, response){
    var error = request.param('error');
    var People = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'];
    var rows2=[];
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    }
    if(mm<10){
        mm='0'+mm;
    }
    var today = dd+'/'+mm+'/'+yyyy;
    var past = new Date();
    past.setDate( past.getDate() - 7 );
    var dd = past.getDate();
    var mm = past.getMonth()+1; //January is 0!

    var yyyy = past.getFullYear();
    if(dd<10){
        dd='0'+dd;
    }
    if(mm<10){
        mm='0'+mm;
    }

    var past = dd+'/'+mm+'/'+yyyy;

    var vendoruserid=request.session.vendoruserid.substr(5);
    var vendorid=request.session.vendorid.substr(5);
    var username=request.session.username;
    if(vendoruserid>0 && vendorid>0) {
        response.render('../views/vendorDashboard', {
            title: 'Partner Dashboard',
            error: error,
            vendoruserid: vendoruserid,
            vendorid: vendorid,
            username: username,
            userid: '12',
            userList: [],
            EmpEmailID: 'laxmikant@holidayiq.com',
            lms_ready: 'yes',
            People: People,
            tariffRange: rows2,
            fromdate: past,
            todate: today,
        });
    }else{
            response.redirect('/partner/login?error=true');
            return;
    }
};

exports.leadUpdate = function(request, response){
    if (!(typeof request.body.leadid === 'undefined')) {
        if(request.body.leadid){

            LeadsDataModel.GetlLeadsStatus(request, function(rows){
                if(rows[0]!== undefined){
                    LeadsDataModel.leadUpdate(request, function(rows1){
                        response.end('done');
                    });
                }else{
                    LeadsDataModel.leadInsert(request, function(rows1){
                        response.end('done');
                    });
                }

                   LeadsDataModel.insertNotes(request, function(rows2){
                        response.end('done');
                   });
            });

        }
    }
    response.end('done');
};

