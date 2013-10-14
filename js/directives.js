'use strict';

/* Directives */


angular.module('myApp.directives', ['ui.utils']).
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
	// scrollable div
	.directive('uiScroll', ['ui.config', function(uiConfig) {
		uiConfig.uiScrollr = uiConfig.uiSCroll || {};
		return {
			restrict: 'A',
			transclude: true,
			replace: true,
			scope: {
				values: '=ngModel'
			},
			template: '<div class="scroll-pane"><div ng-transclude></div></div>',
			link:function(scope,elm, $attrs,uiEvent ) {
				var expression,
					options = {
					};
				if ($attrs.uiScroll) {
					expression = scope.$eval($attrs.uiScroll);
				} else {
					expression = {};
				}

				//Set the options from the directive's configuration
				angular.extend(options, uiConfig.uiScroll, expression);
				console.log(options);
				elm.jScrollPane(options);
			}
		};
	}])
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
				var x, x2, yBand, yCol, yFont;
				// no need for a scale/axis for context view - use the whole height
				var xAxis, xAxis2, yAxis;
				var d3elmt = d3.select(element[0]); // d3 wrapper
				var brush, focus, context;

				// get luminance in [0,255]
				// used to set appropriate font color
				var getLuminance = function(colorStr) {
					// parse R, G and B from string
					var R = parseInt(colorStr.slice(1,3), 16);
					var G = parseInt(colorStr.slice(3,5), 16);
					var B = parseInt(colorStr.slice(5,7), 16);
					return 0.299*R + 0.587*G + 0.114*B;
				};

				// for gymnastics with time
				var parseDate = d3.time.format("%H:%M:%S.%L").parse;

				var msToTime = function(s) {
					function addZ(n) {
						return (n<10? '0':'') + n;
					}
					var ms = s % 1000;
					s = (s - ms) / 1000;
					var secs = s % 60;
					s = (s - secs) / 60;
					var mins = s % 60;
					var hrs = (s - mins) / 60;

					return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
				};


				var drawAnnots = function() {
					focus.selectAll(".annots")
						.data(scope.model.annotations)
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return yCol(d.data);
						})
						.attr("x", function(d) {
							return x(parseDate(msToTime(d.fragment.start)));
						})
						.attr("width", function(d) {
							return x(parseDate(msToTime(d.fragment.end-d.fragment.start)));
						})
						.attr("y", function(d) {
							return yBand(d.data);
						})
						.attr("height", yBand.rangeBand());

				};

				var initComp = function() {
					// init dimensions/margins
					var extWidth = element.parent().width();
					margin = {top: 10, right: 0.1*extWidth, bottom: 100, left: 0.1*extWidth},
					margin2 = {top: 430, right: 0.1*extWidth, bottom: 20, left: 0.1*extWidth},
					width = extWidth - margin.left - margin.right,
					height = 500 - margin.top - margin.bottom,
					height2 = 500 - margin2.top - margin2.bottom;

					d3elmt.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom);

					x = d3.time.scale().range([0, width]).clamp(true),
					x2 = d3.time.scale().range([0, width]).clamp(true),
					yBand = d3.scale.ordinal().rangeBands([0, height]),
					yCol = d3.scale.category10();

					// adapt font colors to yCol
					yFont = d3.scale.ordinal().range(yCol.range().map(function(el) {
						if(getLuminance(el) > 127) {
							return 'black';
						} else {
							return 'white';
						}
					}));

					xAxis = d3.svg.axis().scale(x).orient("bottom");
					xAxis2 = d3.svg.axis().scale(x2).orient("bottom");
					yAxis = d3.svg.axis().scale(yBand).orient("left");

					brush = d3.svg.brush().x(x2).on("brush", brushed);

					function brushed() {
						x.domain(brush.empty() ? x2.domain() : brush.extent());
						//focus.select("path").attr("d", area); // no need - other primitive
						drawAnnots();
						focus.select(".x.axis").call(xAxis);
					};

					focus = d3elmt.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					context = d3elmt.append("g")
						.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					// use time scale, ordinal scale for band layout,
					// and color scale for lane design (background with alpha value)


				};

				// alternatively : specify rect by its bounds ?
				var updateComp = function() {
					x.domain([parseDate("00:00:00.000"),
						d3.max(scope.model.annotations.map(function(d) { return parseDate(msToTime(d.fragment.end)); }))]);
					x2.domain(x.domain());
					// infer y domains from usage, see doc
					var modalities = [];
					scope.model.annotations.forEach(function(elm) {
						if(!modalities.hasOwnProperty('mod'+elm.data)) {
							modalities.push(elm.data);
							modalities['mod'+elm.data] = modalities.length-1;
						}
					});
					yBand.domain(modalities);
					yCol.domain(modalities);
					yFont.domain(modalities);

					// background rects for lanes
					// static, and not updated by brushes
					focus.selectAll(".lanes")
						.data(modalities)
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return yCol(d);
						})
						.attr("opacity", 0.1)
						.attr("x", x.range()[0])
						.attr("width", x.range()[1])
						.attr("y", function(d) {
							return yBand(d);
						})
						.attr("height", function(d) {
							return yBand.rangeBand();
						});

					drawAnnots();


					// display all at each step/brush -> clamp will filter what is displayed
					// area operates this way - no data remap is performed at each interaction

				};

				var resetComp = function() {
					// reset component to init in a consistent and stable way
				};

				initComp();
				scope.$watch('model.selected', function(newValue, oldValue, scope) {
					if(newValue !== undefined) {
						updateComp();
					} else {
						resetComp();
					}
				});
			}
		}
	});


