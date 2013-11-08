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
				'_id': 0,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Hypothesis',
				'_id': 1,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			},
			{
				'label': 'Difference',
				'_id': 2,
				'layer': [],
				'mapping': null,
				'tooltipFunc': null
			}
		];

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
						'mapping': null,
     				'tooltipFunc': null
					}
					$scope.model.layers[0] = layer;
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
						'mapping': null,
     				'tooltipFunc': null
					}
					$scope.model.layers[1] = layer;
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
				var layer = {
					'label': 'Difference',
					'_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
					'layer': $scope.model.diff,
					'mapping': null,
 					'tooltipFunc': null
				}
				$scope.model.layers[2] = layer;
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
		$scope.model.selected_corpus = "";
		$scope.model.selected_medium = "";
		$scope.model.selected_reference = "";
		$scope.model.selected_before = "";
		$scope.model.selected_after = "";
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
				$scope.compute_regression);
		};

		$scope.get_before_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.before = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				$scope.compute_regression);
		};

		$scope.get_after_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.after = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				$scope.compute_regression);
		};

		$scope.compute_regression = function() {

			var reference_and_hypotheses = {
				'reference': $scope.model.reference,
				'before': $scope.model.before,
				'after': $scope.model.after
			};

			CMError.regression(reference_and_hypotheses).success(function(data, status) {
				$scope.model.regression = data;
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

	.controller('SelectListCtrl',
	['$scope', 'Corpus', 'Media', 'Layer', 'Annotation',
	function($scope, Corpus, Media, Layer, Annotation) {

		// mock controller for testing timeline component
		$scope.model = {
				layers: [],
				stockLayers: [],
				curId: 0,
				mediaName: ""
		};

		Corpus.get({corpusId: "524c35740ef6bde125000001"}, function(corp) {
			Media.get({corpusId: corp._id, mediaId: "525bf32fbb9d24dc28000001"}, function(media) {
				$scope.model.mediaName = "- " + media.name;
				Layer.query({corpusId: corp._id, mediaId: media._id}, function(layers){
					layers.forEach(function (l, i) {
						Annotation.query({corpusId: corp._id, mediaId: media._id, layerId: l._id}, function(annots) {
							var obj = {
								_id: l._id,
								layer: annots,
								label: l.layer_type
							};
							$scope.model.stockLayers.push(obj);
						});
					});
				});
			});
		});

		$scope.addLayer = function() {
			$scope.model.layers.push($scope.model.stockLayers[$scope.model.curId]);
			$scope.model.latestLayer = $scope.model.stockLayers[$scope.model.curId];
			$scope.model.curId++;
		};

		$scope.removeLayer = function() {
			$scope.model.latestLayer = $scope.model.layers.pop();
			$scope.model.curId--;
		};

	}])

	.controller('AnalysisCtrl',
	['$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
	function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {
		$scope.model = {
			pageSwitch: "select",
			pageTitle: "Select corpus and media",
			corpusName: "Select corpus",
			mediaName: "Select media",
			methodName: "Method",
			refName: "Reference",
			firstHyp: "1st Hypothesis",
			secondHyp: "2nd Hypothesis"
		};

		$scope.model.layers = [];
		$scope.model.latestLayer = {};




	}]);










