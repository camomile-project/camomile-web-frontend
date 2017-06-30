/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetAnalysisBisBis', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetAnalysisBisBisDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var svgHeight = 20, svgWidth = 120;

                var vis = d3.selectAll('.multipleTargetAnalysisBisBisDirective');

                // Reset graph
                var resetGraph = function()
                {
                    // Remove old existing chart
                    var oldGraph = vis.selectAll("svg");
                    if (oldGraph) {
                        oldGraph.remove();
                    }
                };

                // Update data
                var updateData = function()
                {
                    resetGraph();
                    updateTable();
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
                            id = id.replace('rect','');
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
                            tooltip.html('rate: '+Math.round(this.getAttribute('rate')*100)+'%\naccuracy: '+Math.round(this.getAttribute('accuracy')*100)+"%")
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

                var updateTable = function(){

                    // For each cells, create a SVG corresponding to the data of the cell
                    vis.selectAll('svg')
                        .data(scope.model.multipleAnalysisBaseData)
                        .enter()
                        .append('svg')
                        .each(function (d, i) {
                            var parent = this.parentNode.parentNode;
                            var targetIndex = parent.cellIndex-1;
                            var algoIndex = parseInt(d3.select(parent.parentNode).attr('index'));
                            if (i === algoIndex) {
                                // give its dimension
                                d3.select(this).attr("width", svgWidth)
                                    .attr("height", svgHeight);

                                // Draw the colored rect displaying the value
                                d3.select(this).append('rect')
                                    .attr("x", 0)
                                    .attr("y", 0)
                                    .attr("width", function(){
                                        return scope.model.multipleAnalysisBaseData[algoIndex].data[targetIndex].accuracy*svgWidth;
                                    })
                                    .attr("height", svgHeight)
                                    .attr("fill", function()
                                    {
                                        if(algoIndex+'#'+targetIndex == scope.model.selectedmultipleAnalysisElement)
                                        {
                                            return 'rgba(0,0,255,' + scope.model.multipleAnalysisBaseData[algoIndex].rate +')';
                                        }
                                        return 'rgba(255,0,0,' + scope.model.multipleAnalysisBaseData[algoIndex].rate +')';
                                    })
                                    .attr("accuracy", function(){
                                        return scope.model.multipleAnalysisBaseData[algoIndex].data[targetIndex].accuracy;
                                    })
                                    .attr("rate", function(){
                                        return scope.model.multipleAnalysisBaseData[algoIndex].rate;
                                    })
                                    .attr('class', 'selectableRect')
                                    .attr('algoIndex', scope.model.multipleAnalysisBaseData[algoIndex].name)
                                    .attr('targetIndex', scope.model.multipleAnalysisBaseData[algoIndex].data[targetIndex].name)
                                    .attr('id', algoIndex+'#'+targetIndex);

                                // draw the border, equivalent to a 100% value
                                d3.select(this).append('rect')
                                    .attr("x", 0)
                                    .attr("y", 0)
                                    .attr("width", function(){
                                        return svgWidth;
                                    })
                                    .attr("height", svgHeight)
                                    .attr("fill", 'rgba(0,0,0,0)')
                                    .attr('stroke', 'black')
                                    .attr('class', 'selectableRect')
                                    .attr("accuracy", function(){
                                        return scope.model.multipleAnalysisBaseData[algoIndex].data[targetIndex].accuracy;
                                    })
                                    .attr("rate", function(){
                                        return scope.model.multipleAnalysisBaseData[algoIndex].rate;
                                    })
                                    .attr('algoIndex', scope.model.multipleAnalysisBaseData[algoIndex].name)
                                    .attr('targetIndex', scope.model.multipleAnalysisBaseData[algoIndex].data[targetIndex].name)
                                    .attr('id', 'rect'+algoIndex+'#'+targetIndex);
                            }
                            else
                            {
                                d3.select(this).attr("width", 0)
                                    .attr("height", 0);
                            }
                        }
                    );
                };

                scope.$watch('model.multipleAnalysisBaseData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });
            }
        }
    }
    ]);