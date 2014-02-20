'use strict';


// !!!!! GENERAL NOTE
// In cases where missing values are permitted (e.g. model.layers), 'undefined' should be used
// as explicit placeholders - so that further testing is facilitated (null and undefined are handled
// differently, and relying on the default "falsy" behaviour can lead to unpredictable errors,
// see Crockford "Javascript, the good parts" for reference.

// !!!!! No need for model.latestLayer any more

// !!!!! cm-timeline knows defaults for getKey, tooltip, and color mapping.
// Thus these should be manually defined only if required.

angular.module('myApp.controllers', ['myApp.services'])

.controller('SessionCtrl', ['$sce', '$scope', '$http', 'Session',
    function($sce, $scope, $http, Session) {

        $scope.model = {};
        $scope.model.display_piechart = false;
        $scope.model.message = undefined;
        $scope.login = function(username, password) {

            Session.login({
                username: username,
                password: password
            })
                .success(function(data, status) {
                    console.log('logged in as ' + username);
                    Session.isLogged = true;
                    Session.username = username;
                    $scope.model.message = "Connected as " + Session.username;

                })
                .error(function(data, status) {
                    Session.isLogged = false;
                    Session.username = undefined;
                    $scope.model.message = "Connection error";
                });
        };

        $scope.logout = function() {
            Session.logout()
                .success(function(data, status) {
                    Session.isLogged = false;
                    Session.username = undefined;
                    $scope.model.message = undefined;
                });
        };

        $scope.isLogged = function() {
            return Session.isLogged;
        };

        $scope.getUserName = function() {
            return Session.username;
        };

    }
])

.controller('DiffCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation',
    'CMError', 'defaults', 'palette',
    function($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette) {

        delete $http.defaults.headers.common['X-Requested-With'];


        $scope.model = {};

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

        // init color index
        var curColInd=0;

        // model.layers is mapped in cm-timeline using the defaults
        $scope.model.layers = [
            defaultReferenceLayer,
            defaultHypothesisLayer,
            defaultDiffLayer
        ];

        // reflects model.layer for watch by cm-timeline.
        // initialized empty so that the initial watch triggers with consistent values for cm-timeline,
        // as soon as the corpora are loaded - ie sufficiently "late" in the angular init loop.
        $scope.model.layerWatch = [];

        $scope.model.colScale =  d3.scale.ordinal();// custom color scale

        $scope.model.selected_slice = -1;

        $scope.updateColorScale = function(addedLayerId)
        {
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

        // IDs selected in the interface
        $scope.model.selected_corpus = undefined;
        $scope.model.selected_medium = undefined;
        $scope.model.selected_reference = undefined;
        $scope.model.selected_hypothesis = undefined;
        $scope.model.selected_layer = undefined;

        // URL for video
        $scope.model.video = "";

        // get list of corpora
        $scope.get_corpora = function() {
            $scope.model.available_corpora = Corpus.query(function() {
                // initializing layerWatch after corpora are loaded
                // Adds empty layers as border effect
                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                    $scope.model.layers[1]._id,
                    $scope.model.layers[2]._id
                ];
            });
        };

        // get list of media for a given corpus
        $scope.get_media = function(corpus_id) {
            $scope.model.available_media = Media.query({
                corpusId: corpus_id
            }, function() {
            });
        };

        // get list of layers for a given medium
        $scope.get_layers = function(corpus_id, medium_id) {
            $scope.model.available_layers = Layer.query({
                corpusId: corpus_id,
                mediaId: medium_id
            });
        };

        // get list of reference annotations from a given layer,
        // replace current reference layer,
        // and update difference with hypothesis when it's done
        $scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[0] = {
                'label': 'Reference',
                '_id': layer_id + "0"
            };
            $scope.model.layers[0].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[0] = layer_id + "0";
                    $scope.compute_diff();
                }
            );
        };

        // get list of hypothesis annotations from a given layer,
        // replace current hypothesis layer,
        // and update difference with reference when it's done
        $scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[1] = {
                'label': 'Hypothesis',
                '_id': layer_id + "1"
            };
            $scope.model.layers[1].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[1] = layer_id + "1";
                    $scope.compute_diff();
                });
        };

        // recompute difference between reference and hypothesis,
        // and replace diff layer.
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

        // Action on button "display piechart"
        $scope.displayPiechart = function()
        {
            $scope.model.display_piechart = ! $scope.model.display_piechart;
        };

        $scope.clickOnAPiechartSlice = function(sliceId)
        {
            if ($scope.model.selected_slice == sliceId) {
                $scope.model.selected_slice = -1;
            }
            else {

                $scope.model.selected_slice = sliceId;
            }
        };

        // Method used to compute slices of the piechart.
        $scope.computeSlices = function()
        {
            $scope.slices = [];
            var data = $scope.model.layers[$scope.model.selected_layer].layer;

            data.forEach(function(d,i) {
                var addElement= true;

               var addedLayer = $scope.model.layers.filter(function (l) {
                    return(l._id === $scope.model.layerWatch[$scope.model.selected_layer]);
                })[0];

                for(var i = 0, max = $scope.slices.length; i<max; i++){
                    if($scope.slices[i].element == addedLayer.mapping.getKey(d))
                    {
                        addElement = false;
                        $scope.slices[i].spokenTime+= (d.fragment.end- d.fragment.start);
                    }
                }

                if(addElement)
                {
                    $scope.slices.push({"element": addedLayer.mapping.getKey(d), "spokenTime": (d.fragment.end- d.fragment.start)});
                }
            });
        };

        // the selected corpus has changed
        $scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
            if (newValue) {
                scope.get_media(scope.model.selected_corpus);
                // blank the medium selection
                scope.model.selected_medium = undefined;
            }
        });



        $scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
            // when the medium changes, the viz is reinit, and the select box gets the new layers
            scope.model.selected_reference = undefined;
            scope.model.selected_hypothesis = undefined;
            if (newValue) {
                scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
                scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/" + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
            }
        });

        $scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
            // handle the reinit case
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
            // handle the reinit case
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

    }
])

