/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
    .factory('CMError', ['$http', '$rootScope',
        function ($http, $rootScope) {
            return {
                diff: function (hypLayers) {
                    var url = $rootScope.toolroot + '/error/diff';
                    return $http.post(url, hypLayers);
                },
                regression: function (hypLayers) {
                    var url = $rootScope.toolroot + '/error/regression';
                    return $http.post(url, hypLayers);
                }
            }
        }
    ]);