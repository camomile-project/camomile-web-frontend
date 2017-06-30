/**
 * Created by stefas on 03/12/15.
 */
angular.module('myApp.controllers')
    .controller('OverViewCtrl', ['$scope',
        function ($scope) {
            console.log('controller added');


            var initMetrics = function()
            {
                $scope.model.metrics = ['Nothing', 'A', 'B', 'F', 'duration'];
            };

            initMetrics();

        }]);