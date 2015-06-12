/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')

.controller('SessionCtrl', ['$sce', '$scope', '$controller', '$http', 'defaults', 'Session', '$rootScope', 'camomileService',
    function ($sce, $scope, $controller, $http, defaults, Session, $rootScope, camomileService) {

        $controller('CommonCtrl', {
            $scope: $scope,
            $http: $http,
            defaults: defaults,
            Session: Session
        });

        console.log("sessionCtrl");
        $scope.login = function (submit) {
            var username = $("#login").val();
            var password = $("#password").val();
            // get actual values in the form, as angular scope not
            // updated from autocomplete (see index.html for info)

            // New login method
            camomileService.login(username, password, function (err, data) {
                $scope.$apply(function () {
                    if (!err) {
                        console.log('logged in as ' + username);
                        Session.isLogged = true;
                        Session.username = username;
                        $scope.model.message = "Connected as " + Session.username;

                        submit(); // hack to allow autofill and autocomplete support

                        // window.location.reload();

                    } else {
                        Session.isLogged = false;
                        Session.username = undefined;
                        $scope.model.message = "Connection error";
                        console.log(data);
                        alert(data.error);
                    }
                });

            });
        };

        $scope.logout = function () {

            // FIXME new logout method
            //                camomileService.setURL($rootScope.dataroot);
            camomileService.logout(function (err, data) {
                $scope.$apply(function () {
                    if (!err) {
                        Session.isLogged = false;
                        Session.username = undefined;
                        $scope.model.message = undefined;

                        // window.location.reload();
                        // reload page
                        //                            $route.reload();
                    } else {
                        Session.isLogged = false;
                        Session.username = undefined;
                        //                            Cookies.remove("current.user");
                        $scope.model.message = "Connection error";
                        console.log(err);
                        alert(data.error);
                    }
                });

            });
        };

        $scope.getUserName = function () {
            return Session.username;
        };
    }
]);