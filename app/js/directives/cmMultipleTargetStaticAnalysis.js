/**
 * Created by stefas on 01/04/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetStaticAnalysis', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetStaticAnalysisDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var svgHeight = 20, svgWidth = 100;

                var vis = d3.selectAll('.multipleTargetStaticAnalysisDirective');

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

                var updateInteractions = function()
                {
                    d3.selectAll('.selectableStaticRect').on('click', function(){

                        var elem = d3.select(this);
                        scope.$apply(function()
                        {
                            //TODO

                        });
                    });

                    // Get the tooltip div
                    var tooltip = d3.select('#tooltip')
                        .style('display','none');

                    d3.selectAll('.selectableStaticRect')
                        .on('mouseover', function()
                        {
                            tooltip.html(this.getAttribute('value')+'%')
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px")
                                .style('position', 'absolute')
                                .style('text-align', 'center')
                                .style('width', '34px')
                                .style('height', '24px')
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
                        .data(scope.model.multipleAnalysisFeatureData)
                        .enter()
                        .append('svg')
                        .each(function (d, i) {
                            var parent = this.parentNode.parentNode.parentNode;
                            var featureIndex = parseInt(d3.select(parent).attr('index'));
                            if (i === featureIndex) {
                                d3.select(this).attr("width", svgWidth)
                                    .attr("height", svgHeight);

                                //for each static value
                                d3.select(this).selectAll('rect')
                                    .data(d.staticData).enter()
                                    .append('rect')
                                    .attr("x", function(elem, i){
                                        var value = 0;
                                        for(var j = 0; j<i; j++)
                                        {
                                            value += d.staticData[j].value;
                                        }
                                        return value*svgWidth;
                                    })
                                    .attr("y", 0)
                                    .attr("width", function(elem){
                                        return elem.value * svgWidth;
                                    })
                                    .attr("value", function(elem){
                                        return Math.round(elem.value * 100);
                                    })
                                    .attr('color', function(elem){return elem.color;})
                                    .attr("height", svgHeight)
                                    .attr("fill", function(elem){return elem.color;})
                                    .attr('class', 'selectableStaticRect')
                                    .attr('featureIndex', d.name)
                                    .attr('contextIndex', function(elem)
                                    {
                                        return elem.name;
                                    })
                                    .attr('id', featureIndex+'#'+0);

                                d3.select(this).append('rect')
                                    .attr("x", 0)
                                    .attr("y", 0)
                                    .attr("width", svgWidth)
                                    .attr("height", svgHeight)
                                    .attr("fill", 'none')
                                    .attr('stroke', 'black')
                                    .attr('class', 'selectableRect')
                                    .attr('featureIndex', d.name)
                                    .attr('contextIndex', d.contextualData.name)
                                    .attr('id', 'rect'+featureIndex+'#'+0);
                            }
                            else
                            {
                                d3.select(this).attr("width", 0)
                                    .attr("height", 0);
                            }
                        });
                };

                scope.$watch('model.multipleAnalysisFeatureData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });
            }
        }
    }]);