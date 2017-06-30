/**
 * Created by stefas on 04/03/15.
 * This directive is here to create a legend for views. It have to be linked to a controller containing at least:
 *      scope.model : an object
 *      scope.model.slices : an array containing each element of the legend
 *      Each slice of scope.model.slices must contain 2 things: element (the label) and spokenTime (the value)
 *      scope.model.colScale : a color scale (which has to be initialised in the Ctrl)
 *      scope.clickOnASummaryViewSlice(i) : function defining what to do when an element is clicked
 *
 * If you plan to implement the same version as visible on the front-end, just import commonCtrl.js and
 * explorationBaseCtrl.js. All elements listed on top are in explorationBaseCtrl.js and have to be modified the way you want.
 */
angular.module('myApp.directives')
    .directive("cmLegend", [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg id="legend"></svg>',
            link: function (scope) {


                var updateLegend = function () {

                    if(scope.model.slices != undefined && scope.model.slices.length > 0)
                    {
                        var maxLength = d3.max(scope.model.slices, function (d) {
                            return parseInt(d.element.length);
                        });

                        var rectHeight = 20,
                            rectWidth = 20,
                            legendMargin = 4,
                            legendWidth = 16 * (maxLength ? maxLength : 0) + rectWidth + 4 * legendMargin,
                            legendHeight = (rectHeight + legendMargin) * scope.model.slices.length;

                        //Create the SVG Viewport
                        var svgContainer = d3.select("#legend");

                        // Vire les anciens graphs
                        var oldGraph = svgContainer.selectAll("rect");
                        if (oldGraph) {
                            oldGraph.remove();
                        }

                        oldGraph = svgContainer.selectAll("text");
                        if (oldGraph) {
                            oldGraph.remove();
                        }


//                        svgContainer.style("float", "right");

                        var svg = svgContainer.attr("width", legendWidth + "px")
                            .attr("height", legendHeight + "px");

                        //Add rectangles to the svgContainer
                        var coloredRectangles = svg.selectAll("rect")
                            .data(scope.model.slices)
                            .enter()
                            .append("rect");

                        //Add the rectangle attributes
                        coloredRectangles
                            .attr("x", 10)
                            .attr("y", function (d, i) {
                                return rectHeight * (i) + i * legendMargin;
                            })
                            .on("click", function (d, i) {
                                scope.$apply(function () {
                                    scope.clickOnASummaryViewSlice(i);
                                });
                            })
                            .attr("class", "legend")
                            .attr("width", rectWidth)
                            .attr("height", rectHeight)
                            .style("fill", function (d, i) {
                                if (i == scope.model.selected_slice) {
                                    return scope.model.colScale("selection_color");
                                }
                                else {
                                    return scope.model.colScale(d.element);
                                }
                            })
                            .style("opacity", function (d, i) {
//                                if (i == scope.model.selected_slice) {
//                                    return 1;
//                                }
//                                else {
//                                    return 0.4;
//                                }
                                return 1;
                            })
                            .style("stroke", "black");   //allow us to style things in the slices (like text);

                        //Add the SVG Text Element to the svgContainer
                        var text = svg.selectAll("text")
                            .data(scope.model.slices)
                            .enter()
                            .append("text");

                        //Add SVG Text Element Attributes
                        text.attr("x", rectWidth + 20)
                            .attr("y", function (d, i) {
                                return rectHeight * (i + 1) + i * legendMargin - 5;
                            })
                            .text(function (d, i) {
                                return scope.model.slices[i].element + '   (' + parseInt(scope.model.slices[i].spokenTime).toFixed(0) + 's)';
                            })
                            .attr("font-family", "sans-serif")
                            .attr("font-size", function (d, i) {
                                if (i == scope.model.selected_slice) {
                                    return "18px";
                                }
                                else {
                                    return "16px";
                                }
                            })
                            .attr("fill", function (d, i) {
                                if (i == scope.model.selected_slice) {
                                    return scope.model.colScale("selection_color");
                                }
                                else {
                                    return "black";
                                }
                            });
                    }};

//                scope.$watch('model.selected_layer', function (newValue) {
//                    if (newValue != null && newValue != "" && newValue != -1) {
//                        scope.model.selected_slice = -1;
//                        scope.updateLegend();
//                    }
//                });
//
//                scope.$watch('model.update_SummaryView', function () {
//                    scope.updateLegend();
//                }, true);
//
//                // only one has to be watch cause both change at the same time
//                scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
//                    if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
//                        scope.updateLegend();
//                    }
//
//                });
//
//                scope.$watch('model.selected_slice', function (newValue) {
//                    if (newValue != undefined) {
//                        scope.updateLegend();
//                    }
//                });

                scope.$watch('model.selected_slice', function (newValue) {
                    if (newValue != undefined) {
                        updateLegend();
                    }
                });

                // Update it whenever slices are modified
                scope.$watch('model.slices', function (newValue) {
                    if(newValue)
                    {
                        updateLegend();
                    }
                });
            }
        }
    }]);
