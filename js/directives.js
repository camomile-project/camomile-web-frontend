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
				var xMsScale, xTimeScale, x2MsScale, x2TimeScale, yBand, yCol, yFont;
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
					var roundedS = Math.round(s);
					var ms = roundedS % 1000;
					roundedS = (roundedS - ms) / 1000;
					var secs = roundedS % 60;
					roundedS = (roundedS - secs) / 60;
					var mins = roundedS % 60;
					var hrs = (roundedS - mins) / 60;

					return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
				};

				var videoTime = function(date, ext) {
					var hours = date.toString().slice(16,18)+":";
					var minutes = date.toString().slice(19,21)+":";
					var seconds = date.toString().slice(22,24);
					if(ext < 3600000) {
						hours = "";
					}
					if(ext < 60000) {
						minutes = "";
					}

					return hours+minutes+seconds;
				};

				// readapt annotations to current scale
				var drawAnnots = function() {
					focus.selectAll(".annot")
						.data(scope.model.annotations)
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return yCol(d.data);
						})
						.attr("class", "annot");

					focus.selectAll(".annot")
						.attr("x", function(d) {
							return xMsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.fragment.end)-xMsScale(d.fragment.start);
						})
						.attr("y", function(d) {
							return yBand(d.data);
						})
						.attr("height", yBand.rangeBand());

				};

				var filterXAxis = function(axis, scale) {
					// get axis extent
					var ext = scale.domain();
					ext = ext[1] - ext[0];
					axis.selectAll("text")
						.text(function(d) {
							// d3 time scale displays ms as ".057" for very small scale - use that pattern
							var msecs = this.textContent.match(/^\..*/);
							msecs = (msecs ? msecs[0] : "");
							return(videoTime(d, ext)+msecs);
						});
				}
				// generalize behaviour CURPBR

				var initComp = function() {
					// init dimensions/margins
					// height set depending on number of modalities - in updateComp
					var extWidth = element.parent().width();
					margin = {top: 20, right: 0, bottom: 60, left: 0.15*extWidth},
					margin2 = {right: 0, bottom: 20, left: 0.15*extWidth},
					width = extWidth - margin.left - margin.right,
					height2 = 30;


					xTimeScale = d3.time.scale().range([0, width]).clamp(true),
					x2TimeScale = d3.time.scale().range([0, width]).clamp(true),
					xMsScale = d3.scale.linear().range([0, width]).clamp(true);
					x2MsScale = d3.scale.linear().range([0, width]).clamp(true);
					yBand = d3.scale.ordinal();
					yCol = d3.scale.category10();

					// adapt font colors to yCol
					yFont = d3.scale.ordinal().range(yCol.range().map(function(el) {
						if(getLuminance(el) > 127) {
							return 'black';
						} else {
							return 'white';
						}
					}));

					xAxis = d3.svg.axis().scale(xTimeScale).orient("top");
					xAxis2 = d3.svg.axis().scale(x2TimeScale).orient("bottom");
					yAxis = d3.svg.axis().scale(yBand).orient("left");

					brush = d3.svg.brush().x(x2MsScale).on("brush", brushed);

					function brushed() {
						var brushRange = brush.extent().map(x2MsScale);
						xMsScale.domain(brush.empty() ? x2MsScale.domain() : brush.extent());
						xTimeScale.domain(brush.empty() ? x2TimeScale.domain() : brushRange.map(x2TimeScale.invert));
						drawAnnots();
						focus.select(".x.axis").call(xAxis);
						filterXAxis();
					};

					// init elements
					focus = d3elmt.append("g");

					context = d3elmt.append("g");



				};


				var updateComp = function() {
					xTimeScale.domain([parseDate("00:00:00.000"),
						d3.max(scope.model.annotations.map(function(d) { return parseDate(msToTime(d.fragment.end)); }))]);
					x2TimeScale.domain(xTimeScale.domain());
					xMsScale.domain([0, d3.max(scope.model.annotations.map(function(d) { return d.fragment.end; }))]);
					x2MsScale.domain(xMsScale.domain());

					var modalities = [];
					scope.model.annotations.forEach(function(elm) {
						if(!modalities.hasOwnProperty('mod'+elm.data)) {
							modalities.push(elm.data);
							modalities['mod'+elm.data] = modalities.length-1;
						}
					});

					// customize dimensions depending on number of modalities
					height = modalities.length * 30;
					margin2.top = height + margin.top + 10;

					d3elmt.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom);

					focus.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
					yBand.rangeBands([0, height]);

					yBand.domain(modalities);
					yCol.domain(modalities);
					yFont.domain(modalities);


					// background rects for lanes
					// static, and not updated by brushes
					focus.selectAll(".lane")
						.data(modalities)
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return yCol(d);
						})
						.attr("opacity", 0.1)
						.attr("x", xMsScale.range()[0])
						.attr("width", xMsScale.range()[1])
						.attr("y", function(d) {
							return yBand(d);
						})
						.attr("height", function(d) {
							return yBand.rangeBand();
						})
						.attr("class", "lane");

					drawAnnots();

					context.selectAll(".annot")
						.data(scope.model.annotations)
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

					context.append("g")
						.attr("class", "x brush")
						.call(brush)
						.selectAll("rect")
						.attr("y", -6)
						.attr("height", height2 + 7);

					focus.append("g")
						.attr("class", "x axis")
						//.attr("transform", "translate(0," + height + ")")
						.call(xAxis);

					filterXAxis();

					context.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height2 + ")")
						.call(xAxis2);

					focus.append("g")
						.attr("class", "y axis")
						.call(yAxis);

					// adjust y axis font size to meet the available space
					// first, get default max computed text width
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

				var resetComp = function() {
					// reset component to init in a consistent and stable way
					focus.selectAll(".lane")
						.remove();
					focus.selectAll(".annot")
						.remove();
					context.selectAll(".annot")
						.remove();
					context.selectAll(".brush")
						.remove();
					focus.selectAll(".axis")
						.remove();
					context.selectAll(".axis")
						.remove();
					brush.clear();
				};


				scope.$watch('model.selected', function(newValue, oldValue, scope) {
					resetComp();
					if(newValue !== undefined) {
						updateComp();
					}
				});

				initComp();

			}
		}
	});


