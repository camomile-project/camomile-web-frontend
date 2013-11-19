'use strict';

angular.module('myApp.controllers', ['myApp.services'])

	.controller('DiffCtrl',
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

		delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// layers[0] is the reference
		// layers[1] is the hypothesis
		// layers[2] is their difference
		$scope.model.layers = [
			{
				'label': 'Reference',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Hypothesis',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Difference',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			}
		];

		$scope.model.layerWatch = [null, null, null];

		// selected corpus ID
		$scope.model.selected_corpus = "";

		// selected medium ID
		$scope.model.selected_medium = "";

		// selected reference layer ID
		$scope.model.selected_reference = "";

		// selected hypothesis layer ID
		$scope.model.selected_hypothesis = "";

		// list of annotations
		$scope.model.reference = [];
		$scope.model.hypothesis = [];
		$scope.model.diff = [];

		// get list of corpora
		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query();
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
			$scope.model.reference = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Reference',
						'_id': layer_id,
						'layer': $scope.model.reference,
						'mapping': {
							'getKey': function(d) {
								return d.data;
							}
						},
     					'tooltipFunc': function(d) {
     						return d.data;
     					}
					}
					$scope.model.layers[0] = layer;
					$scope.model.layerWatch[0] = layer_id;
					$scope.model.latestLayer = layer;
					$scope.compute_diff();
				}
			);
		};

		// get list of hypothesis annotations from a given layer
		// and update difference with reference when it's done
		$scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.hypothesis = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Hypothesis',
						'_id': layer_id,
						'layer': $scope.model.hypothesis,
						'mapping': {
							'getKey': function(d) {
								return d.data;
							}
						},
     					'tooltipFunc': function(d) {
     						return d.data;
     					}
					}
					$scope.model.layers[1] = layer;
					$scope.model.layerWatch[1] = layer_id;
					$scope.model.latestLayer = layer;
					$scope.compute_diff();
				});
		};

		// update difference between reference and hypothesis
		$scope.compute_diff = function() {

			var reference_and_hypothesis = {
				'hypothesis': $scope.model.hypothesis,
				'reference': $scope.model.reference
			};

			CMError.diff(reference_and_hypothesis).success(function(data, status) {
				$scope.model.diff = data;
				var layer_id = $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id;
				var layer = {
					'label': 'Difference',
					'_id': layer_id,
					'layer': $scope.model.diff,
					'mapping': {
						'colors': {
							"correct": "green",
							"miss": "orange",
							"false alarm": "orange",
							"confusion": "red"
						},
						'getKey': function(d) {
							return d.data[0];
						}
					},
  					'tooltipFunc': function(d) {
     						return d.data[0];
   					}
				}
				$scope.model.layers[2] = layer;
				$scope.model.layerWatch[2] = layer_id;
				$scope.model.latestLayer = layer;
			});
		}

		$scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_media(scope.model.selected_corpus);
			}
		});

		$scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
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

		$scope.$watch('model.selected_hypothesis', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_hypothesis_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_hypothesis);
			}
		});

	}])

	.controller('RegressionCtrl',
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

	  delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// layers[0] is the reference
		// layers[1] is the first hypothesis
		// layers[2] is the second hypothesis
		// layers[3] is the regression layer

		$scope.model.layers = [
			{
				'label': 'Reference',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Hypothesis 1',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Hypothesis 2',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Regression',
				'_id': null,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			}
		];

		$scope.model.layerWatch = [null, null, null, null];

		// selected corpus ID
		$scope.model.selected_corpus = "";

		// selected medium ID
		$scope.model.selected_medium = "";

		// selected reference layer ID
		$scope.model.selected_reference = "";

		// selected first hypothesis layer ID
		$scope.model.selected_before = "";

		// selected second hypothesis layer ID
		$scope.model.selected_after = "";

		// list of annotations
		$scope.model.reference = [];
		$scope.model.before = [];
		$scope.model.after = [];
		$scope.model.regression = [];

		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query();
		};

		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.reference = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Reference',
						'_id': layer_id,
						'layer': $scope.model.reference,
						'mapping': {
							'getKey': function(d) {
								return d.data;
							}
						},
     					'tooltipFunc': function(d) {
     						return d.data;
     					}
					}
					$scope.model.layers[0] = layer;
					$scope.model.layerWatch[0] = layer_id;
					$scope.model.latestLayer = layer;
					$scope.compute_regression();
				}
			);
		};

		$scope.get_before_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.before = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Hypothesis 1',
						'_id': layer_id,
						'layer': $scope.model.before,
						'mapping': {
							'getKey': function(d) {
								return d.data;
							}
						},
     					'tooltipFunc': function(d) {
     						return d.data;
     					}
					}
					$scope.model.layers[1] = layer;
					$scope.model.layerWatch[1] = layer_id;
					$scope.model.latestLayer = layer;
					$scope.compute_regression();
				}
			);
		};

		$scope.get_after_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.after = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					var layer = {
						'label': 'Hypothesis 2',
						'_id': layer_id,
						'layer': $scope.model.after,
						'mapping': {
							'getKey': function(d) {
								return d.data;
							}
						},
     					'tooltipFunc': function(d) {
     						return d.data;
     					}
					}
					$scope.model.layers[2] = layer;
					$scope.model.layerWatch[2] = layer_id;
					$scope.model.latestLayer = layer;
					$scope.compute_regression();
				}
			);
		};

		$scope.compute_regression = function() {

			var reference_and_hypotheses = {
				'reference': $scope.model.reference,
				'before': $scope.model.before,
				'after': $scope.model.after
			};

			CMError.regression(reference_and_hypotheses).success(function(data, status) {
				$scope.model.regression = data;
				var layer_id = $scope.model.layers[1]._id + '_vs_' + $scope.model.layers[2]._id;
				var layer = {
					'label': 'Regression',
					'_id': layer_id,
					'layer': $scope.model.regression,
					'mapping': {
						'colors': {
							"both_correct": "white",
							"both_incorrect": "black",
							"improvement": "green",
							"regression": "red"
						},
						'getKey': function(d) {
							return d.data[0];
						}
					},
 					'tooltipFunc': function(d) {
 						return d.data[0];
 					}
				}
				$scope.model.layers[3] = layer;
				$scope.model.layerWatch[3] = layer_id;
				$scope.model.latestLayer = layer;
			});
		}

		$scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_media(scope.model.selected_corpus);
			}
		});

		$scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
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
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

	  	delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// timeline layers (and their IDs)
		$scope.model.layers = [];
		$scope.model.layerWatch = [];

		// watch selected corpus ID
		$scope.model.selected_corpus = "";

		// watch selected medium ID
		$scope.model.selected_medium = "";

		$scope.model.annotations = {
			'reference': [],
			'multimodal': []
		};

		// watch selected reference ID
		$scope.model.selected_reference = "";

		// selected multimodal layer ID
		$scope.model.selected_multimodal = "";

		// obtain list of corpora
		$scope.get_corpora = function() {
			$scope.model.available_corpora = Corpus.query();
		};

		// obtain list of media for given corpus
		$scope.get_media = function(corpus_id) {
			$scope.model.available_media = Media.query({corpusId: corpus_id});
		};

		// obtain list of layers for given medium
		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.available_layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		$scope.get_mapping = function(type) {

			if (type == 'label') {
				console.log('type == label');
				return {
					'getKey': function(d) {
						return d.data;
					}
				};
			}

			if (type == 'diff') {
				console.log('type == diff');
				return {
					'colors': {
						"correct": "green",
						"miss": "orange",
						"false alarm": "orange",
						"confusion": "red"
					},
					'getKey': function(d) {
						return d.data[0];
					}
				};
			}

		};

		$scope.get_tooltipFunc = function(t) {
			if (t == "label") {
				return function(d) {return d.data;};
			}
			else {
				return function(d) {return d.data[0];};
			}
		};

		$scope.new_layer = function(label, id, data, type) {

			var mapping = $scope.get_mapping(type);

			var tooltipFunc = $scope.get_tooltipFunc(type);

			var layer = {
				'label': label,
				'_id': id,
				'layer': data,
				'mapping': mapping,
				'tooltipFunc': tooltipFunc,
			};
			return layer;
		};

		$scope.update_layers = function() {

			var reference_and_hypothesis = {
				'reference': $scope.model.annotations['reference'],
				'hypothesis': $scope.model.annotations['multimodal']
			};

			CMError.diff(reference_and_hypothesis).success(function(data, status) {

				$scope.model.annotations['diff'] = data;

				console.log($scope.model.annotations);

				var layers = [];
				var layerWatch = [];

				var layer = $scope.new_layer(
					'Reference',
					$scope.model.selected_reference,
					$scope.model.annotations['reference'],
					'label');
				layers.push(layer);
				layerWatch.push($scope.model.selected_reference);

				var layer = $scope.new_layer(
					'Multimodal',
					$scope.model.selected_multimodal,
					$scope.model.annotations['multimodal'],
					'label');
				layers.push(layer);
				layerWatch.push($scope.model.selected_multimodal);

				var layer = $scope.new_layer(
					'Diff',
					$scope.model.selected_reference + '_vs_' + $scope.model.selected_multimodal,
					$scope.model.annotations['diff'],
					'diff');
				layers.push(layer);
				layerWatch.push($scope.model.selected_reference + '_vs_' + $scope.model.selected_multimodal);

				$scope.model.layers = layers;
				$scope.model.layerWatch = layerWatch;
				console.log($scope.model.layers);
				console.log($scope.model.layerWatch);

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
			}
		});

		$scope.get_annotations = function(corpus_id, medium_id, layer_id, key) {
			$scope.model.annotations[key] = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					$scope.update_layers();
				}
			);
		};

		$scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_reference,
					'reference'
					);
			}
		});

		$scope.$watch('model.selected_multimodal', function(newValue, oldValue, scope) {
			if (newValue) {
				scope.get_annotations(
					scope.model.selected_corpus,
					scope.model.selected_medium,
					scope.model.selected_multimodal,
					'multimodal');
			}
		});

	}]);
