'use strict';

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
	.controller('SelectListCtrl', ['$scope', 'Corpus', 'Media', 'Layer', 'Annotation', function($scope, Corpus, Media, Layer, Annotation) {

        // mock controller for testing timeline component
        $scope.model = {
            layers: []
        };

    	Corpus.query({corpusId: "524c35740ef6bde125000001"}, function(corp) {
            Media.query({corpusId: corp._id, mediaId: "525bf32fbb9d24dc28000001"}, function(media) {
                Layer.query({corpusId: corp._id, mediaId: media._id}, function(layers){
                    layers.forEach(function (l, i) {
                        $scope.model.layers.push({
                            id: i,
                            layer: l,
                            label: "Test" + i
                        });
                    })
                });
            });
		});


//		var mapping = {
//			colors: {
//				"correct": "green",
//				"miss": "orange",
//				"false alarm": "orange",
//				"confusion": "red"
//			},
//			getKey: function(d) {
//				return d.data[0];
//			}
//		};
//
//		var label;
//
//		var tooltipFunc = function(d) {
//			return d.data[0];
//		};
//
//


	}]);











