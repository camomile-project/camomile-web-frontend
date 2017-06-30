/**
 * Created by stefas on 04/05/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetCriteriaImportanceAnalysis', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetCriteriaImportanceAnalysisDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var rectHeight = 17,svgWidth = 180;

                var vis = d3.selectAll('.multipleTargetCriteriaImportanceAnalysisDirective');

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
                    updateGraph();
                    updateInteractions();
                };

                // Sets interactions for elements
                var updateInteractions = function()
                {
                    // TODO: For now, no interaction available
                };

                // Update the graphic view
                var updateGraph = function(){

                    if(scope.model.multipleAnalysisCriteriaData.length != 0)
                    {
                        var svgHeight = rectHeight;

                        // For each cells, create a SVG corresponding to the data of the cell
                        vis.selectAll('svg')
                            .data(scope.model.multipleAnalysisCriteriaData)
                            .enter()
                            .append('svg')
                            .each(function (d, i) {
                                var parent = this.parentNode.parentNode;
                                var featureIndex = parseInt(d3.select(parent.parentNode).attr('index'));
                                if (i === featureIndex) {

                                    // give its dimension
                                    d3.select(this).attr("width", svgWidth)
                                        .attr("height", svgHeight);

                                    var critIndex, maxCritIndex, maxValue = (scope.model.multipleAnalysisCriteriaData[featureIndex].maxValue == 0)? 1 : scope.model.multipleAnalysisCriteriaData[featureIndex].maxValue;

                                    for(critIndex = 0, maxCritIndex = scope.model.multipleAnalysisCriteriaData[featureIndex].criteria.length; critIndex < maxCritIndex;critIndex++)
                                    {
                                        // draw the value as bar
                                        d3.select(this).append('rect')
                                            .attr("x", 0)
                                            .attr("y", 0)
                                            .attr("width", function()
                                            {
                                                return maxValue/scope.model.multipleAnalysisCriteriaMaximalValue*svgWidth;
                                            })
                                            .attr("height", rectHeight)
                                            .attr("fill", 'gray');

                                        // draw the border, equivalent to a 100% score
                                        d3.select(this).append('rect')
                                            .attr("x", 0)
                                            .attr("y", 0)
                                            .attr("width", svgWidth)
                                            .attr("height", rectHeight)
                                            .attr("fill", 'none')
                                            .attr('stroke', 'black');
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

                // Update graph when data change
                scope.$watch('model.multipleAnalysisCriteriaData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });

                // Update graph when an element is selected/unselected
                scope.$watch('model.selectedmultipleAnalysisElement', function(newValue, oldValue){
                    if(newValue != oldValue)
                    {
                        updateData();
                    }
                });

            }
        };
    }]);