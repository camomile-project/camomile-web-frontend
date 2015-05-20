/**
 * Created by stefas on 04/03/15.
 * This directive is here to create a piechart view. It have to be linked to a controller containing at least:
 *      scope.model : an object
 *      scope.model.slices : an array containing each slice of the piechart
 *      Each slice of scope.model.slices must contain 2 things: element (the label) and spokenTime (the value)
 *      scope.model.colScale : a color scale (which has to be initialised in the Ctrl)
 *      scope.clickOnASummaryViewSlice(i) : function defining what to do when an element is clicked
 *
 * If you plan to implement the same version as visible on the front-end, just import commonCtrl.js and
 * explorationBaseCtrl.js. All elements listed on top are in explorationBaseCtrl.js and have to be modified the way you want.
 */
angular.module('myApp.directives')
    .directive('cmPiechart', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg id="piechart"></svg>',
            link: function (scope) {

                var updatePiechart = function () {

                    if(scope.model.slices != undefined && scope.model.slices.length > 0)
                    {

                        var w = 500,                            // width
                            h = 500,                            // height
                            r = 200,                            // radius
                            sum = d3.sum(scope.model.slices, function (d) {
                                return parseInt(d.spokenTime);
                            });

                        // Get the correct svg tag to append the chart
                        var vis = d3.select("#piechart").attr("width", 410).attr("height", 410);


                        // Remove old existing piechart
                        var oldGraph = vis.selectAll("g");
                        if (oldGraph) {
                            oldGraph.remove();
                        }

                        // Remove old existing tooltips
                        var detailedView = d3.select("#detailedView");
                        var oldTooltip = detailedView.selectAll("div.piecharttooltip");
                        if (oldTooltip) {
                            oldTooltip.remove();
                        }

                        // add a div used to display a tooltip
                        var div = detailedView.append("div")
                            .attr("class", "piecharttooltip")
                            .style("opacity", 0);

                        vis = vis
                            .append("g")              //create the SVG element inside the <body>
                            .data([scope.model.slices])                   //associate our data with the document
                            .attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
                            .attr("height", h + "px")
                            .append("g")                //make a group to hold our pie chart
                            .attr("transform", "translate(" + r + "," + r + ")");    //move the center of the pie chart from 0, 0 to radius, radius

                        var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
                            .outerRadius(r);

                        var pie = d3.layout.pie(scope.model.slices)           //this will create arc data for us given a list of values
                            .value(function (d) {
                                return d.spokenTime;
                            });    //we must tell it out to access the value of each element in our data array

                        var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
                            .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
                            .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
                            .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                            .attr("class", "slice")
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
//                            scope.selectASlice();

                            }); //allow us to style things in the slices (like text)

                        arcs.append("svg:path")
                            .style("stroke", "white")
                            .attr("fill", function (d, i) {
                                if (i == scope.model.selected_slice) {
                                    return scope.model.colScale("selection_color");
                                }
                                else {
                                    return scope.model.colScale(scope.model.slices[i].element);
                                }
                            }) //set the color for each slice to be chosen from the color function defined above
                            .attr("d", arc)                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
                            .attr("opacity", function (d, i) {
                                return 1;
                            });
                    }
                };

                scope.$watch('model.selected_slice', function (newValue) {
                    if (newValue != undefined) {
                        updatePiechart();
                    }
                });

                // Update it whenever slices are modified
                scope.$watch('model.slices', function (newValue) {
                    if(newValue){
                        updatePiechart();
                    }
                });
            }
        }
    }]);
