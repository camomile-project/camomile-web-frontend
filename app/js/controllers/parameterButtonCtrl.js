/**
 * Created by stefas on 19/05/15.
 */
angular.module('myApp.controllers')
    .controller('ParameterButtonCtrl', ['$sce', '$scope', '$http',
        'defaults', '$controller', 'Session',
        function ($sce, $scope, $http, defaults, $controller, Session) {

            $controller('CommonCtrl', {
                $scope: $scope,
                $http: $http,
                defaults: defaults,
                Session: Session
            });

            // Store parameters in the cookies
            $scope.saveVideoPreferences = function () {
                var now = new Date(),
                    exp = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

                Cookies.set("video.path", $scope.model.videoPath, {
                    expires: exp
                });

            };
        }
    ]);