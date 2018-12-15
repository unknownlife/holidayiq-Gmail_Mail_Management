var express = require('express');
var cookieSession = require('cookie-session');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var index = require('./app/routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/app/views'));
// app.set('view engine', 'jade');
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
    name: 'session',
    keys: ['ssshhhhh'],
    // Cookie Options
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}));

//app.use('/', index);
require('./app/routes/index')(app);
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development

// console.log(res);

//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   //res.render('index');
// });

module.exports = app;