.controller('RegressionCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults','palette',
    function($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette) {

        delete $http.defaults.headers.common['X-Requested-With'];

        $scope.model = {};
        $scope.model.display_piechart = false;
        $scope.model.selected_slice = -1;

        var curColInd = 0;

        // placeholder definitions
        var defaultReferenceLayer = {
            'label': 'Reference',
            '_id': 'Reference_init',
            'layer': []
        };

        var defaultHypothesis1Layer = {
            'label': 'Hypothesis 1',
            '_id': 'Hypothesis_1_init',
            'layer': []
        };

        var defaultHypothesis2Layer = {
            'label': 'Hypothesis 2',
            '_id': 'Hypothesis_2_init',
            'layer': []
        };

        var defaultRegressionLayer = {
            'label': 'Regression',
            '_id': 'Regression_init',
            'layer': []
        };

        // model.layers is mapped in cm-timeline using the defaults
        $scope.model.layers = [
            defaultReferenceLayer,
            defaultHypothesis1Layer,
            defaultHypothesis2Layer,
            defaultRegressionLayer
        ];

        // reflects model.layer for watch by cm-timeline.
        // initialized empty so that the initial watch triggers with consistent values for cm-timeline,
        // as soon as the corpora are loaded - ie sufficiently "late" in the angular init loop.
        $scope.model.layerWatch = [];

        // Ids selected in the interface
        $scope.model.selected_corpus = undefined;
        $scope.model.selected_medium = undefined;
        $scope.model.selected_reference = undefined;
        $scope.model.selected_before = undefined;
        $scope.model.selected_after = undefined;
        $scope.model.selected_layer = undefined;

        // video URL
        $scope.model.video = "";


        $scope.get_corpora = function() {
            $scope.model.available_corpora = Corpus.query(function() {
                // initializing layerWatch after corpora are loaded
                // Adds empty layers as border effect
                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                    $scope.model.layers[1]._id,
                    $scope.model.layers[2]._id,
                    $scope.model.layers[3]._id
                ];
            });
        };

        $scope.get_media = function(corpus_id) {
            $scope.model.available_media = Media.query({
                corpusId: corpus_id
            });
        };

        $scope.get_layers = function(corpus_id, medium_id) {
            $scope.model.available_layers = Layer.query({
                corpusId: corpus_id,
                mediaId: medium_id
            });
        };

        $scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[0] = {
                'label': 'Reference',
                '_id': layer_id + "0"
            };
            $scope.model.layers[0].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[0] = layer_id + "0";
                    $scope.compute_regression();
                }
            );
        };

        $scope.get_before_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[1] = {
                'label': 'Hypothesis 1',
                '_id': layer_id + "1"
            };
            $scope.model.layers[1].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[1] = layer_id + "1";
                    $scope.compute_regression();
                }
            );
        };

        $scope.get_after_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[2] = {
                'label': 'Hypothesis 2',
                '_id': layer_id + "2"
            };
            $scope.model.layers[2].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[2] = layer_id + "2";
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

        // Action on button "display piechart"
        $scope.displayPiechart = function()
        {
            $scope.model.display_piechart = ! $scope.model.display_piechart;
        };

        $scope.clickOnAPiechartSlice = function(sliceId)
        {
            if ($scope.model.selected_slice == sliceId) {
                $scope.model.selected_slice = -1;
            }
            else {

                $scope.model.selected_slice = sliceId;
            }
        };

        // Method used to compute slices of the piechart.
        $scope.computeSlices = function()
        {
            $scope.slices = [];
            var data = $scope.model.layers[$scope.model.selected_layer].layer;

            data.forEach(function(d,i) {
                var addElement= true;

                var addedLayer = $scope.model.layers.filter(function (l) {
                    return(l._id === $scope.model.layerWatch[$scope.model.selected_layer]);
                })[0];

                for(var i = 0, max = $scope.slices.length; i<max; i++){
                    if($scope.slices[i].element == addedLayer.mapping.getKey(d))
                    {
                        addElement = false;
                        $scope.slices[i].spokenTime+= (d.fragment.end- d.fragment.start);
                    }
                }

                if(addElement)
                {
                    $scope.slices.push({"element": addedLayer.mapping.getKey(d), "spokenTime": (d.fragment.end- d.fragment.start)});
                }
            });
        };

        $scope.model.colScale =  d3.scale.ordinal();// custom color scale

        $scope.updateColorScale = function(addedLayerId)
        {
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
        $scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
            if (newValue) {
                scope.get_media(scope.model.selected_corpus);
                // blank the medium selection
                scope.model.selected_medium = undefined;
            }
        });

        $scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
            // when the medium changes, the viz is reinit, and the select box gets the new layers
            scope.model.selected_reference = undefined;
            scope.model.selected_before = undefined;
            scope.model.selected_after = undefined;
            if (newValue) {
                scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
                scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/" + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
            }
        });

        $scope.$watch('model.selected_reference', function(newValue, oldValue, scope) {
            // handle the reinit case
            if (newValue === undefined) {
                scope.model.layers[0] = defaultReferenceLayer;
                scope.compute_regression();
            } else {
                scope.get_reference_annotations(
                    scope.model.selected_corpus,
                    scope.model.selected_medium,
                    scope.model.selected_reference);
            }
        });

        $scope.$watch('model.selected_before', function(newValue, oldValue, scope) {
            // handle the reinit case
            if (newValue === undefined) {
                scope.model.layers[1] = defaultHypothesis1Layer;
                scope.compute_regression();
            } else {
                scope.get_before_annotations(
                    scope.model.selected_corpus,
                    scope.model.selected_medium,
                    scope.model.selected_before);
            }
        });

        $scope.$watch('model.selected_after', function(newValue, oldValue, scope) {
            // handle the reinit case
            if (newValue === undefined) {
                scope.model.layers[2] = defaultHypothesis2Layer;
                scope.compute_regression();
            } else {
                scope.get_after_annotations(
                    scope.model.selected_corpus,
                    scope.model.selected_medium,
                    scope.model.selected_after);
            }
        });
    }
])

