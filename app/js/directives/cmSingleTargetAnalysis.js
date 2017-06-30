/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.directives')
    .directive('cmSingleTargetAnalysis', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="singleTargetAnalysisDirective"></div>',
            link: function (scope) {

                var svgHeight = 120, svgWidth = 500;
                var legendHeight = 120;
                var margin = {left:10,right:10, top:10, bottom:10};
                var backgroundRectWidth = svgWidth - margin.left-margin.right;
                var backgroundRectHeight = 40;
                var colors = {found:'blue', miss:'red', success:'lightgray', failed: 'orange'};
                var textHeight = 12;

                // svg where the graph will be drawn
                var vis = d3.select('#singleTargetAnalysisDirective')
                    .append('svg')
                    .attr("width", svgWidth)
                    .attr("height", svgHeight + legendHeight + 400);

                // Get the tooltip div
                var tooltip = d3.select('#tooltip')
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
                    .style('display','none');

                // Reset graph
                var resetGraph = function()
                {
                    // Remove old existing chart
                    var oldGraph = vis.selectAll("g");
                    if (oldGraph) {
                        oldGraph.remove();
                    }
                };

                var updateLegend = function()
                {
                    var legend = vis.append('g');

                    // Success rect
                    legend.append('rect')
                        .attr('x', margin.left)
                        .attr('y',svgHeight + margin.top + 14)
                        .attr("width", 14)
                        .attr("height", 14)
                        .attr('fill', 'url(#success)')
                        .attr('stroke', 'black');

                    // Success label
                    legend.append('text')
                        .attr('x', margin.left*3 )
                        .attr('y',svgHeight + (margin.top + 14) + textHeight)
                        .text('Success');

//                    // Fail rect
//                    legend.append('rect')
//                        .attr('x', margin.left)
//                        .attr('y',svgHeight + (margin.top + 14)*2)
//                        .attr("width", 14)
//                        .attr("height", 14)
//                        .attr('fill','url(#failed)')
//                        .attr('stroke', 'black');

//                    // Fail label
//                    legend.append('text')
//                        .attr('x', margin.left*3 )
//                        .attr('y',svgHeight + (margin.top + 14)*2 + textHeight)
//                        .text('Fail');

                    // Found rect
                    legend.append('rect')
                        .attr('x', margin.left)
                        .attr('y',svgHeight + (margin.top + 14)*2)
                        .attr("width", 14)
                        .attr("height", 14)
                        .attr('fill', colors.found)
                        .attr('stroke', 'black');

                    // Found label
                    legend.append('text')
                        .attr('x', margin.left*3 )
                        .attr('y',svgHeight + (margin.top + 14)*2 + textHeight)
                        .text('Found');


                    // miss rect
                    legend.append('rect')
                        .attr('x', margin.left)
                        .attr('y',svgHeight + (margin.top + 14)*3)
                        .attr("width", 14)
                        .attr("height", 14)
                        .attr('fill', colors.miss)
                        .attr('stroke', 'black');

                    // miss label
                    legend.append('text')
                        .attr('x', margin.left*3 )
                        .attr('y',svgHeight + (margin.top + 14)*3 + textHeight)
                        .text('miss');
                };

                // Update graph
                var updateGraphLineVersion = function()
                {
                    var svg = vis.append('g');

                    // Dash pattern for miss elements
                    svg.append('defs')
                        .append('pattern')
                        .attr('id', 'failed')
                        .attr('patternUnits', 'userSpaceOnUse')
                        .attr('width', 4)
                        .attr('height', 4)
                        .append('path')
                        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
                        .attr('stroke', colors.failed)
                        .attr('stroke-width', 1);

                    // Dash pattern for found elements
                    svg.append('defs')
                        .append('pattern')
                        .attr('id', 'success')
                        .attr('patternUnits', 'userSpaceOnUse')
                        .attr('width', 4)
                        .attr('height', 4)
                        .append('path')
                        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
                        .attr('stroke', colors.success)
                        .attr('stroke-width', 1);


                    // Draw the found bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.found)
                        .attr('x', margin.left + (backgroundRectWidth/2 - scope.model.singleAnalysisData.found*backgroundRectWidth/200))
                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
                        .attr("width", scope.model.singleAnalysisData.found*backgroundRectWidth/200)
                        .attr("height", backgroundRectHeight)
                        .attr('fill', colors.found);

                    // Draw the found-success bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['found-success'])
                        .attr('x', margin.left + (backgroundRectWidth/2 - scope.model.singleAnalysisData['found-success']*backgroundRectWidth/200))
                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
                        .attr("width", scope.model.singleAnalysisData['found-success']*backgroundRectWidth/200)
                        .attr("height", backgroundRectHeight)
                        .attr('fill', 'url(#success)');

//                    // Draw the found-fail bar
//                    svg.append('rect')
//                        .attr('class', 'rectWithValue')
//                        .attr('value', scope.model.singleAnalysisData.found - scope.model.singleAnalysisData['found-success'])
//                        .attr('x', margin.left + (backgroundRectWidth/2 - scope.model.singleAnalysisData.found*backgroundRectWidth/200))
//                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
//                        .attr("width", (scope.model.singleAnalysisData.found - scope.model.singleAnalysisData['found-success'])*backgroundRectWidth/200)
//                        .attr("height", backgroundRectHeight)
//                        .attr('fill', 'url(#failed)');

                    // Draw the miss bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.miss)
                        .attr('x', margin.left + (backgroundRectWidth/2))
                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
                        .attr("width", scope.model.singleAnalysisData.miss*backgroundRectWidth/200)
                        .attr("height", backgroundRectHeight)
                        .attr('fill', colors.miss);

                    // Draw the miss-success bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['miss-success'])
                        .attr('x', margin.left + (backgroundRectWidth/2))
                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
                        .attr("width", scope.model.singleAnalysisData['miss-success']*backgroundRectWidth/200)
                        .attr("height", backgroundRectHeight)
                        .attr('fill','url(#success)');

//                    // Draw the miss-failed bar
//                    svg.append('rect')
//                        .attr('class', 'rectWithValue')
//                        .attr('value', scope.model.singleAnalysisData.miss - scope.model.singleAnalysisData['miss-success'])
//                        .attr('x', margin.left + (backgroundRectWidth/2) + scope.model.singleAnalysisData['miss-success']*backgroundRectWidth/200)
//                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
//                        .attr("width", (scope.model.singleAnalysisData.miss - scope.model.singleAnalysisData['miss-success'])*backgroundRectWidth/200)
//                        .attr("height", backgroundRectHeight)
//                        .attr('fill','url(#failed)');

                    // Draw the "background" rect
                    svg.append('rect')
                        .attr('x', margin.left)
                        .attr('y',svgHeight/2 - backgroundRectHeight/2)
                        .attr("width", backgroundRectWidth)
                        .attr("height", backgroundRectHeight)
                        .attr('stroke', 'black')
                        .attr('rx', '8px')
                        .attr('ry', '8px')
                        .attr('fill','none');

                    // Draw the central line:
                    svg.append('line')
                        .attr('x1', svgWidth/2)
                        .attr('y1', margin.top)
                        .attr('x2', svgWidth/2)
                        .attr('y2', svgHeight - margin.bottom)
                        .attr('stroke', 'black');
                };

                // Update data
                var updateData = function()
                {
                    resetGraph();
                    updateGraphLineVersion();
                    updateGraphSquareVersion();
                    updateLegend();

                    updateGraphSquareVersion2();
                    updateInteractions();
                };

                // Update interactions
                var updateInteractions= function(){
                    // Handle rect events
                    d3.selectAll('.rectWithValue')
                        .on('mouseover', function()
                        {
                            tooltip.html(this.getAttribute('value')+'%')
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px")
                                .style('display', 'block');
                        })
                        .on('mouseout', function(){
                            tooltip.style('display','none');
                        });
                };

                var updateGraphSquareVersion = function(){

                    var svg = vis.append('g');

                    // Central point
                    var center = {x: margin.left + backgroundRectWidth/2, y: margin.top + svgHeight*2};

                    var air = svgHeight*svgHeight;


                    // Draw the found bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.found)
                        .attr('x', center.x - Math.round(Math.sqrt(air*scope.model.singleAnalysisData.found/100)))
                        .attr('y',center.y - Math.round(Math.sqrt(air*scope.model.singleAnalysisData.found/100)))
                        .attr("width", Math.round(Math.sqrt(air*scope.model.singleAnalysisData.found/100)))
                        .attr("height", Math.round(Math.sqrt(air*scope.model.singleAnalysisData.found/100)))
                        .attr('fill', colors.found);

                    // Draw the miss bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.miss)
                        .attr('x', center.x)
                        .attr('y',center.y - Math.round(Math.sqrt(air*scope.model.singleAnalysisData.miss/100)))
                        .attr("width", Math.round(Math.sqrt(air*scope.model.singleAnalysisData.miss/100)))
                        .attr("height", Math.round(Math.sqrt(air*scope.model.singleAnalysisData.miss/100)))
                        .attr('fill', colors.miss);

                    // Draw the found-success bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['found-success'])
                        .attr('x', center.x - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('y',center.y - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('fill', 'url(#success)');

                    // Draw the failed bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['miss-success'])
                        .attr('x', center.x)
                        .attr('y',center.y - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr('fill', 'url(#success)');

                    // Draw the "background" bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.found)
                        .attr('x', center.x - svgHeight)
                        .attr('y',center.y - svgHeight)
                        .attr("width", svgHeight)
                        .attr("height", svgHeight)
                        .attr('fill', 'none')
                        .attr('stroke', 'black');

                    // Draw the "background" bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.found)
                        .attr('x', center.x)
                        .attr('y',center.y - svgHeight)
                        .attr("width", svgHeight)
                        .attr("height", svgHeight)
                        .attr('fill', 'none')
                        .attr('stroke', 'black');

                };

                var updateGraphSquareVersion2 = function(){

                    var svg = vis.append('g');

                    // Central point
                    var center = {x: margin.left + backgroundRectWidth/2, y: margin.top*4 + svgHeight*3};

                    var air = svgHeight*svgHeight;

                    // Draw the found-success bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['found-success'])
                        .attr('x', center.x - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('y',center.y - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('fill', colors.found);

                    // Draw the found-fail bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.found-scope.model.singleAnalysisData['found-success'])
                        .attr('x', center.x - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData.found-scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('y',center.y)
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData.found-scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData.found-scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('fill', colors.found);

                    // Draw the found-success bar (the dash path)
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['found-success'])
                        .attr('x', center.x - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('y',center.y - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['found-success'])/100)))
                        .attr('fill', 'url(#success)');

                    // Draw the miss bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['miss-success'])
                        .attr('x', center.x)
                        .attr('y',center.y - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr('fill', colors.miss);

                    // Draw the miss-success bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData['miss-success'])
                        .attr('x', center.x)
                        .attr('y',center.y - Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr('fill', 'url(#success)');

                    // Draw the miss-fail bar
                    svg.append('rect')
                        .attr('class', 'rectWithValue')
                        .attr('value', scope.model.singleAnalysisData.miss-scope.model.singleAnalysisData['miss-success'])
                        .attr('x', center.x)
                        .attr('y',center.y)
                        .attr("width", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData.miss-scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr("height", Math.round(Math.sqrt(air*(scope.model.singleAnalysisData.miss-scope.model.singleAnalysisData['miss-success'])/100)))
                        .attr('fill', colors.miss);

                    // Draw the "background" bar
                    svg.append('rect')
                        .attr('x', center.x - svgHeight)
                        .attr('y',center.y - svgHeight)
                        .attr("width", svgHeight)
                        .attr("height", svgHeight)
                        .attr('fill', 'none')
                        .attr('stroke', 'black');

                    // Draw the "background" bar
                    svg.append('rect')
                        .attr('x', center.x)
                        .attr('y',center.y - svgHeight)
                        .attr("width", svgHeight)
                        .attr("height", svgHeight)
                        .attr('fill', 'none')
                        .attr('stroke', 'black');

                    // Draw the "background" bar
                    svg.append('rect')
                        .attr('x', center.x - svgHeight)
                        .attr('y',center.y)
                        .attr("width", svgHeight)
                        .attr("height", svgHeight)
                        .attr('fill', 'none')
                        .attr('stroke', 'black');

                    // Draw the "background" bar
                    svg.append('rect')
                        .attr('x', center.x)
                        .attr('y',center.y)
                        .attr("width", svgHeight)
                        .attr("height", svgHeight)
                        .attr('fill', 'none')
                        .attr('stroke', 'black');

                    // Labels for Fail
                    svg.append('text').text('Fail')
                        .attr('x', center.x + svgHeight + margin.left )
                        .attr('y',(center.y +svgHeight/2) - textHeight + 14);

                    // Labels for Miss
                    svg.append('text').text('Miss')
                        .attr('x', center.x + svgHeight/4 + margin.left )
                        .attr('y',(center.y - svgHeight -  14 - margin.top) + textHeight);

                    // Labels for Found
                    svg.append('text').text('Found')
                        .attr('x', center.x - 3 * svgHeight/4 + margin.left )
                        .attr('y',center.y - svgHeight -  14 - margin.top + textHeight);

                    // Labels for Success
                    svg.append('text').text('Success')
                        .attr('x', center.x + svgHeight + margin.left )
                        .attr('y',(center.y -svgHeight/4) - textHeight - 14);

                };

                scope.$watch('model.singleAnalysisData', function(newValue){
                    if(newValue)
                    {
                        updateData();
                    }
                });

            }
        }
    }]);