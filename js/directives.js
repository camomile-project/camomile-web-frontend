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
				var xAxis, xAxis2, yAxis;
				var d3elmt = d3.select(element[0]); // d3 wrapper
				var brush, focus, context;

				var d3layers = [];
				var colScales = [];

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

				// readapt annotations to current scale
				var drawAnnots = function() {
					// for each in d3layers
					focus.selectAll(".annot")
						.data(scope.model.annotations)
						.enter()
						.append("rect")
						.attr("fill", function(d) {
							return yCol(d.data);
						})
						.attr("opacity", 0.2)
						.attr("class", "annot");

					focus.selectAll(".annot")
						.attr("x", function(d) {
							return xMsScale(d.fragment.start);
						})
						.attr("width", function(d) {
							return xMsScale(d.fragment.end)-xMsScale(d.fragment.start);
						})
						.attr("y", function(d) {
							return 0;
						})
						.attr("height", height);

				};

				var brushed = function() {
					var brushRange = brush.extent().map(x2MsScale);
					xMsScale.domain(brush.empty() ? x2MsScale.domain() : brush.extent());
					xTimeScale.domain(brush.empty() ? x2TimeScale.domain() : brushRange.map(x2TimeScale.invert));
					drawAnnots();
					focus.select(".x.axis").call(xAxis);
				};

				var initComp = function() {
					// init dimensions/margins
					// height set depending on number of modalities - in updateComp
					var extWidth = element.parent().width();
					margin = {top: 20, right: 0, bottom: 60, left: 0.07*extWidth},
					margin2 = {right: 0, bottom: 20, left: 0.07*extWidth},
					width = extWidth - margin.left - margin.right,
					height2 = 30;


					xTimeScale = d3.time.scale().domain([0,0]).range([0, width]).clamp(true);
					x2TimeScale = d3.time.scale().domain([0,0]).range([0, width]).clamp(true);
					xMsScale = d3.scale.linear().domain([0,0]).range([0, width]).clamp(true);
					x2MsScale = d3.scale.linear().domain([0,0]).range([0, width]).clamp(true);

					yAxis = d3.scale.ordinal(); // range is updated at each layer addition

					var customTimeFormat = timeFormat([
						[d3.time.format("%H:%M:%S"), function(d) { return true; }],
						[d3.time.format("%M:%S"), function(d) { return d.getSeconds(); }],
						[d3.time.format("%S.%L"), function(d) { return d.getMilliseconds(); }]
					]);

					xAxis = d3.svg.axis().scale(xTimeScale).orient("top").ticks(5)
						.tickFormat(customTimeFormat);
					xAxis2 = d3.svg.axis().scale(x2TimeScale).orient("bottom").ticks(5)
						.tickFormat(customTimeFormat);

					brush = d3.svg.brush().x(x2MsScale).on("brush", brushed);

					// init elements
					focus = d3elmt.append("g");

					context = d3elmt.append("g");

				};


				//


				var updateComp = function() {
					xMsScale.domain([0, d3.max(scope.model.annotations.map(function(d) { return d.fragment.end; }))]);
					x2MsScale.domain(xMsScale.domain());

					xTimeScale.domain([parseDate("00:00:00.000"),
							d3.max(scope.model.annotations.map(function(d) { return parseDate(secToTime(d.fragment.end)); }))])
					x2TimeScale.domain(xTimeScale.domain());

					var modalities = [];
					scope.model.annotations.forEach(function(elm) {
						if(!modalities.hasOwnProperty('mod'+elm.data)) {
							modalities.push(elm.data);
							modalities['mod'+elm.data] = modalities.length-1;
						}
					});

					// customize dimensions depending on number of modalities
					//height = modalities.length * 30;
					height = 30;
					margin2.top = height + margin.top + 10;

					d3elmt.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom);

					focus.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					context.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

					yCol.domain(modalities);
					yFont.domain(modalities);

					d3elmt.append("g")
						.selectAll("text")
						.data([
							{title: "Focus",
								y: margin.top +height/2},
							{title: "Context",
								y: margin2.top+height2/2}])
						.enter()
						.append("text")
						.text(function(d) {
							return d.title;
						})
						.attr("class", "label")
						.attr("y", function(d) {
							return d.y;
						});


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
						.attr("class", "brush")
						.call(brush)
						.selectAll("rect")
						.attr("y", -6)
						.attr("height", height2 + 7);

					focus.append("g")
						//.attr("class", "x axis cm-slidable-axis")
						.attr("class", "x axis")
						.call(xAxis);

					context.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height2 + ")")
						.call(xAxis2);

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
					d3elmt.selectAll(".label")
						.remove();
				};


				var addComp = function(i) {
					xMsScale.domain([0,
						d3.max(xMsScale.domain()[1], scope.model.annotations.map(function(d) { return d.fragment.end; }))]);
					if(brush.empty()) {
						x2MsScale.domain(xMsScale.domain());
					}

					xTimeScale.domain([parseDate("00:00:00.000"),
						d3.max(xTimeScale.domain()[1],
							scope.model.annotations.map(function(d) { return parseDate(secToTime(d.fragment.end)); }))]);
					x2TimeScale.domain(xTimeScale.domain());




				};


				var removeComp = function(i) {

				};


				scope.$watch('model.currentIndex', function(newValue, oldValue, scope) {

					// addition case : find refIndexes minus d3indexes
					var refIndexes = scope.model.layers.map(function(d) {return d.id;});
					var d3Indexes = d3layers.map(function(d) {return d.id;});
					var toAdd = refIndexes.filter(function(i) {return !(d3Indexes.indexOf(i) > -1);});

					toAdd.forEach(function(d){
						scope.model.layers.forEach(function(ref,i) {
							if(ref.id === d) {
								addComp(i);
							}
						})
					});

				});

				initComp();

			}
		}
	});





