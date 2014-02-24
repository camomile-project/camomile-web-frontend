'use strict';


angular.module('myApp.services', ['ngResource'])

.value('DataRoot', 'https://flower.limsi.fr/data')

.value('ToolRoot', 'https://flower.limsi.fr/tool')

.factory('Corpus', ['$resource', 'DataRoot',
    function($resource, DataRoot) {
        return $resource(
            DataRoot + '/corpus/:corpusId', {
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
])

.factory('Media', ['$resource', 'DataRoot',
    function($resource, DataRoot) {
        return $resource(
            DataRoot + '/corpus/:corpusId/media/:mediaId', {
                corpusId: '@corpusId',
                mediaId: '@mediaId'
            }, {
                'query': {
                    method: 'GET',
                    withCredentials: true,
                    format: '.json',
                    isArray: true
                }
            });
    }
])

.factory('Layer', ['$resource', 'DataRoot',
    function($resource, DataRoot) {
        return $resource(
            DataRoot + '/corpus/:corpusId/media/:mediaId/layer/:layerId', {
                corpusId: '@corpusId',
                mediaId: '@mediaId',
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
])

.factory('Annotation', ['$resource', 'DataRoot',
    function($resource, DataRoot) {
        return $resource(
            DataRoot + '/corpus/:corpusId/media/:mediaId/layer/:layerId/annotation/:annotationId', {
                corpusId: '@corpusId',
                mediaId: '@mediaId',
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
])

.factory('CMError', ['$http', 'ToolRoot',
    function($http, ToolRoot) {
        return {
            diff: function(hypLayers) {
                var url = ToolRoot + '/error/diff';
                return $http.post(url, hypLayers);
            },
            regression: function(hypLayers) {
                var url = ToolRoot + '/error/regression';
                return $http.post(url, hypLayers);
            }
        }
    }
])

.factory('Session', ['$http', 'DataRoot',
    function($http, DataRoot) {

        return {

            isLogged: false,
            username: undefined,

            login: function(credentials) {
                var url = DataRoot + '/login';
                return $http.post(url, credentials, {
                    withCredentials: true
                });
            },

            logout: function() {
                var url = DataRoot + '/logout';
                return $http.get(url, {
                    withCredentials: true
                });
            }
        }
    }
])

// palette of categorical colors for use throughout the application.
// was especially thought to avoid confusion with green, red and yellow,
// reserved for other usages (see diff and regressionMapping
.value('palette', ["#377EB8","#4DAF4A","#984EA3","#FF7F00","#A65628","#F781BF","#66C2A5",
    "#FC8D62","#8DA0CB","#E78AC3","#A6D854","#E5C494","#8DD3C7","#FFFFB3","#BEBADA",
    "#FB8072","#80B1D3","#FDB462","#B3DE69","#FCCDE5","#D9D9D9","#BC80BD","#CCEBC5",
    "#FBB4AE","#B3CDE3","#CCEBC5","#DECBE4","#FED9A6","#FFFFCC","#E5D8BD","#FDDAEC",
    "#F2F2F2","#B3E2CD","#FDCDAC","#CBD5E8","#F4CAE4","#E6F5C9","#FFF2AE","#F1E2CC",
    "#CCCCCC" ])

// default values and functions for the application
// the function(){}() pattern allows the definition of a private scope and reusable utilities.
.value('defaults', function() {
    var keyFunc = function(d) {
        return d.data[0];
    };

    return {
        'keyFunc': keyFunc,
        'tooltip': keyFunc,
        'diffMapping': {
            'colors': {
                "correct": "#00FF00",
                "miss": "#E6FF00",
                "false alarm": "#FFE600",
                "confusion": "#FF0000"
            },
            'getKey': keyFunc
        },
        'regressionMapping': {
            'colors': {
                "both_correct": "#FFFF00",
                "both_incorrect": "#666666",
                "improvement": "#00FF00",
                "regression": "#FF0000"
            },
            'getKey': keyFunc
        }
    }
}());
