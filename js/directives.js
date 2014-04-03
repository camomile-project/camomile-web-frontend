'use strict';

/* Directives */


angular.module('myApp.directives', ['myApp.filters', 'myApp.services']).
    directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        };
    }])

    .directive('cmTimeline', ['palette', function (palette) {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg></svg>',
            link: function (scope, element, attrs) {
                // definition of timeline properties
                var margin = {}, margin2 = {}, width, height, height2;
                var lanePadding = 5;
                var laneHeight = 30;
                var contextPadding = 25;
                // hack : multiple time scales, to circumvent unsupported difference for dates in JS
                var xMsScale, xTimeScale, x2MsScale, x2TimeScale, yScale;
                var xAxis, xAxis2, yAxis;
                var d3elmt = d3.select(element[0]); // d3 wrapper of the SVG element
                var brush, focus, context;

                var player = $("#player")[0];

                // utility functions for date conversion
                var parseDate = d3.time.format("%H:%M:%S.%L").parse;

                var secToTime = function (s) {
                    function addZ(n) {
                        return (n < 10 ? '0' : '') + n;
                    }

                    var ms = s % 1;
                    s = Math.floor(s);
                    var secs = s % 60;
                    s = (s - secs) / 60;
                    var mins = s % 60;
                    var hrs = (s - mins) / 60;

                    // hack to force ms with 3 decimal parts
                    ms = parseFloat("0." + ms.toString()).toFixed(3).slice(2);

                    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
                };

                // use SVG to draw the tooltip content
                // this is the tooltip graph component init - it is then updated by refreshTooltipForLayer
                // on layer mouseover events.
                var tooltipWidth = 0;
                var tooltipHeight = 0;
                var tooltipPadding = 3;

                var tooltip = d3.select("body")
                    .append("svg")
                    .attr("width", tooltipWidth + 2 * tooltipPadding)
                    .attr("height", tooltipHeight)
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden");

                var borderGenerator = function (w, h) {
                    return [
                        {'x': 0, 'y': 0},
                        {'x': 0, 'y': h},
                        {'x': w, 'y': h},
                        {'x': w, 'y': 0},
                        {'x': 0, 'y': 0}
                    ];
                };
                var lineFunction = d3.svg.line()
                    .x(function (d) {
                        return d.x;
                    })
                    .y(function (d) {
                        return d.y;
                    })
                    .interpolate("linear");

                tooltip.append("path")
                    .attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)))
                    .attr("stroke", "black")
                    .attr("stroke-width", "2")
                    .attr("fill", "white");


                // callback function for the focus brush
                var brushed = function () {
                    var brushRange = brush.extent().map(x2MsScale);
                    xMsScale.domain(brush.empty() ? x2MsScale.domain() : brush.extent());
                    xTimeScale.domain(brush.empty() ? x2TimeScale.domain() : brushRange.map(x2TimeScale.invert));

                    focus.selectAll(".annot")
                        .attr("x", function (d) {
                            return xMsScale(d.fragment.start);
                        })
                        .attr("width", function (d) {
                            return xMsScale(d.fragment.end) - xMsScale(d.fragment.start);
                        });

                    focus.select(".x.axis").call(xAxis);

                    // log scope min and max date
                    scope.$apply(function () {
                        scope.setMinimalXDisplayedValue(xMsScale.domain()[0]);
                        scope.setMaximalXDisplayedValue(xMsScale.domain()[1]);
                        if ('function' == typeof (scope.clickOnAPiechartSlice)) {
                            scope.clickOnAPiechartSlice(-1);
                        }

                    });
                };

                var isMouseDown = false;
                var init = function () {
                    // init dimensions/margins
                    // height set depending on number of modalities - in updateComp
                    var extWidth = element.parent().width();
                    height = 0;
                    height2 = laneHeight;
                    margin = {top: 20, right: 20, bottom: height2 + contextPadding + 20, left: 0.15 * extWidth};
                    margin2 = {top: margin.top + height + contextPadding, right: 20, bottom: 20, left: 0.15 * extWidth};
                    width = extWidth - margin.left - margin.right;

                    // scales for focus and context,
                    // and for internal use (raw annotations use seconds) and display (formatted)
                    xTimeScale = d3.time.scale().domain([0, 0]).range([0, width]).clamp(true);
                    x2TimeScale = d3.time.scale().domain([0, 0]).range([0, width]).clamp(true);
                    xMsScale = d3.scale.linear().domain([0, 0]).range([0, width]).clamp(true);
                    x2MsScale = d3.scale.linear().domain([0, 0]).range([0, width]).clamp(true);

                    yScale = d3.scale.ordinal().range([0, height]); // scale for layer labels
//                    colScale = d3.scale.ordinal(); // custom color scale

                    // d3.time.format.multi recently added in d3 - replaced the legacy solution
                    var customTimeFormat = d3.time.format.multi([
                        ["%S.%L", function (d) {
                            return d.getMilliseconds();
                        }],
                        ["%M:%S", function (d) {
                            return d.getSeconds();
                        }],
                        ["%H:%M:%S", function (d) {
                            return true;
                        }]
                    ]);

                    // init of SVG element and its associated components
                    d3elmt.attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom);

                    xAxis = d3.svg.axis().scale(xTimeScale).orient("top").ticks(5)
                        .tickFormat(customTimeFormat);
                    xAxis2 = d3.svg.axis().scale(x2TimeScale).orient("top").ticks(5)
                        .tickFormat(customTimeFormat);
                    yAxis = d3.svg.axis().scale(yScale).orient("left");

                    brush = d3.svg.brush().x(x2MsScale).on("brush", brushed);


                    focus = d3elmt.append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    context = d3elmt.append("g")
                        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

                    context.append("g")
                        .attr("class", "brush")
                        .call(brush)
                        .selectAll("rect")
                        .attr("y", -6)
                        .attr("height", height2 + 7);

                    focus.append("g")
                        .attr("class", "x axis")
                        .call(xAxis);

                    focus.append("g")
                        .attr("class", "y axis")
                        .call(yAxis);


                    context.insert("g", ".brush")
                        .attr("class", "x axis")
                        .call(xAxis2);


                    var gContainer = $(focus[0][0]);
                    var yAxisContainer = gContainer.children(".y");
                    var xAxisContainer = gContainer.children(".x");

                    focus.append("g").attr("id", "time").append("circle").attr("id", "draggable").attr("cx", gContainer.offset().left + xMsScale(0)).attr('cy', 0).attr("r", 8).style("fill", "steelblue").style("stroke", "black").attr("z", 0);

                    var circleElement = d3.select("circle");

                    focus.append("g").append("line").attr("id", "line").attr("x1", gContainer.offset().left + xMsScale(0)).attr("x2", gContainer.offset().left + xMsScale(0)).attr('y1', parseInt(circleElement.attr("r"))).attr('y2', 130).style("fill", "black").style("stroke", "black").style("stroke-width", "1").style("stroke-dasharray", ("3, 3"));
                    var lineElement = d3.select("#line");


                    circleElement.on("mousemove", function () {
                        circleElement.style("cursor", "e-resize");
                    });


                    // Event that allow to move the pointer on the timeline that is synchronised with the current time of the video
                    var drag = d3.behavior.drag()
                        .on("drag",function () {
                            var position = event.pageX -
                                (gContainer.offset().left + yAxisContainer[0].getBBox().width);

                            if (position >= 0 && position <= xAxisContainer[0].getBBox().width) {
                                circleElement.attr("cx", parseInt(position));
                                lineElement.attr("x1", parseInt(position)).attr("x2", parseInt(position));

                                player.currentTime = xMsScale.invert(position);
                                player.pause();
                            }
                        }).on("dragend", function () {
                            player.play();
                        });

                    circleElement.call(drag);

                    // Listen the current time of the video to update pointer position in the timeline
                    player.addEventListener('timeupdate', function () {
                        if (!isMouseDown) {
                            lineElement.attr("x1", xMsScale(player.currentTime)).attr("x2", xMsScale(player.currentTime));
                            circleElement.attr("cx", xMsScale(player.currentTime));
                        }
                    }, false);

                };

                var updateLayers = function (addedLayerId) {
                    var addedLayer;

                    // HTML5/DOM does not support multiple event trigger for overlaying SVG elements :
                    // only the "latest sibling" in the DOM tree is triggered. This is not satisfactory for
                    // our tooltip function.
                    // refreshTooltipForLayer handles mouseover events at the layer level.
                    // It is rather inefficient as all annots are processed at each move : but this is the only way
                    // for a sufficiently flexible behavior.
                    var refreshTooltipForLayer = function (d) {
                        // select the whole set of annotations in the layer,
                        // and find those hovered by the mouse
                        var currentLayer = d3.select(this);
                        var currentSel = currentLayer.selectAll(".annot");
//                        var pointerPos = undefined;
                        var hoveredElts = currentSel[0].filter(function (d) {
                            var dims = d.getBBox();
                            dims.top = $(d).offset().top;
                            dims.left = $(d).offset().left;

                            return dims.top <= event.pageY && dims.left <= event.pageX &&
                                dims.top + dims.height >= event.pageY && dims.left + dims.width >= event.pageX;
                        });


                        // get position of the pointer wrt current timescale, in pixels
                        // hack : as layer object is shifted to first annotation - use the enclosing <g>
                        // NB that his margins (translate) define its shift wrt page
                        // to get actual time position, y axis space has thus to be explicitly accounted for
                        var gContainer = $($(currentLayer[0][0]).parent()[0]);
                        var yAxisContainer = gContainer.children(".y");
                        var pointerPos = event.pageX -
                            (gContainer.offset().left + yAxisContainer[0].getBBox().width);

                        var margin = pointerPos;

                        pointerPos = xTimeScale.invert(pointerPos);
                        pointerPos = (d3.time.format("%H:%M:%S.%L"))(pointerPos);

                        currentSel = tooltip.selectAll(".time")
                            .data([pointerPos]);

                        currentSel.enter()
                            .append("text");

                        currentSel.text(function (d) {
                            return d;
                        })
                            .attr("x", tooltipPadding)
                            .attr("y", 15)
                            .attr("class", "time");


                        // get the associated labels, with potential repetitions
                        var newLabels = hoveredElts.map(function (d) {
                            return addedLayer.tooltipFunc(d3.select(d).data()[0]);
                        });

                        // add its multiplicity to each value in the array
                        newLabels = newLabels.map(function (d) {
                            var count = newLabels.filter(function (d2) {
                                return d === d2;
                            }).length;
                            if (count > 1) d += (" x" + count);
                            return d;
                        });

                        // reduce to unique
                        newLabels = $.grep(newLabels, function (v, k) {
                            return $.inArray(v, newLabels) === k;
                        });


                        currentSel = tooltip.selectAll(".label")
                            .data(newLabels);

                        currentSel.enter()
                            .append("text");

                        currentSel.exit()
                            .remove();

                        // append the multiplicity of labels in newLabels if needed
                        currentSel.text(function (d) {
                            return d;
                        })
                            .attr("x", tooltipPadding)
                            .attr("y", function (d, i) {
                                return 20 * (i + 1) + 15;
                            })
                            .attr("class", "label");

                        // adjust tooltip width using the max length of labels
                        tooltipWidth = 0;
                        currentSel = tooltip.selectAll("text");
                        currentSel[0].forEach(function (d) {
                            if (d.getComputedTextLength() > tooltipWidth) {
                                tooltipWidth = d.getComputedTextLength();
                            }
                        });
                        // +1 to account for timestamp
                        tooltipHeight = 20 * (newLabels.length + 1);
                        tooltip.attr("width", tooltipWidth + 2 * tooltipPadding)
                            .attr("height", tooltipHeight)
                            .select("path")
                            .attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)));
                        return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
                    };

                    // get layer actual object from ID
                    addedLayer = scope.model.layers.filter(function (l) {
                        return(l._id === addedLayerId);
                    })[0];

                    scope.updateColorScale(addedLayerId);

                    // adapt time scales
                    // TODO: Check this when edition will be available.
                    var theMax = 0;
                    var curMax;
                    var theMin = 9999999999999999;
                    var curMin;
                    var maxDate = parseDate("00:00:00.000");
                    var minDate = parseDate("99:99:99.999");
                    scope.model.layers.forEach(function (l) {
                        curMax = d3.max(l.layer.map(function (d) {
                            return d.fragment.end;
                        }));
                        curMin = d3.min(l.layer.map(function (d) {
                            return d.fragment.start;
                        }));

                        theMax = d3.max([theMax, curMax]);
                        theMin = d3.min([theMin, curMin]);

                        curMax = d3.max(l.layer.map(function (d) {
                            return parseDate(secToTime(d.fragment.end));
                        }));
                        curMin = d3.min(l.layer.map(function (d) {
                            return parseDate(secToTime(d.fragment.start));
                        }));

                        maxDate = d3.max([maxDate, curMax]);
                        minDate = d3.min([minDate, curMin]);
                    });

                    // adapt brush to new scale
                    var brushExtent = [];
                    if (!brush.empty()) {
                        brushExtent = brush.extent();
                    }

                    x2MsScale.domain([theMin, theMax]);
                    x2TimeScale.domain([minDate, maxDate]);

                    if (!brush.empty()) {
                        brush.extent(brushExtent);
                        brush(context.select(".brush"));
                    }

                    if (brush.empty() || scope.model.layers.length === 0) {
                        xMsScale.domain(x2MsScale.domain());
                        xTimeScale.domain(x2TimeScale.domain());
                    }

                    // adapt component dimensions and y axis
                    height = (lanePadding + laneHeight) * scope.model.layers.length;
                    margin2.top = margin.top + height + contextPadding;
                    d3elmt.attr("height", height + margin.top + margin.bottom);
                    context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

                    yScale.domain(scope.model.layers.map(function (el) {
                        return {id: el._id,
                            str: el.label,
                            toString: function () {
                                return this.str;
                            }}
                    }));
                    yScale.rangeBands([0, height]);

                    focus.select(".y.axis").call(yAxis);
                    focus.select(".x.axis").call(xAxis);
                    context.select(".x.axis").call(xAxis2);

                    var layerSel = context.selectAll(".layer")
                        .data(scope.model.layers, function (d) {
                            return d._id;
                        });

                    // insert new context layer before ".brush"
                    layerSel.enter()
                        .insert("g", ".brush")
                        .attr("class", "layer")
                        .selectAll(".annot")
                        .data(function (d) {
                            return d.layer;
                        })
                        .enter()
                        .append("rect")
                        .attr("fill", "#999999")
                        .attr("opacity", 0.2)
                        .attr("x", function (d) {
                            return x2MsScale(d.fragment.start);
                        })
                        .attr("width", function (d) {
                            return x2MsScale(d.fragment.end) - x2MsScale(d.fragment.start);
                        })
                        .attr("y", 0)
                        .attr("height", laneHeight)
                        .attr("class", "annot");

                    layerSel.exit().remove();

                    layerSel = focus.selectAll(".layer")
                        .data(scope.model.layers, function (d) {
                            return d._id;
                        });

                    // insert new focus layer.
                    // note that mouse events are handled at layer level, to allow greater flexibility
                    // (see comments above refreshTooltipForLayer definition)
                    layerSel.enter()
                        .append("g")
                        .attr("id", function (d, i) {
                            return "layer_" + i;
                        })
                        .attr("class", "layer")
                        .on("mouseover", function () {
                            return tooltip.style("visibility", "visible");
                        })
                        .on("mousemove", refreshTooltipForLayer)
                        .on("mouseout", function () {
                            return tooltip.style("visibility", "hidden");
                        })
                        .selectAll(".annot")
                        .data(function (d) {
                            return d.layer;
                        })
                        .enter()
                        .append("rect")
                        .attr("fill", function (d) {
                            return scope.model.colScale(addedLayer.mapping.getKey(d));
                        })
                        .attr("opacity", 0.4)
                        .attr("y", 0)
                        .attr("height", laneHeight)
                        .attr("x", function (d) {
                            return xMsScale(d.fragment.start);
                        })
                        .attr("width", function (d) {
                            return xMsScale(d.fragment.end) - xMsScale(d.fragment.start);
                        })
                        .attr("class", "annot")
                        .on("click", function (d) {
                            player.currentTime = d.fragment.start;
                            player.play();
                        });

                    layerSel.exit().remove();

                    // update positions of new selection
                    layerSel.attr("transform", function (d, i) {
                        return "translate(0," + (lanePadding + (i * (lanePadding + laneHeight))) + ")";
                    });

                    // refresh all annotations in case of rescale
                    focus.selectAll(".annot")
                        .attr("x", function (d) {
                            return xMsScale(d.fragment.start);
                        })
                        .attr("width", function (d) {
                            return xMsScale(d.fragment.end) - xMsScale(d.fragment.start);
                        });

                    // adjust font size to available space in left margin
                    var maxTickLength = 0;
                    focus.select(".y")
                        .selectAll("text")[0]
                        .forEach(function (d) {
                            if (d.getComputedTextLength() > maxTickLength) {
                                maxTickLength = d.getComputedTextLength();
                            }
                        });
                    maxTickLength = maxTickLength * 16 / 12; // approx. points to pixels conversion
                    focus.select(".y")
                        .selectAll("text")
                        .attr("transform", function () {
                            return "scale(" + margin.left / maxTickLength + "," + margin.left / maxTickLength + ")";
                        });

                };

                var updateLayerSelectedItem = function (selectedSliceValue) {
                    if (scope.model.selected_layer != undefined && scope.model.selected_layer != undefined != -1) {

                        var addedLayer;

                        // Restore initial color and opacity
                        for (var i = 0, max = scope.model.layers.length; i < max; i++) {

                            addedLayer = scope.model.layers.filter(function (l) {
                                return(l._id === scope.model.layerWatch[i]);
                            })[0];

                            d3.select('#layer_' + i).selectAll("rect").attr("opacity", 0.4)
                                .attr("fill", function (d) {
                                    return scope.model.colScale(addedLayer.mapping.getKey(d));
                                });
                        }


                        addedLayer = scope.model.layers.filter(function (l) {
                            return(l._id === scope.model.layerWatch[scope.model.selected_layer]);
                        })[0];

                        // in Selected layer:
                        d3.select('#layer_' + scope.model.selected_layer).selectAll("rect").attr("opacity", function (d) {
                            // if selected slice correspond to target rectangle, make it opaque and give it the selection color
                            // if not, make it transparent and let it have its original color
                            if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
                                return 0.4;
                            }
                            else if (selectedSliceValue != undefined && selectedSliceValue != -1) {
                                return 0.1;
                            }
                            else {
                                return 0.4;
                            }
                        })
                            .attr("fill", function (d, i) {
                                if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
                                    return scope.model.colScale("selection_color");
                                }
                                else {
                                    return scope.model.colScale(addedLayer.mapping.getKey(d));
                                }
                            });

                    }
                }


                // BUG #8946 : handle multiple additions/deletions

                scope.$watch('model.layerWatch', function (newValue, oldValue) {

                    var addedLayersId = newValue.filter(function (l) {
                        return !(oldValue.indexOf(l) > -1);
                    });

                    addedLayersId.forEach(function (d) {
                        updateLayers(d);
                    });

                    // update min and max in scope
                    scope.setMinimalXDisplayedValue(x2MsScale.domain()[0]);
                    scope.setMaximalXDisplayedValue(x2MsScale.domain()[1]);

                }, true);

                scope.$watch('model.selected_slice', function (newValue, oldValue) {

                    updateLayerSelectedItem(newValue);
                }, true);


                init();

            }
        }
    }
    ])
    .
    directive('cmPiechart', ['palette', function (palette) {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg id="piechart"></svg>',
            link: function (scope, element, attrs) {
                scope.updatePiechart = function () {

                    scope.computeSlices();

                    var w = 500,                            // width
                        h = 500,                            // height
                        r = 200,                            // radius
                        sum = d3.sum(scope.slices, function (d) {
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
                    var oldTooltip = detailedView.selectAll("div");
                    if (oldTooltip) {
                        oldTooltip.remove();
                    }

                    // add a div used to display a tooltip
                    var div = detailedView.append("div")
                        .attr("class", "piechartTooltip")
                        .style("opacity", 0);

                    vis = vis
                        .append("g")              //create the SVG element inside the <body>
                        .data([scope.slices])                   //associate our data with the document
                        .attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
                        .attr("height", h + "px")
                        .append("g")                //make a group to hold our pie chart
                        .attr("transform", "translate(" + r + "," + r + ")");    //move the center of the pie chart from 0, 0 to radius, radius

                    var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
                        .outerRadius(r);

                    var pie = d3.layout.pie()           //this will create arc data for us given a list of values
                        .value(function (d) {
                            return d.spokenTime;
                        });    //we must tell it out to access the value of each element in our data array

                    var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
                        .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
                        .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
                        .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
                        .attr("class", "slice")
                        .on("mouseover", function (d, i) {
                            div.transition()
                                .duration(200)
                                .style("opacity", 1);
                            div.html(scope.slices[i].element + '<br/>' + 'Duration: ' + Math.floor(scope.slices[i].spokenTime / sum * 100) + "%")
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 18) + "px");
                        })
                        .on("mouseout", function (d, i) {
                            div.transition()
                                .duration(200)
                                .attr("dy", ".3em")
                                .style("opacity", 0)
                                .style("width", (scope.slices[i].element * 10));
                        })
                        .on("click", function (d, i) {
                            scope.$apply(function () {
                                scope.clickOnAPiechartSlice(i);
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
                                return scope.model.colScale(scope.slices[i].element);
                            }
                        }) //set the color for each slice to be chosen from the color function defined above
                        .attr("d", arc)                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
                        .attr("opacity", function (d, i) {
                            if (i == scope.model.selected_slice) {
                                return 1;
                            }
                            else {
                                return 0.4;
                            }
                        });
                };

                scope.$watch('model.selected_layer', function (newValue) {
                    if (newValue != null && newValue != "" && newValue != undefined) {
                        scope.updatePiechart();
                    }
                });

                scope.$watch('model.selected_slice', function (newValue) {
                    if (newValue != undefined) {
                        scope.updatePiechart();
                    }
                });

                // only one has to be watch cause both change at the same time
                scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
                    if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
                        scope.updatePiechart();
                    }

                });
            }
        }
    }])
    .directive("cmPiechartLegend", ['palette', function (palette) {
        return {
            restrict: 'E',
            replace: true,
            template: '<svg id="legend"></svg>',
            link: function (scope, element, attrs) {


                scope.updateLegend = function () {
                    scope.computeSlices();

                    var maxLength = d3.max(scope.slices, function (d) {
                        return parseInt(d.element.length);
                    });

                    var rectHeight = 20,
                        rectWidth = 20,
                        legendMargin = 4,
                        legendWidth = 16 * (maxLength ? maxLength : 0) + rectWidth * 4,
                        legendHeight = (rectHeight + legendMargin) * scope.slices.length;

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


                    svgContainer.style("float", "right");

                    var svg = svgContainer.attr("width", legendWidth + "px")
                        .attr("height", legendHeight + "px");

                    //Add rectangles to the svgContainer
                    var coloredRectangles = svg.selectAll("rect")
                        .data(scope.slices)
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
                                scope.clickOnAPiechartSlice(i);
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
                            if (i == scope.model.selected_slice) {
                                return 1;
                            }
                            else {
                                return 0.4;
                            }
                        })
                        .style("stroke", "black");   //allow us to style things in the slices (like text);

                    //Add the SVG Text Element to the svgContainer
                    var text = svg.selectAll("text")
                        .data(scope.slices)
                        .enter()
                        .append("text");

                    //Add SVG Text Element Attributes
                    text.attr("x", rectWidth + 20)
                        .attr("y", function (d, i) {
                            return rectHeight * (i + 1) + i * legendMargin - 5;
                        })
                        .text(function (d, i) {
                            return scope.slices[i].element + '   (' + parseInt(scope.slices[i].spokenTime).toFixed(0) + 's)';
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
                };

                scope.$watch('model.selected_layer', function (newValue) {
                    if (newValue != null && newValue != "" && newValue != -1) {
                        scope.model.selected_slice = -1;
                        scope.updateLegend();
                    }
                });

                // only one has to be watch cause both change at the same time
                scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
                    if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
                        scope.updateLegend();
                    }

                });

                scope.$watch('model.selected_slice', function (newValue) {
                    if (newValue != undefined) {
                        scope.updateLegend();
                    }
                });
            }
        }
    }]);
