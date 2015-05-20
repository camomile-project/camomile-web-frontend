/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
    .factory('Session', ['$http', '$rootScope',
        function ($http, $rootScope) {
            return {

                isLogged: false,
                username: undefined
            }
        }
    ]);