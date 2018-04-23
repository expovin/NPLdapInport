var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var fs = require('fs');
var session = require('express-session');
//var ntlm = require('express-ntlm');
var request = require('request');
var httpntlm = require('httpntlm');



var viewOpts = { root: 'E:\\$work\\OneDrive\\OneDrive - QlikTech Inc\\740_Internal_Meeting\\20170708 - SPI Meeting\\NPLdapInport' };
var dnFilter = '';
var query;
var matchedUsers = [];

router.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

/* GET home page. */
router.post('/', function(reqE, resE, next) {

	var ldapServer = reqE.body.ldapServer;
	var username = reqE.body.username;
	var password = reqE.body.password;
	var filter = reqE.body.filter;
	var baseDN= reqE.body.baseDN;
	var ldapCompleteServerName=ldapServer+"/"+baseDN;
	var allFilteredUsers=[];

	var email = reqE.body.email;
	var usernameAttr = reqE.body.usernameAttr

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

				res.redirect("/?login=failed&reason=credentials");
			else
				res.redirect("/?login=failed&reason=unknown");
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
                        var newObj={};

                        newObj[email]=entry.object[email];
                        newObj[usernameAttr]=entry.object[usernameAttr];
                        newObj['Enabled']=true;
                        newObj['password']=entry.object[usernameAttr];

                        allFilteredUsers.push(newObj);
                        
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
                        //resE.json(allFilteredUsers);
                        reqE.session.allFilteredUsers=allFilteredUsers;
                        resE.sendFile('views\\auth.html',viewOpts);                        
                        
                    });
                });

		}
	});

});

router.post('/map', function(req, res, next) {
	console.log("Sono in Map");
	console.log(allFilteredUsers);
});

router.post('/auth', function(req, res, next) {
	var NPServer = req.body.NPServer;
	var username = req.body.username;
	var password = req.body.password;
	var allFilteredUsers=req.session.allFilteredUsers;

	console.log("Sono in Auth");
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


	httpntlm.get({
	    url: "https://"+NPServer+":4993/api/v1/login/ntlm",
	    username: username,
	    password: password,
	    workstation: '',
	    domain: ''
	}, function (err, res){
	    if(err) return err;

	    console.log("Authorization Status Code : ",res.statusCode);
	    console.log(res.headers['set-cookie']);
	    var ServerCookie = res.headers['set-cookie'];
	    var ClientCookie = [];


	    ServerCookie.forEach( function (cookie) {
	    	//console.log(cookie);
	    	c = cookie.split(";");
	    	//console.log(c[0]);
	    	//ClientCookie += ClientCookie+JSON.stringify(c[0])+";"
	    	//ClientCookie = ClientCookie.replace('"','');
	    	ClientCookie.push(c[0]);
	    });
	    

	    var tocken = res.headers['set-cookie'][0].split(";")[0];
	    tocken = tocken.substr(tocken.length - 44);
	    res.headers['X-XSRF-TOKEN']=tocken;
	    //var tocken = body.result;
	    console.log("Tocken --> ",tocken);
	    console.log("ClientCookie -->",ClientCookie);

		request({
		    url: 'https://'+NPServer+':4993/api/v1/users',
		    method: "POST",
		    json: true,
		    headers : res.headers,
		    /*
		    headers: {
		        "content-type": "application/json",
		        "Upgrade-Insecure-Requests":"1",
		        "X-XSRF-TOKEN" : tocken,
		        "Cookie" : ServerCookie,
		        'withCredentials':true
		    },
		    */
		    body: allFilteredUsers
		}, 

		 function (error, response, body) {

		 	console.log(error);
		 	console.log(response.statusCode);
		 	console.log(body);

			  if (!error && response.statusCode == 200) {
			    console.log(body) // Print the google web page.
			    res.json(allFilteredUsers);
			  }

		 });

	});

});

module.exports = router;
