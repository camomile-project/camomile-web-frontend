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

	.directive('cmTimeline', function() {
		return {
			restrict: 'E',
			replace: true,
			template: '<svg></svg>',
			link: function(scope, element, attrs) {
				var margin = {}, margin2 = {}, width, height, height2;
				// hack : multiple time scales, to circumvent unsupported date differences in JS
				var xMsScale, xTimeScale, x2MsScale, x2TimeScale;
				var xAxis, xAxis2, yAxis, colScale;
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
					height2 = 30;
					margin = {top: 20, right: 0, bottom: 60, left: 0.07*extWidth};
					margin2 = {top: height+10, right: 0, bottom: 20, left: 0.07*extWidth};
					width = extWidth - margin.left - margin.right;


					xTimeScale = d3.time.scale().domain([0,0]).range([0, width]).clamp(true);
					x2TimeScale = d3.time.scale().domain([0,0]).range([0, width]).clamp(true);
					xMsScale = d3.scale.linear().domain([0,0]).range([0, width]).clamp(true);
					x2MsScale = d3.scale.linear().domain([0,0]).range([0, width]).clamp(true);

					yAxis = d3.scale.ordinal(); // range is updated at each layer addition
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
					xAxis2 = d3.svg.axis().scale(x2TimeScale).orient("bottom").ticks(5)
						.tickFormat(customTimeFormat);

					brush = d3.svg.brush().x(x2MsScale).on("brush", brushed);

					// init elements
					focus = d3elmt.append("g");

					context = d3elmt.append("g");

					context.append("g")
						.attr("class", "brush")
						.call(brush)
						.selectAll("rect")
						.attr("y", -6)
						.attr("height", height2 + 7);

					focus.append("g")
						.attr("class", "x axis")
						.call(xAxis);

					context.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height2 + ")")
						.call(xAxis2);


				};



				var addLayer = function(layer) {
					var layerIndex = scope.model.layers.indexOf(layer);

					// define default mapping if needed
					if(layer.mapping === undefined) {
						layer.mapping = {
							getKey: function(d) {
								return d.data;
							}
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
						colScale.domain().push(vals);
						vals.forEach(function(d) {
							colScale.range().push(refColors[curColInd]);
							curColInd = (curColInd + 1) % refColors.length;
						});
					} else {
						var keys = [];
						var cols = [];
						for(var key in layer.mapping.colors) {
							keys.push(key);
							cols.push(layer.mapping.colors[key]);
						}
						colScale.domain().push(keys);
						colScale.range().push(cols);
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
					x2MsScale.domain([0, theMax]);
					if(brush.empty() || scope.model.layers.length === 0) {
						xMsScale.domain(x2MsScale.domain());
					}

					x2TimeScale.domain([parseDate("00:00:00.000"), maxDate]);
					if(brush.empty()|| scope.model.layers.length === 0) {
						xTimeScale.domain(x2TimeScale.domain());
					}

					// adapt component dimensions and y axis
					height = 30 * scope.model.layers.length;
					margin2.top = height+10;
					d3elmt.attr("height", height + margin.top + margin.bottom);
					context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					yAxis.domain().push(layer.label);
					yAxis.rangeBand([0, height]);


					context.selectAll(".layer")
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
						.attr("fill", "#999999")
						.attr("opacity", 0.2)
						.attr("x", function(d) {
							return x2MsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return x2MsScale(d.fragment.end)-x2MsScale(d.fragment.start);
						})
						.attr("y", 0)
						.attr("height", height2)
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
						.attr("opacity", 0.6)
						.attr("x", function(d) {
							return x2MsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return x2MsScale(d.fragment.end)-x2MsScale(d.fragment.start);
						})
						.attr("y", 0)
						.attr("height", 30)

						.attr("class", "annot");

					// update all lane positions
					focus.selectAll(".layer")
						.attr("transform", function(d,i) {
							return "translate(0," + ((i+1) * 30) + ")";
						});


				};

				var removeLayer = function(oldLayers, i) {
				};



				var refresh = function() {
					focus.selectAll(".annot")
						.attr("x", function(d) {
							return xMsScale(d.cell.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.cell.fragment.end)-xMsScale(d.cell.fragment.start);
						})
						.attr("y", 0)
						.attr("height", 30);

				};





				// ideally, we would have used watchCollection on model.layers, but the feature appears buggy in 1.2.0...
				// instead, use a redundant "currentId", that serves to trigger the notifications
				// or define and use "latestLayer"
				scope.$watch('model.latestLayer', function() {
					// add case : find layers that are in the new object, but not in old
					// use addLayer and remove layer to handle heavy operations

					var isAdded = (scope.model.layers.indexOf(scope.model.latestLayer) > -1);

					if(isAdded) {
						addLayer(scope.model.latestLayer);
					} else {
						removeLayer(scope.model.latestLayer);
					}


				});

				init();

			}
		}
	});





