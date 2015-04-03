/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')

    .controller('SessionCtrl', ['$sce', '$scope', '$controller', '$http', 'defaults', 'Session', '$cookieStore','$rootScope', 'camomileService',
        function ($sce, $scope, $controller, $http, defaults, Session, $cookieStore,$rootScope, camomileService) {

            $controller('CommonCtrl',
                {
                    $scope: $scope,
                    $http: $http,
                    defaults: defaults,
                    Session: Session
                });

            $scope.login = function (submit) {
                var username = $("#login").val();
                var password = $("#password").val();
                // get actual values in the form, as angular scope not
                // updated from autocomplete (see index.html for info)

                // FIXME new login method
//                camomileService.setURL($rootScope.dataroot);
                camomileService.login(username, password, function(err, data)
                    {
                        $scope.$apply(function(){
                            if(!err)
                            {
                                console.log('logged in as ' + username);
                                Session.isLogged = true;
                                Session.username = username;
                                $cookieStore.put("current.user", username);
                                $scope.model.message = "Connected as " + Session.username;

                                submit(); // hack to allow autofill and autocomplete support

                            }
                            else
                            {
                                Session.isLogged = false;
                                Session.username = undefined;
                                $cookieStore.remove("current.user");
                                $scope.model.message = "Connection error";
                                console.log(data);
                                alert(data.message);
                            }
                        });

                    }
                    // Initialize the camomileService URL
//                    ,$rootScope.dataroot
                );


//                Session.login({
//                    username: username,
//                    password: password
//                })
//                    .success(function () {
//                        console.log('logged in as ' + username);
//                        Session.isLogged = true;
//                        Session.username = username;
//                        $cookieStore.put("current.user", username);
//                        $scope.model.message = "Connected as " + Session.username;
//                        submit(); // hack to allow autofill and autocomplete support
//
//                    })
//                    .error(function () {
//                        Session.isLogged = false;
//                        Session.username = undefined;
//                        $cookieStore.remove("current.user");
//                        $scope.model.message = "Connection error";
//                    });
            };


            $scope.logout = function () {

                // FIXME new logout method
//                camomileService.setURL($rootScope.dataroot);
                camomileService.logout(function(err, data)
                {
                    $scope.$apply(function()
                    {
                        if(!err)
                        {
                            Session.isLogged = false;
                            $cookieStore.remove("current.user");
                            Session.username = undefined;
                            $scope.model.message = undefined;

                            window.location.reload();
                            // reload page
//                            $route.reload();
                        }
                        else
                        {
                            Session.isLogged = false;
                            Session.username = undefined;
                            $cookieStore.remove("current.user");
                            $scope.model.message = "Connection error";
                            console.log(err);
                            alert(data.message);
                        }
                    });

                });

//                Session.logout()
//                    .success(function () {
//                        Session.isLogged = false;
//                        $cookieStore.remove("current.user");
//                        Session.username = undefined;
//                        $scope.model.message = undefined;
//
//                        // reload page
//                        window.location.reload();
//                    })
//                    .error(function (err) {
//                        Session.isLogged = false;
//                        Session.username = undefined;
//                        $cookieStore.remove("current.user");
//                        $scope.model.message = "Connection error";
//                        console.log(err);
//                    });
            };

            $scope.isLogged = function () {
                return Session.isLogged;
            };

            $scope.getUserName = function () {
                return Session.username;
            };

            // Allow to check in the coockie if the user is already set
            $scope.checkLoggin = function () {
                var currentUser = $cookieStore.get("current.user");
                if (currentUser && currentUser != "") {
                    Session.isLogged = true;
                    Session.username = currentUser;
                    $cookieStore.put("current.user", currentUser);
                    $scope.model.message = "Connected as " + Session.username;
//                    camomileService.setURL($rootScope.dataroot);
                }

            }

        }]);