/**
 * Created by stefas on 07/12/15.
 */
angular.module('myApp.controllers')
    .controller('DetailCtrl', ['$scope', 'camomileService',
        function ($scope, camomileService) {

            //TODO vraiment utile ???
            console.log('detail installed');

            $scope.model.selectedMediaMetric = 'Nothing';

            $scope.initDetailData = function(){

                for(var j = 0, maxJ = $scope.model.mediaDistribution.length;j<maxJ;j++)
                {
                    // Initializes the medium names
                    camomileService.getMedium($scope.model.mediaDistribution[j].media_id, function(err, data){

                        $scope.$apply(function(){
                            for(var i = 0, maxI = $scope.model.mediaDistribution.length;i<maxI;i++)
                            {
                                if($scope.model.mediaDistribution[i].media_id == data._id)
                                if($scope.model.mediaDistribution[i].media_id == data._id)
                                {
                                    $scope.model.mediaDistribution[i].mediaName = data.name;
                                    break;
                                }
                            }

                        });
                    });
                }
            }
        }]);