'use strict';

angular.module('myApp.controllers', ['myApp.services'])

	.controller('DiffCtrl',
		[
			'$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
			function($scope, $http, Corpus, Media, Layer, Annotation, CMError) {

	    delete $http.defaults.headers.common['X-Requested-With'];

		$scope.model = {};
		$scope.model.selected_corpus = "";
		$scope.model.selected_medium = "";
		$scope.model.selected_reference = "";
		$scope.model.selected_hypothesis = "";
		$scope.model.reference = [];
		$scope.model.hypothesis = [];
		$scope.model.diff = [];

		$scope.model.currentIndex = 0;
		$scope.model.layers = [];

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
				$scope.compute_diff);
		};

		$scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
			$scope.model.hypothesis = Annotation.query(
				{corpusId: corpus_id, mediaId: medium_id, layerId: layer_id},
				$scope.compute_diff);

		};

		$scope.compute_diff = function() {

			var reference_and_hypothesis = {
				'hypothesis': $scope.model.hypothesis,
				'reference': $scope.model.reference
			};

			CMError.diff(reference_and_hypothesis).success(function(data, status) {
				$scope.model.diff = data;
				$scope.model.
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









