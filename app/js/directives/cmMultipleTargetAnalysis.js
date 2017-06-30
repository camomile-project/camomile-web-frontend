/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetAnalysis', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetAnalysisDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var svgHeight = 50, svgWidth = 50;

                var vis = d3.selectAll('.multipleTargetAnalysisDirective');
//                d3.selectAll('#test').on('click', function(){updateData()});

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
//                    scope.model.multipleAnalysisDataWereUpdated = false;
//                    scope.model.truc=0;
                };

                // Update data
//                var updateData = function()
//                {
//                    console.log('updateData')
//                    resetGraph();
//                    if(scope.model.multipleAnalysisDataWereUpdated)
//                    {
//                        updateTable();
//                        scope.model.multipleAnalysisDataWereUpdated = false;
//                        scope.model.truc=0;
//                    }
//                    else
//                    {
//                        scope.model.truc++;
//                        if(scope.model.truc === scope.model.multipleAnalysisData.length*scope.model.multipleAnalysisData[0].data.length -1)
//                        {
//                            scope.model.multipleAnalysisDataWereUpdated = true;
//                        }
//                    }
//                };

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
                            tooltip.html('result: '+this.getAttribute('result')+'%\nprecision: '+this.getAttribute('precision')+"%")
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
                        .data(scope.model.multipleAnalysisData)
                        .enter()
                        .append('svg')
                        .each(function (d, i) {
                            var parent = this.parentNode.parentNode;
                            var targetIndex = parent.cellIndex-1;
                            var algoIndex = parseInt(d3.select(parent.parentNode).attr('index'));
                            if (i === algoIndex) {
                                d3.select(this).attr("width", svgWidth)
                                    .attr("height", svgHeight);
                                d3.select(this).append('rect')
                                    .attr("x", 0)
                                    .attr("y", 0)
                                    .attr("width", function(){
                                        return scope.model.multipleAnalysisData[algoIndex].data[targetIndex].precision*svgWidth;
                                    })
                                    .attr("height", function(){
                                        return scope.model.multipleAnalysisData[algoIndex].data[targetIndex].precision*svgHeight;
                                    })
                                    .attr("fill", function()
                                    {
                                        if(algoIndex+'#'+targetIndex == scope.model.selectedmultipleAnalysisElement)
                                        {
                                            return 'rgba(0,0,255,' + scope.model.multipleAnalysisData[algoIndex].result +')';
                                        }
                                        return 'rgba(255,0,0,' + scope.model.multipleAnalysisData[algoIndex].result +')';
                                    })
                                    .attr("precision", function(){
                                        return Math.round(scope.model.multipleAnalysisData[algoIndex].data[targetIndex].precision * 100);
                                    })
                                    .attr("result", function(){
                                        return Math.round(scope.model.multipleAnalysisData[algoIndex].result * 100);
                                    })
                                    .attr('class', 'selectableRect')
                                    .attr('algoIndex', scope.model.multipleAnalysisData[algoIndex].name)
                                    .attr('targetIndex', scope.model.multipleAnalysisData[algoIndex].data[targetIndex].name)
                                    .attr('id', algoIndex+'#'+targetIndex);

                                d3.select(this).append('rect')
                                    .attr("x", 0)
                                    .attr("y", 0)
                                    .attr("width", svgWidth)
                                    .attr("height", svgHeight)
                                    .attr("fill", 'rgba(0,0,0,0)')
                                    .attr('stroke', 'black')
                                    .attr('class', 'selectableRect')
                                    .attr("precision", function(){
                                        return Math.round(scope.model.multipleAnalysisData[algoIndex].data[targetIndex].precision * 100);
                                    })
                                    .attr("result", function(){
                                        return Math.round(scope.model.multipleAnalysisData[algoIndex].result * 100);
                                    })
                                    .attr('algoIndex', scope.model.multipleAnalysisData[algoIndex].name)
                                    .attr('targetIndex', scope.model.multipleAnalysisData[algoIndex].data[targetIndex].name)
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

                scope.$watch('model.multipleAnalysisData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });
            }
        }
    }
    ]);