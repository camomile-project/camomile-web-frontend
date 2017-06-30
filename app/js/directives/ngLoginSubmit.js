/**
 * Created by stefas on 04/03/15.
 */

// see index.html about login form
angular.module('myApp.directives')
    .directive("ngLoginSubmit", function () {
        return {
            restrict: "A",
            scope: {
                onSubmit: "=ngLoginSubmit",
                message: "="
            },
            link: function (scope, element) {
                $(element)[0].onsubmit = function () {
                    $("#login-login").val($("#login", element).val());
                    $("#login-password").val($("#password", element).val());

                    scope.onSubmit(function () {
//					$("#login-form")[0].submit(); // wrongly redirects to root hostname
                        window.location.reload();
                    });
                    return false;
                };
            }
        };
    });