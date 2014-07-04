'use strict';

/* Directives */


angular.module('myApp.directives', ['myApp.filters', 'myApp.services']).
	directive('appVersion', ['version', function (version) {
		return function (scope, elm, attrs) {
			elm.text(version);
		};
	}])

	.directive('cmVideoPlayer', ['DateUtils', function (DateUtils) {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				scope.model.toggle_play = function (value) {
					if (scope.model.play_state !== undefined) {
						if (value !== undefined) {
							scope.model.play_state = value;
						} else {
							scope.model.play_state = !scope.model.play_state;
						}

						if (scope.model.play_state) {
							element[0].play();
						} else {
							element[0].pause();
						}
					}
				};

				element[0].addEventListener("loadedmetadata", function () {
					scope.$apply(function () {
						scope.model.play_state = false;
						scope.model.current_time = 0;
						scope.model.restrict_toggle = 0;
						scope.model.infbndsec = 0;
						scope.model.duration = element[0].duration;
						scope.model.supbndsec = scope.model.duration;
					});
				});

				scope.$watch("model.current_time", function (newValue) {
					if (newValue !== undefined && element[0].readyState !== 0) {
						scope.model.current_time_display = DateUtils.timestampFormat(DateUtils.parseDate(scope.model.current_time));
						element[0].currentTime = newValue;
					}
				});

				element[0].addEventListener("timeupdate", function () {
					scope.$apply(function () {
						// if player paused, currentTime has been changed for exogenous reasons
						if(!element[0].paused) {
							scope.model.current_time = element[0].currentTime;
						}
					});
				});



			}
		};
	}])

	.directive('cmTimeline', ['palette', 'DateUtils', function (palette, DateUtils) {
		return {
			restrict: 'E',
			replace: true,
			//template: '<svg></svg>', // fix related to issue in angularjs
			link: function (scope, element, attrs) {
				// definition of timeline properties
				var margin = {}, margin2 = {}, width, height, height2;
				var lanePadding = 5;
				var laneHeight = 30;
				var contextPadding = 25;
				// hack : multiple time scales, to circumvent unsupported difference for dates in JS
				var xTimeScale, x2MsScale, x2TimeScale, yScale;
				var xAxis, xAxis2, yAxis;
				var d3elmt = d3.select(element[0]).append("svg"); // d3 wrapper of the SVG element
				var brush, focus, context;
				var infannot, supannot, infannotdate, supannotdate;
				var lineElement, circleElement;


				// use SVG to draw the tooltip content
				// this is the tooltip graph component init - it is then updated by refreshTooltipForLayer
				// on layer mouseover events.
				var tooltipWidth = 0;
				var tooltipHeight = 0;
				var tooltipPadding = 3;

				var tooltip = d3.select("body")
					.append("svg")
					.attr("width", tooltipWidth + 2 * tooltipPadding)
					.attr("height", tooltipHeight)
					.style("position", "absolute")
					.style("z-index", "10")
					.style("visibility", "hidden");


				// hack to remove selection glitch with dblclick event
				var clearSelection= function() {
					if ( document.selection ) {
						document.selection.empty();
					} else if ( window.getSelection ) {
						window.getSelection().removeAllRanges();
					}
				};

				var borderGenerator = function (w, h) {
					return [
						{'x': 0, 'y': 0},
						{'x': 0, 'y': h},
						{'x': w, 'y': h},
						{'x': w, 'y': 0},
						{'x': 0, 'y': 0}
					];
				};
				var lineFunction = d3.svg.line()
					.x(function (d) {
						return d.x;
					})
					.y(function (d) {
						return d.y;
					})
					.interpolate("linear");

				tooltip.append("path")
					.attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)))
					.attr("stroke", "black")
					.attr("stroke-width", "2")
					.attr("fill", "white");


				// callback function for the focus brush
				var brushed = function () {
					var brushRange = brush.extent().map(x2MsScale);
					scope.model.xMsScale.domain(brush.empty() ? x2MsScale.domain() : brush.extent());
					xTimeScale.domain(brush.empty() ? x2TimeScale.domain() : brushRange.map(x2TimeScale.invert));

					focus.selectAll(".annot")
						.attr("x", function (d) {
							return scope.model.xMsScale(d.fragment.start);
						})
						.attr("width", function (d) {
							return scope.model.xMsScale(d.fragment.end) - scope.model.xMsScale(d.fragment.start);
						});

					focus.select(".x.axis").call(xAxis);

					// log scope min and max date
					scope.$apply(function () {
						scope.setMinimalXDisplayedValue(scope.model.xMsScale.domain()[0]);
						scope.setMaximalXDisplayedValue(scope.model.xMsScale.domain()[1]);
						if ('function' == typeof (scope.clickOnAPiechartSlice)) {
							scope.clickOnAPiechartSlice(-1);
						}

					});
				};

				var init = function () {
					// init dimensions/margins
					// height set depending on number of modalities - in updateComp
					var extWidth = element.parent().width();
					height = 0;
					height2 = laneHeight;
					margin = {top: 20, right: 20, bottom: height2 + contextPadding + 20, left: 0.15 * extWidth};
					margin2 = {top: margin.top + height + contextPadding, right: 20, bottom: 20, left: 0.15 * extWidth};
					width = extWidth - margin.left - margin.right;

					// scales for focus and context,
					// and for internal use (raw annotations use seconds) and display (formatted)
					xTimeScale = d3.time.scale().domain([0, 0]).range([0, width]).clamp(true);
					x2TimeScale = d3.time.scale().domain([0, 0]).range([0, width]).clamp(true);
					scope.model.xMsScale = d3.scale.linear().domain([0, 0]).range([0, width]).clamp(true);
					x2MsScale = d3.scale.linear().domain([0, 0]).range([0, width]).clamp(true);

					yScale = d3.scale.ordinal().range([0, height]); // scale for layer labels
//                    colScale = d3.scale.ordinal(); // custom color scale

					// d3.time.format.multi recently added in d3 - replaced the legacy solution
					var customTimeFormat = d3.time.format.multi([
						["%S.%L", function (d) {
							return d.getMilliseconds();
						}],
						["%M:%S", function (d) {
							return d.getSeconds();
						}],
						["%H:%M:%S", function (d) {
							return true;
						}]
					]);

					// init of SVG element and its associated components
					d3elmt.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom);

					xAxis = d3.svg.axis().scale(xTimeScale).orient("top").ticks(5)
						.tickFormat(customTimeFormat);
					xAxis2 = d3.svg.axis().scale(x2TimeScale).orient("top").ticks(5)
						.tickFormat(customTimeFormat);
					yAxis = d3.svg.axis().scale(yScale).orient("left");

					brush = d3.svg.brush().x(x2MsScale).on("brush", brushed);


					focus = d3elmt.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					context = d3elmt.append("g")
						.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					context.append("g")
						.attr("class", "brush")
						.call(brush)
						.selectAll("rect")
						.attr("y", -6)
						.attr("height", height2 + 7);

					focus.append("g")
						.attr("class", "x axis")
						.call(xAxis);

					focus.append("g")
						.attr("class", "y axis")
						.call(yAxis);


					context.insert("g", ".brush")
						.attr("class", "x axis")
						.call(xAxis2);


					var gContainer = $(focus[0][0]);
					var xAxisContainer = $(".x path");

					focus.append("g").attr("id", "time").append("circle").attr("id", "draggable").attr("cx", gContainer.offset().left + scope.model.xMsScale(0)).attr('cy', 0).attr("r", 8).style("fill", "steelblue").style("stroke", "black").attr("z", 0);

					circleElement = d3.select("circle");

					focus.append("g").append("line").attr("id", "line").attr("x1", gContainer.offset().left + scope.model.xMsScale(0)).attr("x2", gContainer.offset().left + scope.model.xMsScale(0)).attr('y1', parseInt(circleElement.attr("r"))).attr('y2', 130).style("fill", "black").style("stroke", "black").style("stroke-width", "1").style("stroke-dasharray", ("3, 3"));
					lineElement = d3.select("#line");

					circleElement.on("mousemove", function () {
						circleElement.style("cursor", "e-resize");
					});

					var save_state;


					// Event that allow to move the pointer on the timeline that is synchronised with the current time of the video
					var drag = d3.behavior.drag()
						.on("dragstart", function () {
							save_state = scope.model.play_state;
							scope.$apply(function () {
								scope.model.toggle_play(false);
							});
						})
						.on("drag", function () {
							var position = d3.event.x;

							if (position >= 0 && position <= xAxisContainer[0].getBBox().width) {
								circleElement.attr("cx", parseInt(position));
								lineElement.attr("x1", parseInt(position)).attr("x2", parseInt(position));
								scope.$apply(function () {
									scope.model.current_time = scope.model.xMsScale.invert(position);
								});
							}
						})
						.on("dragend", function() {
							scope.$apply(function () {
								scope.model.toggle_play(save_state);
							});
						});

					circleElement.call(drag);

				};

				var updateLayers = function (addedLayerId) {
					var addedLayer;

					// HTML5/DOM does not support multiple event trigger for overlaying SVG elements :
					// only the "latest sibling" in the DOM tree is triggered. This is not satisfactory for
					// our tooltip function.
					// refreshTooltipForLayer handles mouseover events at the layer level.
					// It is rather inefficient as all annots are processed at each move : but this is the only way
					// for a sufficiently flexible behavior.
					var refreshTooltipForLayer = function (d) {
						// select the whole set of annotations in the layer,
						// and find those hovered by the mouse
						var currentLayer = d3.select(this);
						var currentSel = currentLayer.selectAll(".annot");
//                        var pointerPos = undefined;
						var bodyElt = $("body")[0];
						var coords = d3.mouse(bodyElt);
						var hoveredElts = currentSel[0].filter(function (d) {
							var dims = d.getBBox();
							dims.top = $(d).offset().top;
							dims.left = $(d).offset().left;
							return dims.top <= coords[1] && dims.left <= coords[0] &&
								dims.top + dims.height >= coords[1] && dims.left + dims.width >= coords[0];

						});


						// get position of the pointer wrt current timescale, in pixels
						// hack : as layer object is shifted to first annotation - use the enclosing <g>
						// NB that his margins (translate) define its shift wrt page
						// to get actual time position, y axis space has thus to be explicitly accounted for
						var gContainer = $($(currentLayer[0][0]).parent()[0]);
						var yAxisContainer = gContainer.children(".y");
						var pointerPos = coords[0] -
							(gContainer.offset().left + yAxisContainer[0].getBBox().width);
						var margin = pointerPos;

						pointerPos = xTimeScale.invert(pointerPos);
						pointerPos = DateUtils.timestampFormat(pointerPos);

						currentSel = tooltip.selectAll(".time")
							.data([pointerPos]);

						currentSel.enter()
							.append("text");

						currentSel.text(function (d) {
							return d;
						})
							.attr("x", tooltipPadding)
							.attr("y", 15)
							.attr("class", "time");


						// get the associated labels, with potential repetitions
						var newLabels = hoveredElts.map(function (d) {
							return addedLayer.tooltipFunc(d3.select(d).data()[0]);
						});

						// add its multiplicity to each value in the array
						newLabels = newLabels.map(function (d) {
							var count = newLabels.filter(function (d2) {
								return d === d2;
							}).length;
							if (count > 1) d += (" x" + count);
							return d;
						});

						// reduce to unique
						newLabels = $.grep(newLabels, function (v, k) {
							return $.inArray(v, newLabels) === k;
						});


						currentSel = tooltip.selectAll(".label")
							.data(newLabels);

						currentSel.enter()
							.append("text");

						currentSel.exit()
							.remove();

						// append the multiplicity of labels in newLabels if needed
						currentSel.text(function (d) {
							return d;
						})
							.attr("x", tooltipPadding)
							.attr("y", function (d, i) {
								return 20 * (i + 1) + 15;
							})
							.attr("class", "label");

						// adjust tooltip width using the max length of labels
						tooltipWidth = 0;
						currentSel = tooltip.selectAll("text");
						currentSel[0].forEach(function (d) {
							if (d.getComputedTextLength() > tooltipWidth) {
								tooltipWidth = d.getComputedTextLength();
							}
						});
						// +1 to account for timestamp
						tooltipHeight = 20 * (newLabels.length + 1);
						tooltip.attr("width", tooltipWidth + 2 * tooltipPadding)
							.attr("height", tooltipHeight)
							.select("path")
							.attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)));
						return tooltip.style("top", (coords[1] - 10) + "px").style("left", (coords[0] + 10) + "px");
					};

					// get layer actual object from ID
					addedLayer = scope.model.layers.filter(function (l) {
						return(l._id === addedLayerId);
					})[0];

					scope.updateColorScale(addedLayerId);

					// adapt time scales
					scope.model.layers.forEach(function (l) {
						var curMax = d3.max(l.layer.map(function (d) {
							return d.fragment.end;
						}));
						var curMin = d3.min(l.layer.map(function (d) {
							return d.fragment.start;
						}));

						infannot = d3.min([infannot, curMin]);
						supannot = d3.max([supannot, curMax]);

						curMax = d3.max(l.layer.map(function (d) {
							return DateUtils.parseDate(d.fragment.end);
						}));
						curMin = d3.min(l.layer.map(function (d) {
							return DateUtils.parseDate(d.fragment.start);
						}));

						infannotdate = d3.min([infannotdate, curMin]);
						supannotdate = d3.max([supannotdate, curMax]);

					});


					// adapt brush to new scale
					var brushExtent = [];
					if (!brush.empty()) {
						brushExtent = brush.extent();
					}

					// rescale only if restricted to loaded annotations
					if (scope.model.restrict_toggle === 2) {
						x2MsScale.domain([infannot, supannot]);
						x2TimeScale.domain([infannotdate, supannotdate]);
						if (brush.empty() || scope.model.layers.length === 0) {
							scope.model.xMsScale.domain(x2MsScale.domain());
							xTimeScale.domain(x2TimeScale.domain());
						}
					}

					if (!brush.empty()) {
						brush.extent(brushExtent);
						brush(context.select(".brush"));
					}

					// adapt component dimensions and y axis
					height = (lanePadding + laneHeight) * scope.model.layers.length;
					margin2.top = margin.top + height + contextPadding;
					d3elmt.attr("height", height + margin.top + margin.bottom);
					context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					yScale.domain(scope.model.layers.map(function (el) {
						return {id: el._id,
							str: el.label,
							toString: function () {
								return this.str;
							}}
					}));
					yScale.rangeBands([0, height]);

					focus.select(".y.axis").call(yAxis);
					focus.select(".x.axis").call(xAxis);
					context.select(".x.axis").call(xAxis2);

					var layerSel = context.selectAll(".layer")
						.data(scope.model.layers, function (d) {
							return d._id;
						});

					// insert new context layer before ".brush"
					layerSel.enter()
						.insert("g", ".brush")
						.attr("class", "layer")
						.selectAll(".annot")
						.data(function (d) {
							return d.layer;
						})
						.enter()
						.append("rect")
						.attr("fill", "#999999")
						.attr("opacity", 0.2)
						.attr("x", function (d) {
							return x2MsScale(d.fragment.start);
						})
						.attr("width", function (d) {
							return x2MsScale(d.fragment.end) - x2MsScale(d.fragment.start);
						})
						.attr("y", 0)
						.attr("height", laneHeight)
						.attr("class", "annot");

					layerSel.exit().remove();

					layerSel = focus.selectAll(".layer")
						.data(scope.model.layers, function (d) {
							return d._id;
						});

					// insert new focus layer.
					// note that mouse events are handled at layer level, to allow greater flexibility
					// (see comments above refreshTooltipForLayer definition)
					layerSel.enter()
						.append("g")
						.attr("id", function (d, i) {
							return "layer_" + i;
						})
						.attr("class", "layer")
						.on("mouseover", function () {
							return tooltip.style("visibility", "visible");
						})
						.on("mousemove", refreshTooltipForLayer)
						.on("mouseout", function () {
							return tooltip.style("visibility", "hidden");
						})
						.selectAll(".annot")
						.data(function (d) {
							return d.layer;
						})
						.enter()
						.append("rect")
						.attr("fill", function (d) {
							return scope.model.colScale(addedLayer.mapping.getKey(d));
						})
						.attr("opacity", 0.4)
						.attr("y", 0)
						.attr("height", laneHeight)
						.attr("x", function (d) {
							return scope.model.xMsScale(d.fragment.start);
						})
						.attr("width", function (d) {
							return scope.model.xMsScale(d.fragment.end) - scope.model.xMsScale(d.fragment.start);
						})
						.attr("class", "annot")
						.on("click", function (d) {
							scope.$apply(function () {
								var save_state;
								save_state = scope.model.play_state;
								scope.model.toggle_play(false);
								scope.model.current_time = d.fragment.start;
								scope.model.toggle_play(save_state);
							});
						})
						.on("dblclick", function(d) {
							scope.$apply(function () {
								scope.model.toggle_play(false);
								scope.model.current_time = d.fragment.start;
								scope.model.toggle_play(true);
							});
							clearSelection();
						})
						.on('contextmenu', function(d){
							d3.event.preventDefault();
							console.log("R-C");
//													scope.$apply(function() {
//														d3.select(this).attr("name", function(d) {
//															return addedLayer.mapping.getKey(d);
//														})
//															.attr("toggle", true);
//														scope.model.testval = !scope.model.testval;
//														console.log(scope.model.testval);
//													});
							return false;
						});


					layerSel.exit().remove();

					// update positions of new selection
					layerSel.attr("transform", function (d, i) {
						return "translate(0," + (lanePadding + (i * (lanePadding + laneHeight))) + ")";
					});

					// refresh all annotations in case of rescale
					focus.selectAll(".annot")
						.attr("x", function (d) {
							return scope.model.xMsScale(d.fragment.start);
						})
						.attr("width", function (d) {
							return scope.model.xMsScale(d.fragment.end) - scope.model.xMsScale(d.fragment.start);
						});

					// adjust font size to available space in left margin
					var maxTickLength = 0;
					focus.select(".y")
						.selectAll("text")[0]
						.forEach(function (d) {
							if (d.getComputedTextLength() > maxTickLength) {
								maxTickLength = d.getComputedTextLength();
							}
						});
					maxTickLength = maxTickLength * 16 / 12; // approx. points to pixels conversion

					// ensure maxTickLength != 0 to avoid 0 division
					if (maxTickLength == 0) {
						maxTickLength = 1;
					}
					focus.select(".y")
						.selectAll("text")
						.attr("transform", function () {
							return "scale(" + margin.left / maxTickLength + "," + margin.left / maxTickLength + ")";
						});

				};

				var updateLayerSelectedItem = function (selectedSliceValue) {
					if (scope.model.selected_layer != undefined && scope.model.selected_layer != -1) {

						var addedLayer;

						// Restore initial color and opacity
						for (var i = 0, max = scope.model.layers.length; i < max; i++) {

							addedLayer = scope.model.layers.filter(function (l) {
								return(l._id === scope.model.layerWatch[i]);
							})[0];

							d3.select('#layer_' + i).selectAll("rect").attr("opacity", 0.4)
								.attr("fill", function (d) {
									return scope.model.colScale(addedLayer.mapping.getKey(d));
								});
						}


						addedLayer = scope.model.layers.filter(function (l) {
							return(l._id === scope.model.layerWatch[scope.model.selected_layer]);
						})[0];

						// in Selected layer:
						d3.select('#layer_' + scope.model.selected_layer).selectAll("rect").attr("opacity", function (d) {
							// if selected slice correspond to target rectangle, make it opaque and give it the selection color
							// if not, make it transparent and let it have its original color
							if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
								return 1.0;
							}
							else if (selectedSliceValue != undefined && selectedSliceValue != -1) {
								return 0.1;
							}
							else {
								return 0.4;
							}
						})
							.attr("fill", function (d, i) {
								if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
									return scope.model.colScale("selection_color");
								}
								else {
									return scope.model.colScale(addedLayer.mapping.getKey(d));
								}
							});

					}
				}


				// BUG #8946 : handle multiple additions/deletions

				scope.$watch('model.layerWatch', function (newValue, oldValue) {
					var addedLayersId = newValue.filter(function (l) {
						return !(oldValue.indexOf(l) > -1);
					});

					addedLayersId.forEach(function (d) {
						updateLayers(d);
					});

					// update min and max in scope
					scope.setMinimalXDisplayedValue(x2MsScale.domain()[0]);
					scope.setMaximalXDisplayedValue(x2MsScale.domain()[1]);

				}, true);


				scope.$watch('model.selected_slice', function (newValue) {
					updateLayerSelectedItem(newValue);
				}, true);


				// restrict timeline to loaded annotations if wanted
				scope.$watch("model.restrict_toggle", function (newValue) {
					if (newValue === 2) {
						if (infannot !== undefined) {
							x2MsScale.domain([infannot, supannot]);
							x2TimeScale.domain([infannotdate, supannotdate]);
							scope.model.infbndsec = infannot;
							scope.model.supbndsec = supannot;

							if (scope.model.current_time < scope.model.infbndsec) {
								scope.model.current_time = scope.model.infbndsec;
							}
							if (scope.model.current_time > scope.model.supbndsec) {
								scope.model.current_time = scope.model.supbndsec;
							}
						}
					} else if (newValue === 0 || newValue === 1) {
						x2MsScale.domain([0, scope.model.duration]);
						x2TimeScale.domain([DateUtils.parseDate(0),
							DateUtils.parseDate(scope.model.duration)]);
						scope.model.infbndsec = 0;
						scope.model.supbndsec = scope.model.duration;
					}
					if (brush.empty()) {
						scope.model.xMsScale.domain(x2MsScale.domain());
						xTimeScale.domain(x2TimeScale.domain());
					}

					focus.select(".x.axis").call(xAxis);
					context.select(".x.axis").call(xAxis2);

					focus.selectAll(".annot")
						.attr("x", function (d) {
							return scope.model.xMsScale(d.fragment.start);
						})
						.attr("width", function (d) {
							return scope.model.xMsScale(d.fragment.end) - scope.model.xMsScale(d.fragment.start);
						});

					context.selectAll(".annot")
						.attr("x", function (d) {
							return x2MsScale(d.fragment.start);
						})
						.attr("width", function (d) {
							return x2MsScale(d.fragment.end) - x2MsScale(d.fragment.start);
						});


				});

				scope.$watch("model.xMsScale.domain()", function (newValue) {
					if (newValue !== undefined && scope.model.play_state !== undefined) {
						lineElement.attr("x1", scope.model.xMsScale(scope.model.current_time)).attr("x2",
							scope.model.xMsScale(scope.model.current_time));
						circleElement.attr("cx", scope.model.xMsScale(scope.model.current_time));
					}
				}, true);

				scope.$watch("model.current_time", function (newValue) {
					if (newValue !== undefined) {
						lineElement.attr("x1", scope.model.xMsScale(newValue)).attr("x2", scope.model.xMsScale(newValue));
						circleElement.attr("cx", scope.model.xMsScale(newValue));
					}
				});

				init();

			}
		}
	}
])


