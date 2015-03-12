/**
 * Created by stefas on 04/03/15.
 */

// Used to get the list of layers for the given corpus which id is given
angular.module('myApp.services')
    .factory('Layer', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(
                $rootScope.dataroot + '/corpus/:corpusId/layer', {
                    corpusId: '@corpusId',
                    layerId: '@layerId'
                }, {
                    'query': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: true
                    }
                });
        }
    ]);