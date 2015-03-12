/**
 * Created by stefas on 04/03/15.
 */

// Used to modify annotations in the timeline
angular.module('myApp.services')
    .factory('AnnotationUpdater', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(
                $rootScope.dataroot + '/annotation/:annotationId', {
                    annotationId: '@annotationId'
                },
                {
                    // Used to get a particular annotation given its ID
                    'queryForAnUpdate': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: false
                    },
                    // Used to update
                    'update': {
                        method: 'PUT',
                        withCredentials: true
                    }, 'remove': {
                    method: 'DELETE',
                    withCredentials: true,
                    isArray: false
                }
                });
        }
    ]);