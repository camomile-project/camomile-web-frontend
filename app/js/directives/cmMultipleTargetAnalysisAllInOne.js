/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetAnalysisAllInOne', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetAnalysisAllInOneDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var rectHeight = 14,svgWidth = 150;

                // Used for coloring element, depending of their value
                var color = d3.scale.quantize().domain([0,0.9])
                    .range(['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081']);

                var vis = d3.selectAll('.multipleTargetAnalysisAllInOneDirective');

                // Reset graph
                var resetGraph = function()
                {
                    // Remove old existing chart
                    var oldGraph = vis.selectAll("svg");
                    if (oldGraph) {
                        oldGraph.remove();
                    }
                };

                // Update data - refresh everything
                var updateData = function()
                {
                    resetGraph();
                    updateGraph();
                    updateInteractions();
                };

                // Sets interactions for elements - allows selection
                var updateInteractions = function()
                {
                    d3.selectAll('.selectableRect').on('click', function(){

                        var elem = d3.select(this);
                        scope.$apply(function()
                        {
                            var id = elem.attr('id');

                            // If the element isn't already selected, select it
                            if(scope.model.selectedmultipleAnalysisElement !== id)
                            {
                                scope.model.selectedmultipleAnalysisElement = id;
                            }
                            // else, unselect it
                            else
                            {
                                scope.model.selectedmultipleAnalysisElement = undefined;
                            }
                            scope.computeDelta();
                            updateData();
                        });
                    });

                    // Get the tooltip div
                    var tooltip = d3.select('#tooltip')
                        .style('display','none');

                    // Handle rect events
                    d3.selectAll('.selectableRect')
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

                // Updates the graphic
                var updateGraph = function(){

                    var svgHeight = scope.model.multipleAnalysisBaseData[0].algo.length * 25;

                    // For each cells, create a SVG corresponding to the data of the cell
                    vis.selectAll('svg')
                        .data(scope.model.multipleAnalysisBaseData)
                        .enter()
                        .append('svg')
                        .each(function (d, i) {
                            var parent = this.parentNode.parentNode;
                            var targetIndex = parseInt(d3.select(parent.parentNode).attr('index'));
                            var algoIndex = 0;
                            var value;
                            if (i === targetIndex) {

                                // give its dimension
                                d3.select(this).attr("width", svgWidth )
                                    .attr("height", svgHeight);

                                for(algoIndex = 0; algoIndex< scope.model.multipleAnalysisBaseData[targetIndex].algo.length;algoIndex++)
                                {

                                    // Old way of computing value
                                    // value = (scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy - Math.max(scope.model.multipleAnalysisBaseData[targetIndex].rate, 1 - scope.model.multipleAnalysisBaseData[targetIndex].rate))/ (1 -  Math.max(scope.model.multipleAnalysisBaseData[targetIndex].rate, 1 - scope.model.multipleAnalysisBaseData[targetIndex].rate));
                                    // compute the value to display
                                    value = scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy;

                                    // draw Algorithm label
                                    d3.select(this).append('text')
                                        .attr("x", 0)
                                        .attr("y", 14 + algoIndex*(25))
                                        .text(scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].name);

                                    // Draw the colored rect displaying the value
                                    d3.select(this).append('rect')
                                        .attr("x", 30)
                                        .attr("y", algoIndex*(25))
                                        .attr("width", function(){
//                                            return scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy*(svgWidth - 30);
                                            return Math.max(0.05, value)*(svgWidth - 30);
                                        })
                                        .attr("height", rectHeight)
                                        .attr("fill", function()
                                        {
                                            // Color changed if the element is selected
                                            var selectedId;
                                            if(scope.model.selectedmultipleAnalysisElement != undefined)
                                            {
                                                selectedId = scope.model.selectedmultipleAnalysisElement.replace('previousRect','');
                                            }
                                            if(targetIndex+'_'+ algoIndex== selectedId)
                                            {
                                                //return 'yellow';
                                                return 'gray';
                                            }
                                            return color(scope.model.multipleAnalysisBaseData[targetIndex].rate);
                                        })
                                        .attr("kappa", function(){
                                            return scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy;
                                        })
                                        .attr("rate", function(){
                                            return scope.model.multipleAnalysisBaseData[targetIndex].rate;
                                        })
                                        .attr("used_value", function(){return value;})
                                        .attr('class', 'selectableRect')
                                        .attr('targetIndex', scope.model.multipleAnalysisBaseData[targetIndex].name)
                                        .attr('algoIndex', scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].name)
                                        .attr('id', targetIndex+'_'+algoIndex);

                                    // draw the border, equivalent to a 100% value
                                    d3.select(this).append('rect')
                                        .attr("x", 30)
                                        .attr("y", algoIndex*(25))
                                        .attr("width", function(){
                                            return (svgWidth - 30);
                                        })
                                        .attr("height", rectHeight)
                                        .attr("fill", 'rgba(0,0,0,0)')
                                        .attr('stroke', 'black')
                                        .attr('class', 'selectableRect')
                                        .attr("kappa", function(){
                                            return scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy;
                                        })
                                        .attr("rate", function(){
                                            return scope.model.multipleAnalysisBaseData[targetIndex].rate;
                                        })
                                        .attr("used_value", function(){return value;})
                                        .attr('targetIndex', scope.model.multipleAnalysisBaseData[targetIndex].name)
                                        .attr('algoIndex', scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].name)
                                        .attr('id', 'previousRect'+targetIndex+'_'+algoIndex);
                                }
                            }
                            else
                            {
                                // Remove the unused svg
                                d3.select(this).remove();
                            }
                        }
                    );
                };

                // Update graph when data change
                scope.$watch('model.multipleAnalysisBaseData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });

                // Update graph when an element is selected/unselected
                scope.$watch('model.selectedmultipleAnalysisElement', function(newValue, oldValue){
                    if(newValue !== oldValue && scope.model.multipleAnalysisBaseData != undefined)
                    {
                        updateData();
                    }
                });
            }
        }
    }
    ]);