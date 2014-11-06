var express = require("express"),
	app     = express(),
	port    = parseInt(process.env.PORT, 10) || 8070,
    program = require('commander'),
    fs = require('fs');

sprintf = require('sprintf').sprintf;

app.configure(function(){
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/app'));
	app.use(app.router);
});


// === config.js === 
// angular.module('myApp.config', [])
//     .value('DataRoot', 'https://flower.limsi.fr/api')
//     .value('ToolRoot', 'https://flower.limsi.fr/tool');
// =================

program
    .option('-c, --camomile <url>', 'base URL of Camomile server (e.g. https://camomile.fr/api)')
    .option('-p, --pyannote <url>', 'base URL of PyAnnote server (e.g. https://camomile.fr/tool)')
    .parse(process.argv);

var camomile_api = program.camomile || process.env.CAMOMILE_API
var pyannote_api = program.pyannote || process.env.PYANNOTE_API

config_js = sprintf(
    "angular.module('myApp.config', [])" + "\n" + 
    "   .value('DataRoot', '%s')" + "\n" +
    "   .value('ToolRoot', '%s');",
    camomile_api, pyannote_api
)

fs.writeFile(
    __dirname + '/app/config.js', config_js, 
    function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log('Camomile API --> ' + camomile_api);
            console.log('PyAnnote API --> ' + pyannote_api);
        }
    }
); 

app.post('/', function(req, res){
	res.redirect('/'); // handle the hidden form submit
});

app.listen(port);
console.log('Web App --> ' + 'http://localhost:' + port + '/');
