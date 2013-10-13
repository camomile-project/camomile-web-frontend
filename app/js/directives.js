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
	});
//	.directive('cmTimeline', function() {
//		var initComp = function(scope, element) {
//			// init dimensions/margins
//
//			// use time scale, ordinal scale for band layout,
//			// and color scale for lane design (background with alpha value)
//
//			// compute luminance of colors to determine color of overlayed font
//
//			// derive utility methods to extract channels from RGB string
//			// see eg http://www.javascripter.net/faq/octalsan.htm
//		};
//		var updateComp = function(scope, element) {
//		};
//		return {
//			restrict: 'E',
//			replace: true,
//			template: '<svg></svg>',
//			link: function(scope, element, attrs) {
//				initComp();
//				scope.$watch('model.selected', function(newValue, oldValue, scope) {
//					updateComp();
//				});
//			}
//		}
//	});

