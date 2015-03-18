/**
 * Created by stefas on 12/03/15.
 */
angular.module('myApp.controllers')
    .controller('TestTimeLineCtrl', ['$scope',
        function ($scope) {

            'use strict';

            $scope.model = {};
            $scope.model.colScale = d3.scale.ordinal();// custom color scale

            // Example of data
            var data=[
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
                data.forEach(function(d, i)
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
                layer:[data[0], data[1], data[2]],
                label:"Layer de test"
            };
            $scope.model.layers[1] = {
                _id:1,
                layer:[data[3], data[4], data[5]],
                label:"Layer de test n°2"
            };

            // Allow the layer watch in the directive
            $scope.model.layerWatch = [$scope.model.layers[0]._id, $scope.model.layers[1]._id];

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

            $scope.setMinimalXDisplayedValue = function(value){
                $scope.model.minimalXDisplayedValue = value;
            };

            $scope.setMaximalXDisplayedValue = function(value){
                $scope.model.maximalXDisplayedValue = value;
            };

            $scope.model.toggle_play = function(save_state)
            {
//                TODO  : Handle it
            }

        }]);