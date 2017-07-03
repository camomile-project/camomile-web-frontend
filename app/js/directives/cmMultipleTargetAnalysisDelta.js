/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetAnalysisDelta', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetAnalysisDeltaDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var rectHeight = 14,svgWidth = 150;

                // Used for coloring element, depending of their value
                var colorPositive = d3.scale.quantize().domain([0,0.9])
                    //.range(['#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081']);
                    .range(['#FFFFBF', '#D9EF8B', '#A6D96A', '#66BD63', '#1A9850']);
                var colorNegative = d3.scale.quantize().domain([0, -0.9])
                    //.range(['#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506']);
                    .range(['#FFFFBF', '#FEE08B', '#FDAE61', '#F46D43', '#D73027']);

                var vis = d3.selectAll('.multipleTargetAnalysisDeltaDirective');

                // Reset graph
                var resetGraph = function()
                {
                    // Remove old existing chart
                    var oldGraph = vis.selectAll("svg");
                    if (oldGraph) {
                        oldGraph.remove();
                    }
                };

                // Update data (refresh everything)
                var updateData = function()
                {
                    resetGraph();
                    updateGraph();
                    updateInteractions();
                };

                // Sets interactions for elements - allows selection
                var updateInteractions = function()
                {
                    // Get the tooltip div
                    var tooltip = d3.select('#tooltip')
                        .style('display','none');

                    // Handle rect events
                    d3.selectAll('.deltaRect')
                        .on('mouseover', function()
                        {
                            tooltip.html('Rate: '+Math.round(this.getAttribute('rate')*10000)/100+'%\nKappa: '+Math.round(this.getAttribute('kappa')*10000)/100+"%")
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px")
                                .style('position', 'absolute')
                                .style('text-align', 'left')
                                .style('width', '96px')
                                .style('height', '36px')
                                .style('padding', '2px')
                                .style('font', 'bold 12px sans-serif ')
                                .style('background', 'rgba(66,180,230,0.7)')
                                .style('border', '0px')
                                .style('border-radius', '8px')
                                .style('pointer-events', 'none')
                                .style('display', 'block');
                        })
                        .on('mouseout', function(){
                            tooltip.style('display','none');
                        });
                };

                // Update the graphic view
                var updateGraph = function(){

                    if(scope.model.multipleAnalysisDeltaData.data.length != 0)
                    {

                        // initialize graph height
                        var svgHeight = scope.model.multipleAnalysisDeltaData.data[0].algo.length * 25 + 5;

                        // For each cells, create a SVG corresponding to the data of the cell
                        vis.selectAll('svg')
                            .data(scope.model.multipleAnalysisDeltaData.data)
                            .enter()
                            .append('svg')
                            .each(function (d, i) {
                                var parent = this.parentNode.parentNode;
                                var targetIndex = parseInt(d3.select(parent.parentNode).attr('index'));
                                var algoIndex = 0;
                                if (i === targetIndex) {

                                    // give its dimension
                                    d3.select(this).attr("width", svgWidth )
                                        .attr("height", svgHeight);

                                    for(var algoIndex = 0; algoIndex< scope.model.multipleAnalysisDeltaData.data[targetIndex].algo.length;algoIndex++)
                                    {
                                        // draw Algorithm label
                                        d3.select(this).append('text')
                                            .attr("x", 0)
                                            .attr("y", 14 + algoIndex*(25)+5)
                                            .text(scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].name);

                                        // get the delta value
                                        var deltaValue = scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].accuracy / (scope.model.multipleAnalysisDeltaData.maxAccuracy == 0 ? 1 : scope.model.multipleAnalysisDeltaData.maxAccuracy);

                                        // Old way of computing delta
//                                        var deltaValue = scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].value / (scope.model.multipleAnalysisDeltaData.maxValue + (scope.model.multipleAnalysisDeltaData.maxValue == 0 ? 1: 0));
                                        // Draw the colored rect displaying the value
                                        d3.select(this).append('rect')
                                            .attr("x", function(){
                                                if(deltaValue>= 0)
                                                {
                                                    return (svgWidth + 30)/2;
                                                }
                                                else
                                                {
                                                    return (svgWidth + 30)/2 + deltaValue * (svgWidth - 30)/2;
                                                }
                                            })
                                            .attr("y", algoIndex*(25)+5)
                                            .attr("width", function(){
                                                return Math.abs(deltaValue * (svgWidth - 30)/2);
                                            })
                                            .attr("height", rectHeight)
                                            .attr("fill", function()
                                            {
                                                var value = scope.model.multipleAnalysisDeltaData.data[targetIndex].rate/scope.model.multipleAnalysisDeltaData.maxRate;
                                                //Positive Case
                                                if(value >= 0)
                                                {
                                                    return colorPositive(value);

                                                }
                                                // Negative case
                                                else
                                                {
                                                    return colorNegative(value);
                                                }

                                            })
                                            .attr("kappa", function(){
                                                return scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].accuracy;
                                            })
                                            .attr("rate", function(){
                                                return scope.model.multipleAnalysisDeltaData.data[targetIndex].rate;
                                            })
                                            .attr("used_value", function(){
                                                return deltaValue;
                                            })
                                            .attr('class', 'deltaRect')
                                            .attr('targetIndex', scope.model.multipleAnalysisDeltaData.data[targetIndex].name)
                                            .attr('algoIndex', scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].name)
                                            .attr('id', targetIndex+'#'+algoIndex);

                                        // draw the border, equivalent to a 100% value
                                        d3.select(this).append('rect')
                                            .attr("x", 30)
                                            .attr("y", algoIndex*(25)+5)
                                            .attr("width", function(){
                                                return (svgWidth - 30);
                                            })
                                            .attr("height", rectHeight)
                                            .attr("fill", 'rgba(0,0,0,0)')
                                            .attr('stroke', 'black')
                                            .attr('class', 'deltaRect')
                                            .attr("kappa", function(){
                                                return scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].accuracy;
                                            })
                                            .attr("rate", function(){
                                                return scope.model.multipleAnalysisDeltaData.data[targetIndex].rate;
                                            })
                                            .attr("used_value", function(){
                                                return deltaValue;
                                            })
                                            .attr('targetIndex', scope.model.multipleAnalysisDeltaData.data[targetIndex].name)
                                            .attr('algoIndex', scope.model.multipleAnalysisDeltaData.data[targetIndex].algo[algoIndex].name)
                                            .attr('id', 'rect'+targetIndex+'#'+algoIndex);

                                        // Draw the middle line
                                        d3.select(this).append('line')
                                            .attr("x1", function(){
                                                return (svgWidth + 30)/2;
                                            })
                                            .attr("y1", function(){
                                                return algoIndex*(25);
                                            })
                                            .attr("x2", function(){
                                                return (svgWidth + 30)/2;
                                            })
                                            .attr("y2", function(){
                                                return algoIndex*(25) + rectHeight + 10
                                            })
                                            .attr('stroke', 'rgb(0,0,0)')
                                            .attr('stroke-width', '2');
                                    }
                                }
                                else
                                {
                                    // Remove the unused svg
                                    d3.select(this).remove();
                                }
                            }
                        );
                    }
                };

                scope.$watch('model.multipleAnalysisDeltaData.data', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });
            }
        }
    }
    ]);