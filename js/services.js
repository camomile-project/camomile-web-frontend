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
	.factory('Corpus', ['$resource', function($resource) {
			return $resource('/corpus/:corpusId',
					{corpusId: '@corpusId'});
	}])
	.factory('Media', ['$resource', function($resource) {
			return $resource('/corpus/:corpusId/media/:mediaId',
					{corpusId: '@corpusId', mediaId: '@mediaId'});
	}])
	.factory('Layer', ['$resource', function($resource) {
		return $resource('/corpus/:corpusId/media/:mediaId/layer/:layerId',
				{corpusId: '@corpusId', mediaId: '@mediaId', layerId: '@layerId'});
	}])
	.factory('Annotation', ['$resource', function($resource) {
		return $resource('/corpus/:corpusId/media/:mediaId/layer/:layerId/annotation/:annotationId',
				{corpusId: '@corpusId', mediaId: '@mediaId', layerId: '@layerId', annotationId: '@annotationId'});
	}]);
//	.factory('LayerAll', ['$resource', function($resource) {
//		return $resource('/corpus/:corpusId/media/:mediaId/layerAll',
//				{corpusId: '@corpusId', mediaId: '@mediaId'});
//	}]);

