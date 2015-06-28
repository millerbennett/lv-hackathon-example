var hackathon_options = {
	server: 'http://localhost:8080',
	app: 'http://localhost:5000',
	facilityCode: '777',
	facilityName: 'TEST VAMC 3'
};
var express = require('express');
var http = require('http');
var cookie = require('tough-cookie');
var bodyParser = require('body-parser');
var xmlToJson = require('xml2json');
var httpRequest = require('request').defaults({
	jar: true // enables cookie persistance accross headless http requests
});
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/app'));

app.get('/token', function(request, response) {
	console.log(request);
	console.log(response);
	response.send(request.param('token'));
	response.end();
});

app.post('/login', function(request, response) {
	var username = request.body.username, password = request.body.password;

	httpRequest.post({
		url : hackathon_options.server + '/AuthorizationServices/provider/security_check', 
		form: {
			'j_username': username,
			'j_password': password,
			'facilityCode': hackathon_options.facilityCode,
			'facilityName': hackathon_options.facilityName
		}
	}, function (error, res, body) {
		if (error) { console.log(error); response.status(500).send('Error during the login process').end(); }

		httpRequest.get(hackathon_options.server + '/AuthorizationServices/provider/authorize?' + 
				'response_type=code&state=stateId&client_id=MobileBlueButton&redirect_uri=' + 
				hackathon_options.server + '/MobileHealthPlatformWeb/oauthtoken?original_redirect_uri%3D' + 
				hackathon_options.app + '/token&scope=read',  function(error, res, body) {
			console.log(body);
			if (!/^[\w\d-]+$/.test(body)) { response.status(400).end(); return; }
			if (error) { response.status(500).send('Error during the login process').end(); }
			response.send(body);
			response.end();
		});
	});
});

app.all('/service/:service', function(request, response) {
	httpRequest({
		jar: false,
		meothod: request.method,
		url: hackathon_options.server + '/' + request.param('service'),
		headers: {
			'Authorization': request.headers.authorization
		}
	}, function(error, res, body) {
		if (error) { response.status(500).send('Error calling service').end(); }
		var responseBody = body;
		console.log(res);

		if (body && /application\/xml/.test(res.headers['content-type'])) {
			console.log(xmlToJson.toJson(body));
			response.set('Content-Type', 'application/json');
			responseBody = xmlToJson.toJson(body);
		}

		response.send(responseBody);
		response.end();
	});
});

var port = 5000;
var server = app.listen(port, function() {
	console.log('Server listening on http://localhost:%s/', port);
});