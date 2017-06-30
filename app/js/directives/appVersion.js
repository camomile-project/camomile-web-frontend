/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives').
    directive('appVersion', ['version', function (version) {
        return function (scope, elm) {
            elm.text(version);
        };
    }]);