'use strict';


angular.module('myApp.services', ['ngResource'])

.value('DataRoot', 'https://flower.limsi.fr/dev')

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
.value('palette', ["#0000F0", "#00EAC5", "#FFB91E", "#9EFFFF", "#969800",
    "#50CFFF", "#00FFFF", "#007F5D", "#B400A9", "#DA7700",
    "#FFD1F2", "#A8BFFF", "#E554DA", "#AC3413", "#00AECC",
    "#007D9A", "#E76A58", "#0C3D00", "#0049CA", "#FFDACB",
    "#636500", "#6D89FB", "#DEFF66", "#C88300", "#8F5200",
    "#B61A51", "#00FFD9", "#DEAEFF", "#0069C5", "#00E4FF",
    "#FFAD63", "#81001F", "#9F00C6", "#492E00", "#7400EF",
    "#FF97BA", "#A975F9", "#671200", "#00B16A", "#005775",
    "#009AF4", "#F05E84", "#00502F", "#FFE8FF"
])

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
                "correct": "green",
                "miss": "yellow",
                "false alarm": "yellow",
                "confusion": "red"
            },
            'getKey': keyFunc
        },
        'regressionMapping': {
            'colors': {
                "both_correct": "yellow",
                "both_incorrect": "#666666",
                "improvement": "green",
                "regression": "red"
            },
            'getKey': keyFunc
        }
    }
}());
