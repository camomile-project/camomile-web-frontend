/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmMultipleTargetCriteriaAnalysis', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="multipleTargetCriteriaAnalysisDirective"></div>',
            link: function (scope) {

                // Height and width of the SVGs
                var rectHeight = 34,svgWidth = 400, rectWidth = 20, textWidth = 0;//textWidth = 100;

                var vis = d3.selectAll('.multipleTargetCriteriaAnalysisDirective');


                // Just verify if the checkbox has to be checked or not
                scope.isChecked = function(name)
                {
                    // 'D' signifies the element can be deleted
                    return scope.model.multipleAnalysisCriteriaData[name].type === 'D';
                };

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
                    // Get the tooltip div
                    var tooltip = d3.select('#tooltip')
                        .style('display','none');

                    // Handle rect events
                    d3.selectAll('.criterionRect')
                        .on('mouseover', function()
                        {
                            tooltip.html('Criterion value: ' + (Math.round(d3.select(this).attr('score')*100)/100) +
                                    "<br>Corresponding target: "+d3.select(this).attr('criteria-name')
                                +"<br>Corresponding algorithm: "+d3.select(this).attr('criteria-algo'))
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px")
                                .style('position', 'absolute')
                                .style('text-align', 'left')
                                .style('width', '380px')
                                .style('height', '48px')
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
                        })
                        .on("click", function()
                        {
                            var targetIndex = d3.select(this).attr('target-index');
                            var algoIndex = d3.select(this).attr('algo-index');

                            // If a previous classifier was selected, a previous classifier will be selected
                            // If a current classifier was selected, a current classifier will be selected
                            var prefix;
                            if(scope.model.selectedmultipleAnalysisElement !== undefined)
                            {
                                if(scope.model.selectedmultipleAnalysisElement.indexOf('current') == -1)
                                {
                                    prefix = 'previousRect';
                                }
                                else
                                {
                                    prefix = 'currentRect';
                                }

                            }
                            else
                            {
                                prefix = 'currentRect';
                            }


                            var id = prefix+targetIndex+'_'+algoIndex;
                            scope.$apply(function(){

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
                            });
                        });

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

                                        if(critIndex % 2 === 0 && critIndex !== 0)
                                        {
                                            // Draw ticks separating criterion bars
                                            d3.select(this).append('line')
                                                .attr("x1", function(){
                                                    return textWidth + 2 + critIndex*(rectWidth+2) + ((parseInt(critIndex/2))*12) - 6;
                                                })
                                                .attr("y1", function(){
                                                    return svgHeight/4;
                                                })
                                                .attr("x2",  function(){
                                                    return textWidth + 2 + critIndex*(rectWidth+2) + ((parseInt(critIndex/2))*12) - 6;
                                                })
                                                .attr("y2", function(){
                                                    return 3*svgHeight/4;
                                                })
                                                .attr('stroke', 'black')
                                                .attr('stroke-width', '1');
                                        }


                                        // Draw the rect representing the criterion value
                                        d3.select(this).append('rect')
                                            .attr("x", function(){
                                                return textWidth + 2 + critIndex*(rectWidth+2) + ((parseInt(critIndex/2))*12) ;
                                            })
                                            .attr("y", function(){

                                                if( scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score >= 0)
                                                {
                                                    return svgHeight/2 - Math.abs(scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score/maxValue * svgHeight/2);
                                                }
                                                else
                                                {
                                                    return svgHeight/2;
                                                }
                                            })
                                            .attr("width", rectWidth)
                                            .attr("height", function(){
                                                return Math.abs(scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score/maxValue * svgHeight/2);
                                            })
                                            .attr('fill', function()
                                            {
                                                if(scope.model.selectedmultipleAnalysisElement != undefined)
                                                {
                                                    var index = scope.model.selectedmultipleAnalysisElement.replace('currentRect','').replace('previousRect','').split('_');

                                                    index = parseInt(index[0])*2 + parseInt(index[1]);
                                                    if(critIndex === index)
                                                    {
                                                        //return 'yellow';
                                                        return 'gray';
                                                    }
                                                }
//                                                if((scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].type === "A" && scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score >=0)
//                                                    ||
//                                                    (scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].type === "D" && scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score <=0))
                                                if(scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score >=0)
                                                {
                                                    return "green";
                                                }
                                                else
                                                {
                                                    return 'red';
                                                }
                                            });

                                        // Draw the rect representing the criterion value
                                        d3.select(this).append('rect')
                                            .attr("x", function(){
                                                return textWidth + 2 + critIndex*(rectWidth+2) + ((parseInt(critIndex/2))*12) ;
                                            })
                                            .attr("y", 0)
                                            .attr("width", rectWidth)
                                            .attr("height", svgHeight)
                                            .attr('fill', 'rgba(0,0,0,0)')
                                            .attr('class', 'criterionRect')
                                            .attr('critIndex', function(){

                                            })
                                            .attr("score", function(){
                                                return scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].score;
                                            })
                                            .attr("criteria-name", function(){
                                                return scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].targetName;
                                            })
                                            .attr("criteria-algo", function(){
                                                return scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].algorithmName;
                                            })
                                            .attr("target-index", function(){
                                                return scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].targetIndex;
                                            })
                                            .attr("algo-index", function(){
                                                return scope.model.multipleAnalysisCriteriaData[featureIndex].criteria[critIndex].algoIndex;
                                            });


                                        // Draw the middle line
                                        d3.select(this).append('line')
                                            .attr("x1", textWidth)
                                            .attr("y1", function(){
                                                return svgHeight/2;
                                            })
                                            .attr("x2", svgWidth)
                                            .attr("y2", function(){
                                                return svgHeight/2;
                                            })
                                            .attr('stroke', 'black')
                                            .attr('stroke-width', '1');
                                    }

                                    // draw the border, equivalent to a 100% score
                                    d3.select(this).append('rect')
                                        .attr("x", textWidth)
                                        .attr("y", 0)
                                        .attr("width", svgWidth - textWidth)
                                        .attr("height", rectHeight)
                                        .attr("fill", 'none')
                                        .attr('stroke', 'black')
                                        .attr('criterionIndex', scope.model.multipleAnalysisCriteriaData[featureIndex].name)
                                        .attr('id', 'rect'+featureIndex);

                                    // Write the value of the max
//                                    d3.select(this).append('text')
//                                        .attr("x", 0)
//                                        .attr("y", 22)
//                                        .text("Max: " + Math.round(scope.model.multipleAnalysisCriteriaData[featureIndex].maxValue*100)/100);
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

                // Event when click on the ckeckbox (called in the html file)
                scope.checkFeature = function(name, elem)
                {
                    scope.AddorRemoveFeature(name, elem.currentTarget.checked);
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
        }
    }
    ]);