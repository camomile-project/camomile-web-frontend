/**
 * Created by stefas on 04/03/15.
 */

// Service used to get a queue from its ID
angular.module('myApp.services')
    .factory('QueuesBrowser', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(
                $rootScope.dataroot + '/queue/:queueId', {
                    queueId: '@queueId'
                },
                {
                    // Return a queue from queue list given the id
                    'get': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: false
                    }
                }
            );
        }
    ]);