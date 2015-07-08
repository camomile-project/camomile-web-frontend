/**
 * Created by stefas on 04/03/15.
 * This directive create a time line. You have to import the service located in file dateUtils.js.
 * It have to be linked to a controller containing at least:
 *
 *      scope.model : an object
 *
 *      $scope.updateColorScale : a method that init the colorScale
 *
 *      $scope.model.layers : A list of layers. Each element must be structured as follow
 *
 *      {
 *          _id: an_id,
 *          label: a_label,
 *          mapping:
 *          {
 *              getKey: get_key_method,
 *              colors: color_method
 *          }
 *          layer: your_layer_data,
 *          tooltipFunc: tooltip_method
 *
 *      }
 *
 *      an_id is the id of your layer as a number
 *      a_label is the label of your layer, displayed in the timeline
 *      mapping: {} is an object used to map element label with a color
 *      tooltipFunc: a method returning element label, called when the mouse is over a layer element.
 *      your_layer_data is a list of object representing a layer, structured as follow:
 *      {
 *          fragment:
 *          {
 *              start: start_time_code,
 *              end: end_time_code
 *          },
 *          data: name_of_the_layer_object
 *      }
 *      data:name_of_the_layer_object is basically the label displayed for the element
 *      fragment: object containing information about start and end time of the layer element
 *
 *
 *      $scope.model.current_time : the position of the cursor (which can be linked with the video, as example)
 *
 *      $scope.model.layerWatch : a list of layer _id, so each time you add a layer, you have to add its id in this list
 *
 *      $scope.setMinimalXDisplayedValue : a method that change the value of the minimal X displayed value
 *
 *      $scope.setMaximalXDisplayedValue : a method that change the value of the maximal X displayed value
 *
 *      $scope.model.toggle_play : a method that is called each time you move tu cursor. So you can ask to play a linked
 *      video at the cursor position for instance
 *
 *
 * If you plan to implement the same version as visible on the front-end, just import commonCtrl.js and
 * explorationBaseCtrl.js. All elements listed on top are in explorationBaseCtrl.js and have to be modified the way you want.
 */
angular.module('myApp.directives')
	.directive('cmTimeline', ['DateUtils', function (DateUtils) {
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
						if ('function' == typeof (scope.clickOnASummaryViewSlice)) {
							scope.clickOnASummaryViewSlice(-1);
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

					// Update the brush layer on the time-line
					scope.model.brushUpdate = true;

					var layerSel = focus.selectAll(".layer")
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
						.attr("opacity", 1.0)
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
						//TODO: uncomment this if you want to use the context menu to allow annotation modification in the time line
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

					scope.model.xMsScale.domain(brush.empty() ? x2MsScale.domain() : brush.extent());
					xTimeScale.domain(brush.empty() ? x2TimeScale.domain() : brush.extent().map(x2MsScale).map(x2TimeScale.invert));
				};

				var updateLayerSelectedItem = function (selectedSliceValue) {
					if (scope.model.selected_layer != undefined && scope.model.selected_layer != -1) {

						var addedLayer;

//						// Restore initial color and opacity
						scope.model.layers.forEach(function (l) {
							// use of jQuery selector as d3 selector has limitations
							d3.select($("#" + l._id)[0]).selectAll("rect").attr("opacity", 1.0)
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
								if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.model.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
									return 1.0;
								}
								else
                                if (selectedSliceValue != undefined && selectedSliceValue != -1) {
									return 0.1;
								}
//								else {
//									return 0.4;
//								}
							})
							.attr("fill", function (d) {
								if (selectedSliceValue != undefined && selectedSliceValue != -1 && scope.model.slices[selectedSliceValue].element === addedLayer.mapping.getKey(d)) {
									return scope.model.colScale("selection_color");
								}
								else {
									return scope.model.colScale(addedLayer.mapping.getKey(d));
								}
							});

					}
				};

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

				var bushRects;
				// TODO: this is not how context is supposed to be updated - see in updateLayers how
				// TODO: scope.model.layers is processed. This causes several problems, eg if with want to restrict_toggle.
				scope.$watch('model.brushUpdate', function (newValue) {
					if (newValue === true) {

						// Be sure to remove stuff only when meta data are loaded and only once
						//if (bushRects !== undefined && scope.model.brushRemove) {
						if (bushRects !== undefined) {
							var layerToRemove = document.getElementById('brush-rects-div');
							layerToRemove.parentNode.removeChild(layerToRemove);
							bushRects = undefined;
						}

						if (bushRects === undefined) {
							bushRects = context.insert("g", ".brush").attr("id", "brush-rects-div");
						}


						// Be sure to do it only when a layer has changed, not when meta data are loaded
						// originally condition on brushRemove
						// but not triggered in case of medium change then
						//if (scope.model.selected_reference !== undefined || scope.model.selected_hypothesis !== undefined) {
						scope.model.layers.forEach(function (d) {
							d.layer.forEach(function (layer) {
								if (layer._id != undefined && layer._id.indexOf("Computed") === -1) {
									bushRects
										//.append("g")
										//.attr("class", "layer")
										.append("rect")
										.attr("fill", "#999999")
										.attr("opacity", 0.2)
										.attr("x", function () {
											return x2MsScale(layer.fragment.start);
										})
										.attr("width", function () {
											return x2MsScale(layer.fragment.end) - x2MsScale(layer.fragment.start);
										})
										.attr("y", 0)
										.attr("height", laneHeight)
										.attr("class", "annot-brushed")
										.attr("id", function () {
											return "brushed" + layer._id;
										});
								}
							});
						});
						//}
						scope.model.brushUpdate = false;
						//scope.model.brushRemove = false;
					}


				});

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
				scope.$watch("model.reinit_video_size", function (newValue) {
					if (newValue === true) {
						x2MsScale.domain([0, scope.model.duration]);
						x2TimeScale.domain([DateUtils.parseDate(0),
							DateUtils.parseDate(scope.model.duration)]);
						scope.model.infbndsec = 0;
						scope.model.supbndsec = scope.model.duration;
						scope.model.reinit_video_size = false;
						scope.model.xMsScale.domain(x2MsScale.domain());
						xTimeScale.domain(x2TimeScale.domain());

						// reset axes and brush
						d3.selectAll(".brush").call(brush.clear());
						focus.select(".x.axis").call(xAxis);
						context.select(".x.axis").call(xAxis2);

						// refresh layers, and brush update is commanded by this refresh
						scope.model.layersUpdated = true;
						//scope.model.brushUpdate = true;
						//scope.model.brushRemove = true;

					}

				});

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

					//context.selectAll(".annot-brushed")
//					bushRects.selectAll(".annot-brushed")
//						.attr("x", function (d) {
//							return x2MsScale(d.fragment.start);
//						})
//						.attr("width", function (d) {
//							return x2MsScale(d.fragment.end) - x2MsScale(d.fragment.start);
//						});


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
	]);