'use strict';

/* Filters */

angular.module('myApp.filters', [])
	.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])
	.filter('truncate' , function() {
		return function(text, length) {
			if(text.length > length) {
				return text.slice(0,length) + '...';
			} else {
				return(text);
			}
		};
	});

