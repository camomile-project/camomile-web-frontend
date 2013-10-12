'use strict';

/* Directives */


angular.module('myApp.directives', ['ui.utils']).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
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
	.directive('cmClickable', function() {
		return {
			restrict: 'C',
//			scope: {
//				index: '=',
//				selected: '='
//			},
			link: function(scope, element, attrs) {
				//var clickElmt = angular.element(element.children()[0]);
				//var clickElmt = angular.element(element.children()[0]);
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
	.directive('uiScroll', ['ui.config', function(uiConfig) {
		uiConfig.uiScrollr = uiConfig.uiSCroll || {};
		return {
			restrict: 'A',
			transclude: true,
			scope: {
				values: '=ngModel'
			},
			template: '<div class="scroll-pane"><div ng-transclude></div></div>',
			link:function(scope,elm,$attrs,uiEvent ) {
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

			},
			replace: true
		};
	}]);


