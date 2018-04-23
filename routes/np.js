var express = require('express');
var router = express.Router();
var session = require('express-session');
var request = require('request');
var fs = require('fs'); 
var helper = require('../sharedService/generalHelper.js');
var reqMaker = require('../sharedService/requestMaker.js');

var userTest = {
    'email':'ves@qlik.com',
    'password':'segreta',
    'enabled':true,
	'username':'ves',
	'timezone' : 'Europe/Rome',
	'locale' : 'it'
}

// Session variable
var sess={};

// Authentication (get the Token)
router.post('/auth', function(req, res, next) {

	sess=req.session;
	sess.username = req.body.user;
	sess.password = req.body.password;
	sess.NPServer = req.body.NPServer;
	sess.NPPort = req.body.NPPort;
	sess.Cookies_toSend = [];


	// Actual URL to make the authentication (INTERNAL)
	var Baseurl = 'https://'+sess.NPServer+":"+sess.NPPort
	
	// Credential in the Body
	var credential = {
    	"username": sess.username,
    	"password" : sess.password
	};

	var getOptions = {
		method : 'GET',
		url : Baseurl
	};


	//console.log(helper.echo("ciao"));
	// First request GET to retrive NPWEBCONSOLE_SESSION
	// Avoid Self-Signed Certificate Warning
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	request(getOptions, function(error, response, body){
		if(error){
			console.error("Error getting data", error);
			throw error;
		}

		if(response.statusCode == 200){
			
			
			sess.Cookies = response.headers['set-cookie'];
			sess.Cookies_toSend = helper.getCookie(sess.Cookies);
			sess.X_XSRF_TOKEN = helper.getToken(sess.Cookies_toSend,'NPWEBCONSOLE_XSRF-TOKEN');
			sess.preLoginSession = helper.getToken(sess.Cookies_toSend,'NPWEBCONSOLE_SESSION');

			console.log("GET Request\t",response.statusCode,"\t",helper.getToken(sess.Cookies_toSend,'NPWEBCONSOLE_XSRF-TOKEN'),"\t",unescape(helper.getToken(sess.Cookies_toSend,'NPWEBCONSOLE_SESSION')));

			// Headers
			var headers = {
				"Content-Type": "application/json;charset=utf-8",
				"Accept": "application/json, text/plain, */*",
				"Cache-Control":"no-cache",
				'Connection':'keep-alive',
				"x-xsrf-token" : sess.X_XSRF_TOKEN,
				"Cookie" : helper.oneString(sess.Cookies_toSend)
			};

			var option = {
				'method' : 'POST',
				'body' : credential,
				'headers' : headers,
				'json' : true,
				'url' : Baseurl+"/login"

			//	'agentOptions' : {
			//		ca: fs.readFileSync("certs/EC2AMAZ-UANEOM8.crt")
			//	}
			};


			// Second Call to make the actual Login
			request(option,  function (error, response, body) {
				
				if(error){
					console.error("Error posting data", error);
					throw error;
				}

				console.log("GET Request\t",response.statusCode,"\t",helper.getToken(sess.Cookies_toSend,'NPWEBCONSOLE_XSRF-TOKEN'),"\t",unescape(helper.getToken(sess.Cookies_toSend,'NPWEBCONSOLE_SESSION')));

				if(response.statusCode == 200){
					console.log("POST Auth  	[OK]");

					sess.Cookies = response.headers['set-cookie'];
					sess.Cookies_toSend = helper.getCookie(sess.Cookies);
					console.log("New Cookies -->", sess.Cookies_toSend);
					sess.Cookies_toSend = helper.replaceSessionId(sess.Cookies_toSend, "NPWEBCONSOLE_SESSION="+sess.preLoginSession);
					console.log("Replace Session --> ",sess.Cookies_toSend);


					if(response.statusCode == 200){
						res.json({
							"X_XSRF_TOKEN" : sess.X_XSRF_TOKEN,
							"Body" : response.body,
							"Header" : response.headers,
							"Status Code" : response.statusCode ,
							"Session" : sess
						});
					}
					else {
						console.error("Errore di Autenticazione : ", response.statusCode);
						console.log("Response Headers:", response.headers);
						//console.log("Response body:",response.body);
						res.status(response.statusCode);
						res.json(response.body);
					}					
				}
				else {
					res.status(200);
					res.json({body : response.body, 'Status Code' : response.statusCode});
				}
			});
		}

	});
	
});



router.post('/user', function(req, res, next) {
	console.log("Token : ",sess.X_XSRF_TOKEN);

	var urlPost = 'https://'+sess.NPServer+":"+sess.NPPort+"/api/v1/users"
	var headersOpt = {  
		"content-type": "application/json",
		"NPWEBCONSOLE_XSRF_TOKEN" : sess.X_XSRF_TOKEN,
		"X-XSRF-TOKEN": sess.X_XSRF_TOKEN,
		"cookie" :  helper.oneString(sess.Cookies_toSend)
	};

	console.log(headersOpt);
	request({
		url: urlPost,
		method : 'POST',
		headers : headersOpt,
		body: req.body,
		json : true
	},function(error, response, body){
		console.log(response.headers);
		console.log(response.statusCode);
		res.status(response.statusCode);
		res.json(body);			
	});	

	//res.json({'Token': sess.X_XSRF_TOKEN});
});


module.exports = router;
