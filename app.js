var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var ntlm = require('express-ntlm');

//var routes = require('./routes/index');
var users = require('./routes/users');
var ldap = require('./routes/ldap');
var np = require('./routes/np');
var getUsers = require('./routes/getUsers');


var app = express();
app.use(cookieParser());





// view engine setup
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret:'uwotm8'}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Gestione CORS
app.use(function(req,res,next){
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","X-Requested-With, content-type");
  res.header("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS");
  next();
});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/users', users);
app.use('/getUsers', getUsers);
app.use('/ldap',ldap);
app.use('/np',np);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

