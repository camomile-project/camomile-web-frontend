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

    .controller('SessionCtrl', ['$sce', '$scope', '$http', 'Session', '$cookieStore',
        function ($sce, $scope, $http, Session, $cookieStore) {

            $scope.model = {};
            $scope.model.message = undefined;


            $scope.login = function (submit) {
                var username = $("#login").val();
                var password = $("#password").val();
                // get actual values in the form, as angular scope not
                // updated from autocomplete (see index.html for info)
                Session.login({
                    username: username,
                    password: password
                })
                    .success(function () {
                        console.log('logged in as ' + username);
                        Session.isLogged = true;
                        Session.username = username;
                        $cookieStore.put("current.user", username);
                        $scope.model.message = "Connected as " + Session.username;
                        submit(); // hack to allow autofill and autocomplete support

                    })
                    .error(function () {
                        Session.isLogged = false;
                        Session.username = undefined;
                        $cookieStore.remove("current.user");
                        $scope.model.message = "Connection error";
                    });
            };


            $scope.logout = function () {
                Session.logout()
                    .success(function () {
                        Session.isLogged = false;
                        $cookieStore.remove("current.user");
                        Session.username = undefined;
                        $scope.model.message = undefined;
                    });
            };

            $scope.isLogged = function () {
                return Session.isLogged;
            };

            $scope.getUserName = function () {
                return Session.username;
            };

            // Allow to check in the coockie if the user is already set
            $scope.checkLoggin = function () {
                var currentUser = $cookieStore.get("current.user");
                if (currentUser && currentUser != "") {
                    Session.isLogged = true;
                    Session.username = currentUser;
                    $cookieStore.put("current.user", currentUser);
                    $scope.model.message = "Connected as " + Session.username;
                }

            }

        }
    ])
    .controller('BaseCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation',
        'CMError', 'defaults', 'palette',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette) {

            delete $http.defaults.headers.common['X-Requested-With'];


            $scope.model = {};
            $scope.model.modified_element = "nothing";
            $scope.model.selectedSummary = "nothing";
            $scope.model.display_piechart = false;
            $scope.model.display_barchart = false;
            $scope.model.display_treemap = false;
            $scope.model.update_SummaryView = 0;

            // reflects model.layer for watch by cm-timeline.
            // initialized empty so that the initial watch triggers with consistent values for cm-timeline,
            // as soon as the corpora are loaded - ie sufficiently "late" in the angular init loop.
            $scope.model.layerWatch = [];

            $scope.model.colScale = d3.scale.ordinal();// custom color scale

            $scope.model.selected_slice = -1;

            $scope.model.play_label = "Play";

            $scope.model.layers = [];

            // init color index
            var curColInd = 0;

            // IDs selected in the interface
            $scope.model.selected_corpus = undefined;
            $scope.model.selected_medium = undefined;
            $scope.model.selected_reference = undefined;
            $scope.model.selected_layer = undefined;

            // URL for video
            $scope.model.video = "";

            function f_filterResults(n_win, n_docel, n_body) {
                var n_result = n_win ? n_win : 0;
                if (n_docel && (!n_result || (n_result > n_docel)))
                    n_result = n_docel;
                return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
            }

            // get the client height
            $scope.f_clientHeight = function () {
                return f_filterResults(
                    window.innerHeight ? window.innerHeight : 0,
                    document.documentElement ? document.documentElement.clientHeight : 0,
                    document.body ? document.body.clientHeight : 0
                );
            };

            // get the client width
            $scope.f_clientWidth = function () {
                return f_filterResults(
                    window.innerWidth ? window.innerWidth : 0,
                    document.documentElement ? document.documentElement.clientWidth : 0,
                    document.body ? document.body.clientWidth : 0
                );
            };

            // hide contextmenu if clicked anywhere but on relevant targets
            $("body").on("click", function () {
                $("#contextMenu").hide().find("li").removeClass("disabled").children().css({
                    "pointer-events": "auto"
                });
            });

            $scope.updateColorScale = function () {
                // refresh color scale completely:
                // - add new modalities
                // - remove unused


                // newVals: modalities not already in the color mapping
                // oldVals: modalities historically in the mapping, from which we exclude those still needed
                var vals;
                var newVals = [];
                var oldVals = $scope.model.colScale.domain();
                var newMaps = {
                    keys: [],
                    maps: []
                };


                $scope.model.layers.forEach(function (layer) {
                    if (layer.mapping === undefined) {
                        layer.mapping = {
                            getKey: function (d) {
                                return d.data;
                            }
                        };
                    }

                    if (layer.tooltipFunc === undefined) {
                        layer.tooltipFunc = function (d) {
                            return d.data;
                        };
                    }


                    if (layer.mapping.colors === undefined) {
                        vals = layer.layer.map(layer.mapping.getKey);
                        vals = $.grep(vals, function (v, k) {
                            return $.inArray(v, vals) === k;
                        }); // jQuery hack to get Array of unique values
                        // and then all that are not already in the scale domain
                        newVals = newVals.concat(vals.filter(function (l) {
                            return (!($scope.model.colScale.domain().indexOf(l) > -1)
                                && !(newVals.indexOf(l) > -1));
                        }));

                        oldVals = oldVals.filter(function (l) {
                            return !(vals.indexOf(l) > -1);
                        });
                    } else {
                        vals = Object.keys(layer.mapping.colors).filter(function (l) {
                            return (!($scope.model.colScale.domain().indexOf(l) > -1)
                                && !(newMaps.keys.indexOf(l) > -1));
                        });
                        // check that explicit mapping is not already defined in the color scale
                        newMaps.keys = newMaps.keys.concat(vals);
                        newMaps.maps = newMaps.maps.concat(vals.map(function (d) {
                            return layer.mapping.colors[d];
                        }));

                        oldVals = oldVals.filter(function (l) {
                            return !(Object.keys(layer.mapping.colors).indexOf(l) > -1);
                        });

                    }

                });

                // add new mappings, and remove stale ones

                newVals.forEach(function (d) {
                    $scope.model.colScale.domain().push(d);
                    $scope.model.colScale.domain($scope.model.colScale.domain()); // hack to register changes
                    $scope.model.colScale.range().push(palette[curColInd]);
                    $scope.model.colScale.range($scope.model.colScale.range());
                    curColInd = (curColInd + 1) % palette.length;
                });


                newMaps.keys.forEach(function (k, i) {
                    $scope.model.colScale.domain().push(k);
                    $scope.model.colScale.domain($scope.model.colScale.domain());
                    $scope.model.colScale.range().push(newMaps.maps[i]);
                    $scope.model.colScale.range($scope.model.colScale.range());
                });

                oldVals.forEach(function (d) {
//                    var mapping = $scope.model.colScale(d);
                    var index = $scope.model.colScale.domain().indexOf(d);
                    $scope.model.colScale.domain().splice(index, 1);
                    $scope.model.colScale.domain($scope.model.colScale.domain());
                    $scope.model.colScale.range().splice(index, 1);
                    $scope.model.colScale.range($scope.model.colScale.range());
                });


            };

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
                }, function () {
                });
            };

            // get list of layers for a given medium
            $scope.get_layers = function (corpus_id, medium_id) {
                $scope.model.available_layers = Layer.query({
                    corpusId: corpus_id,
                    mediaId: medium_id
                });
            };


            // Action on combobox "display piechart"
            $scope.displayPiechart = function () {
                $scope.model.display_piechart = true;
            };

            // Action on button "display barchart"
            $scope.displayBarchart = function () {
                $scope.model.display_barchart = true;
            };

            // Action on button "display treemap"
            $scope.displayTreemap = function () {
                $scope.model.display_treemap = true;
            };

            // Action on button "display nothing"
            $scope.displayNothing = function () {
                $scope.model.display_piechart = false;
                $scope.model.display_barchart = false;
                $scope.model.display_treemap = false;
            };

            $scope.displayRepresentation = function () {
                $scope.displayNothing();
                if ($scope.model.selectedSummary === "piechart") {
                    $scope.displayPiechart();
                }
                else if ($scope.model.selectedSummary === "barchart") {
                    $scope.displayBarchart();
                }
                else if ($scope.model.selectedSummary === "treemap") {
                    $scope.displayTreemap();
                }
            };

            $scope.clickOnAPiechartSlice = function (sliceId) {
                if ($scope.model.selected_slice == sliceId) {
                    $scope.model.selected_slice = -1;
                }
                else {
                    $scope.model.selected_slice = sliceId;
                }
            };

            // Method used to compute slices of the piechart.
            $scope.computeSlices = function () {
                $scope.slices = [];
                if ($scope.model.selected_layer !== undefined) {
                    var data = $scope.model.layers[$scope.model.selected_layer];

                    data.layer.forEach(function (d) {
                        var addElement = true;
                        if ((d.fragment.end <= $scope.model.maximalXDisplayedValue && d.fragment.end >= $scope.model.minimalXDisplayedValue)
                            || (d.fragment.start <= $scope.model.maximalXDisplayedValue && d.fragment.start >= $scope.model.minimalXDisplayedValue)
                            || (($scope.model.maximalXDisplayedValue <= d.fragment.end && $scope.model.maximalXDisplayedValue >= d.fragment.start)
                            || ($scope.model.minimalXDisplayedValue <= d.fragment.end && $scope.model.minimalXDisplayedValue >= d.fragment.start))) {

                            for (var i = 0, max = $scope.slices.length; i < max; i++) {
                                if ($scope.slices[i].element == data.mapping.getKey(d)) {
                                    addElement = false;
                                    $scope.slices[i].spokenTime += (d.fragment.end - d.fragment.start);
                                }
                            }

                            if (addElement) {
                                $scope.slices.push({"element": data.mapping.getKey(d), "spokenTime": (d.fragment.end - d.fragment.start)});
                            }
                        }
                    });
                }

                // Sort them (descending) in order to keep indexes correct
                $scope.slices.sort(function (a, b) {
                    return (b.spokenTime - a.spokenTime);
                });
            };

            $scope.setMinimalXDisplayedValue = function (value) {
                $scope.model.minimalXDisplayedValue = value;
            };

            $scope.setMaximalXDisplayedValue = function (value) {
                $scope.model.maximalXDisplayedValue = value;
            };

            // Method that updates an annotation's data
            $scope.update_annotation = function (corpus_id, medium_id, layer_id, annotation_id, newValue) {

                // qet the annotation to edit
                var annotation_edited = Annotation.queryForAnUpdate({
                    corpusId: corpus_id,
                    mediaId: medium_id,
                    layerId: layer_id,
                    annotationId: annotation_id
                });

                // replace its data by the new one
                annotation_edited.data = newValue;

                // update it on server
                Annotation.update(
                    // update parameters
                    {
                        corpusId: corpus_id,
                        mediaId: medium_id,
                        layerId: layer_id,
                        annotationId: annotation_id
                    },
                    // data to post
                    annotation_edited,
                    // success handling
                    function () {
                        console.log('Successfully update the annotation');
                    },
                    //error handling
                    function (error) {
                        console.log("ERROR: ");
                        console.log(error);
                    });

            };

            // Method that removes an annotation
            $scope.remove_annotation = function (corpus_id, medium_id, layer_id, annotation_id) {

                // call the native remove method
                Annotation.remove({
                        corpusId: corpus_id,
                        mediaId: medium_id,
                        layerId: layer_id,
                        annotationId: annotation_id
                    },
                    function () {
                        console.log('Successfully remove the annotation')
                    });


            };

