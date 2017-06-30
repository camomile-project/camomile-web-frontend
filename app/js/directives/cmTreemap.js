/**
 * Created by stefas on 04/03/15.
 * This directive is here to create a treemap view. It have to be linked to a controller containing at least:
 *      scope.model : an object
 *      scope.model.slices : an array containing each element of the treemap
 *      Each slice of scope.model.slices must contain 2 things: element (the label) and spokenTime (the value)
 *      scope.model.colScale : a color scale (which has to be initialised in the Ctrl)
 *      scope.clickOnASummaryViewSlice(i) : function defining what to do when an element is clicked
 *
 * If you plan to implement the same version as visible on the front-end, just import commonCtrl.js and
 * explorationBaseCtrl.js. All elements listed on top are in explorationBaseCtrl.js and have to be modified the way you want.
 */
angular.module('myApp.directives')
    .directive('cmTreemap', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg id="treemap"></svg>',
            link: function (scope) {

                var updateTreeMap = function () {

                    if(scope.model.slices != undefined && scope.model.slices.length > 0)
                    {
                        var w = 500,                            // width
                            h = 500,                            // height
                            sum = d3.sum(scope.model.slices, function (d) {
                                return parseInt(d.spokenTime);
                            });

                        // Get the correct svg tag to append the chart
                        var vis = d3.select("#treemap")
                            .attr("width", w)
                            .attr("height", h);


                        // Remove old existing piechart
                        var oldGraph = vis.selectAll("g");
                        if (oldGraph) {
                            oldGraph.remove();
                        }

                        // Remove old existing tooltips
                        var detailedView = d3.select("#detailedView");
                        var oldTooltip = detailedView.selectAll("div.treeemaptooltip");
                        if (oldTooltip) {
                            oldTooltip.remove();
                        }

                        // add a div used to display a tooltip
                        var div = detailedView.append("div")
                            .attr("class", "treeemaptooltip")
                            .style("opacity", 0);

                        var slices = {children: scope.model.slices};

                        vis = vis
                            .append("g")
                            .attr("x", "4")
                            .attr("y", "4")
                            .attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
                            .attr("height", h + "px")
                            .append("g");

                        // make the treemap layout
                        var treemap = d3.layout.treemap()
                            .size([w, h])
                            .sticky(true)
                            .value(function (d) {
                                return d.spokenTime;
                            });


                        // make cells for each cause
                        var node = vis.datum(slices).selectAll(".node").append("g");
                        node.data(treemap.nodes)
                            .enter().append("rect")
                            .attr("class", "node")
                            .call(position)
                            .style("stroke", function (d) {
                                if (d.children) {
                                    return "white";
                                }
                                else {
                                    return "black";
                                }
                            })
                            .style("fill", function (d, i) {
                                if (d.children || i === 0) {
                                    return "white";
                                }
                                else if (i - 1 == scope.model.selected_slice) {
                                    return scope.model.colScale("selection_color");
                                }
                                else {
                                    return scope.model.colScale(slices.children[i - 1].element); //'blue';
                                }
                            })
                            .style("opacity", function (d, i) {
//                                if (i - 1 == scope.model.selected_slice) {
//                                    return 1;
//                                }
//                                else {
//                                    return 0.4;
//                                }
                                return 1;
                            })
                            .on("mouseover", function (d, i) {
                                if (!d.children) {
                                    var bodyElt = $("body")[0];
                                    var coords = d3.mouse(bodyElt);
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", 1);
                                    div.html(scope.model.slices[i - 1].element + '<br/>' + 'Duration: ' + Math.floor(scope.model.slices[i - 1].spokenTime / sum * 100) + "%")
                                        .style("left", (coords[0]) + "px")
                                        .style("top", (coords[1] - 18) + "px");
                                }
                            })
                            .on("mouseout", function (d, i) {
                                if (!d.children) {
                                    div.transition()
                                        .duration(200)
                                        .attr("dy", ".3em")
                                        .style("opacity", 0)
                                        .style("width", (scope.model.slices[i - 1].element * 10));
                                }
                            })
                            .on("click", function (d, i) {
                                scope.$apply(function () {
                                    scope.clickOnASummaryViewSlice(i - 1);
                                });
                            });


//                    node.data(treemap.nodes)
//                        .enter().append("text").text(function (d) {
//                            return  d.element;
//                        }).call(positionText);

                        function position() {
                            this.attr("x", function (d) {
                                return d.x + "px";
                            })
                                .attr("y", function (d) {
                                    return (d.y + 3) + "px";
                                })
                                .attr("width", function (d) {
                                    return Math.max(0, d.dx - 5) + "px";
                                })
                                .attr("height", function (d) {
                                    return Math.max(0, d.dy - 5) + "px";
                                });
                        }
                    }};

                scope.$watch('model.selected_slice', function (newValue) {
                    if (newValue != undefined) {
                        updateTreeMap();
                    }
                });

                // Update it whenever slices are modified
                scope.$watch('model.slices', function (newValue) {
                    if(newValue)
                    {
                        updateTreeMap();
                    }
                });
            }
        };
    }]);
