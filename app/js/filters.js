'use strict';

/* Filters */

angular.module('myApp.filters', [])
	.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])
	.filter('truncate' , function() {
		return function(text) {
			if(text.length > 11) {
				return text.slice(0,11) + '...';
			} else {
				return(text);
			}
		};
	});