// remove old summary
            $scope.resetSummaryView = function (resetSelection) {
                // Get the correct svg tag to append the chart
                var vis = d3.select("#piechart").attr("width", 410).attr("height", 410);


                // Remove old existing piechart
                var oldGraph = vis.selectAll("g");


                if (oldGraph) {
                    oldGraph.remove();
                }

                // remove barchart
                vis = d3.select("#barchart").attr("width", 410).attr("height", 410);


                // Remove old existing piechart
                oldGraph = vis.selectAll("g");


                if (oldGraph) {
                    oldGraph.remove();
                }

                // remove treemap
                vis = d3.select("#treemap").attr("width", 410).attr("height", 410);


                // Remove old existing piechart
                oldGraph = vis.selectAll("g");


                if (oldGraph) {
                    oldGraph.remove();
                }


                // Remove old existing tooltips
                var detailedView = d3.select("#detailedView").attr("width", 0).attr("height", 0);
                var oldTooltip = detailedView.selectAll("div");
                if (oldTooltip) {
                    oldTooltip.remove();
                }


                var svgContainer = d3.select("#legend");

                // Vire les anciens graphs
                oldGraph = svgContainer.selectAll("rect");
                if (oldGraph) {
                    oldGraph.remove();
                }

                oldGraph = svgContainer.selectAll("text");
                if (oldGraph) {
                    oldGraph.remove();
                }

                if (resetSelection) {
                    $scope.model.selected_slice = undefined;
                    $scope.model.selected_layer = undefined;
                    $scope.model.display_piechart = false;
                    $scope.model.selectedSummary = "nothing";
                    $scope.model.display_barchart = false;
                    $scope.model.display_treemap = false;
                }
            };

            $scope.model.edit_click = function () {
                $scope.model.edit_flag = true;
            };

            $scope.model.remove_click = function () {

                // check if user really wants to remove target annotation
                if (confirm("Are you sure you want to remove this annotation ?")) {

                    // remove annotation from currently loaded data
                    // refresh view
                    var layer_index = $scope.model.layers.map(function (d) {
                        return d._id;
                    }).indexOf($scope.model.edit_layer_id);
                    var annot_index = $scope.model.layers[layer_index].layer.map(function (d) {
                        return d._id;
                    }).indexOf($scope.model.edit_annot_id);

                    $scope.remove_annotation($scope.model.selected_corpus, $scope.model.selected_medium, $scope.model.edit_layer_id, $scope.model.edit_annot_id);

                    // TODO This part is the one removing brush elements
                    // Get the layer that have to be removed from the brush
                    var layerToRemove = $scope.model.layers[layer_index].layer[annot_index];
                    // Get its corresponding rectangle in the brush
                    layerToRemove = document.getElementById('brushed' + layerToRemove._id);
                    // Removes it from the brush
                    layerToRemove.parentNode.removeChild(layerToRemove);

                    $scope.model.layers[layer_index].layer.splice(annot_index, 1);
                    $scope.model.layersUpdated = true;
                    $scope.computeLastLayer();

                    if ($scope.model.update_SummaryView > 3) {
                        $scope.model.update_SummaryView = 0;
                    }
                    else {
                        $scope.model.update_SummaryView++;
                    }
                }
            };

            $scope.model.edit_save_element = function (edit_items) {
                var layer_index = $scope.model.layers.map(function (d) {
                    return d._id;
                }).indexOf($scope.model.edit_layer_id);
                var annot_index = $scope.model.layers[layer_index].layer.map(function (d) {
                    return d._id;
                }).indexOf($scope.model.edit_annot_id);

                $scope.model.layers[layer_index].layer[annot_index].data = edit_items[0].value;
                $scope.model.layersUpdated = true;
                $scope.computeLastLayer();

                // serveur update
                $scope.update_annotation($scope.model.selected_corpus, $scope.model.selected_medium, $scope.model.edit_layer_id, $scope.model.edit_annot_id, edit_items[0].value);
                // Forces summary view's update
                if ($scope.model.update_SummaryView > 3) {
                    $scope.model.update_SummaryView = 0;
                }
                else {
                    $scope.model.update_SummaryView++;
                }
            };

            var save_state;

            $('#seek-bar').on('mousedown',function () {
                save_state = $scope.model.play_state;
                $scope.$apply(function () {
                    $scope.model.toggle_play(false);
                });

            }).on('mouseup', function () {
                    $scope.$apply(function () {
                        $scope.model.toggle_play(save_state);
                    });
                });

            $scope.computeLastLayer = function () {
                // TODO replace this in children controller;
            };

            $scope.$watch("model.play_state", function (newValue) {
                if (newValue) {
                    $scope.model.play_label = "Pause";
                } else {
                    $scope.model.play_label = "Play";
                }
            });

            $scope.model.debugProbe = function () {
                console.log("probe called");
            }

        }])
    .
    controller('DiffCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation',
        'CMError', 'defaults', 'palette', 'DataRoot', '$controller',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette, DataRoot, $controller) {

            $controller('BaseCtrl',
                {
                    $sce: $sce,
                    $scope: $scope,
                    $http: $http,
                    Corpus: Corpus,
                    Media: Media,
                    Layer: Layer,
                    Annotation: Annotation,
                    CMError: CMError,
                    defaults: defaults,
                    palette: palette
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
                        corpusId: corpus_id,
                        mediaId: medium_id,
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
                        corpusId: corpus_id,
                        mediaId: medium_id,
                        layerId: layer_id
                    },
                    function () {
//						$scope.model.layerWatch[1] = layer_id + "_1";
                        $scope.model.layersUpdated = true;
                        $scope.compute_diff();
                    });
            };

            // recompute difference between reference and hypothesis,
            // and replace diff layer.
            $scope.compute_diff = function () {

                var reference_and_hypothesis = {
                    'hypothesis': $scope.model.layers[1].layer,
                    'reference': $scope.model.layers[0].layer
                };

                CMError.diff(reference_and_hypothesis).success(function (data) {
                    $scope.model.layers[2] = {
                        'label': 'Difference',
                        '_id': 'Computed_' + $scope.model.layers[0]._id + '_vs_' + $scope.model.layers[1]._id,
                        'mapping': defaults.diffMapping,
                        'tooltipFunc': defaults.tooltip
                    };

                    $scope.model.layers[2].layer = data;
//					$scope.model.layerWatch[2] = $scope.model.layers[2]._id;
                    $scope.model.layersUpdated = true;
                });
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
                    $scope.resetSummaryView(true, true, true);
                }
            });


            $scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
                // when the medium changes, the viz is reinit, and the select box gets the new layers
                scope.model.selected_reference = undefined;
                scope.model.selected_hypothesis = undefined;
                if (newValue) {
                    scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
                    scope.model.video = $sce.trustAsResourceUrl(DataRoot + "/corpus/" +
                        scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
                    $scope.resetSummaryView(true, true, true);
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
                    $scope.resetSummaryView(true, true, true);
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
                    $scope.resetSummaryView(true, true, true);
                }
            });

        }])

    .controller('RegressionCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError',
        'defaults', 'palette', 'DataRoot', '$controller',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette, DataRoot, $controller) {

            delete $http.defaults.headers.common['X-Requested-With'];

            $controller('BaseCtrl',
                {
                    $sce: $sce,
                    $scope: $scope,
                    $http: $http,
                    Corpus: Corpus,
                    Media: Media,
                    Layer: Layer,
                    Annotation: Annotation,
                    CMError: CMError,
                    defaults: defaults,
                    palette: palette
                });


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

            $scope.get_reference_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[0] = {
                    'label': 'Reference',
                    '_id': layer_id + "_0"
                };
                $scope.model.layers[0].layer = Annotation.query({
                        corpusId: corpus_id,
                        mediaId: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        $scope.model.layerWatch[0] = layer_id + "0";
                        $scope.compute_regression();
                    }
                );
            };

            $scope.get_before_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[1] = {
                    'label': 'Hypothesis 1',
                    '_id': layer_id + "_1"
                };
                $scope.model.layers[1].layer = Annotation.query({
                        corpusId: corpus_id,
                        mediaId: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        $scope.model.layerWatch[1] = layer_id + "1";
                        $scope.compute_regression();
                    }
                );
            };

            $scope.get_after_annotations = function (corpus_id, medium_id, layer_id) {
                $scope.model.layers[2] = {
                    'label': 'Hypothesis 2',
                    '_id': layer_id + "_2"
                };
                $scope.model.layers[2].layer = Annotation.query({
                        corpusId: corpus_id,
                        mediaId: medium_id,
                        layerId: layer_id
                    },
                    function () {
                        $scope.model.layerWatch[2] = layer_id + "2";
                        $scope.compute_regression();
                    }
                );
            };

            $scope.compute_regression = function () {

                var reference_and_hypotheses = {
                    'reference': $scope.model.layers[0].layer,
                    'before': $scope.model.layers[1].layer,
                    'after': $scope.model.layers[2].layer
                };

                CMError.regression(reference_and_hypotheses).success(function (data) {
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
                    $scope.model.layersUpdated = true;
                });
            };


            $scope.computeLastLayer = function () {
                $scope.compute_regression();
            };

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
                scope.model.selected_reference = undefined;
                scope.model.selected_before = undefined;
                scope.model.selected_after = undefined;
                if (newValue) {
                    scope.get_layers(scope.model.selected_corpus, scope.model.selected_medium);
                    scope.model.video = $sce.trustAsResourceUrl(DataRoot + "/corpus/" + scope.model.selected_corpus + "/media/" + scope.model.selected_medium + "/video");
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_reference', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[0] = defaultReferenceLayer;
                    scope.compute_regression();
                } else {
                    scope.get_reference_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_reference);
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_before', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[1] = defaultHypothesis1Layer;
                    scope.compute_regression();
                } else {
                    scope.get_before_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_before);
                    $scope.resetSummaryView(true);
                }
            });

            $scope.$watch('model.selected_after', function (newValue, oldValue, scope) {
                // handle the reinit case
                if (newValue === undefined) {
                    scope.model.layers[2] = defaultHypothesis2Layer;
                    scope.compute_regression();
                } else {
                    scope.get_after_annotations(
                        scope.model.selected_corpus,
                        scope.model.selected_medium,
                        scope.model.selected_after);
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
        }
    ])

    .controller('FusionCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation', 'CMError', 'defaults', 'palette',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette) {

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
                    mediaId: medium_id
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
                        mediaId: medium_id,
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
                        mediaId: medium_id,
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
                        mediaId: medium_id,
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
                    'hypothesis': $scope.model.layers[1].layer,
                    'reference': $scope.model.layers[0].layer
                };

                CMError.diff(reference_and_hypothesis).success(function (data) {
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


        }
    ])
    .controller('QueueCtrl', ['$sce', '$scope', '$http', 'Corpus', 'Media', 'Layer', 'Annotation',
        'CMError', 'defaults', 'palette', 'DataRoot', '$controller', 'Queue', 'QueuePush', '$cookieStore',
        function ($sce, $scope, $http, Corpus, Media, Layer, Annotation, CMError, defaults, palette, DataRoot, $controller, Queue, QueuePush, $cookieStore) {

            $controller('BaseCtrl',
                {
                    $sce: $sce,
                    $scope: $scope,
                    $http: $http,
                    Corpus: Corpus,
                    Media: Media,
                    Layer: Layer,
                    Annotation: Annotation,
                    CMError: CMError,
                    defaults: defaults,
                    palette: palette
                });

            $scope.queues = [];
            $scope.model.queueTableData = [];
            $scope.model.incomingQueue = {};
            $scope.model.outcomingQueue = {};
            $scope.model.queueData = [];
            $scope.model.availableEntry = [];


            $(function () {
                $("#entry_input").autocomplete({
                    source: $scope.model.availableEntry
                });
            });

						// default for annotation context
						$scope.model.context_size = 5;

            // store the entry typed in the textbox
            $scope.model.entryTyped = "";

            // Store the selected table's line
            $scope.model.selectedQueueLineIndex = "";

            // add context menu to the table's lines
            $scope.model.contextMenu = function (event) {
                var $contextMenu = $("#contextMenu");

                $scope.model.selectedQueueLineIndex = event.currentTarget.rowIndex - 1;

                $scope.model.edit_items = [
                    {id: '', value: $scope.model.queueTableData[$scope.model.selectedQueueLineIndex]}
                ];

                $contextMenu.css({
                    display: "block",
                    left: event.pageX,
                    top: event.pageY
                });


                return false;
            };

            // Add typed entry to queue entries
            $scope.model.addEntry = function () {
                $scope.model.entryTyped = document.getElementById("entry_input").value;
                $scope.model.queueTableData.push($scope.model.entryTyped);
                if ($scope.model.availableEntry.indexOf($scope.model.entryTyped) == -1) {
                    $scope.model.availableEntry.push($scope.model.entryTyped);
                }
                $scope.model.entryTyped = "";

                // reactivate save button
                $scope.model.updateSaveButtonStatus(true);
            };

            // Remove target element if a confirmation is given by the user
            $scope.model.remove_click = function () {
                if (confirm("Are you sure you want to remove this entry ?")) {
                    $scope.model.queueTableData.splice($scope.model.selectedQueueLineIndex, 1);
                    var elementIndex = $scope.model.queueTableData[$scope.model.selectedQueueLineIndex];
                    elementIndex = $scope.model.availableEntry.indexOf(elementIndex);
                    $scope.model.availableEntry.splice(elementIndex, 1);

                    // reactivate save button
                    $scope.model.updateSaveButtonStatus(true);
                }
            };

            // Override save method from the modal dialog
            $scope.model.edit_save_element = function (edit_items) {
                $scope.model.queueTableData[$scope.model.selectedQueueLineIndex] = edit_items[0].value;

                // reactivate save button
                $scope.model.updateSaveButtonStatus(true);
            };

            // Initializes the data from the queue
            $scope.model.initQueueData = function (firstInit) {

                $scope.model.getQueues().$promise.then(function (data) {

                    for (var queue in data) {
                        if (data[queue].name === "IncomingQueue") {
                            $scope.model.incomingQueue = data[queue];
                        }
                        else if (data[queue].name === "OutcomingQueue") {
                            $scope.model.outcomingQueue = data[queue];
                        }
                    }

                    var id = $scope.model.incomingQueue._id;


                    // Update the next button's status
                    $scope.model.updateNextStatus(firstInit);

                    $scope.model.updateSaveButtonStatus(firstInit === undefined);
                    $scope.model.updateAddEntryButtonStatus(firstInit === undefined);

                    if (firstInit === undefined) {
                        $scope.model.getNextQueueData(id).$promise.then(function (data) {

                            $scope.model.queueData = data;

                            $scope.model.inData = [];

                            $scope.model.queueTableData = [];

//                            var now = new Date();
//                            var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
//                            var date = new Date(now_utc.getTime());
                            var date = new Date(); // already UTC ddate in JSON Format...

                            $scope.model.initialDate = date;

                            //copy initial data
                            for (var i in $scope.model.queueData.data) {
                                $scope.model.inData[i] = $scope.model.queueData.data[i];
                                $scope.model.queueTableData[i] = $scope.model.queueData.data[i];
                                if ($scope.model.availableEntry.indexOf($scope.model.queueData.data[i]) == -1) {
                                    $scope.model.availableEntry.push($scope.model.queueData.data[i]);
                                }

                            }

                            // Update the next button's status
                            $scope.model.updateNextStatus(firstInit);

                            // Update the add entry button's status
                            $scope.model.updateAddEntryButtonStatus($scope.model.inData.length != 0);

                            // Get the video
                            $scope.model.video = $sce.trustAsResourceUrl(DataRoot + "/corpus/" +
                                $scope.model.queueData.id_corpus + "/media/" + $scope.model.queueData.id_medium + "/video");

                            if ($scope.model.queueData !== undefined && $scope.model.queueData.fragment !== undefined && $scope.model.queueData.fragment.start !== undefined && $scope.model.queueData.fragment.end !== undefined) {
                                $scope.model.restrict_toggle = 2;
                                $scope.model.infbndsec = $scope.model.queueData.fragment.start - $scope.model.context_size;
																if($scope.model.infbndsec < 0) {
																	$scope.model.infbndsec = 0;
																}
                                $scope.model.supbndsec = $scope.model.queueData.fragment.end + parseInt($scope.model.context_size);
																if($scope.model.supbndsec > $scope.model.fullDuration) {
																	$scope.model.supbndsec = $scope.model.fullDuration;
																}
                                $scope.model.duration = $scope.model.supbndsec - $scope.model.queueData.infbndsec;
                                $scope.model.current_time = $scope.model.queueData.fragment.start;

                            }

                        });
                    }

                });
            };

            // Event launched when click on the save button.
					$scope.model.saveQueueElement = function () {

						var id = $scope.model.outcomingQueue._id;

						$scope.model.getQueueWithId(id).$promise.then(function (data) {
							var outcomingQueue = data;

							var dataToPush = {};
							dataToPush["inData"] = {};
							dataToPush["inData"]["data"] = $scope.model.inData;
							dataToPush["inData"]["date"] = $scope.model.initialDate;
							dataToPush["outData"] = {};

//                    var now = new Date();
//                    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
//                    var date = new Date(now_utc.getTime());

							var date = new Date(); // already UTC ddate in JSON Format...

							var user = $cookieStore.get("current.user");
							var data = [];
							var modified = false;

							for (var i in $scope.model.queueTableData) {
								data[i] = $scope.model.queueTableData[i];
							}

							if($scope.model.inData.length == data.length)
							{
								for (var i in data) {
									if(data[i] != $scope.model.inData[i])
									{
										modified = true;
									}
								}
							}
							else
							{
								modified = true;
							}
							dataToPush["outData"]["date"] = date;
							dataToPush["outData"]["duration"] = date - $scope.model.initialDate;
							dataToPush["outData"]["user"] = user;
							dataToPush["outData"]["data"] = data;

							//status
							if(modified){
								dataToPush["status"] = "MODIFIED";
							}
							else {
								dataToPush["status"] = "VALIDATED";
							}

							$scope.model.queueData.data = dataToPush;

							outcomingQueue.id_list = [$scope.model.queueData];
							$scope.model.updateQueueOnServer(outcomingQueue);

							// call only if button have to be disabled
//							$scope.model.updateSaveButtonStatus(false);
						});


						console.log("save");
						$scope.model.initQueueData();
					};

            // Event launched when click on the next button
            $scope.model.nextQueueElement = function () {

								var id = $scope.model.outcomingQueue._id;

								$scope.model.getQueueWithId(id).$promise.then(function (data) {
									var outcomingQueue = data;

									var dataToPush = {};
									dataToPush["inData"] = {};
									dataToPush["inData"]["data"] = $scope.model.inData;
									dataToPush["inData"]["date"] = $scope.model.initialDate;
									dataToPush["outData"] = {};

//                    var now = new Date();
//                    var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
//                    var date = new Date(now_utc.getTime());

									var date = new Date(); // already UTC ddate in JSON Format...

									var user = $cookieStore.get("current.user");
									var data = [];
									for (var i in $scope.model.queueTableData) {
										data[i] = $scope.model.queueTableData[i];
									}
									dataToPush["outData"]["date"] = date;
									dataToPush["outData"]["duration"] = date - $scope.model.initialDate;
									dataToPush["outData"]["user"] = user;
									dataToPush["outData"]["data"] = data;

									//status
									dataToPush["status"] = "SKIP";

									$scope.model.queueData.data = dataToPush;

									outcomingQueue.id_list = [$scope.model.queueData];
									$scope.model.updateQueueOnServer(outcomingQueue);

									$scope.model.updateSaveButtonStatus(false);
								});


								console.log("skip");

                $scope.model.initQueueData();
            };

            $scope.model.updateNextStatus = function (firstInit) {

                var buttonNext = document.getElementById("buttonNext");

                if (firstInit != undefined) {
                    $scope.model.disableNext = false;
                    buttonNext.innerHTML = "Start";

                    //Also disable add entry button because nothing else to save!
                    $scope.model.updateAddEntryButtonStatus(true);
                }
                else {
                    $scope.model.disableNext = $scope.model.queueData.data == undefined;
                    buttonNext.innerHTML = "Next";
                }


                if ($scope.model.disableNext) {
                    buttonNext.setAttribute("class", "btn btn-primary disabled");

                    // also disable save button because nothing else to save!
                    $scope.model.updateSaveButtonStatus(false);

                    //Also disable add entry button because nothing else to save!
                    $scope.model.updateAddEntryButtonStatus(true);

                    // Removes all element from table
                    $scope.model.queueTableData = undefined;
                }
                else {
                    buttonNext.setAttribute("class", "btn btn-primary");


                }
            };

            $scope.model.updateSaveButtonStatus = function (activate) {
                $scope.model.disableSaveButton = !activate;

                var buttonSave = document.getElementById("buttonSave");

                if ($scope.model.disableSaveButton) {
                    // Disables save button
                    buttonSave.setAttribute("class", "btn btn-success disabled");
                }
                else {
                    buttonSave.setAttribute("class", "btn btn-success");
                }
            };

            $scope.model.updateAddEntryButtonStatus = function (activate) {
                $scope.model.disableAddEntryButton = !activate;


                var addEntryButton = document.getElementById("addEntryButton");

                if ($scope.model.disableAddEntryButton) {
                    // Disables add entry button
                    addEntryButton.setAttribute("class", "btn btn-default disabled");
                }
                else {
                    addEntryButton.setAttribute("class", "btn btn-default");
                    if ($scope.model.queueTableData == undefined) {
                        $scope.model.queueTableData = [];
                    }
                }
            };

            $scope.model.getQueues = function () {
//            get queues
                return Queue.query();
            };

            $scope.model.createNewQueue = function (queueName) {
//            create queue
                Queue.post(
                    {
                        "name": queueName
                    }
                );
            };

            $scope.model.getQueueWithId = function (queueId) {
//            get queue
                return Queue.getQueue(
                    {
                        "queueId": queueId
                    }
                );
            };

            $scope.model.updateQueueOnServer = function (queue) {
                QueuePush.update(
                    {
                        queueId: queue._id
                    },
                    // data to post
                    queue,
                    // success handling
                    function () {
                        console.log('Successfully update the annotation');
                    },
                    //error handling
                    function (error) {
                        console.log("ERROR: ");
                        console.log(error);
                    }

                );
            };

//            get the queue's next data and remove it from the queue
            $scope.model.getNextQueueData = function (id) {
                // recupere le suivant en supprimant le précédent
                return QueuePush.query(
                    {
                        "queueId": id
                    }
                );
            };


            $scope.model.createFakeQueue = function () {
                // update it on server
                // create queue
                $scope.model.createNewQueue("IncomingQueue");

                $scope.model.createNewQueue("OutcomingQueue");
            };

            $scope.model.addFakeValues = function () {

                $scope.model.getQueues().$promise.then(function (data) {

                    $scope.queues = data;

                    for (var queue in $scope.queues) {
                        if ($scope.queues[queue].name == undefined) {

                        }
                        else if ($scope.queues[queue].name === "IncomingQueue") {
                            $scope.model.incomingQueue = $scope.queues[queue];
                        }
                        else if ($scope.queues[queue].name === "OutcomingQueue") {
                            $scope.model.outcomingQueue = $scope.queues[queue];
                        }
                    }

                    var id = $scope.model.incomingQueue._id;
                    // get queue
                    $scope.model.getQueueWithId(id).$promise.then(function (data) {
                        var queue = data;

                        queue.id_list = [
                            {
															id_corpus: "52fe3fd811d4fade00007c2c",
															id_medium: "52fb4ec46ed21ede00000018",
															_id: "52fb49016ed21ede00000009",
															id_layer: "52fe3fd811d4fade00007c29",
															data: ["Rachid_M_BARKI"],
															fragment: {
																	start: 340.27,
																	end: 362.18
															},
															"context": {
																_id: "52fe49d8350185de000015ab",
																id_corpus: "52fe3fd811d4fade00007c2c",
																id_medium: "52fb4ec46ed21ede00000018"
															}
                            },
														{
															id_corpus: "52fb49016ed21ede00000009",
															id_medium: "52fb4ec46ed21ede00000018",
															_id: "52fe3fd811d4fade00007c2b",
															id_layer: "52fe3fd811d4fade00007c29",
															data: ["Olivier_TRUCHOT"],
															fragment: {
																	start: 330.21,
																	end: 340.27
															},
															"context": {
																_id: "52fe49d8350185de000015ab",
																id_corpus: "52fe3fd811d4fade00007c2c",
																id_medium: "52fb4ec46ed21ede00000018"
															}

														}

												];


                        // update it on server
                        $scope.model.updateQueueOnServer(queue);
                    });
                });
            };

//             $scope.model.createFakeQueue();
//           	$scope.model.addFakeValues();

            // reinit outcoming
//            db.queues.update({ _id: ObjectId("54085dd383950d581c8bd062") },{ $set: { queue: [] } })
            // db.queues.update({ _id: ObjectId("54085db083950d581c8bd061") },{ $set: { queue: [] } })

						$scope.$watch('model.context_size', function(newValue) {
							newValue = parseInt(newValue);
							if(isNaN(newValue)) {
								newValue = 0;
							}
							if ($scope.model.queueData !== undefined
									&& $scope.model.queueData.fragment !== undefined
									&& $scope.model.queueData.fragment.start !== undefined) {
								$scope.model.infbndsec = $scope.model.queueData.fragment.start - newValue;
								if($scope.model.infbndsec < 0) {
									$scope.model.infbndsec = 0;
								}
								$scope.model.supbndsec = $scope.model.queueData.fragment.end + newValue;
								if($scope.model.supbndsec > $scope.model.fullDuration) {
									$scope.model.supbndsec = $scope.model.fullDuration;
								}
								$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;
								if($scope.model.current_time < $scope.model.infbndsec) {
									$scope.model.current_time = $scope.model.infbndsec;
								}
								if($scope.model.current_time > $scope.model.supbndsec) {
									$scope.model.current_time = $scope.model.supbndsec;
								}
						}});

        }]);


