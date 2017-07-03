/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetAnalysisAllInOneCurrent', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetAnalysisAllInOneCurrentDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var rectHeight = 14,svgWidth = 220, svgFirstPartWidth = 150;

                // Used for coloring element, depending of their value
                var color = d3.scale.quantize().domain([0,0.9])
                    .range(['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081']);

                var vis = d3.selectAll('.multipleTargetAnalysisAllInOneCurrentDirective');

                // Reset graph
                var resetGraph = function()
                {
                    // Remove old existing chart
                    var oldGraph = vis.selectAll("svg");
                    if (oldGraph) {
                        oldGraph.remove();
                    }
                };

                // Update data  (refresh everything)
                var updateData = function()
                {
                    resetGraph();
                    updateGraph();
                    updateInteractions();
                };

                // Sets interactions for elements - allows selection
                var updateInteractions = function()
                {
                    d3.selectAll('.selectableCurrentRect').on('click', function(){

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
                    d3.selectAll('.selectableCurrentRect')
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

                    var svgHeight = scope.model.multipleAnalysisCurrentData[0].algo.length * 25;

                    // For each cells, create a SVG corresponding to the data of the cell
                    vis.selectAll('svg')
                        .data(scope.model.multipleAnalysisCurrentData)
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

                                for(var algoIndex = 0; algoIndex< scope.model.multipleAnalysisCurrentData[targetIndex].algo.length;algoIndex++)
                                {

                                    // Old way to compute value
                                    // value = (scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy - Math.max(scope.model.multipleAnalysisCurrentData[targetIndex].rate, 1 - scope.model.multipleAnalysisCurrentData[targetIndex].rate))/ (1 -  Math.max(scope.model.multipleAnalysisCurrentData[targetIndex].rate, 1 - scope.model.multipleAnalysisCurrentData[targetIndex].rate));
                                    // compute the value to display
                                    value = scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy;

                                    // draw Algorithm label
                                    d3.select(this).append('text')
                                        .attr("x", 0)
                                        .attr("y", 14 + algoIndex*(25))
                                        .text(scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].name);

                                    // Draw the colored rect displaying the value
                                    d3.select(this).append('rect')
                                        .attr("x", 30)
                                        .attr("y", algoIndex*(25))
                                        .attr("width", function(){
//                                            return scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy*(svgFirstPartWidth - 30);
                                            return Math.max(0.05, value)*(svgFirstPartWidth - 30);
                                        })
                                        .attr("height", rectHeight)
                                        .attr("fill", function()
                                        {
                                            var selectedId;
                                            if(scope.model.selectedmultipleAnalysisElement != undefined)
                                            {
                                                selectedId = scope.model.selectedmultipleAnalysisElement.replace('currentRect','');
                                            }
                                            if(targetIndex+'_'+ algoIndex== selectedId)
                                            {
                                                //return 'yellow';
                                                return 'gray';
                                            }
                                            return color(scope.model.multipleAnalysisCurrentData[targetIndex].rate);
                                        })
                                        .attr("kappa", function(){
                                            return scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy;
                                        })
                                        .attr("rate", function(){
                                            return scope.model.multipleAnalysisCurrentData[targetIndex].rate;
                                        })
                                        .attr('class', 'selectableCurrentRect')
                                        .attr('targetIndex', scope.model.multipleAnalysisCurrentData[targetIndex].name)
                                        .attr('algoIndex', scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].name)
                                        .attr('id', targetIndex+'_'+algoIndex);

                                    // draw the border, equivalent to a 100% value
                                    d3.select(this).append('rect')
                                        .attr("x", 30)
                                        .attr("y", algoIndex*(25))
                                        .attr("width", function(){
                                            return (svgFirstPartWidth - 30);
                                        })
                                        .attr("height", rectHeight)
                                        .attr("fill", 'rgba(0,0,0,0)')
                                        .attr('stroke', 'black')
                                        .attr('class', 'selectableCurrentRect')
                                        .attr("kappa", function(){
                                            return scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy;
                                        })
                                        .attr("rate", function(){
                                            return scope.model.multipleAnalysisCurrentData[targetIndex].rate;
                                        })
                                        .attr('targetIndex', scope.model.multipleAnalysisCurrentData[targetIndex].name)
                                        .attr('algoIndex', scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].name)
                                        .attr('id', 'currentRect'+targetIndex+'_'+algoIndex);

                                    if(scope.model.multipleAnalysisBaseData != undefined && scope.model.multipleAnalysisBaseData != undefined && scope.model.selectedmultipleAnalysisElement == undefined)
                                    {
                                        var tempValue, currentValue, previousValue, textValue;
//
//                                        // Compute the previous value
//                                        tempValue = (1 -  Math.max(scope.model.multipleAnalysisBaseData[targetIndex].rate, 1 - scope.model.multipleAnalysisBaseData[targetIndex].rate));
//                                        tempValue = tempValue + (tempValue == 0 ? 1 : 0);
//                                        previousValue = (scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy - Math.max(scope.model.multipleAnalysisBaseData[targetIndex].rate, 1 - scope.model.multipleAnalysisBaseData[targetIndex].rate))/ tempValue;
//
//                                        // Compute the previous value
//                                        tempValue = (1 -  Math.max(scope.model.multipleAnalysisCurrentData[targetIndex].rate, 1 - scope.model.multipleAnalysisCurrentData[targetIndex].rate));
//                                        tempValue = tempValue + (tempValue == 0 ? 1 : 0);
//                                        currentValue = (scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy - Math.max(scope.model.multipleAnalysisCurrentData[targetIndex].rate, 1 - scope.model.multipleAnalysisCurrentData[targetIndex].rate))/ tempValue;
//
//                                        textValue = currentValue - previousValue;

                                        previousValue = scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy;
                                        currentValue = scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy;

                                        textValue = Math.round((currentValue - previousValue)*10000)/100;

                                        d3.select(this).append('text')
                                            .attr("x", svgFirstPartWidth +5)
                                            .attr("y", 14 + algoIndex*(25))
                                            .text(textValue + "%")
                                            .attr('stroke', function()
                                            {
                                                if(textValue >= 0)
                                                {
                                                    return 'green';
                                                }
                                                return 'red';
                                            });
                                    }
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
                scope.$watch('model.multipleAnalysisCurrentData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });

                // Update graph when an element is selected/unselected
                scope.$watch('model.selectedmultipleAnalysisElement', function(newValue, oldValue){
                    if(newValue !== oldValue && scope.model.multipleAnalysisCurrentData != undefined)
                    {
                        updateData();
                    }
                });
            }
        }
    }]);