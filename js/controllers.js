'use strict';


// !!!!! GENERAL NOTE
// In cases where missing values are permitted (e.g. model.layers), undefined should be used
// as explicit placeholders - so that further testing is facilitated (null and undefined are handled
// differently, and relying on the default "falsy" behaviour can lead to unpredictable errors,
// see Crockford "Javascript, the good parts" for reference.

angular.module('myApp.controllers', ['myApp.services'])

	.controller('DiffCtrl',
	['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults',
	function($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults) {

		delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};


		// layers[0] is the reference
		// layers[1] is the hypothesis
		// layers[2] is their difference

        var defaultReferenceLayer = {
            'label': 'Reference',
            '_id': 'Reference_init',
            'layer': []
        };

        var defaultHypothesisLayer = {
            'label': 'Hypothesis',
            '_id': 'Hypothesis_init',
            'layer': []
        };

        var defaultDiffLayer = {
            'label': 'Difference',
            '_id': 'Difference_init',
            'layer': []
        };

		$scope.model.layers = [
			defaultReferenceLayer,
			defaultHypothesisLayer,
            defaultDiffLayer
		];

        // No need for model.latestLayer any more
		$scope.model.layerWatch = [];

		// selected corpus ID
		$scope.model.selected_corpus = undefined;

		// selected medium ID
		$scope.model.selected_medium = undefined;
	    $scope.model.video = "";

		// selected reference layer ID
		$scope.model.selected_reference = undefined;

		// selected hypothesis layer ID
		$scope.model.selected_hypothesis = undefined;

		// list of annotations // redundant with model.layers
		//$scope.model.reference = [];
		//$scope.model.hypothesis = [];
		//$scope.model.diff = [];

		// get list of corpora
		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query(function() {
                // initializing layerWatch after corpora are loaded
                // Adds empty layers as border effect
                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                    $scope.model.layers[1]._id,
                    $scope.model.layers[2]._id];
            });
		};

		// get list of media for a given corpus
		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		// get list of layers for a given medium
		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		// get list of reference annotations from a given layer
		// and update difference with hypothesis when it's done
		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.layers[0] = {
                'label': 'Reference',
                '_id': layer_id
            };
            $scope.model.layers[0].layer = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					$scope.model.layerWatch[0] = layer_id;
                    $scope.compute_diff();
				}
			);
		};

		// get list of hypothesis annotations from a given layer
		// and update difference with reference when it's done
		$scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[1] = {
                'label': 'Hypothesis',
                '_id': layer_id
            };
			$scope.model.layers[1].layer = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					$scope.model.layerWatch[1] = layer_id;
					$scope.compute_diff();
				});
		};

		// update difference between reference and hypothesis
		$scope.compute_diff = function() {

			var reference_and_hypothesis = {
				'hypothesis': $scope.model.layers[1].layer,
				'reference': $scope.model.layers[0].layer
			};

			CMError.diff(reference_and_hypothesis).success(function(data, status) {
                $scope.model.layers[2] = {
                    'label': 'Difference',
                    '_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
                    'mapping': defaults.diffMapping,
                    'tooltipFunc': defaults.tooltip
                };

                $scope.model.layers[2].layer = data;
 				$scope.model.layerWatch[2] = $scope.model.layers[2]._id;
			});
		}

		$scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_media(scope.model.selected_corpus);
                // causes reinit of media
                scope.model.selected_medium = undefined;
			}
		});



		$scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
            // when the media changes, the viz is reinit
            scope.model.selected_reference = undefined;
            scope.model.selected_hypothesis = undefined;
            if(newValue) {
                scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
                scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/"
                    + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
		    }
		});

		$scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
            if (newValue === undefined) {
                scope.model.layers[0] = defaultReferenceLayer;
                scope.compute_diff();
            } else {
				scope.get_reference_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_reference);
			}
		});

		$scope.$watch('model.selected_hypothesis', function(newValue, oldValue, scope) {
            if (newValue === undefined) {
                scope.model.layers[1] = defaultHypothesisLayer;
                scope.compute_diff();
            } else {
				scope.get_hypothesis_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_hypothesis);
			}
		});

	}])

	.controller('RegressionCtrl',
	['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults',
	function($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults) {

	  delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// layers[0] is the reference
		// layers[1] is the first hypothesis
		// layers[2] is the second hypothesis
		// layers[3] is the regression layer

        $scope.model.layers = [
            {
                'label': 'Reference',
                '_id': 'Reference_init',
                'layer': []
            },
            {
                'label': 'Hypothesis 1',
                '_id': 'Hypothesis_1_init',
                'layer': []
            },
            {
                'label': 'Hypothesis 2',
                '_id': 'Hypothesis_2_init',
                'layer': []
            },
            {
                'label': 'Regression',
                '_id': 'Regression_init',
                'layer': []
            }

        ];


        $scope.model.layerWatch = [];

		// selected corpus ID
		$scope.model.selected_corpus = undefined;

		// selected medium ID
		$scope.model.selected_medium = undefined;
	    $scope.model.video = "";

		// selected reference layer ID
		$scope.model.selected_reference = undefined;

		// selected first hypothesis layer ID
		$scope.model.selected_before = undefined;

		// selected second hypothesis layer ID
		$scope.model.selected_after = undefined;


		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query(function() {
                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                    $scope.model.layers[1]._id,
                    $scope.model.layers[2]._id,
                    $scope.model.layers[3]._id];
            });
		};

		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[0] = {
                'label': 'Reference',
                '_id': layer_id
            };
            $scope.model.layers[0].layer = Annotation.query(
                {corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
                function() {
                    $scope.model.layerWatch[0] = layer_id;
                    $scope.compute_regression();
                }
            );
		};

		$scope.get_before_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[1] = {
                'label': 'Hypothesis 1',
                '_id': layer_id
            };
            $scope.model.layers[1].layer = Annotation.query(
                {corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
                function() {
                    $scope.model.layerWatch[1] = layer_id;
                    $scope.compute_regression();
                }
            );
		};

		$scope.get_after_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[2] = {
                'label': 'Hypothesis 2',
                '_id': layer_id
            };
            $scope.model.layers[2].layer = Annotation.query(
                {corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
                function() {
                    $scope.model.layerWatch[2] = layer_id;
                    $scope.compute_regression();
                }
            );
		};

		$scope.compute_regression = function() {

			var reference_and_hypotheses = {
				'reference': $scope.model.layers[0].layer,
				'before': $scope.model.layers[1].layer,
				'after': $scope.model.layers[2].layer
			};

			CMError.regression(reference_and_hypotheses).success(function(data, status) {
				$scope.model.regression = data;
                $scope.model.layers[3] = {
                    'label': 'Regression',
                    '_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id +
                                        '_and_' + $scope.model.layers[2]._id,
                    'mapping': defaults.regressionMapping,
                    'tooltipFunc': defaults.tooltip
                };

                $scope.model.layers[3].layer = data;
                $scope.model.layerWatch[3] = $scope.model.layers[3]._id;
			});
		};

		$scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_media(scope.model.selected_corpus);
			}
		});

	    $scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
		if (newValue) {
		    scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
		    scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/"
                + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
		}
	    });

		$scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_reference_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_reference);
			}
		});

		$scope.$watch('model.selected_before', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_before_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_before);
			}
		});

		$scope.$watch('model.selected_after', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_after_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_after);
			}
		});
	}])

	.controller('FusionCtrl',
	['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults',
	function($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults) {

		delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// layers[0] is the reference
		// layers[1] is the hypothesis
		// layers[2] is their difference
        $scope.model.layers = [
            {
                'label': 'Reference',
                '_id': 'Reference_init',
                'layer': []
            },
            {
                'label': 'Fusion',
                '_id': 'Hypothesis_init',
                'layer': []
            },
            {
                'label': 'Difference',
                '_id': 'Difference_init',
                'layer': []
            }

        ];

		$scope.model.layerWatch = [];

		// selected corpus ID
		$scope.model.selected_corpus = undefined;

		// selected medium ID
		$scope.model.selected_medium = undefined;
		$scope.model.video = "";

		// selected reference layer ID
		$scope.model.selected_reference = undefined;

		// selected hypothesis layer ID
		$scope.model.selected_hypothesis = undefined;

		// array of selected monomodal layer IDs
		$scope.model.selected_monomodal = [];


		// get list of corpora
		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query(function() {
                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                    $scope.model.layers[1]._id,
                    $scope.model.layers[2]._id];

            });
		};

		// get list of media for a given corpus
		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		// get list of layers for a given medium
		$scope.get_layers = function(corpus_id, medium_id) {

			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id}
			);
		};

		// get list of reference annotations from a given layer
		// and update difference with hypothesis when it's done
		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[0] = {
                'label': 'Reference',
                '_id': layer_id
            };
            $scope.model.layers[0].layer = Annotation.query(
                {corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
                function() {
                    $scope.model.layerWatch[0] = layer_id;
                    $scope.compute_diff();
                }
            );
		};

		// get list of hypothesis annotations from a given layer
		// and update difference with reference when it's done
		$scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[1] = {
                'label': 'Fusion',
                '_id': layer_id
            };
            $scope.model.layers[1].layer = Annotation.query(
                {corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
                function() {
                    $scope.model.layerWatch[1] = layer_id;
                    $scope.compute_diff();
                }
            );
		};

		$scope.get_monomodal_annotations = function(corpus_id, medium_id, layer_id) {
            var index = $scope.model.selected_monomodal.indexOf(layer_id);
            var aIndex = $scope.model.available_layers.map(function(d) {
                return d._id;
            }).indexOf(layer_id);
            var name = $scope.model.available_layers[aIndex].layer_type;
			$scope.model.layers[3+index] = {
                '_id': layer_id,
                'label': name
            };
            $scope.model.layers[3+index].layer = Annotation.query(
                {corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
                function() {
                    $scope.model.layerWatch[3+index] = layer_id;
                    $scope.compute_diff();
                }
            );
        };

		// update difference between reference and hypothesis
		$scope.compute_diff = function() {

            var reference_and_hypothesis = {
                'hypothesis': $scope.model.layers[1].layer,
                'reference': $scope.model.layers[0].layer
            };

            CMError.diff(reference_and_hypothesis).success(function(data, status) {
                $scope.model.layers[2] = {
                    'label': 'Difference',
                    '_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
                    'mapping': defaults.diffMapping,
                    'tooltipFunc': defaults.tooltip
                };

                $scope.model.layers[2].layer = data;
                $scope.model.layerWatch[2] = $scope.model.layers[2]._id;
            });
		};

		$scope.$watch(
			'model.selected_corpus',
			function(newValue, oldValue, scope) {
				if (newValue) {
					scope.get_media(scope.model.selected_corpus);
				}
			}
		);

		$scope.$watch(
			'model.selected_medium',
			function(newValue, oldValue, scope) {
				if (newValue) {
					scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
				        scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/"
                            + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
				}
			}
		);

		$scope.$watch(
			'model.selected_reference',
			function(newValue, oldValue, scope) {
				if (newValue) {
					scope.get_reference_annotations(
						scope.model.selected_corpus,
						scope.model.selected_medium,
						scope.model.selected_reference);
				}
			}
		);

		$scope.$watch(
			'model.selected_hypothesis',
			function(newValue, oldValue, scope) {
				if (newValue) {
					scope.get_hypothesis_annotations(
						scope.model.selected_corpus,
						scope.model.selected_medium,
						scope.model.selected_hypothesis);
				}
			}
		);

		$scope.$watch(
			'model.selected_monomodal',
			function(newValue, oldValue, scope) {
                var newMonomodals = newValue.filter(function(l) {
                    return !(oldValue.indexOf(l) > -1);
                });
                newMonomodals.forEach(function(d) {
                    scope.get_monomodal_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        d);
                });
			}, true
		);



        $scope.addMonomodal = function() {
            $scope.model.selected_monomodal.push($scope.model.monomodal_id);
        };


	}]);
