/**
 * Created by stefas on 04/03/15.
 */

// Service used to modify an element of a queue (get will pop the element prom the queue, update will put it as last element of the queue)
angular.module('myApp.services')
    .factory('QueueElementModifier', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(
                $rootScope.dataroot + '/queue/:queueId/next', {
                    queueId: '@queueId'
//                    ,list:'@list'
                },
                {
                    // Every time get is called, the returned queue's element got removed from the queue
                    'get': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: false
                    },
                    // Allows to modify an element of a queue, putting it as last element of the queue
                    'update': {
                        method: 'PUT',
                        isObject: true,
                        withCredentials: true
                    }
                }
            );
        }
    ]);