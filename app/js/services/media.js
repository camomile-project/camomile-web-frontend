/**
 * Created by stefas on 04/03/15.
 */

// Used to get the list of available media for the given corpus which id is given
angular.module('myApp.services')
    .factory('Media', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(

                $rootScope.dataroot + '/corpus/:corpusId/media', {
                    corpusId: '@corpusId'

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