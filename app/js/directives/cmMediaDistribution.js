/**
 * Created by stefas on 07/12/15.
 */
angular.module('myApp.directives')
    .directive('cmMediaDistribution', [function () {

        return {
            restrict: 'E',
            replace: true,
            template: '<div id="mediaDistributionDirective"></div>',
            link: function (scope) {

                console.log("cmMediaDistribution installed");

                scope.model.personData = {};
                scope.model.selected_medium_distribution = undefined;

                var divToolTip = d3.select("#tooltip-detail").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                var initData = function()
                {
                    if(scope.model.selectedElement == undefined)
                    {
                        return;
                    }

                    // This will store media information
                    scope.model.mediaDistribution = [];

                    //  Initialise the data
                    for(var i = 0, maxI = scope.model.selectedElement.media.length; i<maxI; i++)
                    {
                        scope.model.mediaDistribution.push(
                            {
                                'media_id':scope.model.selectedElement.media[i],
                                'id':i,
                                'metrics':{
                                    // TODO: Only duration is a real one, for now
                                    'Nothing':1.0,
                                    'F':scope.model.selectedElement.media_metrics[scope.model.selectedElement.media[i]].totalValues.F,
                                    'A':scope.model.selectedElement.media_metrics[scope.model.selectedElement.media[i]].totalValues.A,
                                    'B':scope.model.selectedElement.media_metrics[scope.model.selectedElement.media[i]].totalValues.B,
                                    'duration':scope.model.selectedElement.media_metrics[scope.model.selectedElement.media[i]].totalValues.duration

                                },
                                'color': scope.model.selectedElement.media_color[i],
                                'MaxMetricsValue': scope.model.selectedElement.media_metrics.media_max_value

                            }
                        )
                    }

                    // This will initialise media name
                    scope.initDetailData();
                };

                var updateGraphic = function(){

                    // Stop here if no selected element
                    if(scope.model.selectedElement == undefined)
                    {
                        return;
                    }

                    var directive = d3.select("#mediaDistributionDirective");

                    var oldDirective = directive.select("#mediaDistributionDetail");
                    if (oldDirective) {
                        oldDirective.remove();
                    }

                    directive = directive.append('div').attr('id', 'mediaDistributionDetail');

                    var svg = directive.append('svg').attr('height', '130px').attr('width', function(){
                        return scope.model.mediaDistribution.length * 100;
                    });

                    svg.selectAll('rect')
                        .data(scope.model.mediaDistribution)
                        .enter()
                        .append('rect')
                        .attr('class', 'hoverable-element')
                        .attr('x', function(d,i){
                            return (i*100) + 'px';
                        })
                        .attr('y', function(d){
                            return 100 -(d['metrics'][scope.model.selectedMediaMetric]/d['MaxMetricsValue'][scope.model.selectedMediaMetric] * 70) + 'px';
                        })
                        .attr('width', '40px')
                        .attr('height', function(d){
                            return (d['metrics'][scope.model.selectedMediaMetric]/d['MaxMetricsValue'][scope.model.selectedMediaMetric] * 70) + 'px';
                        })
                        .attr('fill', function(d){
                            if(scope.model.selected_medium_distribution != undefined && scope.model.selected_medium_distribution.id === d.id)
                            {
                                return 'red';
                            }
                            return d.color;
                        })
                        .attr('stroke', function(d){
                            if(scope.model.selected_medium_distribution != undefined && scope.model.selected_medium_distribution.id === d.id)
                            {
                                return 'crimson';
                            }

                            return 'black';
                        })
                        .attr('stroke-width', function(d){
                            if(scope.model.selected_medium_distribution != undefined && scope.model.selected_medium_distribution.id === d.id)
                            {
                                return '6px';
                            }

                            return '1px';
                        });

                    var mediumLabels = svg.selectAll("text")
                        .data(scope.model.mediaDistribution)
                        .enter()
                        .append("text")
                        .attr('class', 'hoverable-element');


                    mediumLabels.attr("x", function (d,i) {
                        return (i*100 ) + 'px';
                    })
                        .attr("y", '120px')
                        .text(function (d) {
                            if(d.media_id.length>10)
                            {
                                return d.media_id.substring(0,8) +'...';
                            }
                            else{
                                return d.media_id;
                            }
                        })
                        .attr("max-width", "50px")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "16px")
                        .attr('font-weight', 'normal')
                        .attr('fill', 'black');

                    var metricValues = svg.selectAll("text2")
                        .data(scope.model.mediaDistribution)
                        .enter()
                        .append("text")
                        .attr('class', 'hoverable-element');

                    metricValues.attr("x", function (d,i) {
                        return (i*100 ) + 'px';
                    })
                        .attr("y", '15px')
                        .html(function (d) {
                            return Math.round(d.metrics[scope.model.selectedMediaMetric]* 100) / 100;
                        })
                        .attr("max-width", "50px")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "16px")
                        .attr('font-weight', 'normal')
                        .attr('fill', 'black');

                    d3.selectAll('.hoverable-element')
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

                            var oldTooltip = d3.select("#tooltip-div");
                            if (oldTooltip) {
                                oldTooltip.remove();
                            }

                            divToolTip.transition()
                                .duration(200)
                                .style("opacity",0.9);

                            var positionX = d3.event.pageX;
                            var positionY = d3.event.pageY;

                            divToolTip.style("left", (positionX) + "px")
                                .style("top", (positionY - 10) + "px");

                            divToolTip.append("div").attr("id", "tooltip-div")
                                .style("color", "white");

                            document.getElementById("tooltip-div")
                                .appendChild(JsonHuman.format({
                                    'media_name': d.mediaName,
                                    'id': d.id,
                                    'media_id': d.media_id,
                                    'value': d.metrics[scope.model.selectedMediaMetric]

                                }));
                        })
                        .on('click', function(d,i){

                            // store selected element
                            scope.$apply(function(){

                                if(scope.model.selected_medium_distribution != undefined)
                                {
                                    var id = scope.model.selected_medium_distribution.id;
                                    scope.resetAnnotationData();

                                    if(id == d.id)
                                    {
                                        updateGraphic();
                                        return
                                    }
                                }

                                // store selected element color
                                scope.model.selected_medium_distribution = d;
                                scope.model.selected_medium = d.media_id;
                                scope.$parent.updateAnnotationData(scope.model.personData.name, d.media_id);

                            });
                            updateGraphic();

                        });

                };

                // Re init data and update graphic part
                scope.updateData = function() {

                    async.series(
                        [
                        function(callback){
                            callback(null, initData());

                        },function(callback){
                            callback(null, updateGraphic());
                        }
                        ]);

                };

                // Event when the metric from the media distribution is changed
                scope.$watch('model.selectedMediaMetric', function(newValue)
                {
                    if(newValue)
                    {
                        scope.updateData();
                    }
                });

                // Event when the media distribution part is displayed
                scope.$watch('model.detailIsDisplayed', function(newValue){
                    if(newValue != false)
                    {
                        scope.updateData();

                    }
                });
            }
        };
    }]);