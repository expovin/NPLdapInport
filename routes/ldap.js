var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var fs = require('fs');
var session = require('express-session');
//var ntlm = require('express-ntlm');
var request = require('request');
var httpntlm = require('httpntlm');


var dnFilter = '';
var query;
var matchedUsers = [];

/* GET home page. */
router.post('/', function(req, resE, next) {

	var ldapServer = req.body.ldapServer;
	var ldapPort = req.body.ldapPort;
	var username = req.body.username;
	var password = req.body.password;
	var filter = req.body.filter;
	var baseDN= req.body.baseDN;
	var ldapCompleteServerName=ldapServer+":"+ldapPort+"/"+baseDN;

	var allFilteredUsers=[];

	var email = req.body.email;
	var usernameAttr = req.body.usernameAttr


	console.log("Ldap Server 				: ",ldapServer);
	console.log("Complete Server Name 			: ",ldapCompleteServerName);
	console.log("Base DN 				: ",baseDN);
	console.log("Username 				: ",username);
	//console.log("Password 				: ",password);
	console.log("Filter 					: ",filter);
	console.log("email 					: ",email);
	console.log("usernameAttr 					: ",usernameAttr);

	var adClient = ldap.createClient({ url: ldapCompleteServerName, reconnect: true });

	adClient.bind(username, password, function(err) {

		if (err != null) {
			console.log("Error : "+err);
			if (err.name === "InvalidCredentialsError")

				resE.json({'Error':'Credential Error'});
			else
				resE.json({'Error':'Unknow'});
		} else {
			console.log("Login success!");

                var opts = {
                    filter: filter,
                    scope : 'one'
                } ;

                adClient.search(baseDN, opts, function(err, res) {
                    res.on('searchEntry', function(entry) {
                        console.log('hit');
                        console.log('entry: ' + JSON.stringify(entry.object));

                        allFilteredUsers.push(entry.object);
                        
                    });

                    res.on('searchReference', function(referral) {
                        console.log('referral: ' + referral.uris.join());
                    });

                    res.on('error', function(err) {
                        console.log('searchFailed') ;
                        console.error('error: ' + err.message);
                    });

                    res.on('end', function(result) {
                        console.log('4') ;
                        fs.writeFile('test.json', JSON.stringify(allFilteredUsers, null, 4));
						console.log('status: ' + result.status);
						adClient.destroy();
						resE.json(allFilteredUsers);   
						                     
                        
                    });
				});

		}
	});


});


module.exports = router;
