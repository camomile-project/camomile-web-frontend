'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', ['ngResource'])
	.value('titles', {Corpus: 'Corpuses',
										Media: 'Media',
										Layer: 'Layers',
										Annotation: 'Annotations'
	})
  .value('RESTroot', 'http://localhost\\:3000')// double esc. needed to specify port, see https://github.com/angular/angular.js/issues/1243
	.factory('Corpus', ['$resource', 'RESTroot', function($resource, RESTroot) {
			return $resource(RESTroot + '/corpus/:corpusId',
					{corpusId: '@corpusId'});
	}])
	.factory('Media', ['$resource', 'RESTroot', function($resource, RESTroot) {
			return $resource(RESTroot + '/corpus/:corpusId/media/:mediaId',
					{corpusId: '@corpusId', mediaId: '@mediaId'});
	}])
	.factory('Layer', ['$resource', 'RESTroot', function($resource, RESTroot) {
		return $resource(RESTroot + '/corpus/:corpusId/media/:mediaId/layer/:layerId',
				{corpusId: '@corpusId', mediaId: '@mediaId', layerId: '@layerId'});
	}])
	.factory('Annotation', ['$resource', 'RESTroot', function($resource, RESTroot) {
		return $resource(RESTroot + '/corpus/:corpusId/media/:mediaId/layer/:layerId/annotation/:annotationId',
				{corpusId: '@corpusId', mediaId: '@mediaId', layerId: '@layerId', annotationId: '@annotationId'});
	}])




// sample list of elements
	.value('sampleList', ['carrots',
		'bananas',
		'oranges',
		'apples',
		'cherries',
		'bananas',
		'oranges',
		'apples',
		'cherries',
		'bananas',
		'oranges',
		'apples',
		'cherries',
		'bananas',
		'oranges',
		'apples',
		'cherries',
		'potatoes']);
