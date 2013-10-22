'use strict';

angular.module('myApp.controllers', ['myApp.services'])

	.controller('DiffCtrl',
		[
			'$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
			function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

	    delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};

		// layers[0] is the reference
		// layers[1] is the hypothesis
		// layers[2] is their difference
		$scope.model.show_layers = [
			{
				'id': 0,
				'label': 'Reference',
				'layer': [],
				'mapping': null,
				'tooltipFunc': null,
			},
			{
				'id': 1,
				'label': 'Hypothesis',
				'layer': [],
				'mapping': null,
				'tooltipFunc': null,
			},
			{
				'id': 2,
				'label': 'Difference',
				'layer': [],
				'mapping': null,
				'tooltipFunc': null,
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

		$scope.model.currentIndex = 2;

		// get list of corpora
		$scope.get_corpora = function() {
			$scope.model.corpora = Corpus.query();
		};

		// get list of media for a given corpus
		$scope.get_media = function(corpus_id) {
			$scope.model.media = Media.query({corpusId: corpus_id});
		};

		// get list of layers for a given medium
		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.layers = Layer.query(
				{corpusId: corpus_id, mediaId: medium_id});
		};

		// get list of reference annotations from a given layer
		// and update difference with hypothesis when it's done
		$scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.reference = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				function() {
					$scope.model.show_layers[0].layer = $scope.model.reference;
					$scope.model.show_layers[0].id = $scope.model.currentIndex++;
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
					$scope.model.show_layers[1].layer = $scope.model.hypothesis;
					$scope.model.show_layers[1].id = $scope.model.currentIndex++;
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
				$scope.model.show_layers[2].layer = $scope.model.diff;
				$scope.model.show_layers[2].id = $scope.model.currentIndex++;
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
		[
			'$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
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
			$scope.model.corpora = Corpus.query();
		};

		$scope.get_media = function(corpus_id) {
			$scope.model.media = Media.query({corpusId: corpus_id});
		};

		$scope.get_layers = function(corpus_id, medium_id) {
			$scope.model.layers = Layer.query(
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
				'after': $scope.model.after,
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

	}]);









