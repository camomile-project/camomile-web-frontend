/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives')
    .directive('blurbtn', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element).click(function () {
                    $(element).blur();
                });
            }
        }
    });