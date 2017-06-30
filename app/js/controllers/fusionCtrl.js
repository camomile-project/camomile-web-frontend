/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
    .controller('FusionCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults', 'palette', 'camomile2pyannoteFilter', 'pyannote2camomileFilter',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette, camomile2pyannoteFilter, pyannote2camomileFilter) {

            delete $http.defaults.headers.common['X-Requested-With'];

            $scope.model = {};

            var curColInd = 0;

            // placeholder definitions
            var defaultReferenceLayer = {
                'label': 'Reference',
                '_id': 'Reference_init',
                'layer': []
            };

            var defaultFusionLayer = {
                'label': 'Hypothesis 1',
                '_id': 'Hypothesis_1_init',
                'layer': []
            };

            var defaultDiffLayer = {
                'label': 'Hypothesis 2',
                '_id': 'Hypothesis_2_init',
                'layer': []
            };

            // model.layers is mapped in cm-timeline using the defaults
            $scope.model.layers = [
                defaultReferenceLayer,
                defaultFusionLayer,
                defaultDiffLayer
            ];

            // reflects model.layer for watch by cm-timeline.
            // initialized empty so that the initial watch triggers with consistent values for cm-timeline,
            // as soon as the corpora are loaded - ie sufficiently "late" in the angular init loop.
            $scope.model.layerWatch = [];

            // IDs selected in the interface
            $scope.model.selected_corpus = undefined;
            $scope.model.selected_medium = undefined;
            $scope.model.selected_reference = undefined;
            $scope.model.selected_hypothesis = undefined;
            $scope.model.selected_monomodal = []; // variable sized vector of additional layer IDs


            // video URL
            $scope.model.video = "";


            // get list of corpora
            $scope.get_corpora = function () {
                $scope.model.available_corpora = Corpus.query(function () {
                    // initializing layerWatch after corpora are loaded
                    // Adds empty layers as border effect
                    $scope.model.layerWatch = [$scope.model.layers[0]._id,
                        $scope.model.layers[1]._id,
                        $scope.model.layers[2]._id
                    ];

                });
            };

            // get list of media for a given corpus
            $scope.get_media = function (corpus_id) {
                $scope.model.available_media = Media.query({
                    corpusId: corpus_id
                });
            };

            // get list of layers for a given medium
            $scope.get_layers = function (corpus_id, medium_id) {

                $scope.model.available_layers = Layer.query({
                    corpusId: corpus_id,
                    id_media: medium_id
                });
            };

            // get list of reference annotations from a given layer
            // and update difference with hypothesis when it's done
            $scope.get_reference_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[0] = {
                    'label': 'Reference',
                    '_id': layer_id + "0"
                };
                $scope.model.layers[0].layer = Annotation.query({
                        corpusId: corpus_id,
                        id_media: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        $scope.model.layerWatch[0] = layer_id + "0";
                        $scope.compute_diff();
                    }
                );
            };

            // get list of hypothesis annotations from a given layer
            // and update difference with reference when it's done
            $scope.get_hypothesis_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[1] = {
                    'label': 'Fusion',
                    '_id': layer_id + "1"
                };
                $scope.model.layers[1].layer = Annotation.query({
                        corpusId: corpus_id,
                        id_media: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        $scope.model.layerWatch[1] = layer_id + "1";
                        $scope.compute_diff();
                    }
                );
            };

            $scope.get_monomodal_annotations = function (corpus_id, medium_id, layer_id) {
                var index = $scope.model.selected_monomodal.indexOf(layer_id);
                var aIndex = $scope.model.available_layers.map(function (d) {
                    return d._id;
                }).indexOf(layer_id);
                var name = $scope.model.available_layers[aIndex].layer_type;
                $scope.model.layers[3 + index] = {
                    '_id': layer_id + "" + (3 + index),
                    'label': name
                };
                $scope.model.layers[3 + index].layer = Annotation.query({
                        corpusId: corpus_id,
                        id_media: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        $scope.model.layerWatch[3 + index] = layer_id + "" + (3 + index);
                        $scope.compute_diff();
                    }
                );
            };

            // update difference between reference and hypothesis
            $scope.compute_diff = function () {

                var reference_and_hypothesis = {
                    'hypothesis': camomile2pyannoteFilter($scope.model.layers[1].layer),
                    'reference': camomile2pyannoteFilter($scope.model.layers[0].layer)
                };

                if (reference_and_hypothesis.hypothesis.content.length > 0 && reference_and_hypothesis.reference.content.length > 0) {
                    CMError.diff(reference_and_hypothesis).success(function (data) {
                        $scope.model.layers[2] = {
                            'label': 'Difference',
                            '_id': $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
                            'mapping': defaults.diffMapping,
                            'tooltipFunc': defaults.tooltip
                        };

                        $scope.model.layers[2].layer = pyannote2camomileFilter(data);
                        $scope.model.layerWatch[2] = $scope.model.layers[2]._id;
                    });
                }
            };

            $scope.model.colScale = d3.scale.ordinal();// custom color scale

            $scope.updateColorScale = function (addedLayerId) {
                // get layer actual object from ID
                var addedLayer = $scope.model.layers.filter(function (l) {
                    return(l._id === addedLayerId);
                })[0];

                // set up defaults for mapping and tooltipFunc
                if (addedLayer.mapping === undefined) {
                    addedLayer.mapping = {
                        getKey: function (d) {
                            return d.data;
                        }
                    };
                }

                if (addedLayer.tooltipFunc === undefined) {
                    addedLayer.tooltipFunc = function (d) {
                        return d.data;
                    };
                }

                if (addedLayer.mapping.colors === undefined) {
                    // increment the color mapping using the default palette,
                    // according to the observed values
                    var vals = addedLayer.layer.map(addedLayer.mapping.getKey);
                    vals = $.grep(vals, function (v, k) {
                        return $.inArray(v, vals) === k;
                    }); // jQuery hack to get Array of unique values
                    // and then all that are not already in the scale domain
                    vals = vals.filter(function (l) {
                        return !($scope.model.colScale.domain().indexOf(l) > -1);
                    });
                    vals.forEach(function (d) {
                        $scope.model.colScale.domain().push(d);
                        $scope.model.colScale.domain($scope.model.colScale.domain()); // hack to register changes
                        $scope.model.colScale.range().push(palette[curColInd]);
                        $scope.model.colScale.range($scope.model.colScale.range());
                        curColInd = (curColInd + 1) % palette.length;
                    });
                } else {
                    // check that explicit mapping is not already defined in the color scale
                    var newKeys = Object.keys(addedLayer.mapping.colors).filter(function (l) {
                        return !($scope.model.colScale.domain().indexOf(l) > -1);
                    });
                    newKeys.forEach(function (k) {
                        $scope.model.colScale.domain().push(k);
                        $scope.model.colScale.domain($scope.model.colScale.domain());
                        $scope.model.colScale.range().push(addedLayer.mapping.colors[k]);
                        $scope.model.colScale.range($scope.model.colScale.range());
                    });
                }

            };

            $scope.setMinimalXDisplayedValue = function (value) {
                $scope.model.minimalXDisplayedValue = value;
            };

            $scope.setMaximalXDisplayedValue = function (value) {
                $scope.model.maximalXDisplayedValue = value;
            };

            $scope.$watch('model.selected_corpus', function (newValue, oldValue, scope) {
                if (newValue) {
                    scope.get_media(scope.model.selected_corpus);
                    scope.model.selected_medium = undefined;
                }
            });

            $scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
                scope.model.selected_reference = undefined;
                scope.model.selected_hypothesis = undefined;
                scope.model.selected_monomodal = [];
                if (newValue) {
                    scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);

                    scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/" + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
                }
            });

            $scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
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

            $scope.$watch('model.selected_hypothesis', function (newValue, oldValue, scope) {
                if (newValue === undefined) {
                    scope.model.layers[1] = defaultFusionLayer;
                    scope.compute_diff();
                } else {
                    scope.get_hypothesis_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_hypothesis);
                }
            });

            $scope.$watch('model.selected_monomodal', function (newValue, oldValue, scope) {
                    var newMonomodals = newValue.filter(function (l) {
                        return !(oldValue.indexOf(l) > -1);
                    });
                    newMonomodals.forEach(function (d) {
                        scope.get_monomodal_annotations(
                            scope.model.selected_corpus,
                            scope.model.selected_medium,
                            d);
                    });
                }, true // deep watch, as selected_monomodal is an array
            );


            $scope.addMonomodal = function () {
                $scope.model.selected_monomodal.push($scope.model.monomodal_id);
            };


        }]);