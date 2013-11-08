'use strict';


angular.module('myApp.services', ['ngResource'])
	// double esc. if a specific port is needed, see https://github.com/angular/angular.js/issues/1243
	.value('DataRoot', 'https://flower.limsi.fr/data')
	.value('ToolRoot', 'https://flower.limsi.fr/tool')
	.factory('Corpus', ['$resource', 'DataRoot', function($resource, DataRoot) {
		return $resource(DataRoot + '/corpus/:corpusId',
			{corpusId: '@corpusId'});
	}])
	.factory('Media', ['$resource', 'DataRoot', function($resource, DataRoot) {
		return $resource(DataRoot + '/corpus/:corpusId/media/:mediaId',
			{corpusId: '@corpusId', mediaId: '@mediaId'});
	}])
	.factory('Layer', ['$resource', 'DataRoot', function($resource, DataRoot) {
		return $resource(DataRoot + '/corpus/:corpusId/media/:mediaId/layer/:layerId',
			{corpusId: '@corpusId', mediaId: '@mediaId', layerId: '@layerId'});
	}])
	.factory('Annotation', ['$resource', 'DataRoot', function($resource, DataRoot) {
		return $resource(DataRoot + '/corpus/:corpusId/media/:mediaId/layer/:layerId/annotation/:annotationId',
			{corpusId: '@corpusId', mediaId: '@mediaId', layerId: '@layerId', annotationId: '@annotationId'});
	}])
	.factory('CMError', ['$http', 'ToolRoot', function($http, ToolRoot) {
		return {
			diff: function(hypLayers) {
				var url = ToolRoot + '/error/diff';
				return $http.post(url, hypLayers);
			},
			regression: function(hypLayers) {
				var url = ToolRoot + '/error/regression';
				return $http.post(url, hypLayers);
			}
		}
	}]);



