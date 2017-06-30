/**
 * Created by stefas on 07/12/15.
 */
angular.module('myApp.controllers')
    .controller('AnalyseCommonCtrl', ['$scope','camomileService', '$sce',
        function ($scope, camomileService, $sce) {

            $scope.model = {};
            $scope.model.overviewReferenceData = [];
            $scope.model.annotationReferenceData = {};

            $scope.model.firstLoad = true;

            $scope.model.selected_reference = undefined;
            $scope.model.selected_hypothesis = undefined;

            $scope.model.available_layers = [];

            var useDefaultVideoPath = Cookies.get("use.default.video.path");
            // Test the string value also, cause Cookie store a string, not a boolean
            if(useDefaultVideoPath === undefined || useDefaultVideoPath === 'true' || useDefaultVideoPath == true)
            {
                useDefaultVideoPath = true;
            }
            else
            {
                useDefaultVideoPath = false;
            }

            var videoPath = Cookies.get("video.path") || "";

            $scope.model.useDefaultVideoPath = useDefaultVideoPath;
            $scope.model.videoPath = videoPath;


            // true when initialisation is finished
            $scope.model.initialisationCompleted = false;

            // true or false depending the part to display
            $scope.model.overviewIsDisplayed = false;
            $scope.model.detailIsDisplayed = false;

            // store the selected element
            $scope.model.selectedElement = undefined;

            // proceed click, will simply lead to the detail "page"
            $scope.proceed = function(){
                $scope.model.detailIsDisplayed = true;
                $scope.model.overviewIsDisplayed = false;

            };

            // go back click, will simply lead to the overview "page"
            $scope.goBack = function(){
                $scope.model.detailIsDisplayed = false;
                $scope.model.overviewIsDisplayed = true;

                $scope.resetAnnotationData();

            };

            $scope.resetAnnotationData = function()
            {
                // unselect previous element
                if($scope.model.selected_medium_distribution != undefined)
                {
                    $scope.model.selected_medium_distribution = undefined;
                }
            };

            $scope.model.colScale = d3.scale.ordinal();// custom color scale

            // Example of data
            $scope.model.annotationReferenceData=[
                {fragment:{ start: 0, end:1}, data:'Element_1'},
                { fragment:{ start: 1, end:2}, data:'Element_2'},
                {fragment:{ start: 2, end:5}, data:'Element_3'},
                {fragment:{ start: 1, end:3}, data:'Element_4'},
                {fragment:{ start: 4, end:8}, data:'Element_5'},
                {fragment:{ start: 9, end:11}, data:'Element_3'},
                {fragment:{ start: 12, end:13}, data:'Element_4'}


            ];

            // List of the colors you want given as example
            var colors = ["#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#A65628", "#F781BF", "#66C2A5",
                "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#E5C494", "#8DD3C7", "#FFFFB3", "#BEBADA",
                "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5",
                "#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC",
                "#F2F2F2", "#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC",
                "#CCCCCC"];

            // Init color map
            $scope.updateColorScale = function(){
                $scope.model.annotationReferenceData.forEach(function(d, i)
                {
                    $scope.model.colScale.domain().push(d);
                    $scope.model.colScale.range().push(colors[i]);
                });

                var selected_element_color = '#ff0000'; // RED
                $scope.model.colScale.domain().push('selection_color');
                $scope.model.colScale.range().push(selected_element_color);
            };

            $scope.model.layers = [];
            $scope.model.current_time = 0;

            $scope.model.layers[0] = {
                _id:0,
                layer:[],
                label:"Layer de test"
            };

            // Allow the layer watch in the directive
            $scope.model.layerWatch = [$scope.model.layers[0]._id];

            var vals;
            var newVals = [];
            var oldVals = $scope.model.colScale.domain();
            var newMaps = {
                keys: [],
                maps: []
            };

            var initLayers = function(){
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
            };

            $scope.initAvailableLayers = function()
            {
                camomileService.getLayers(function(err, data){
                    $scope.$apply(function(){
                        $scope.model.available_layers = data;
                    })
                });
            };

            $scope.initialiseData=function(){

                camomileService.getAnnotations(function(err, data){

                    $scope.$apply(function(){
                        var maxDuration = 0, maxF = 0, maxB = 0, maxA = 0, mediumIds =[];
                        $scope.model.overviewReferenceData = [];
                        $scope.model.annotationsData = {};
                        var speakerMap = {};
                        var annotation,speaker_name, duration, medium, a, b, f;
                        for(var i = 0, maxI = data.length;i<maxI;i++)
                        {
                            annotation = data[i];
                            speaker_name = annotation.data;
                            medium = annotation.id_medium;

                            if(mediumIds.indexOf(medium) == undefined)
                            {
                                mediumIds.push(mediumIds);
                            }
                            duration = annotation.fragment.end - annotation.fragment.start;

                            // TODO : These are placeholder values, for test only!
                            a = Math.random();
                            b = Math.random();
                            f = Math.random();

                            if(speakerMap[speaker_name] != undefined)
                            {
                                // Stores annotations for this medium. Used to make layers
                                if(speakerMap[speaker_name].annotations[medium] == undefined){
                                    speakerMap[speaker_name].annotations[medium] = [annotation];
                                }
                                else
                                {
                                    speakerMap[speaker_name].annotations[medium].push(annotation);
                                }

                                // Stores medium list for actual speaker
                                if(speakerMap[speaker_name].media_list.indexOf(medium) == -1)
                                {
                                    speakerMap[speaker_name].media_list.push(medium);

                                    // TODO to be defined
                                    speakerMap[speaker_name].media_color.push('lightblue');
                                }

                                // Stores total metrics for actual speaker
                                speakerMap[speaker_name].duration += duration;
                                speakerMap[speaker_name].Nothing += 1;
                                speakerMap[speaker_name].A += a;
                                speakerMap[speaker_name].B += b;
                                speakerMap[speaker_name].F += f;

                                // Computes maximum value for metrics
                                maxA = Math.max(maxA, speakerMap[speaker_name].A);
                                maxB = Math.max(maxB, speakerMap[speaker_name].B);
                                maxF = Math.max(maxF, speakerMap[speaker_name].F);
                                maxDuration = Math.max(maxDuration, speakerMap[speaker_name].duration);

                                if(speakerMap[speaker_name].media_metrics[medium] != undefined)
                                {
                                    // Stores total value for this medium and this speaker
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.duration += duration;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.Nothing = 1;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.A += a;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.B += b;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.F += f;

                                    // Stores metric values for this medium and this speaker
                                    speakerMap[speaker_name].media_metrics[medium].durations.push(duration);
                                    speakerMap[speaker_name].media_metrics[medium].A.push(a);
                                    speakerMap[speaker_name].media_metrics[medium].B.push(b);
                                    speakerMap[speaker_name].media_metrics[medium].F.push(f);
                                    speakerMap[speaker_name].media_metrics[medium].Nothing.push(1);

                                    // Stores maximum total value for this speaker over all medium
                                    speakerMap[speaker_name].media_metrics.media_max_value.duration = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.duration, speakerMap[speaker_name].media_metrics[medium].totalValues.duration);
                                    speakerMap[speaker_name].media_metrics.media_max_value.A = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.A, speakerMap[speaker_name].media_metrics[medium].totalValues.A);
                                    speakerMap[speaker_name].media_metrics.media_max_value.B = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.B, speakerMap[speaker_name].media_metrics[medium].totalValues.B);
                                    speakerMap[speaker_name].media_metrics.media_max_value.F = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.F, speakerMap[speaker_name].media_metrics[medium].totalValues.F);
                                    speakerMap[speaker_name].media_metrics.media_max_value.Nothing = 1;
                                }
                                else
                                {
                                    // Stores total value for this medium and this speaker
                                    speakerMap[speaker_name].media_metrics[medium] = {};
                                    speakerMap[speaker_name].media_metrics[medium].totalValues = {};
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.duration = duration;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.A = a;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.B = b;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.F = f;
                                    speakerMap[speaker_name].media_metrics[medium].totalValues.Nothing = 1;

                                    // Stores metric values for this medium and this speaker
                                    speakerMap[speaker_name].media_metrics[medium].durations = [duration];
                                    speakerMap[speaker_name].media_metrics[medium].A = [a];
                                    speakerMap[speaker_name].media_metrics[medium].B = [b];
                                    speakerMap[speaker_name].media_metrics[medium].F = [f];
                                    speakerMap[speaker_name].media_metrics[medium].Nothing= [1];

                                    // Stores maximum total value for this speaker over all medium
                                    speakerMap[speaker_name].media_metrics.media_max_value.duration = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.duration, speakerMap[speaker_name].media_metrics[medium].totalValues.duration);
                                    speakerMap[speaker_name].media_metrics.media_max_value.A = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.A, speakerMap[speaker_name].media_metrics[medium].totalValues.A);
                                    speakerMap[speaker_name].media_metrics.media_max_value.B = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.B, speakerMap[speaker_name].media_metrics[medium].totalValues.B);
                                    speakerMap[speaker_name].media_metrics.media_max_value.F = Math.max(speakerMap[speaker_name].media_metrics.media_max_value.F, speakerMap[speaker_name].media_metrics[medium].totalValues.F);
                                    speakerMap[speaker_name].media_metrics.media_max_value.Nothing = 1;
                                }
                            }
                            else
                            {
                                speakerMap[speaker_name] = {};

                                // Stores annotations for this medium. Used to make layers
                                speakerMap[speaker_name].annotations = [];
                                speakerMap[speaker_name].annotations[medium] = [annotation];

                                // Initializes total metrics for actual speaker
                                speakerMap[speaker_name].duration = duration;
                                speakerMap[speaker_name].Nothing = 1;
                                speakerMap[speaker_name].A = a;
                                speakerMap[speaker_name].B = b;
                                speakerMap[speaker_name].F = f;

                                // Initializes medium list for actual speaker
                                speakerMap[speaker_name].media_list = [medium];

                                // TODO to be defined
                                speakerMap[speaker_name].media_color = ['lightblue'];

                                speakerMap[speaker_name].media_metrics = {};
                                speakerMap[speaker_name].media_metrics[medium] = {};

                                // Stores total values for this medium and this speaker
                                speakerMap[speaker_name].media_metrics[medium].totalValues = {}
                                speakerMap[speaker_name].media_metrics[medium].totalValues.duration = duration;
                                speakerMap[speaker_name].media_metrics[medium].totalValues.A = a;
                                speakerMap[speaker_name].media_metrics[medium].totalValues.B = b;
                                speakerMap[speaker_name].media_metrics[medium].totalValues.F = f;
                                speakerMap[speaker_name].media_metrics[medium].totalValues.Nothing = 1;

                                // Stores metric values for this medium and this speaker
                                speakerMap[speaker_name].media_metrics[medium].durations = [duration];
                                speakerMap[speaker_name].media_metrics[medium].A = [a];
                                speakerMap[speaker_name].media_metrics[medium].B = [b];
                                speakerMap[speaker_name].media_metrics[medium].F = [f];
                                speakerMap[speaker_name].media_metrics[medium].Nothing = [1];

                                // Stores maximum total value for this speaker over all medium
                                speakerMap[speaker_name].media_metrics.media_max_value = {};
                                speakerMap[speaker_name].media_metrics.media_max_value.duration = speakerMap[speaker_name].media_metrics[medium].totalValues.duration;
                                speakerMap[speaker_name].media_metrics.media_max_value.A = speakerMap[speaker_name].media_metrics[medium].totalValues.A;
                                speakerMap[speaker_name].media_metrics.media_max_value.B = speakerMap[speaker_name].media_metrics[medium].totalValues.B;
                                speakerMap[speaker_name].media_metrics.media_max_value.F = speakerMap[speaker_name].media_metrics[medium].totalValues.F;
                                speakerMap[speaker_name].media_metrics.media_max_value.Nothing = 1;
                            }


                        }

                        var keys = Object.keys(speakerMap);
                        for(var j = 0, maxJ = keys.length;j<maxJ;j++)
                        {
                            speaker_name = keys[j];
                            $scope.model.overviewReferenceData.push(
                                {
                                    // simple identifier, as a number
                                    'id':j,
                                    // the speaker's name
                                    "name": speaker_name,
                                    // Total for each metric, for each speaker, over all medium
                                    "totalMetrics":{
                                        'Nothing':1.0,
                                        'F':speakerMap[speaker_name].F,
                                        'A':speakerMap[speaker_name].A,
                                        'B':speakerMap[speaker_name].B,
                                        'duration': speakerMap[speaker_name].duration
                                    },
                                    // List of medium id
                                    'media' : speakerMap[speaker_name].media_list,
                                    // Color for the relative bar representing speaker
                                    'media_color' : speakerMap[speaker_name].media_color,
                                    // Maximum value of total for each metric, over all medium and speaker
                                    'maxTotalMetricValue': {
                                        'Nothing':1,
                                        'A': maxA,
                                        'B':maxB,
                                        'F':maxF,
                                        'duration':maxDuration
                                    },
                                    // All metrics values for all medium/speaker
                                    'media_metrics': speakerMap[speaker_name].media_metrics,
                                    // List of media name. will be filled later
                                    'mediaNames': [],
                                    // Image relative to the speeaker... TODO: HAVE TO BE DONE!
                                    'image' : "data:image/jpeg;base64,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"
                                }
                            );

                            if($scope.model.annotationsData[speaker_name] == undefined)
                            {
                                $scope.model.annotationsData[speaker_name] = {};
                            }
                            $scope.model.annotationsData[speaker_name] = speakerMap[speaker_name].annotations;


                            $scope.model.initialisationCompleted = true;
                            $scope.model.overviewIsDisplayed = true;
                            $scope.model.displayInitialisationMessage = false;
                        }
                    });

                }, {filter:{id_layer:$scope.model.selected_reference}});
            };

            $scope.updateAnnotationData = function(name, medium_id){
                $scope.model.annotationReferenceData = $scope.model.annotationsData[name][medium_id];

                var layers = [];
                for(var i = 0, maxI = $scope.model.annotationReferenceData.length; i< maxI; i++)
                {
                    layers.push($scope.model.annotationReferenceData[i]);
                }

                $scope.model.layers[0] = {
                    _id:0,
                    layer:layers,
                    label:"speech distribution"
                };

                initLayers();
            };

            $scope.setMinimalXDisplayedValue = function(value){
                $scope.model.minimalXDisplayedValue = value;
            };

            $scope.setMaximalXDisplayedValue = function(value){
                $scope.model.maximalXDisplayedValue = value;
            };

            $scope.initAvailableLayers();

            $scope.$watch('model.selected_medium', function (newValue, oldValue, scope) {
                if (newValue) {

                    if(scope.model.useDefaultVideoPath) {
                        scope.model.video = $sce.trustAsResourceUrl(camomileService.getMediumURL(scope.model.selected_medium, 'webm'));
                    }
                    else {
                        camomileService.getMedium(scope.model.selected_medium, function(err, data) {
                            $scope.$apply(function(){
                                scope.model.video = $sce.trustAsResourceUrl(scope.model.videoPath+ '/' + data.url +'.webm');
                            });
                        });
                    }

                }
            });

            $scope.$watch('model.selected_reference', function(newValue){
                if(newValue){
                    $scope.model.initialisationCompleted = false;
                    $scope.model.overviewIsDisplayed = false;
                    $scope.model.displayInitialisationMessage = true;
                    $scope.model.detailIsDisplayed = false;
                    $scope.model.selected_medium_distribution = undefined;
                    $scope.model.selectedElement = undefined;
                    $scope.initialiseData();
                }
            });

        }]);