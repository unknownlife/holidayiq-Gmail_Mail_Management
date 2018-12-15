var config;
if (process.env.NODE_ENV == 'production') {
	config = require('../../config/production');
}
else{
	config = require('../../config/development');
}
var geolocationController = require('../controllers/geolocationController');
var adminController = require('../controllers/adminController');
var adminControllerPhoto = require('../controllers/adminControllerPhoto');
var nodeCron = require('../crons/geoScheduler');
var vendorController = require('../controllers/vendorController');
var updateVendor = require('../controllers/vendorController');
var vidmodController = require('../controllers/vidmodController');
var markspam = require('../controllers/markSpamLeadController');
var LeadResultController = require('../controllers/LeadResultController');
var loginVendor = require('../controllers/vendorLoginController');
//Add small comments about every api - the main function it performs
//This file should only contain paths and the functions mapped to them and no business logic

/* GET home page. */
// Returns all the nearby attractions
module.exports = function(app) {
    
    //Returns the vendor page to update the score
    app.get('/rate-vendor', vendorController.Index);
    app.post('/rate-vendor/updateVendor', vendorController.updateVendor);

    app.get('/vidmod', vidmodController.Index);
    app.get('/vidmod/getobjects', vidmodController.getObjects);
    app.get('/vidmod/updatetime', vidmodController.submit);
    app.get('/vidmod/remove', vidmodController.remove);
    app.get('/vidmod/add', vidmodController.add);
    app.get('/vidmod/replace', vidmodController.replace);
    app.get('/vidmod/regenerate', vidmodController.regenerate);
    app.get('/partner/api', LeadResultController.Api);
    app.post('/partner/leadupdate', LeadResultController.leadUpdate);
    app.post('/partner/loginsubmit', LeadResultController.loginSubmit);
    app.get('/partner/dashboard', LeadResultController.dashboard);
    app.get('/partner/login', LeadResultController.Login);
    app.get('/partner/logout', LeadResultController.Logout);

app.get('/attraction/', geolocationController.getNearbyAttractions);

// Returns the attraction data to the Admin Page.
app.get('/attractionlatlon', adminController.attractionLatLon);

// Returns the attraction data based on the specified filters to the Admin Page.
app.get('/filterattractionlatlon', adminController.filterAttractionLatLon);

// Returns the attraction data with no LatLon data to the admin page to the Admin Page.
app.get('/getattractionswolatlon', adminController.getAttractionsWOLatLon);

// Sends the admin page as a response.
app.get('/admin/correctlatlon', adminController.correctLatLon);

// Update LatLon data in MySQL and Solr.
app.put('/updatelatlon', adminController.updateLatLon);

app.put('/updateattractiondisplay', adminController.updateAttractionDisplay);
// Returns total number of Docs present in Solr.
app.get('/getnoofdocsinsolr', adminController.getNoOfDocsInSolr);

app.get('/getlatlon', adminController.getLatLon);
app.get('/image', adminController.image);
app.get('/admin/demo', adminController.demo);

// Returns all the nearby hotels
app.get('/hotel/', geolocationController.getNearbyHotels);

// Returns the attraction data to the Admin Page.
app.get('/hotellatlon', adminController.hotelLatLon);

// Returns the attraction data based on the specified filters to the Admin Page.
app.get('/filterhotellatlon', adminController.filterHotelLatLon);

// Returns the hotel data with no LatLon data to the admin page to the Admin Page.
app.get('/gethotelswolatlon', adminController.getHotelsWOLatLon);

// Sends the admin page as a response.
app.get('/admin/correctlatlonhotel', adminController.correctLatLonHotel);

// Update LatLon data in MySQL and Solr.
app.put('/updatelatlonhotel', adminController.updateLatLonHotel);

app.put('/updatehoteldisplay', adminController.updateHotelDisplay);
// Returns total number of Docs present in Solr.
app.get('/getnoofdocsinsolrhotel', adminController.getNoOfDocsInSolrHotel);




// Sends the admin page as a response.
app.get('/admin/photoquality/', adminControllerPhoto.photoQuality);

// Sends the photo data as a response.
app.get('/getphotos/', adminControllerPhoto.getPhotos);

// Sends the filter photo data as a response.
app.get('/getfilterphotos/', adminControllerPhoto.getFilterPhotos);

// Sends the hero photo data as a response.
app.get('/getherophotos/', adminControllerPhoto.getHeroPhotos);

// Sends the Inspirational photo data as a response.
app.get('/getinspphotos/', adminControllerPhoto.getInspPhotos);

// Sends the filter photo data count as a response.
app.get('/countoffilterphotos/', adminControllerPhoto.getCountOfFilterPhotos);

// Sends the photo data count as a response.
app.get('/countofphotos/', adminControllerPhoto.getCountOfPhotos);

// Approve Photo status in MySQL.
app.put('/approvephotostatus', adminControllerPhoto.approvePhotoStatus);

// Disapprove Photo status in MySQL.
app.put('/disapprovephotostatus', adminControllerPhoto.disapprovePhotoStatus);

// Get all destinations
app.get('/getdestinations', adminControllerPhoto.getDestinations);

// Get attractions
app.get('/getattractions', adminControllerPhoto.getAttractions);

// Get hotels
app.get('/gethotels', adminControllerPhoto.getHotels);

// Change vertical of image
app.put('/changeverticalphoto', adminControllerPhoto.changeVertical);

// Set hero photos
app.put('/sethero', adminControllerPhoto.setHero);

// Remove hero photos
app.put('/removehero', adminControllerPhoto.removeHero);

// Set Insp photos
app.put('/setinsp', adminControllerPhoto.setInsp);

// Remove Insp photos
app.put('/removeinsp', adminControllerPhoto.removeInsp);

//Move Photo
app.put('/moveSelectedPhotos', adminControllerPhoto.movePhoto);

//Update Moved Photo Log
app.put('/updateMovedPhotos', adminControllerPhoto.updateMovedPhoto);


//Vendor Registration
app.get('/vendor/registration', loginVendor.vendorLogin);

//Vendor Generate
app.post('/vendor/generate', loginVendor.vendorGenerate);

//Vendor Home
app.get('/vendor/generate/home', loginVendor.vendorHome);

//Vendor List
app.post('/vendor/generate/list', loginVendor.vendorListFilter);

//Vendor Invite
app.get('/vendor/generate/add', loginVendor.vendorAdd);

//Vendor Intro
app.get('/vendor/authenticate', loginVendor.vendorAuth);

//Vendor Python Sign in
app.get('/vendor/pythonsign', loginVendor.vendorPySign);

//Vendor Mail view through lead id
app.post('/vendor/generate/list/view', loginVendor.vendorView);

//Vendor Update Status
app.post('/vendor/generate/list/update', loginVendor.vendorUpdate);
};