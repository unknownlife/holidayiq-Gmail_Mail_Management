var request = require('request');
var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}

var message = {
    "html": "",
    // "text": "Example text content",
    "subject": "Geo-scheduler progress",
    "from_email": "noreply@holidayiq.com",
    "from_name": "Geo-Location scheduler",
    "to": config.emailService.geoScheduler,
    "headers": {
        "Reply-To": "noreply@holidayiq.com"
    },
    // "tags" : [ process.env.NODE_ENV + "-prospect-engine"],
    "important": true,
    "track_opens": true,
    "track_clicks": true,
    "auto_text": null,
    "auto_html": null,
    "inline_css": null,
    "url_strip_qs": null,
    "preserve_recipients": null,
    "view_content_link": null,
    "tracking_domain": null,
    "signing_domain": null,
    "return_path_domain": null,
    "metadata": {
        "website": "www.holidayiq.com"
    },
    "recipient_metadata": [{
            "rcpt": "akash.basabhat@holidayiq.com",
            "values": {
            //     "prospect_destination_id": prospect_destination_id,
            //     "event_id" : event_id,
            //     "environment" : process.env.NODE_ENV,
            //     "template_id" : templateObj.id
            }
        }]
};


var options = { 
    method: 'POST',
    url: 'https://mandrillapp.com/api/1.0/messages/send.json',
    headers: { 
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json' 
    },
    json : {
        'key': 'hlKxJxcw5Ef7yV3FbvSTyA',
        'message' : message,
        'async': false,
        'ip_pool': 'Main Pool',
        'send_at': "2015-01-01 00:00:00"
    }

};

exports.sendEmail = function(processed, noData, remaining){
    message.subject = "Geo Scheduler progress for Attractions";
    message.html = "<p>Total number of Attractions processed: " + processed + "<br/>" +
                   "Total number of Attractions having no data: " + noData + "<br/>" +
                   "Total number of Attractions remaining: " + remaining + "</p>"
    request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Email Failure");
        }
        else{
            console.log("Email Success");
        }
    });
}

exports.sendEmailHotel = function(processed, noData, remaining){
    message.subject = "Geo Scheduler progress for Hotels";
    message.html = "<p>Total number of Hotels processed: " + processed + "<br/>" +
                   "Total number of Hotels having no data: " + noData + "<br/>" +
                   "Total number of Hotels remaining: " + remaining + "</p>"
    request(options, function (error, response, body) {

        if (error) {
            // done();
            console.log("Email Failure");
        }
        else{
            console.log("Email Success");
        }
    });
}