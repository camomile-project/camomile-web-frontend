/**
 * Created by stefas on 19/05/15.
 */
angular.module('myApp.controllers')
    .controller('ParameterButtonCtrl', ['$sce', '$scope', '$http',
        'defaults', '$controller', 'Session',
        function ($sce, $scope, $http, defaults, $controller,Session) {

            $controller('CommonCtrl', {
                $scope: $scope,
                $http: $http,
                defaults: defaults,
                Session: Session
            });

            var tooltip = d3.select("#button-tooltip");
            d3.select("#parameterButtons_button_id").on("mouseover", function (d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9)
                    .style("z-index", 100);
                tooltip.html("Modify parameters")
                    .style("left", (d3.event.pageX - 20) + "px")
                    .style("top", (d3.event.pageY + 28) + "px");
            }).on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

            // Open the dialog
            $scope.openParameters = function () {
                $("#parameterModal").modal('show');
            };

            // Store parameters in the cookies
            $scope.modifyVideoPath = function () {
                var now = new Date(),
                // this will set the expiration to 1 month
                    exp = new Date(now.getFullYear(), now.getMonth()+1, now.getDate());

                Cookies.set("use.default.video.path", $scope.model.useDefaultVideoPath,{
                    expires: exp
                });
                Cookies.set("video.path", $scope.model.videoPath, {
                    expires: exp
                });

                // reload page
                window.location.reload();
            };
        }
    ]);