'use strict';

/* Controllers */

angular.module('myApp.controllers', ['myApp.services'])
	.controller('CorpusCtrl', ['$scope', 'titles', 'Corpus', function($scope, titles, Corpus) {
		$scope.model = {
			corpusTitle: titles.Corpus,
			corpusOpened: false
		};
		$scope.$watch('model.corpusOpened', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.model.corpuses = Corpus.query();
			} else {
				scope.model.corpuses = undefined;
			}
		});
	}])


	.controller('MediaCtrl', ['$scope', 'titles', 'Media', function($scope, titles, Media) {
		$scope.model = {
			mediaTitle: titles.Media,
			mediaOpened: false
		};

		$scope.$watch('model.mediaOpened', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.model.media = Media.query({corpusId: scope.corpus._id});
			} else {
				scope.model.media = undefined;
			}
		});
		$scope.$watch('model.corpusOpened', function(newValue, oldValue, scope) {
			if (!newValue) {
				scope.model.mediaOpened = false;
			}
		});
	}])


	.controller('LayerCtrl', ['$scope', 'titles', 'Layer', function($scope, titles, Layer) {
		$scope.model = {
			layerTitle: titles.Layer,
			layerOpened: false
		};

		$scope.$watch('model.layerOpened', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.model.layers = Layer.query({corpusId: scope.corpus._id, mediaId:scope.media._id});
			} else {
				scope.model.layers = undefined;
			}
		});
		$scope.$watch('model.mediaOpened', function(newValue, oldValue, scope) {
			if (!newValue) {
				scope.model.layerOpened = false;
			}
		});
	}])


	.controller('AnnotationCtrl', ['$scope', 'titles', 'Annotation', function($scope, titles, Annotation) {
		$scope.model = {
			annotationTitle: titles.Annotation,
			annotationOpened: false
		};

		$scope.$watch('model.annotationOpened', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.model.annotations = Annotation.query({corpusId: scope.corpus._id, mediaId: scope.media._id, layerId: scope.layer._id});
			} else {
				scope.model.annotations = undefined;
			}
		});
		$scope.$watch('model.layerOpened', function(newValue, oldValue, scope) {
			if (!newValue) {
				scope.model.annotationOpened = false;
			}
		});
	}])
	.controller('SelectListCtrl', ['$scope', 'Corpus', 'Media', 'Layer', function($scope, Corpus, Media, Layer) {
		$scope.model = {
			list: [],
			annotations: [],
			selected: undefined
		};

		$scope.selectLayer = function(index) {
			$scope.model.selected = index;
			// populate annotations vector
		};

		// nested populating snippet
		Corpus.query(function(corpuses) {
			corpuses.forEach(function(c) {
				Media.query({corpusId: c._id}, function(media) {
					media.forEach(function(m) {
						Layer.query({corpusId: c._id, mediaId: m._id}, function(layer){
							layer.forEach(function(l) {
								$scope.model.list.push({
									corpusId: c._id,
									mediaId: m._id,
									layerId: l._id,
									mediaName: m.name,
									layerType: l.layer_type
								});
							});
						});
					});
				});
			});
		});


	}]);











