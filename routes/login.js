var express = require('express');
var router = express.Router();




router.post('/', function(req, res, next){
	console.log("login triggerata!");

	console.log("Header length :",JSON.stringify(req.headers).length);
	console.log(req.headers);
	console.log("Body length :",JSON.stringify(req.body).length);
	console.log(req.body);

	res.json({header : req.headers, body: req.body});

});

module.exports = router;
