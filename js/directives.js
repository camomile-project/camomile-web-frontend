'use strict';

/* Directives */


angular.module('myApp.directives', ['myApp.filters']).
	directive('appVersion', ['version', function(version) {
		return function(scope, elm, attrs) {
			elm.text(version);
		};
	}])
	// toggable panel for nested display
	.directive('cmToggable', function() {
		return {
			restrict: 'C',
			replace: false,
			transclude: true,
			scope: {
				opened: '=' // bound to model.<elem>Opened at the parent level
			},
			template: '<div class=\"emph clickable closed\" ng-click=\"toggle()\" ng-transclude></div>',
			link: function(scope, element, attrs) {
				var clickElmt = angular.element(element.children()[0]);
				scope.toggle = function() {
					scope.opened = !scope.opened;
					clickElmt.removeClass(scope.opened ? 'closed' : 'opened');
					clickElmt.addClass(scope.opened ? 'opened' : 'closed');
				}

			}};
	})

	//clickable elements in a list
	.directive('cmClickable', function() {
		return {
			restrict: 'C',
			link: function(scope, element, attrs) {
				scope.$watch('model.selected', function(newValue, oldValue, scope) {
					if(element.hasClass('alert') && (newValue !== scope.$index)) {
						element.removeClass('round').removeClass('alert');
					}
					if((!element.hasClass('alert')) && (newValue === scope.$index)) {
						element.addClass('round').addClass('alert');
					}
				});
				$('.scroll-pane').jScrollPane({
					showArrows: true,
					autoReinitialise: true
				});
			}
		};
	})
	// hack to deselect currently selected element
	.directive('clickAnywhereButHere', function($document){
		return {
			restrict: 'A',
			link: function(scope, elem, attr, ctrl) {
				elem.bind('click', function(e) {
					e.stopPropagation();
				});
				$document.bind('click', function() {
					// magic here.
					scope.$apply(attr.clickAnywhereButHere);
				})
			}
		}
	})

