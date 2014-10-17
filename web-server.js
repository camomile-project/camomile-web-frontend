var express = require("express"),
	app     = express(),
	port    = parseInt(process.env.PORT, 10) || 8070;

app.configure(function(){
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/app'));
	app.use(app.router);
});

app.post('/', function(req, res){
	res.redirect('/'); // handle the hidden form submit
});

app.listen(port);
console.log('Now serving the app at http://localhost:' + port + '/');
