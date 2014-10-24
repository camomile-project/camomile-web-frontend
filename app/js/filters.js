'use strict';

/* Filters */

function truncate(text, length) {
    if(text.length > length) {
        return text.slice(0,length) + '...';
    } else {
        return(text);
    }    
};

// Convert from PyAnnote JSON format to Camomile JSON format
function pyannote2camomile(pyannote) {

    var camomile = [];

    for (var i=0; i<pyannote.content.length; i++) {

        var fragment = pyannote.content[i].segment;
        fragment.track = pyannote.content[i].track;

        camomile.push({
            'data': pyannote.content[i].label,
            'fragment': fragment
        });

    };

    return camomile
};

// Convert from Camomile JSON format to PyAnnote JSON format
function camomile2pyannote(camomile) {

    var pyannote = {'pyannote': 'Annotation', 'content': []};

    for (var i=0; i<camomile.length; i++) {
        
        pyannote.content.push({
            'segment': camomile[i].fragment,
            'track': i,
            'label': camomile[i].data});

    };

    return pyannote;
};

angular.module('myApp.filters', [])
	.filter('interpolate', ['version', function(version) {
        return function(text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }])

	.filter('truncate' , function() { return truncate;})

    .filter('camomile2pyannote', 
            function() { return camomile2pyannote; } )

    .filter('pyannote2camomile', 
            function() { return pyannote2camomile; } );
