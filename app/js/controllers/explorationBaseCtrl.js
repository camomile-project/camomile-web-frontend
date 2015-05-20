/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
    .controller('ExplorationBaseCtrl', ['$scope', '$http',
        'defaults', 'palette', '$controller','Session', 'camomileService',
        function ($scope, $http, defaults, palette, $controller, Session, camomileService) {


            'use strict';

            $controller('CommonCtrl',
                {
                    $scope: $scope,
                    $http: $http,
                    defaults: defaults,
                    Session: Session
                });

            console.log("ExplorationBaseCtrl");

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

            $scope.model.layers = [];

            // init color index
            var curColInd = 0;

            // IDs selected in the interface
            $scope.model.selected_corpus = undefined;
            $scope.model.selected_medium = undefined;
            $scope.model.selected_reference = undefined;
            $scope.model.selected_layer = undefined;

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
                    //var mapping = $scope.model.colScale(d);
                    var index = $scope.model.colScale.domain().indexOf(d);
                    $scope.model.colScale.domain().splice(index, 1);
                    $scope.model.colScale.domain($scope.model.colScale.domain());
                    $scope.model.colScale.range().splice(index, 1);
                    $scope.model.colScale.range($scope.model.colScale.range());
                });


            };

            // get list of corpora
            $scope.get_corpora = function () {
                    camomileService.getCorpora(function(err, data)
                    {
                        if(!err)
                        {
                            $scope.$apply(function(){
                                $scope.model.available_corpora = data;

                                $scope.model.layerWatch = [$scope.model.layers[0]._id,
                                    $scope.model.layers[1]._id,
                                    $scope.model.layers[2]._id
                                ];

                            });
                        }
                        else
                        {
                            alert(data.error);
                        }

                    });
//                    $scope.model.available_corpora = Corpus.query(function () {
//                        // initializing layerWatch after corpora are loaded
//                        // Adds empty layers as border effect
//                        $scope.model.layerWatch = [$scope.model.layers[0]._id,
//                            $scope.model.layers[1]._id,
//                            $scope.model.layers[2]._id
//                        ];
//                    });

            };

            // get list of media for a given corpus
            $scope.get_media = function (corpus_id) {
//                $scope.model.available_media = Media.query({
//                    corpusId: corpus_id
//                }, function () {
//                });
//                Camomile.setURL($rootScope.dataroot);
                camomileService.getMedia(
                    function(err, data)
                    {
                        if(!err)
                        {
                            $scope.$apply(function()
                            {
                                $scope.model.available_media = data;
                            });
                        }
                        else
                        {
                            alert(data.error);
                        }

                    },
                    // Filter over corpus_id
                    {filter:{id_corpus:corpus_id}});
            };

            // get list of layers for a given medium
            $scope.get_layers = function (corpusId) {
//                $scope.model.available_layers = Layer.query({
//                    corpusId: corpusId
//                });
//                Camomile.setURL($rootScope.dataroot);
                camomileService.getLayers(
                    // The callback
                    function(err, data)
                    {
                        if(!err)
                        {
                            $scope.$apply(function()
                            {
                                $scope.model.available_layers = data;
                            });
                        }
                        else
                        {
                            alert(data.error);
                        }

                    },
                    // Filter over corpus_id
                    {filter:{id_corpus:corpusId}});
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

            $scope.clickOnASummaryViewSlice = function (sliceId) {
                if ($scope.model.selected_slice == sliceId) {
                    $scope.model.selected_slice = -1;
                }
                else {
                    $scope.model.selected_slice = sliceId;
                }
            };

            // Method used to compute slices of the piechart.
            $scope.computeSlices = function () {

                $scope.updateColorScale();

                $scope.model.slices = [];
                if ($scope.model.selected_layer !== undefined) {
                    var data = $scope.model.layers[$scope.model.selected_layer];

                    data.layer.forEach(function (d) {

                        var addElement = true;
                        if ((d.fragment.end <= $scope.model.xMsScale.domain()[1] && d.fragment.end >= $scope.model.xMsScale.domain()[0])
                            || (d.fragment.start <= $scope.model.xMsScale.domain()[1] && d.fragment.start >= $scope.model.xMsScale.domain()[0])
                            || (($scope.model.xMsScale.domain()[1] <= d.fragment.end && $scope.model.xMsScale.domain()[1] >= d.fragment.start)
                            || ($scope.model.xMsScale.domain()[0] <= d.fragment.end && $scope.model.xMsScale.domain()[0] >= d.fragment.start))) {

                            for (var i = 0, max = $scope.model.slices.length; i < max; i++) {
                                if ($scope.model.slices[i].element == data.mapping.getKey(d)) {
                                    addElement = false;
                                    $scope.model.slices[i].spokenTime += (d.fragment.end - d.fragment.start);
                                }
                            }

                            if (addElement) {
                                $scope.model.slices.push({"element": data.mapping.getKey(d), "spokenTime": (d.fragment.end - d.fragment.start)});
                            }
                        }
                    });
                }

                // Sort them (descending) in order to keep indexes correct
                $scope.model.slices.sort(function (a, b) {
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
//                var annotation_edited = AnnotationUpdater.queryForAnUpdate({
//                    annotationId: annotation_id
//                });

//                Camomile.setURL($rootScope.dataroot);
                camomileService.getAnnotation(annotation_id, function(err, data)
                {
                    if(!err)
                    {
                        $scope.$apply(function()
                        {
                            var annotation_edited;

                            annotation_edited = data;

                            // replace its data by the new one
                            annotation_edited.data = newValue;

                            // update it on server
                            camomileService.updateAnnotation(annotation_id, annotation_edited, function(err, data)
                            {
                                if(!err)
                                {
                                    $scope.$apply(function()
                                    {
                                        if(data) {
                                            console.log('Successfully update the annotation');
                                        }
                                        //error handling
                                        else if (error) {
                                            console.log("ERROR: ");
                                            console.log(error);
                                        }
                                    });
                                }
                                else
                                {
                                    alert(data.error);
                                }

                            });
                        });
                    }
                    else
                    {
                        alert(data.error);
                    }

                });


//                // replace its data by the new one
//                annotation_edited.data = newValue;
//
//                // update it on server
//                AnnotationUpdater.update(
//                    // update parameters
//                    {
//                        annotationId: annotation_id
//                    },
//                    // data to post
//                    annotation_edited,
//                    // success handling
//                    function () {
//                        console.log('Successfully update the annotation');
//                    },
//                    //error handling
//                    function (error) {
//                        console.log("ERROR: ");
//                        console.log(error);
//                    });

            };

            // Method that removes an annotation
            $scope.remove_annotation = function (corpus_id, medium_id, layer_id, annotation_id) {

                // call the native remove method
//                AnnotationUpdater.remove({
////						corpusId: corpus_id,
//                        media: medium_id,
//                        layerId: layer_id,
//                        annotationId: annotation_id
//                    },
//                    function () {
//                        console.log('Successfully remove the annotation')
//                    });

//                Camomile.setURL($rootScope.dataroot);
                camomileService.deleteAnnotation(annotation_id, function(err, data)
                {
                    if(!err)
                    {
                        $scope.$apply(function()
                        {
                            if(data)
                            {
                                console.log('Successfully remove the annotation');
                            }
                            else if(err)
                            {
                                console.log('Error while trying to remove the annotation')
                            }
                        });
                    }
                    else
                    {
                        alert(data.error);
                    }

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

//                    if ($scope.model.update_SummaryView > 3) {
//                        $scope.model.update_SummaryView = 0;
//                    }
//                    else {
//                        $scope.model.update_SummaryView++;
//                    }
                    $scope.computeSlices();
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

            $scope.computeLastLayer = function () {
                // TODO replace this in children controller;
            };

            // only one has to be watch cause both change at the same time
            $scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
                if (newValue && $scope.model.selected_layer != -1 && $scope.model.selected_layer != undefined) {
                    $scope.computeSlices();
                }

            }, true);

            $scope.$watch('model.selected_layer', function (newValue) {
                if (newValue != null && newValue != "" && newValue != undefined) {

                    var layer = $scope.model.layers[$scope.model.selected_layer];
                    $scope.model.maximalXDisplayedValue = layer.layer[layer.layer.length-1].fragment.end;

                    $scope.model.minimalXDisplayedValue = layer.layer[0].fragment.start;

                   $scope.computeSlices();
                }
            });

        }]);