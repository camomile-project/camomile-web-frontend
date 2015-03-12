/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
    .factory('Session', ['$http', '$rootScope',
        function ($http, $rootScope) {
            return {

                isLogged: false,
                username: undefined,

                login: function (credentials) {
                    var url = $rootScope.dataroot + '/login';
                    return $http.post(url, credentials, {
                        withCredentials: true
                    });
                },

                logout: function (credentials) {
                    var url = $rootScope.dataroot + '/logout';
                    return $http.post(url, credentials, {
                        withCredentials: true
                    });
                }
            }
        }
    ]);