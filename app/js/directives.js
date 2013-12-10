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

			        var player = $( "#player" )[0];

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

					focus.selectAll(".annot")
						.attr("x", function(d) {
							return xMsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.fragment.end)-xMsScale(d.fragment.start);
						});

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

				var updateLayers = function(addedLayerId, removedLayerId) {
					var addedLayer, removedLayer;
					if(addedLayerId !== undefined) {
						addedLayer = scope.model.layers.filter(function(l) {
							return(l._id === addedLayerId);
						})[0];
					}
					if(removedLayerId !== undefined) {
						removedLayer = scope.model.layers.filter(function(l) {
							return(l._id === removedLayerId);
						})[0];
					}

					// update color scale consistently if layer has been added
					if((addedLayer !== undefined) && (addedLayer.mapping === undefined)) {
						addedLayer.mapping = {
							getKey: function(d) {
								return d.data;
							}
						};
					}

					if((addedLayer !== undefined) && (addedLayer.tooltipFunc === undefined)) {
						addedLayer.tooltipFunc = function(d) {
							return d.data;
						};
					}

					if(addedLayer !== undefined) {
						if(addedLayer.mapping.colors === undefined) {
							// use default mapping, or define a custom one
							var vals = addedLayer.layer.map(addedLayer.mapping.getKey);
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
							for(var key in addedLayer.mapping.colors) {
								colScale.domain().push(key);
								colScale.domain(colScale.domain());
								colScale.range().push(addedLayer.mapping.colors[key]);
								colScale.range(colScale.range());
							}
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

					yScale.domain(scope.model.layers.map(function(el) {
						return {id: el._id,
							str: el.label,
							toString: function() {
								return this.str;
							}}}));
					yScale.rangeBands([0, height]);

					focus.select(".y.axis").call(yAxis);
					focus.select(".x.axis").call(xAxis);
					context.select(".x.axis").call(xAxis2);

					var layerSel = context.selectAll(".layer")
						.data(scope.model.layers, function(d) {
							return d._id;
						});

					layerSel.enter()
						.insert("g", ".brush")// insert before ".brush"
						.attr("class", "layer")
						.selectAll(".annot")
						.data(function(d) {
							return d.layer;
						})
						// derive simple example to understand clearly why it does not work (example.html)
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

					layerSel.exit().remove();

					layerSel = focus.selectAll(".layer")
						.data(scope.model.layers, function(d) {
							return d._id;
						});

					layerSel.enter()
						.append("g")
						.attr("class", "layer").selectAll(".annot")
						.data(function(d) {
							return d.layer;
						})
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return colScale(addedLayer.mapping.getKey(d));
						})
						.attr("opacity", 0.4)
						.attr("y", 0)
						.attr("height", laneHeight)
						.attr("x", function(d) {
							return xMsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.fragment.end)-xMsScale(d.fragment.start);
						})
						.attr("class", "annot")
						.on("mouseover", function(d){
							tooltip.text(addedLayer.tooltipFunc(d)); return tooltip.style("visibility", "visible");
						})
						.on("mousemove", function(){
							return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
						})
						.on("mouseout", function(){
							return tooltip.style("visibility", "hidden");
						})
						.on("click", function(d) {
						    player.currentTime = d.fragment.start;
						    player.play();
						});

					layerSel.exit().remove();

					// update positions of new selection
					layerSel.attr("transform", function(d,i) {
						return "translate(0," + (lanePadding+(i*(lanePadding+laneHeight))) + ")";
					});

					// refresh all annotations in case of rescale
					focus.selectAll(".annot")
						.attr("x", function(d) {
							return xMsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.fragment.end)-xMsScale(d.fragment.start);
						});

					// adjust font size to available space in left margin
					var maxTickLength=0;
					focus.select(".y")
						.selectAll("text")[0]
						.forEach(function(d) {
							if(d.getComputedTextLength() > maxTickLength) {
								maxTickLength = d.getComputedTextLength();
							}
						});
					maxTickLength = maxTickLength * 16 / 12; // approx. points to pixels conversion
					focus.select(".y")
						.selectAll("text")
						.attr("font-size", "" +110*margin.left/maxTickLength +"%");


				};




				// instead, updating layer function
				// updateLayers(newLayer, oldLayer)

				// scope.$watch('model.video', function(newValue, oldValue) {
				// 	player.attr("src", scope.model.video);
				// });

				scope.$watch('model.layerWatch', function(newValue, oldValue) {
					// watches are executed at initialization, even if latestLayer is still undefined
					// -> care with tests

					var addedLayerId = newValue.filter(function(l) {
						return !(oldValue.indexOf(l) > -1);
					});
					addedLayerId = (addedLayerId.length > 0) ? addedLayerId[0] : undefined;


					var removedLayerId = oldValue.filter(function(l) {
						return !(newValue.indexOf(l) > -1);
					});
					removedLayerId = (removedLayerId.length > 0) ? removedLayerId[0] : undefined;

					updateLayers(addedLayerId, removedLayerId);

				}, true);


				init();

			}
		}
	});