.directive('cmContextMenu', ['$dropdown', function($dropdown) {
	return {
		restrict: 'C',
//			scope: {
//				name: "=name",
//				toggle: "=toggle"
//			},
		link: function(scope, element, attrs) {
			var dropdown = $dropdown(element, {
				content: name,
				show: false,
				trigger: "manual"
			});
			scope.$watch("model.testval", function(newValue) {
				if(newValue) {
					dropdown.show();
				} else {
					dropdown.hide();
				}
			});
		}
	};
}])

	.directive('element1', ['$compile', function($compile) {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg></svg>',
			link: function (scope, element, attrs) {
				var therect = d3.select(element[0])
					.append("rect")
					.attr("fill", "red")
					.attr("width", 100)
					.attr("height", 100)
					.attr("class", "class1");
				therect.on("click", function() {
					console.log("rect clicked");
					console.log("current scopeval is", scope.scopeval);
					scope.$apply(function() {
						if(scope.scopeval === undefined) {
							scope.scopeval = true;
						} else {
							scope.scopeval = !scope.scopeval;
						}
					});
				});
//				element.removeAttr("class")
//				$compile(element)(scope);
			}
		}
	}])

	.directive('class1', function() {
		return {
			restrict: 'C',
			link: function (scope, element, attrs) {
				scope.$watch("scopeval", function() {
					console.log("scopeval change detected");
				});
			}
		}
	})



	.directive('cmBarchart', ['palette', '$filter', function (palette, $filter) {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg id="barchart"></svg>',
			link: function (scope, element, attrs) {

				scope.updateBarChart = function () {

					scope.computeSlices();

					scope.slices = $filter('orderBy')(scope.slices, function (d) {
						return -d.spokenTime;
					});

					var rectHeight = 20,
						legendMargin = 4, w = 500,                            // width
						h = (rectHeight + legendMargin) * scope.slices.length, // height
						sum = d3.sum(scope.slices, function (d) {
							return parseInt(d.spokenTime);
						}),
						max = d3.max(scope.slices, function (d) {
							return parseInt(d.spokenTime);
						});

					// Get the correct svg tag to append the chart
					var vis = d3.select("#barchart").attr("width", w).attr("height", h);


					// Remove old existing chart
					var oldGraph = vis.selectAll("g");
					if (oldGraph) {
						oldGraph.remove();
					}

					// Remove old existing tooltips
					var detailedView = d3.select("#detailedView");
					var oldTooltip = detailedView.selectAll("div.tooltip");
					if (oldTooltip) {
						oldTooltip.remove();
					}

					// add a div used to display a tooltip
					var div = detailedView.append("div")
						.attr("class", "tooltip")
						.style("opacity", 0);

					vis = vis
						.append("g")              //create the SVG element inside the <body>
						.data([scope.slices])                   //associate our data with the document
						.attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
						.attr("height", h + "px")
						.append("g");                //make a group to hold our pie chart

					vis.selectAll("g.barchart-bar")
						.data(scope.slices)
						.enter().append("rect")
						.attr("class", "barchart-bar")
						.attr("fill", function (d, i) {
							if (i == scope.model.selected_slice) {
								return scope.model.colScale("selection_color");
							}
							else {
								return scope.model.colScale(scope.slices[i].element);
							}
						})
						.attr("x", "4px")
						.attr("y", function (d, i) {
							return rectHeight * (i) + i * legendMargin + 5;
						})
						.attr("width", function (d, i) {
							return Math.floor(Math.max(scope.slices[i].spokenTime / max * (w - 14 - legendMargin), 3));
						})
						.attr("height", "15px")
						.style("opacity", function (d, i) {
							if (i == scope.model.selected_slice) {
								return 1;
							}
							else {
								return 0.4;
							}
						})
						.style("stroke", "black")
						.on("mouseover", function (d, i) {
							var bodyElt = $("body")[0];
							var coords = d3.mouse(bodyElt);
							div.transition()
								.duration(200)
								.style("opacity", 1);
							div.html(scope.slices[i].element + '<br/>' + 'Duration: ' + Math.floor(scope.slices[i].spokenTime / sum * 100) + "%")
								.style("left", (coords[0]) + "px")
								.style("top", (coords[1] - 18) + "px");
						})
						.on("mouseout", function (d, i) {
							div.transition()
								.duration(200)
								.attr("dy", ".3em")
								.style("opacity", 0)
								.style("width", (scope.slices[i].element * 10));
						})
						.on("click", function (d, i) {
							scope.$apply(function () {
								scope.clickOnAPiechartSlice(i);
							});
						}); //allow us to style things in the slices (like text);
				}

				scope.$watch('model.selected_layer', function (newValue) {
					if (newValue != null && newValue != "" && newValue != undefined) {
						scope.updateBarChart();
					}
				});

				scope.$watch('model.selected_slice', function (newValue) {
					if (newValue != undefined) {
						scope.updateBarChart();
					}
				});

				// only one has to be watch cause both change at the same time
				scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
					if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
						scope.updateBarChart();
					}

				});
			}
		};
	}])
	.directive('cmPiechart', ['palette', function (palette) {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg id="piechart"></svg>',
			link: function (scope, element, attrs) {

				scope.updatePiechart = function () {

					scope.computeSlices();

					var w = 500,                            // width
						h = 500,                            // height
						r = 200,                            // radius
						sum = d3.sum(scope.slices, function (d) {
							return parseInt(d.spokenTime);
						});

					// Get the correct svg tag to append the chart
					var vis = d3.select("#piechart").attr("width", 410).attr("height", 410);


					// Remove old existing piechart
					var oldGraph = vis.selectAll("g");
					if (oldGraph) {
						oldGraph.remove();
					}

					// Remove old existing tooltips
					var detailedView = d3.select("#detailedView");
					var oldTooltip = detailedView.selectAll("div.piecharttooltip");
					if (oldTooltip) {
						oldTooltip.remove();
					}

					// add a div used to display a tooltip
					var div = detailedView.append("div")
						.attr("class", "piecharttooltip")
						.style("opacity", 0);

					vis = vis
						.append("g")              //create the SVG element inside the <body>
						.data([scope.slices])                   //associate our data with the document
						.attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
						.attr("height", h + "px")
						.append("g")                //make a group to hold our pie chart
						.attr("transform", "translate(" + r + "," + r + ")");    //move the center of the pie chart from 0, 0 to radius, radius

					var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
						.outerRadius(r);

					var pie = d3.layout.pie(scope.slices)           //this will create arc data for us given a list of values
						.value(function (d) {
							return d.spokenTime;
						});    //we must tell it out to access the value of each element in our data array

					var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
						.data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
						.enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
						.append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
						.attr("class", "slice")
						.on("mouseover", function (d, i) {
							var bodyElt = $("body")[0];
							var coords = d3.mouse(bodyElt);
							div.transition()
								.duration(200)
								.style("opacity", 1);
							div.html(scope.slices[i].element + '<br/>' + 'Duration: ' + Math.floor(scope.slices[i].spokenTime / sum * 100) + "%")
								.style("left", (coords[0]) + "px")
								.style("top", (coords[1] - 18) + "px");
						})
						.on("mouseout", function (d, i) {
							div.transition()
								.duration(200)
								.attr("dy", ".3em")
								.style("opacity", 0)
								.style("width", (scope.slices[i].element * 10));
						})
						.on("click", function (d, i) {
							scope.$apply(function () {
								scope.clickOnAPiechartSlice(i);
							});
//                            scope.selectASlice();

						}); //allow us to style things in the slices (like text)

					arcs.append("svg:path")
						.style("stroke", "white")
						.attr("fill", function (d, i) {
							if (i == scope.model.selected_slice) {
								return scope.model.colScale("selection_color");
							}
							else {
								return scope.model.colScale(scope.slices[i].element);
							}
						}) //set the color for each slice to be chosen from the color function defined above
						.attr("d", arc)                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function
						.attr("opacity", function (d, i) {
							if (i == scope.model.selected_slice) {
								return 1;
							}
							else {
								return 0.4;
							}
						});
				};

				scope.$watch('model.selected_layer', function (newValue) {
					if (newValue != null && newValue != "" && newValue != undefined) {
						scope.updatePiechart();
					}
				});

				scope.$watch('model.selected_slice', function (newValue) {
					if (newValue != undefined) {
						scope.updatePiechart();
					}
				});

				// only one has to be watch cause both change at the same time
				scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
					if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
						scope.updatePiechart();
					}

				});
			}
		}
	}])
	.directive("cmPiechartLegend", ['palette', '$filter', function (palette, $filter) {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg id="legend"></svg>',
			link: function (scope, element, attrs) {


				scope.updateLegend = function () {

					scope.computeSlices();

					scope.slices = $filter('orderBy')(scope.slices, function (d) {
						return -d.spokenTime;
					});

					var maxLength = d3.max(scope.slices, function (d) {
						return parseInt(d.element.length);
					});

					var rectHeight = 20,
						rectWidth = 20,
						legendMargin = 4,
						legendWidth = 16 * (maxLength ? maxLength : 0) + rectWidth + 4 * legendMargin,
						legendHeight = (rectHeight + legendMargin) * scope.slices.length;

					//Create the SVG Viewport
					var svgContainer = d3.select("#legend");

					// Vire les anciens graphs
					var oldGraph = svgContainer.selectAll("rect");
					if (oldGraph) {
						oldGraph.remove();
					}

					oldGraph = svgContainer.selectAll("text");
					if (oldGraph) {
						oldGraph.remove();
					}


					svgContainer.style("float", "right");

					var svg = svgContainer.attr("width", legendWidth + "px")
						.attr("height", legendHeight + "px");

					//Add rectangles to the svgContainer
					var coloredRectangles = svg.selectAll("rect")
						.data(scope.slices)
						.enter()
						.append("rect");

					//Add the rectangle attributes
					coloredRectangles
						.attr("x", 10)
						.attr("y", function (d, i) {
							return rectHeight * (i) + i * legendMargin;
						})
						.on("click", function (d, i) {
							scope.$apply(function () {
								scope.clickOnAPiechartSlice(i);
							});
						})
						.attr("class", "legend")
						.attr("width", rectWidth)
						.attr("height", rectHeight)
						.style("fill", function (d, i) {
							if (i == scope.model.selected_slice) {
								return scope.model.colScale("selection_color");
							}
							else {
								return scope.model.colScale(d.element);
							}
						})
						.style("opacity", function (d, i) {
							if (i == scope.model.selected_slice) {
								return 1;
							}
							else {
								return 0.4;
							}
						})
						.style("stroke", "black");   //allow us to style things in the slices (like text);

					//Add the SVG Text Element to the svgContainer
					var text = svg.selectAll("text")
						.data(scope.slices)
						.enter()
						.append("text");

					//Add SVG Text Element Attributes
					text.attr("x", rectWidth + 20)
						.attr("y", function (d, i) {
							return rectHeight * (i + 1) + i * legendMargin - 5;
						})
						.text(function (d, i) {
							return scope.slices[i].element + '   (' + parseInt(scope.slices[i].spokenTime).toFixed(0) + 's)';
						})
						.attr("font-family", "sans-serif")
						.attr("font-size", function (d, i) {
							if (i == scope.model.selected_slice) {
								return "18px";
							}
							else {
								return "16px";
							}
						})
						.attr("fill", function (d, i) {
							if (i == scope.model.selected_slice) {
								return scope.model.colScale("selection_color");
							}
							else {
								return "black";
							}
						});
				};

				scope.$watch('model.selected_layer', function (newValue) {
					if (newValue != null && newValue != "" && newValue != -1) {
						scope.model.selected_slice = -1;
						scope.updateLegend();
					}
				});

				// only one has to be watch cause both change at the same time
				scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
					if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
						scope.updateLegend();
					}

				});

				scope.$watch('model.selected_slice', function (newValue) {
					if (newValue != undefined) {
						scope.updateLegend();
					}
				});
			}
		}
	}])
	.directive('cmTreemap', ['palette', '$filter', function (palette, $filter) {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg id="treemap"></svg>',
			link: function (scope, element, attrs) {

				scope.updateTreeMap = function () {

					scope.computeSlices();

					var w = 500,                            // width
						h = 500,                            // height
						sum = d3.sum(scope.slices, function (d) {
							return parseInt(d.spokenTime);
						});

					scope.slices = $filter('orderBy')(scope.slices, function (d) {
						return -d.spokenTime;
					});

					// Get the correct svg tag to append the chart
					var vis = d3.select("#treemap")
						.attr("width", w)
						.attr("height", h);


					// Remove old existing piechart
					var oldGraph = vis.selectAll("g");
					if (oldGraph) {
						oldGraph.remove();
					}

					// Remove old existing tooltips
					var detailedView = d3.select("#detailedView");
					var oldTooltip = detailedView.selectAll("div.treeemaptooltip");
					if (oldTooltip) {
						oldTooltip.remove();
					}

					// add a div used to display a tooltip
					var div = detailedView.append("div")
						.attr("class", "treeemaptooltip")
						.style("opacity", 0);

					var slices = {children: scope.slices};

					vis = vis
						.append("g")
						.attr("x", "4")
						.attr("y", "4")
						.attr("width", w + "px")           //set the width and height of our visualization (these will be attributes of the <svg> tag
						.attr("height", h + "px")
						.append("g");

					// make the treemap layout
					var treemap = d3.layout.treemap()
						.size([w, h])
						.sticky(true)
						.value(function (d) {
							return d.spokenTime;
						});


					// make cells for each cause
					var node = vis.datum(slices).selectAll(".node").append("g");
					node.data(treemap.nodes)
						.enter().append("rect")
						.attr("class", "node")
						.call(position)
						.style("stroke", function (d) {
							if (d.children) {
								return "white";
							}
							else {
								return "black";
							}
						})
						.style("fill", function (d, i) {
							if (d.children) {
								return "white";
							}
							else if (i - 1 == scope.model.selected_slice) {
								return scope.model.colScale("selection_color");
							}
							else {
//                                console.log(slices.children[i-1].element);
								return scope.model.colScale(slices.children[i - 1].element); //'blue';
							}
						})
						.style("opacity", function (d, i) {
							if (i - 1 == scope.model.selected_slice) {
								return 1;
							}
							else {
								return 0.4;
							}
						})
						.on("mouseover", function (d, i) {
							if (!d.children) {
								var bodyElt = $("body")[0];
								var coords = d3.mouse(bodyElt);
								div.transition()
									.duration(200)
									.style("opacity", 1);
								div.html(scope.slices[i - 1].element + '<br/>' + 'Duration: ' + Math.floor(scope.slices[i - 1].spokenTime / sum * 100) + "%")
									.style("left", (coords[0]) + "px")
									.style("top", (coords[1] - 18) + "px");
							}
						})
						.on("mouseout", function (d, i) {
							if (!d.children) {
								div.transition()
									.duration(200)
									.attr("dy", ".3em")
									.style("opacity", 0)
									.style("width", (scope.slices[i - 1].element * 10));
							}
						})
						.on("click", function (d, i) {
							scope.$apply(function () {
								scope.clickOnAPiechartSlice(i - 1);
							});
						});
					;

//                    node.data(treemap.nodes)
//                        .enter().append("text").text(function (d) {
//                            return  d.element;
//                        }).call(positionText);

					function position() {
						this.attr("x", function (d) {
							return d.x + "px";
						})
							.attr("y", function (d) {
								return (d.y + 3) + "px";
							})
							.attr("width", function (d) {
								return Math.max(0, d.dx - 5) + "px";
							})
							.attr("height", function (d) {
								return Math.max(0, d.dy - 5) + "px";
							});
					}
				};

				scope.$watch('model.selected_layer', function (newValue) {
					if (newValue != null && newValue != "" && newValue != undefined) {
						scope.updateTreeMap();
					}
				});

				scope.$watch('model.selected_slice', function (newValue) {
					if (newValue != undefined && scope.slices != undefined && scope.slices.length > 0) {
						scope.updateTreeMap();
					}
				});

				// only one has to be watch cause both change at the same time
				scope.$watch('model.maximalXDisplayedValue + model.minimalXDisplayedValue', function (newValue) {
					if (newValue && scope.model.selected_layer != -1 && scope.model.selected_layer != undefined) {
						scope.updateTreeMap();
					}

				});
			}
		};
	}])

	// see index.html about login form
	.directive("ngLoginSubmit", function () {
		return {
			restrict: "A",
			scope: {
				onSubmit: "=ngLoginSubmit",
				message: "="
			},
			link: function (scope, element, attrs) {
				$(element)[0].onsubmit = function () {
					$("#login-login").val($("#login", element).val());
					$("#login-password").val($("#password", element).val());

					scope.onSubmit(function () {
						$("#login-form")[0].submit();
					});
					return false;
				};
			}
		};
	})

	.directive('blurbtn', function () {
		return {
			restrict: 'A',
			link: function (scope, element) {
				$(element).click(function () {
					$(element).blur();
				});
			}
		}
	});


