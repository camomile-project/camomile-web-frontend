/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives')
.directive('cmVideoThumbnail', ['DateUtils', function (DateUtils) {
    return {
        restrict: 'A',
        link: function (scope, element) {

            scope.$watch("model.thumbnail_current_time", function (newValue) {
                if (newValue !== undefined  && element[0].id) {
                    scope.model.current_time_display = DateUtils.timestampFormat(DateUtils.parseDate(scope.model.current_time));
                    if (element[0].readyState !== 0) {
                        element[0].currentTime = newValue;
                    }
                }
            });

            element[0].addEventListener("timeupdate", function () {
                scope.$apply(function () {
                    // if player paused, currentTime has been changed for exogenous reasons
                    if (!element[0].paused) {
                        if (element[0].currentTime > scope.model.supbndsec) {
                            scope.model.toggle_play(false);
                            scope.model.current_time = scope.model.supbndsec;
                        } else {
                            scope.model.current_time = element[0].currentTime;
                        }
                    }
                });
            });


        }
    };
}]);