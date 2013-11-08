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
  .value('DataRoot', 'https://flower.limsi.fr/data')// double esc. needed to specify port, see https://github.com/angular/angular.js/issues/1243
  .value('ToolRoot', 'https://flower.limsi.fr/tool')// double esc. needed to specify port, see https://github.com/angular/angular.js/issues/1243
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
			diff: function(reference_and_hypothesis) {
				var url = ToolRoot + '/error/diff';
				return $http.post(url, reference_and_hypothesis);
			},
			regression: function(reference_and_hypotheses) {
				var url = ToolRoot + '/error/regression';
				return $http.post(url, reference_and_hypotheses);
			}
		}
	}]);
