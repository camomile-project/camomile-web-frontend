/**
 * Created by stefas on 04/03/15.
 *
 * This directive is here to create a barchart view. It have to be linked to a controller containing at least:
 *      scope.model : an object
 *      scope.model.slices : an array containing each element of the barchart
 *      Each slice of scope.model.slices must contain 2 things: element (the label) and spokenTime (the value)
 *      scope.model.colScale : a color scale (which has to be initialised in the Ctrl)
 *      scope.clickOnASummaryViewSlice(i) : function defining what to do when an element is clicked
 *
 * If you plan to implement the same version as visible on the front-end, just import commonCtrl.js and
 * explorationBaseCtrl.js. All elements listed on top are in explorationBaseCtrl.js and have to be modified the way you want.
 *
 */
// TODO: now default opacity is 1.0 with mix-blend-mode set to multiply - adjust summary views consistently
angular.module('myApp.directives')
    .directive('cmBarchart', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg id="barchart"></svg>',
            link: function (scope) {

                var updateBarChart = function () {

                    if(scope.model.slices != undefined && scope.model.slices.length > 0)
                    {
                        var rectHeight = 20,
                            legendMargin = 4, w = 500,                            // width
                            h = (rectHeight + legendMargin) * scope.model.slices.length, // height
                            sum = d3.sum(scope.model.slices, function (d) {
                                return parseInt(d.spokenTime);
                            }),
                            max = d3.max(scope.model.slices, function (d) {
                                return parseInt(d.spokenTime);
                            });

                        // Get the correct svg tag to append the chart
                        var vis = d3.select("#barchart").attr("width", w).attr("height", h);


                        // Remove old existing chart
                        var oldGraph = vis.selectAll("g");
                        if (oldGraph) {
                            oldGraph.remove();
                        }

                        // Remove old existing tooltips
                        var detailedView = d3.select("#detailedView");
                        var oldTooltip = detailedView.selectAll("div.tooltip");
                        if (oldTooltip) {
                            oldTooltip.remove();
                        }

                        // add a div used to display a tooltip
                        var div = detailedView.append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0);

                        vis = vis
                            .append("g")              //create the SVG element inside the <body>
                            .data([scope.model.slices])                   //associate our data with the document
                            .attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
                            .attr("height", h + "px")
                            .append("g");                //make a group to hold our pie chart

                        vis.selectAll("g.barchart-bar")
                            .data(scope.model.slices)
                            .enter().append("rect")
                            .attr("class", "barchart-bar")
                            .attr("fill", function (d, i) {
                                if (i == scope.model.selected_slice) {
                                    return scope.model.colScale("selection_color");
                                }
                                else {
                                    return scope.model.colScale(scope.model.slices[i].element);
                                }
                            })
                            .attr("x", "4px")
                            .attr("y", function (d, i) {
                                return rectHeight * (i) + i * legendMargin + 5;
                            })
                            .attr("width", function (d, i) {
                                return Math.floor(Math.max(scope.model.slices[i].spokenTime / max * (w - 14 - legendMargin), 3));
                            })
                            .attr("height", "15px")
                            .style("opacity", function (d, i) {
//                                if (i == scope.model.selected_slice) {
//                                    return 1;
//                                }
//                                else {
//                                    return 0.4;
//                                }
                                return 1;
                            })
                            .style("stroke", "black")
                            .on("mouseover", function (d, i) {
                                var bodyElt = $("body")[0];
                                var coords = d3.mouse(bodyElt);
                                div.transition()
                                    .duration(200)
                                    .style("opacity", 1);
                                div.html(scope.model.slices[i].element + '<br/>' + 'Duration: ' + Math.floor(scope.model.slices[i].spokenTime / sum * 100) + "%")
                                    .style("left", (coords[0]) + "px")
                                    .style("top", (coords[1] - 18) + "px");
                            })
                            .on("mouseout", function (d, i) {
                                div.transition()
                                    .duration(200)
                                    .attr("dy", ".3em")
                                    .style("opacity", 0)
                                    .style("width", (scope.model.slices[i].element * 10));
                            })
                            .on("click", function (d, i) {
                                scope.$apply(function () {
                                    scope.clickOnASummaryViewSlice(i);
                                });
                            }); //allow us to style things in the slices (like text);
                    }};

                scope.$watch('model.selected_slice', function (newValue) {
                    if (newValue != undefined) {
                        updateBarChart();
                    }
                });

                // Update it whenever slices are modified
                scope.$watch('model.slices', function (newValue) {
                    if(newValue)
                    {
                        updateBarChart();
                    }
                });
            }
        };
    }]);
