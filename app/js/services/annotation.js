/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
// Used to get the list of available annotations for the given layer which ID is given, or a particular annotation with the given ID
    .factory('Annotation', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(
                $rootScope.dataroot + '/layer/:layerId/annotation/:annotationId', {
                    media: '@media',
                    layerId: '@layerId',
                    annotationId: '@annotationId'
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