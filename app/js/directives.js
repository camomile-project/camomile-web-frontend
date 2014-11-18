'use strict';

/* Directives */


angular.module('myApp.directives', ['myApp.filters', 'myApp.services']).
	directive('appVersion', ['version', function (version) {
		return function (scope, elm) {
			elm.text(version);
		};
	}])

	.directive('cmVideoPlayer', ['DateUtils', function (DateUtils) {
		return {
			restrict: 'A',
			link: function (scope, element) {
				scope.model.play_state = false;
				scope.model.current_time = 0;
				scope.model.restrict_toggle = 0;
				scope.model.infbndsec = 0;


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
						scope.model.duration = scope.model.fullDuration = element[0].duration;
						element[0].currentTime = scope.model.current_time;
						if(scope.model.supbndsec === undefined) {
							scope.model.supbndsec = scope.model.duration;
						}
					});
				});

				scope.$watch("model.current_time", function (newValue) {
					if (newValue !== undefined) {
						scope.model.current_time_display = DateUtils.timestampFormat(DateUtils.parseDate(scope.model.current_time));
						if(element[0].readyState !== 0) {
							element[0].currentTime = newValue;
						}
					}
				});

				element[0].addEventListener("timeupdate", function () {
					scope.$apply(function () {
						// if player paused, currentTime has been changed for exogenous reasons
						if (!element[0].paused) {
							if(element[0].currentTime > scope.model.supbndsec) {
								scope.model.toggle_play(false);
								scope.model.current_time = scope.model.supbndsec;
							} else{
								scope.model.current_time = element[0].currentTime;
							}
						}
					});
				});


			}
		};
	}])


	.directive('cmContextBar', ['Annotation', function (Annotation) {
		return {
			restrict: 'A',
			link: function (scope, element) {
				var width = 470;
				var height = 50;
				var d3elmt = d3.select(element[0]);
				var marker = d3elmt.append('g').append('rect')
					.attr('width', 0);
				var contextMarks = d3elmt.append('g');
				var timescale = d3.time.scale().range([0, width]).clamp(true);
				var targetBounds;
				var contextLayer;

				// Snippet for tooltip
				var borderGenerator = function (w, h) {
					return [
						{'x': 0, 'y': 0},
						{'x': 0, 'y': h},
						{'x': w, 'y': h},
						{'x': w, 'y': 0},
						{'x': 0, 'y': 0}
					];
				};
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

				var tooltipText = tooltip.append('text');

				// mousemove management at SVG level
				// if mouse is over a mark, have it appearing
				d3elmt.on("mousemove", function(d) {

					var rectSel = d3elmt.selectAll('.mark')[0];
					var i=0, found;
					var bodyElt = $("body")[0];
					var coords = d3.mouse(bodyElt);

					while(!found && (i < rectSel.length)) {
							var dims = rectSel[i].getBBox();
							dims.top = $(rectSel[i]).offset().top;
							dims.left = $(rectSel[i]).offset().left;
							if(dims.top <= coords[1] && dims.left <= coords[0] &&
								dims.top + dims.height >= coords[1] && dims.left + dims.width >= coords[0]) {
									var aggrText = rectSel[i].__data__.data;
									if(!$.isArray(aggrText)) {
										aggrText = [ aggrText ];
									}

									tooltipHeight = 20 * aggrText.length;

									aggrText = aggrText.join('\n');
									tooltipText.datum(aggrText)
										.text(function(d2) {
											return d2;
										})
										.attr('x', tooltipPadding)
										.attr('y', tooltipHeight - tooltipPadding);
									tooltipWidth = tooltipText[0][0].getComputedTextLength();

									tooltip.attr("width", tooltipWidth + 2 * tooltipPadding)
										.attr("height", tooltipHeight)
										.select("path")
										.attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)));

									tooltip.style("top", (coords[1] - 10) + "px").style("left", (coords[0] + 10) + "px")
										.style("visibility", "visible");
									found = true;
							} else {
									tooltip.style("visibility", "hidden");
							}
						i++;
					}


				});

				d3elmt.on("mouseout", function() {
					tooltip.style("visibility", "hidden");
				});

				var updateMarker = function() {
					marker.datum(targetBounds)
						.attr('x', function(d) {
							return timescale(d[0]);
						})
						.attr('y', 0)
						.attr('width', function(d) {
							return timescale(d[1]) - timescale(d[0]);
						})
						.attr('height', 50)
						.attr('fill', "#FF0000")

				};

				var updateContext = function() {
					contextLayer.$promise.then(function(data) {
						var curSelect = contextMarks.selectAll('.mark')
							.data(contextLayer, function(d) {
								return d._id;});
						curSelect.enter().append('rect')
							.attr('class', 'mark');


						curSelect.attr('x', function(d) {
							return timescale(d.fragment.start);
						})
							.attr('y', 0)
							.attr('width', function(d) {
								return timescale(d.fragment.end) - timescale(d.fragment.start);
							})
							.attr('height', 50)
							.attr('fill', "#777777")
							.attr('opacity', 0.5);

						curSelect.exit().remove();
					});

				};


				scope.$watch('model.queueData._id', function (newValue) {
					if (newValue !== undefined) {
						timescale.domain([scope.model.infbndsec, scope.model.supbndsec]);
						targetBounds = [scope.model.queueData.fragment.start, scope.model.queueData.fragment.end];
						updateMarker();
						if(scope.model.queueData.fragment.context !== undefined) {
							contextLayer = Annotation.query({corpusId: scope.model.queueData.fragment.context.id_corpus,
																				mediaId: scope.model.queueData.fragment.context.id_medium,
																				layerId: scope.model.queueData.fragment.context._id});
							updateContext();
						} else {
							contextLayer = undefined;
						}

					}
				});

				scope.$watch('[model.infbndsec, model.supbndsec]', function(newValue) {
					if (newValue[1] !== undefined) {
						timescale.domain([scope.model.infbndsec, scope.model.supbndsec]);
						updateMarker();
						if(contextLayer !== undefined) {
							updateContext();
						}
					}
				}, true);


			}
		}
	}])



	.directive('cmTimeline', ['palette', 'DateUtils', function (palette, DateUtils) {
		return {
			restrict: 'A',
			link: function (scope, element) {
				// definition of timeline properties
				var margin = {}, margin2 = {}, width, height, height2;
				var lanePadding = 5;
				var laneHeight = 30;
				var contextPadding = 25;
				// hack : multiple time scales, to circumvent unsupported difference for dates in JS
				var xTimeScale, x2MsScale, x2TimeScale, yScale;
				var xAxis, xAxis2, yAxis;
				// SVG template caused binding problems - use <svg> in HTML instead
				//var d3elmt = d3.select(element[0]).append("svg"); // d3 wrapper of the SVG element
				var d3elmt = d3.select(element[0]);
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
				var clearSelection = function () {
					if (document.selection) {
						document.selection.empty();
					} else if (window.getSelection) {
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
					// xMsScale at controller level so that can be watched
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
						["%H:%M:%S", function () {
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
						.on("dragend", function () {
							scope.$apply(function () {
								scope.model.toggle_play(save_state);
							});
						});

					circleElement.call(drag);

				};

				// now rather a "refresh" function
				var updateLayers = function () {

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
						// hack : as DOM layer object is shifted to first annotation - use the enclosing <g>
						// NB that his margins (translate) define its shift wrt page
						// to get actual time position, y axis space has thus to be explicitly accounted for
						var gContainer = $($(currentLayer[0][0]).parent()[0]);
						var yAxisContainer = gContainer.children(".y");
						var pointerPos = coords[0] - (gContainer.offset().left + yAxisContainer[0].getBBox().width);
//                        var margin = pointerPos;

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
							return currentLayer.data()[0].tooltipFunc(d3.select(d).data()[0]);
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


					// updateColorScale now refreshed independently of a specific layer
					scope.updateColorScale();

					// TODO
					// adapt time scales
					adaptTimeScales();

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
							//TODO brush layer has to be validated with Pierrick
							//Only take into account none-computed layer
							if (d._id.indexOf("Computed") === -1) {
								return d._id;
							}
							else {
								return undefined;
							}
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
						.attr("class", "annot")
						.attr("id", function (d) {
//                            if (d._id == undefined) {
//                                console.log(d);
//                            }
							return "brushed" + d._id;
						});

					layerSel.exit().remove();

					layerSel = focus.selectAll(".layer")
						.data(scope.model.layers, function (d) {
							return d._id;
						});

					// new layer/annot update sequence to allow annotation removal/modifications
					layerSel.enter()
						.append("g")
						.attr("id", function (d) {
							return d._id;
						})

						.attr("class", "layer")
						.on("mouseover", function () {
							return tooltip.style("visibility", "visible");
						})
						.on("mousemove", refreshTooltipForLayer)
						.on("mouseout", function () {
							return tooltip.style("visibility", "hidden");
						});

					layerSel.exit().remove();

					var annotSel = layerSel.selectAll(".annot")
						.data(function (d) {
							// use the property "layer" from the upper level selection
							return d.layer;
						}, function (d2, i2) {
							// map cells in "layer" wrt their _id property
							// manage case where no _id property
							if (d2._id === undefined) {
								return i2;
							} else {
								return d2._id;
							}
						});

					annotSel.enter()
						.append("rect")
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
						.attr("id", function (d) {
							return d._id;
						})
						.on("click", function (d) {
							scope.$apply(function () {
								var save_state;
								save_state = scope.model.play_state;
								scope.model.toggle_play(false);
								scope.model.current_time = d.fragment.start;
								scope.model.toggle_play(save_state);
							});
						})
						.on("dblclick", function (d) {
							scope.$apply(function () {
								scope.model.toggle_play(false);
								scope.model.current_time = d.fragment.start;
								scope.model.toggle_play(true);
							});
							clearSelection();
						})
						.on('contextmenu', function (d) {
							d3.event.preventDefault();

							var $contextMenu = $("#contextMenu");
							var edit_layer_id = $(this).parent().attr("id");
							var edit_annot_id = $(this).attr("id");

							$contextMenu.css({
								display: "block",
								left: d3.event.pageX,
								top: d3.event.pageY
							});

							// disable context menu when click on auto-computed layer
							if (edit_layer_id.match(/Computed.*/) !== null) {
								$contextMenu.find("li").addClass("disabled").children().css({
									"pointer-events": "none"
								});
								edit_layer_id = undefined;
								edit_annot_id = undefined;
							}
							// enable context menu when click on a layer distinct from auto-computed layer
							else {
								$contextMenu.find("li").removeClass("disabled").children().css({
									"pointer-events": "all"
								});
							}


							scope.$apply(function () {
								// $apply has full window as this - use that pointer copy to preserve the context
								scope.model.edit_layer_id = edit_layer_id;
								scope.model.edit_annot_id = edit_annot_id;
								scope.model.edit_data = d.data;

							});

							return false;
						});

					annotSel.exit().remove();

					// allow refresh operations
					annotSel.attr("fill", function (d) {
						// use parent jquery to get the correct getkey func
						// to have refresh not to depend on specific addedLayer parameter
						//return scope.model.colScale(addedLayer.mapping.getKey(d));
						return scope.model.colScale(d3.select(this.parentNode).data()[0].mapping.getKey(d));
					});


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

//						// Restore initial color and opacity
						scope.model.layers.forEach(function (l) {
							// use of jQuery selector as d3 selector has limitations
							d3.select($("#" + l._id)[0]).selectAll("rect").attr("opacity", 0.4)
								.attr("fill", function (d) {
									return scope.model.colScale(d3.select(this.parentNode).data()[0].mapping.getKey(d));
								});
						});


						addedLayer = scope.model.layers[scope.model.selected_layer];

						// in Selected layer:
						d3.select($("#" + addedLayer._id)[0])
							.selectAll("rect").attr("opacity", function (d) {
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
							.attr("fill", function (d) {
								if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
									return scope.model.colScale("selection_color");
								}
								else {
									return scope.model.colScale(addedLayer.mapping.getKey(d));
								}
							});

					}
				};

				//TODO moved this block to allow it to be called multiple times
				var adaptTimeScales = function () {
					// Reinitialises infannot and supannot
					infannot = undefined;
					supannot = undefined;
					// Reinitialises infannotdate and supannotdate
					infannotdate = undefined;
					supannotdate = undefined;

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
				};


				// BUG #8946 : handle multiple additions/deletions
				// DEPRECATED : now use model.layersUpdated

				scope.$watch('model.layerWatch', function (newValue) {
//					var addedLayersId = newValue.filter(function (l) {
//						return !(oldValue.indexOf(l) > -1);
//					});
//
//					addedLayersId.forEach(function (d) {
//						updateLayers(d);
//					});
					if (newValue !== undefined && newValue.length > 0) {
						updateLayers();
					}

					// update min and max in scope
					scope.setMinimalXDisplayedValue(x2MsScale.domain()[0]);
					scope.setMaximalXDisplayedValue(x2MsScale.domain()[1]);

				}, true);


				scope.$watch('model.layersUpdated', function (newValue) {
					if (newValue === true) {
						updateLayers();
						scope.setMinimalXDisplayedValue(x2MsScale.domain()[0]);
						scope.setMaximalXDisplayedValue(x2MsScale.domain()[1]);
						scope.model.layersUpdated = false; // put the flag down
					}
				});


				scope.$watch('model.selected_slice', function (newValue) {
					updateLayerSelectedItem(newValue);
				}, true);


				// restrict timeline to loaded annotations if wanted
				scope.$watch("model.restrict_toggle", function (newValue) {

					// not usefull
					//adaptTimeScales();

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

				// to refresh playback marker position on brush events
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

	.directive('cmEditModal', ['LangUtils', function () {
		// LangUtils : isarray func.

		// edit form based on properties in model.edit_data
		// inspect properties, form with same structure and names
		// - if edit_data is a string: edit value
		// - if is an array: edit value_i
		// - if is a regular object: edit string properties with appropriate labels
		return {
			restrict: 'C',
			link: function (scope, element) {

				scope.$watch("model.edit_flag", function (newValue) {
					// a bit tedious procedure, to allow for extensions such as array or object data
					// (instead of mere string)
					if (newValue === true) {
						if (typeof scope.model.edit_data === 'string') {
							scope.model.edit_items = [
								{
									id: '',
									value: scope.model.edit_data
								}
							];
						}

						scope.model.edit_flag = false;
						element.modal('show');

						// get the middle screen Y position
						var y = (scope.f_clientHeight() / 2 - document.getElementById("modal-dialog").offsetHeight / 4);

						$("#modal-dialog").css({
							marginTop: y
						});

//                        element.modal('show');

					}
				});

				scope.model.edit_save = function () {

					scope.model.edit_save_element(scope.model.edit_items);
					element.modal('hide');

				};

			}
		};


	}])

	.directive('cmBarchart', ['palette', '$filter', function (palette, $filter) {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg id="barchart"></svg>',
			link: function (scope) {

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
				};

				scope.$watch('model.selected_layer', function (newValue) {
					if (newValue != null && newValue != "" && newValue != undefined) {
						scope.updateBarChart();
					}
				});

				scope.$watch('model.update_SummaryView', function () {
					scope.updateBarChart();
				}, true);

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
	.directive('cmPiechart', ['palette', function () {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg id="piechart"></svg>',
			link: function (scope) {

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

				scope.$watch('model.update_SummaryView', function () {
					scope.updatePiechart();
				}, true);

				scope.$watch('model.selected_slice', function (newValue) {
					if (newValue != undefined) {
						scope.updatePiechart();
					}
				}, true);

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
			link: function (scope) {


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

				scope.$watch('model.update_SummaryView', function () {
					scope.updateLegend();
				}, true);

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
			link: function (scope) {

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
							if (d.children || i === 0) {
								return "white";
							}
							else if (i - 1 == scope.model.selected_slice) {
								return scope.model.colScale("selection_color");
							}
							else {
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

				scope.$watch('model.update_SummaryView', function () {
					scope.updateTreeMap();
				}, true);

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
			link: function (scope, element) {
				$(element)[0].onsubmit = function () {
					$("#login-login").val($("#login", element).val());
					$("#login-password").val($("#password", element).val());

					scope.onSubmit(function () {
//					$("#login-form")[0].submit(); // wrongly redirects to root hostname
						window.location.reload();
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
	})
	.directive('ngRightClick', function ($parse) {
		return function (scope, element, attrs) {
			var fn = $parse(attrs.ngRightClick);
			element.bind('contextmenu', function (event) {
				scope.$apply(function () {
					event.preventDefault();
					fn(scope, {$event: event});
				});
			});
		};
	});