.directive('cmDropdown', function() {
		return {
			restrict: 'C',
			replace: false,
			transclude: false,
			scope: {
				dropId: "&dropId",
				title: "=dropTitle",
				coll: "=coll",
				selectedId: "=selectedId",
				enabledRef: "=enabledRef"
			},
			link: function(scope, element, attrs) {
				var ulElmt;
				scope.toggle = function(newState, ev) {
					if(ulElmt === undefined) {
						ulElmt = element.find('#'+scope.dropId());
						ulElmt.attr("position", "absolute")
							.css("top", ""+(element.position().top+element.height()/2)+"px")
							.css("left", "-9999px")
							.css("max-width", ""+(element.width())+"px");
					}
					if(ulElmt.hasClass('open')) {
						ulElmt.removeClass('open');
						ulElmt.css("left", "-9999px");
					} else {
						ulElmt.addClass('open');
						ulElmt.css("left", ""+(element.position().left)+"px");
					}
				};
				scope.select = function(id) {
					scope.selectedId=id;
					scope.toggle();
				};
			}
		}
	})


	.directive('cmTimeline', function() {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg></svg>',
			link: function(scope, element, attrs) {
				var margin = {}, margin2 = {}, width, height, height2;
				var lanePadding = 5;
				var laneHeight = 30;
				var contextPadding = 25;
				// hack : multiple time scales, to circumvent unsupported difference for dates in JS
				var xMsScale, xTimeScale, x2MsScale, x2TimeScale, yScale, colScale;
				var xAxis, xAxis2, yAxis;
				var curColInd = 0;
				var d3elmt = d3.select(element[0]); // d3 wrapper
				var refColors = d3.scale.category20().range();
				var brush, focus, context;




				// for gymnastics with time
				var parseDate = d3.time.format("%H:%M:%S.%L").parse;

				var secToTime = function(s) {
					function addZ(n) {
						return (n<10? '0':'') + n;
					}

					var ms = s % 1;
					s = Math.floor(s);
					var secs = s % 60;
					s = (s - secs) / 60;
					var mins = s % 60;
					var hrs = (s - mins) / 60;

					// hack to force ms with 3 decimal parts
					ms = parseFloat("0." + ms.toString()).toFixed(3).slice(2);

					return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
				};

				function timeFormat(formats) {
					return function(date) {
						var i = formats.length - 1, f = formats[i];
						while (!f[1](date)) f = formats[--i];
						return f[0](date);
					};
				}

				var tooltip = d3.select("body")
					.append("div")
					.style("position", "absolute")
					.style("z-index", "10")
					.style("visibility", "hidden")
					.style("background-color", "yellow")
					.style("border-style", "solid")
					.style("border-color", "red");



				var brushed = function() {
					var brushRange = brush.extent().map(x2MsScale);
					xMsScale.domain(brush.empty() ? x2MsScale.domain() : brush.extent());
					xTimeScale.domain(brush.empty() ? x2TimeScale.domain() : brushRange.map(x2TimeScale.invert));
					refresh();
					focus.select(".x.axis").call(xAxis);
				};

				var init = function() {
					// init dimensions/margins
					// height set depending on number of modalities - in updateComp
					var extWidth = element.parent().width();
					height = 0;
					height2 = laneHeight;
					margin = {top: 20, right: 20, bottom: height2+contextPadding+20, left: 0.15*extWidth};
					margin2 = {top: margin.top+height+contextPadding, right: 20, bottom: 20, left: 0.15*extWidth};
					width = extWidth - margin.left - margin.right;


					xTimeScale = d3.time.scale().domain([0,0]).range([0, width]).clamp(true);
					x2TimeScale = d3.time.scale().domain([0,0]).range([0, width]).clamp(true);
					xMsScale = d3.scale.linear().domain([0,0]).range([0, width]).clamp(true);
					x2MsScale = d3.scale.linear().domain([0,0]).range([0, width]).clamp(true);

					yScale = d3.scale.ordinal().range([0, height]); // range is updated at each layer addition
					colScale = d3.scale.ordinal(); // custom color scale

					var customTimeFormat = timeFormat([
						[d3.time.format("%H:%M:%S"), function(d) { return true; }],
						[d3.time.format("%M:%S"), function(d) { return d.getSeconds(); }],
						[d3.time.format("%S.%L"), function(d) { return d.getMilliseconds(); }]
					]);

					d3elmt.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom);

					xAxis = d3.svg.axis().scale(xTimeScale).orient("top").ticks(5)
						.tickFormat(customTimeFormat);
					xAxis2 = d3.svg.axis().scale(x2TimeScale).orient("top").ticks(5)
						.tickFormat(customTimeFormat);
					yAxis = d3.svg.axis().scale(yScale).orient("left");

					brush = d3.svg.brush().x(x2MsScale).on("brush", brushed);

					// init elements
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


				};



				var addLayer = function(layer) {
					// define default mapping if needed
					if(layer.mapping === undefined) {
						layer.mapping = {
							getKey: function(d) {
								return d.data;
							}
						};
					}

					if(layer.tooltipFunc === undefined) {
						layer.tooltipFunc = function(d) {
							return d.data;
						};
					}

					if(layer.mapping.colors === undefined){
						// use default mapping, or define a custom one
						var vals = layer.layer.map(layer.mapping.getKey);
						vals = $.grep(vals, function(v, k){
							return $.inArray(v ,vals) === k;
						}); // jQuery hack to get Array of unique values
						// and then all that are not already in the scale domain
						vals = vals.filter(function(l) {return !(colScale.domain().indexOf(l) > -1);});
						vals.forEach(function(d) {
							colScale.domain().push(d);
							colScale.domain(colScale.domain()); // hack to register changes
							colScale.range().push(refColors[curColInd]);
							colScale.range(colScale.range());
							curColInd = (curColInd + 1) % refColors.length;
						});
					} else {
						for(var key in layer.mapping.colors) {
							colScale.domain().push(d);
							colScale.domain(colScale.domain());
							colScale.range().push(layer.mapping.colors[key]);
							colScale.range(colScale.range());
						}
					}

					// adapt reference scales
					var theMax = 0;
					var curMax;
					var maxDate = parseDate("00:00:00.000");
					scope.model.layers.forEach(function(l) {
						curMax = d3.max(l.layer.map(function(d) { return d.fragment.end; }));
						theMax = d3.max([theMax, curMax]);
						curMax = d3.max(l.layer.map(function(d) { return parseDate(secToTime(d.fragment.end)); }));
						maxDate = d3.max([maxDate, curMax]);
					});

					// adapt brush to new scale
					var brushExtent = [];
					if(!brush.empty()) {
						brushExtent = brush.extent();
					}

					x2MsScale.domain([0, theMax]);
					x2TimeScale.domain([parseDate("00:00:00.000"), maxDate]);

					if(!brush.empty()){
						brush.extent(brushExtent);
						brush(context.select(".brush"));
					}

					if(brush.empty()|| scope.model.layers.length === 0) {
						xMsScale.domain(x2MsScale.domain());
						xTimeScale.domain(x2TimeScale.domain());
					}

					// adapt component dimensions and y axis
					height = (lanePadding+laneHeight) * scope.model.layers.length;
					margin2.top = margin.top+height+contextPadding;
					d3elmt.attr("height", height + margin.top + margin.bottom);
					context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					yScale.domain().push({id: layer._id,
																str: layer.label,
																toString: function() {
																	return this.str;
																}});
					yScale.domain(yScale.domain());
					yScale.rangeBands([0, height]);

					focus.select(".y.axis").call(yAxis);
					focus.select(".x.axis").call(xAxis);
					context.select(".x.axis").call(xAxis2);

					context.selectAll(".layer")
						.data(scope.model.layers, function(d) {
							return d._id;
						})
						.enter()
						.insert("g", ".brush")// insert before ".brush"
						.attr("class", "layer")
						.selectAll(".annot")
						.data(layer.layer, function(d) {
							return d._id;
						})
						.enter()
						.append("rect")
						.attr("fill", "#999999")
						.attr("opacity", 0.2)
						.attr("x", function(d) {
							return x2MsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return x2MsScale(d.fragment.end)-x2MsScale(d.fragment.start);
						})
						.attr("y", 0)
						.attr("height", laneHeight)
						.attr("class", "annot");



					focus.selectAll(".layer")
						.data(scope.model.layers, function(d) {
							return d._id;
						})
						.enter()
						.append("g")
						.attr("class", "layer")
						.selectAll(".annot")
						.data(layer.layer, function(d) {
							return d._id;
						})
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return colScale(layer.mapping.getKey(d));
						})
						.attr("opacity", 0.4)
						.attr("y", 0)
						.attr("height", laneHeight)

						.attr("class", "annot")
						.on("mouseover", function(d){
							tooltip.text(layer.tooltipFunc(d)); return tooltip.style("visibility", "visible");
						})
						.on("mousemove", function(){
							return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
						})
						.on("mouseout", function(){
							return tooltip.style("visibility", "hidden");
						});


					// update all lane positions
					focus.selectAll(".layer")
						.attr("transform", function(d,i) {
							return "translate(0," + (lanePadding+(i*(lanePadding+laneHeight))) + ")";
						});


				};

				var removeLayer = function(layer) {
					// seek color mapping for unused colors
					var vals = [];
					scope.model.layers.forEach(function(l) {
						vals = vals.concat(l.layer.map(function(d) {
							return l.mapping.getKey(d);
						}));
					});
					// reorder according to current range
					vals = colScale.domain().filter(function(l) {return (vals.indexOf(l) > -1);});
					colScale.domain(vals);
					colScale.range(vals.map(colScale));

					// adapt timescales
					var theMax = 0;
					var curMax;
					var maxDate = parseDate("00:00:00.000");
					scope.model.layers.forEach(function(l) {
						curMax = d3.max(l.layer.map(function(d) { return d.fragment.end; }));
						theMax = d3.max([theMax, curMax]);
						curMax = d3.max(l.layer.map(function(d) { return parseDate(secToTime(d.fragment.end)); }));
						maxDate = d3.max([maxDate, curMax]);
					});

					// adapt brush to new scale
					var brushExtent = [];
					if(!brush.empty()) {
						brushExtent = brush.extent();
						if(brushExtent[1] > theMax) {
							brushExtent[1] = theMax;
						}
						if(brushExtent[0] > theMax) {
							brush.clear();
							brush(context.select(".brush"));
						}
					}

					x2MsScale.domain([0, theMax]);
					x2TimeScale.domain([parseDate("00:00:00.000"), maxDate]);

					if(!brush.empty()){
						brush.extent(brushExtent);
						brush(context.select(".brush"));
						brush.event(context.select(".brush")); // force refresh in case of clamping
					}

					if(brush.empty()|| scope.model.layers.length === 0) {
						xMsScale.domain(x2MsScale.domain());
						xTimeScale.domain(x2TimeScale.domain());
					}



					// adapt component size
					height = (lanePadding+laneHeight) * scope.model.layers.length;
					margin2.top = margin.top+height+contextPadding;
					d3elmt.attr("height", height + margin.top + margin.bottom);
					context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					// remove from yscale using _id
					yScale.domain(yScale.domain().filter(function(e) {
						return e.id !== layer._id;
					}));
					yScale.rangeBands([0, height]);

					focus.select(".y.axis").call(yAxis);
					focus.select(".x.axis").call(xAxis);
					context.select(".x.axis").call(xAxis2);


					// remove annotations and lanes
					context.selectAll(".layer")
						.data(scope.model.layers, function(d) {
							return d._id;
						})
						.exit()
						.remove();

					focus.selectAll(".layer")
						.data(scope.model.layers, function(d) {
							return d._id;
						})
						.exit()
						.remove();

					// update all lane positions
					focus.selectAll(".layer")
						.attr("transform", function(d,i) {
							return "translate(0," + (lanePadding+(i*(lanePadding+laneHeight))) + ")";
						});

				};



				var refresh = function() {
					focus.selectAll(".annot")
						.attr("x", function(d) {
							return xMsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.fragment.end)-xMsScale(d.fragment.start);
						})
				};






				scope.$watch('model.layers.length', function(newValue, oldValue) {
					// add case : find layers that are in the new object, but not in old
					// use addLayer and remove layer to handle heavy operations

					// watches are executed at initialization, even if latestLayer is still undefined
					// -> care with tests
					var isAdded = (newValue - oldValue) === 1;
					var isRemoved = (newValue - oldValue) === -1;

					if(isAdded) {
						addLayer(scope.model.latestLayer);
					}
					if(isRemoved) {
						removeLayer(scope.model.latestLayer);
					}
					refresh();


				});


// watchCollection still buggy (see https://github.com/angular/angular.js/issues/2621)
// alternatively, watch layers length, and use latestLayer for quicker reference
//				scope.$watchCollection('model.layers', function(newLayers, oldLayers, scope) {
//					// add case : find layers that are in the new object, but not in old
//					// use addLayer and remove layer to handle heavy operations
//
//					// watches are executed at initialization, even if latestLayer is still undefined
//					// -> care with tests
//					console.log("added");
//					var isAdded = (scope.model.layers.indexOf(scope.model.latestLayer) > -1);
//
//					if(isAdded) {
//						addLayer(scope.model.latestLayer);
//					} else if(scope.model.latestLayer !== undefined) {
//						removeLayer(scope.model.latestLayer);
//					}
//					refresh();
//
//
//				});


				init();

			}
		}
	});





