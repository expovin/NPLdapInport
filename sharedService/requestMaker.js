var session = require('express-session');
var request = require('request');
var helper = require('./generalHelper.js');

module.exports = {

    'baseUrl' : (sess, getOptions, callback ) => {

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        request(getOptions, function(error, response, body){
            callback(response);
        });



    }
}
