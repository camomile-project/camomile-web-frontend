'use strict';

/* Filters */

// 1- always precede any declaration with "var" to avoid polluting the global namespace
// 2- truncate and al. might pollute it anyway here. See how this might be improved,
// eg in http://lillylabs.no/2014/09/19/avoid-polluting-the-global-namespace-in-javascript/

var truncate = function(text, length) {
    if(text.length > length) {
        return text.slice(0,length) + '...';
    } else {
        return(text);
    }    
};

// Convert from PyAnnote JSON format to Camomile JSON format
var pyannote2camomile = function(pyannote) {

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
var camomile2pyannote = function(camomile) {

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

