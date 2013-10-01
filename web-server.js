var express = require("express"),
    http = require('http'),
    path = require('path'),
    app     = express(),
    port    = parseInt(process.env.PORT, 10) || 8080;

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    //res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, x-xsrf-token');
		res.header('Access-Control-Allow-Headers', 'Accept, Origin, X-Requested-With, x-xsrf-token');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
    app.use(app.router);
    app.use(express.static(__dirname + '/app'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.listen(port);
console.log('Now serving the app at http://localhost:' + port + '/');
