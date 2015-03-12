/**
 * Created by stefas on 12/03/15.
 */
angular.module('myApp.controllers')
    .controller('TestSummaryViewsCtrl', ['$scope',
        function ($scope) {

            'use strict';

            $scope.model = {};
            $scope.model.slices=[];
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
                // Warning!!!!!! It's a MAP, so no element repetition allowed
                $scope.model.slices.forEach(function(d, i)
                {
                    $scope.model.colScale.domain().push(d.element);
                    $scope.model.colScale.range().push(colors[i]);
                });

                var selected_element_color = '#ff0000'; // RED
                $scope.model.colScale.domain().push('selection_color');
                $scope.model.colScale.range().push(selected_element_color);
            };

            // Whet to do when a slice is clicked
            $scope.clickOnASummaryViewSlice = function (sliceId) {
                if ($scope.model.selected_slice == sliceId) {
                    $scope.model.selected_slice = -1;
                }
                else {
                    $scope.model.selected_slice = sliceId;
                }
            };

            // Compute data
            var computeSlices = function()
            {

                data.forEach(function(d)
                {

                    var addElement = true;
                    if ((d.fragment.end <= 0 && d.fragment.end >= 18)
                        || (d.fragment.start <= 18 && d.fragment.start >= 0)
                        || ((18 <= d.fragment.end && 18 >= d.fragment.start)
                        || (0 <= d.fragment.end && 0 >= d.fragment.start))) {

                        for (var i = 0, max = $scope.model.slices.length; i < max; i++) {
                            if ($scope.model.slices[i].element == d.data) {
                                addElement = false;
                                $scope.model.slices[i].spokenTime += (d.fragment.end - d.fragment.start);
                            }
                        }

                        if (addElement) {
                            $scope.model.slices.push({"element": d.data, "spokenTime": (d.fragment.end - d.fragment.start)});
                        }
                    }
                });

                $scope.updateColorScale();

                $scope.model.slices.sort(function (a, b) {
                    return (b.spokenTime - a.spokenTime);
                });
            };

            computeSlices();

        }]);