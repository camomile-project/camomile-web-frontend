/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
    .controller('DiffCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'AnnotationUpdater',
        'CMError', 'defaults', 'palette', '$controller', 'Session', 'camomile2pyannoteFilter', 'pyannote2camomileFilter', '$rootScope',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, AnnotationUpdater, CMError, defaults, palette, $controller, Session, camomile2pyannoteFilter, pyannote2camomileFilter, $rootScope) {

            $controller('ExplorationBaseCtrl',
            {
                $scope: $scope,
                $http: $http,
                Corpus: Corpus,
                Media: Media,
                Layer: Layer,
                AnnotationUpdater: AnnotationUpdater,
                defaults: defaults,
                palette: palette,
                Session: Session
            });


            // placeholder definitions
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

            // model.layers is mapped in cm-timeline using the defaults
            $scope.model.layers = [
                defaultReferenceLayer,
                defaultHypothesisLayer,
                defaultDiffLayer
            ];

            // get list of reference annotations from a given layer,
            // replace current reference layer,
            // and update difference with hypothesis when it's done
            $scope.get_reference_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[0] = {
                    'label': 'Reference',
                    '_id': layer_id + "_0"
                };
                $scope.model.layers[0].layer = Annotation.query({
//						corpusId: corpus_id,
                        media: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        //$scope.model.layerWatch[0] = layer_id + "_0";
                        $scope.model.layersUpdated = true;
                        $scope.compute_diff();
                    }
                );
            };

            // get list of hypothesis annotations from a given layer,
            // replace current hypothesis layer,
            // and update difference with reference when it's done
            $scope.get_hypothesis_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[1] = {
                    'label': 'Hypothesis',
                    '_id': layer_id + "_1"
                };
                $scope.model.layers[1].layer = Annotation.query({
//						corpusId: corpus_id,
                        media: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        //$scope.model.layerWatch[1] = layer_id + "_1";
                        $scope.model.layersUpdated = true;
                        $scope.compute_diff();
                    });
            };

            // recompute difference between reference and hypothesis,
            // and replace diff layer.
            $scope.compute_diff = function () {

                var reference_and_hypothesis = {
                    'hypothesis': camomile2pyannoteFilter($scope.model.layers[1].layer),
                    'reference': camomile2pyannoteFilter($scope.model.layers[0].layer)
                };

                if ($scope.model.selected_medium != undefined && reference_and_hypothesis.reference.content.length > 0 && reference_and_hypothesis.hypothesis.content.length > 0) {
                    CMError.diff(reference_and_hypothesis).success(function (data) {
                        $scope.model.layers[2] = {
                            'label': 'Difference',
                            '_id': 'Computed_' + $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
                            'mapping': defaults.diffMapping,
                            'tooltipFunc': defaults.tooltip
                        };

                        $scope.model.layers[2].layer = pyannote2camomileFilter(data);
                        $scope.model.layersUpdated = true;
                    });
                }

            };


            $scope.computeLastLayer = function () {
                $scope.compute_diff();
            };


            // the selected corpus has changed
            $scope.$watch('model.selected_corpus', function (newValue, oldValue, scope) {
                if (newValue) {
                    scope.get_media(scope.model.selected_corpus);
                    // blank the medium selection
                    scope.model.selected_medium = undefined;
                    $scope.resetSummaryView(true);
                }
            });


            $scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
                // when the medium changes, the viz is reinit, and the select box gets the new layers
                // TODO: no more necessary since all videos have the same layers
//				scope.model.selected_reference = undefined;
//				scope.model.selected_hypothesis = undefined;

                if (newValue) {

                    scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/media/" + scope.model.selected_medium + "/video");
                    scope.get_layers(scope.model.selected_corpus);

                    // re-initialize the reference is needed
                    if (scope.model.selected_reference != undefined) {
                        $scope.get_reference_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_reference);
                    }

                    // re-initialize the hypothesis is needed
                    if (scope.model.selected_hypothesis != undefined) {
                        $scope.get_hypothesis_annotations(scope.model.selected_corpus, scope.model.selected_medium, scope.model.selected_hypothesis);
                    }

                    $scope.resetSummaryView(true);


                }
            });

            $scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[0] = defaultReferenceLayer;
                    scope.compute_diff();
                } else {
                    scope.get_reference_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_reference);
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_reference === undefined && model.selected_hypothesis === undefined',
                function (newValue, oldValue) {
                    // to avoid triggering at init (only case where new and old are both true)
                    if (!newValue) {
                        $scope.model.restrict_toggle = 1;
                    } else if (!oldValue) {
                        $scope.model.restrict_toggle = 0;
                    }
                });


            $scope.$watch('model.selected_hypothesis', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[1] = defaultHypothesisLayer;
                    scope.compute_diff();
                } else {
                    scope.get_hypothesis_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_hypothesis);
                    $scope.resetSummaryView(true);
                }
            });

        }]);