.controller('FusionCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults','palette',
    function($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette) {

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
        $scope.get_corpora = function() {
            $scope.model.available_corpora = Corpus.query(function() {
                // initializing layerWatch after corpora are loaded
                // Adds empty layers as border effect
                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                    $scope.model.layers[1]._id,
                    $scope.model.layers[2]._id
                ];

            });
        };

        // get list of media for a given corpus
        $scope.get_media = function(corpus_id) {
            $scope.model.available_media = Media.query({
                corpusId: corpus_id
            });
        };

        // get list of layers for a given medium
        $scope.get_layers = function(corpus_id, medium_id) {

            $scope.model.available_layers = Layer.query({
                corpusId: corpus_id,
                mediaId: medium_id
            });
        };

        // get list of reference annotations from a given layer
        // and update difference with hypothesis when it's done
        $scope.get_reference_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[0] = {
                'label': 'Reference',
                '_id': layer_id + "0"
            };
            $scope.model.layers[0].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[0] = layer_id + "0";
                    $scope.compute_diff();
                }
            );
        };

        // get list of hypothesis annotations from a given layer
        // and update difference with reference when it's done
        $scope.get_hypothesis_annotations = function(corpus_id, medium_id, layer_id) {
            $scope.model.layers[1] = {
                'label': 'Fusion',
                '_id': layer_id + "1"
            };
            $scope.model.layers[1].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[1] = layer_id + "1";
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
            $scope.model.layers[3 + index] = {
                '_id': layer_id + "" + (3+index),
                'label': name
            };
            $scope.model.layers[3 + index].layer = Annotation.query({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id
                },
                function() {
                    $scope.model.layerWatch[3 + index] = layer_id + "" + (3+index);
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

        $scope.model.colScale =  d3.scale.ordinal();// custom color scale

        $scope.updateColorScale = function(addedLayerId)
        {
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

        $scope.$watch('model.selected_corpus', function(newValue, oldValue, scope) {
            if (newValue) {
                scope.get_media(scope.model.selected_corpus);
                scope.model.selected_medium = undefined;
            }
        });

        $scope.$watch('model.selected_medium', function(newValue, oldValue, scope) {
            scope.model.selected_reference = undefined;
            scope.model.selected_hypothesis = undefined;
            scope.model.selected_monomodal = [];
            if (newValue) {
                scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
                scope.model.video = $sce.trustAsResourceUrl("https://flower.limsi.fr/data/corpus/" + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
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
                scope.model.layers[1] = defaultFusionLayer;
                scope.compute_diff();
            } else {
                scope.get_hypothesis_annotations(
                    scope.model.selected_corpus,
                    scope.model.selected_medium,
                    scope.model.selected_hypothesis);
            }
        });

        $scope.$watch('model.selected_monomodal', function(newValue, oldValue, scope) {
                var newMonomodals = newValue.filter(function(l) {
                    return !(oldValue.indexOf(l) > -1);
                });
                newMonomodals.forEach(function(d) {
                    scope.get_monomodal_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        d);
                });
            }, true // deep watch, as selected_monomodal is an array
        );



        $scope.addMonomodal = function() {
            $scope.model.selected_monomodal.push($scope.model.monomodal_id);
        };


    }
]);
