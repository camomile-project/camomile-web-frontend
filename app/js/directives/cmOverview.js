/**
 * Created by stefas on 03/12/15.
 */
angular.module('myApp.directives')
    .directive('cmOverview', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="overviewDirective"></div>',
            link: function (scope) {


                var divToolTip = d3.select("#tooltip-overview").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var initialiseData=function(){
                    scope.initialiseData();
                };


                var svg = d3.select("#overviewDirective").append('svg').attr('width','500px')
                    .attr('height', '0px');

                var selectedElement;

                var updateGraphic = function(){
                    // Vire les anciens graphs
                    var oldGraph = svg.selectAll("rect");
                    if (oldGraph) {
                        oldGraph.remove();
                    }

                    oldGraph = svg.selectAll("text");
                    if (oldGraph) {
                        oldGraph.remove();
                    }

                    svg.attr('height', function(){
                        return (30*(scope.model.filtered.length+1))+'px';
                    });

                    var elements = svg.selectAll("text")
                        .data(scope.model.filtered)
                        .enter()
                        .append("text");

                    elements.attr("x", 0)
                        .attr('class', 'overview-element')
                        .attr("y", function (d, i) {
                            return 20 * (i + 1) + i * 10 - 5;
                        })
                        .text(function (d) {
                            return d.name;
                        })
                        .attr("max-width", "50px")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "16px")
                        .attr('font-weight', function(d){
                            if(scope.model.selectedElement != undefined && scope.model.selectedElement.id === d.id)
                            {
                                return 'bold';
                            }
                            return 'normal';
                        })
                        .attr('fill', function(d){
                            if(scope.model.selectedElement != undefined && scope.model.selectedElement.id === d.id)
                            {
                                return 'red';
                            }

                            return 'black';
                        });


                    svg.selectAll("rect")
                        .data(scope.model.filtered)
                        .enter().append("rect")
                        .attr('class', 'overview-element')
                        .attr('x','250px')
                        .attr("y", function (d, i) {
                            return 20 * (i) + i * 10;
                        })
                        .attr('width', function(d){
                            return (d.totalMetrics[scope.model.selectedMetric]*200 / d.maxTotalMetricValue[scope.model.selectedMetric] ) +'px';
                        })
                        .attr('height','20px')
                        .attr('fill',function(d){
                            if(scope.model.selectedElement != undefined && scope.model.selectedElement.id === d.id)
                            {
                                return 'red';
                            }

                            return 'lightblue';
                        })
                        .attr('stroke', function(d){
                            if(scope.model.selectedElement != undefined && scope.model.selectedElement.id === d.id)
                            {
                                return 'crimson';
                            }

                            return 'black';
                        }).attr('stroke-width', function(d){
                            if(scope.model.selectedElement != undefined && scope.model.selectedElement.id === d.id)
                            {
                                return '6px';
                            }

                            return '1px';
                        });

                    // tooltip
                    d3.selectAll('.overview-element')
                        .on("mouseout", function () {
                            var oldTooltip = d3.select("#tooltip-div");
                            if (oldTooltip) {
                                oldTooltip.remove();
                            }

                            divToolTip.transition()
                                .duration(200)
                                .attr("dy", ".3em")
                                .style("opacity", 0);
                        })
                        .on("mouseover", function (d) {


                            var displayedElement = {};
                            displayedElement.name = d.name;
                            displayedElement[scope.model.selectedMetric] = d.totalMetrics[scope.model.selectedMetric];
//                            displayedElement.media = d.mediaNames;
                            displayedElement.media = d.media;


                            divToolTip.transition()
                                .duration(200)
                                .style("opacity", 0.9);

                            var positionX = d3.event.pageX;
                            var positionY = d3.event.pageY;

                            divToolTip.style("left", (positionX) + "px")
                                .style("top", (positionY - 10) + "px");

                            divToolTip.append("div").attr("id", "tooltip-div")
                                .style("color", 'rgb(255,255,255)');

                            document.getElementById("tooltip-div")
                                .appendChild(JsonHuman.format(displayedElement));

                        })
                        .on('click', function(d){
                            if(scope.model.selectedElement == d)
                            {
                                scope.$apply(function(){
                                    scope.model.selectedElement = undefined;
                                });
                            }
                            else {
                                scope.$apply(function(){
                                    scope.model.selectedElement = d;
                                });
                            }

                            // remove tooltip if necessary
                            var oldTooltip = d3.select("#tooltip-div");
                            if (oldTooltip) {
                                oldTooltip.remove();
                            }

                            updateGraphic();
                        });
                };

//                initialiseData();

                // update Data
                scope.updateData = function(){

                    // initialize selectedElement;
                    selectedElement = undefined;

                    scope.model.overviewReferenceData.sort(sort);
                    scope.model.filtered = scope.model.overviewReferenceData.filter(nameFilter);
                    scope.model.filtered = scope.model.filtered.filter(mediumFilter);
//                    scope.model.filtered = scope.model.overviewReferenceData;
                    updateGraphic();
                };

                var sort = function(elem1, elem2){
                    if(scope.model.selectedOrder === "nothing")
                    {
                        return 0;
                    }
                    else if(scope.model.selectedOrder === "increasing")
                    {
                        return (elem1.totalMetrics[scope.model.selectedMetric] <= elem2.totalMetrics[scope.model.selectedMetric])? -1 : 1;
                    }
                    else if(scope.model.selectedOrder === "decreasing")
                    {
                        return (elem1.totalMetrics[scope.model.selectedMetric] <= elem2.totalMetrics[scope.model.selectedMetric])? 1 : -1;
                    }
                    else if(scope.model.selectedOrder === "alphabetic")
                    {
                        return (elem1.name <= elem2.name)? -1 : 1;
                    }
                    else if(scope.model.selectedOrder === "r-alphabetic")
                    {
                        return (elem1.name <= elem2.name)? 1 : -1;
                    }
                    return -1;
                };

                var nameFilter = function(elem)
                {
                    if(scope.model.nameFilter == "" || scope.model.nameFilter == undefined)
                    {
                        return true;
                    }
                    return elem.name.indexOf(scope.model.nameFilter) != -1;
                };

                var mediumFilter = function(elem)
                {
                    if(scope.model.mediumFilter == "" || scope.model.mediumFilter == undefined)
                    {
                        return true;
                    }

                    for(var i = 0, maxI = elem.media.length;i<maxI; i++)
                    {
                        if(elem.media[i].indexOf(scope.model.mediumFilter) != -1)
                        {
                            return true;
                        }
                    }
                    return false;
                };


                scope.$watch('model.selectedMetric', function(newValue)
                {
                    if(newValue)
                    {
                        scope.updateData();
                    }
                });

                scope.$watch('model.selectedOrder', function(newValue)
                {
                    if(newValue)
                    {
                        scope.updateData();
                    }
                });

                scope.$watch('model.nameFilter', function(newValue)
                {
                    if(newValue || newValue=='')
                    {
                        scope.updateData();
                    }
                });

                scope.$watch('model.mediumFilter', function(newValue)
                {
                    if(newValue || newValue=='')
                    {
                        scope.updateData();
                    }
                });

                scope.$watch('model.initialisationCompleted', function(newValue)
                {
                    if((newValue || newValue=='') && scope.model.selectedMetric != undefined)
                    {
                        scope.updateData();
                    }
                });
            }
        };
    }]);