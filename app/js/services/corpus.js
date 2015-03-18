/**
 * Created by stefas on 04/03/15.
 */
// Used to get the list of available corpus or the corpus with the given ID
angular.module('myApp.services')
    .factory('Corpus', ['$resource', '$rootScope',
        function ($resource, $rootScope) {
            return $resource(
                $rootScope.dataroot + '/corpus/:corpusId', {
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