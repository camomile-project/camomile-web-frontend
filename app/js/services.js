'use strict';


angular.module('myApp.services', ['ngResource'])


//DB adress
  	.value('DataRoot', 'http://localhost:3000')
//		.value('DataRoot', 'https://flower.limsi.fr/data')
//    .value('DataRoot', 'https://flower.limsi.fr/crpgl/api')
    .value('ToolRoot', 'https://flower.limsi.fr/tool')

    .factory('Queue', ['$resource', 'DataRoot',
        function ($resource, DataRoot) {
            return $resource(
                DataRoot + '/queue/:queueId', {
                    queueId: '@queueId'
                },
                {
                    'query': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: true
                    },
                    'getQueue': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: false
                    },
                    'update': {
                        method: 'PUT',
                        withCredentials: true
                    },
                    'post':{
                        method: 'POST',
                        withCredentials: true
                    }
                }
            );
        }
    ])

    .factory('QueuePush', ['$resource', 'DataRoot',
        function ($resource, DataRoot) {
            return $resource(
                DataRoot + '/queue/:queueId/next', {
                    queueId: '@queueId'
                },
                {
                    'query': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: false
                    },
                    'update': {
                        method: 'PUT',
                        withCredentials: true
                    }
                }
            );
        }
    ])

    .factory('Corpus', ['$resource', 'DataRoot',
        function ($resource, DataRoot) {
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
        function ($resource, DataRoot) {
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
        function ($resource, DataRoot) {
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
        function ($resource, DataRoot) {
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
                    }, 'queryForAnUpdate': {
                        method: 'GET',
                        withCredentials: true,
                        format: '.json',
                        isArray: false
                    },
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
    ])

    .factory('CMError', ['$http', 'ToolRoot',
        function ($http, ToolRoot) {
            return {
                diff: function (hypLayers) {
                    var url = ToolRoot + '/error/diff';
                    return $http.post(url, hypLayers);
                },
                regression: function (hypLayers) {
                    var url = ToolRoot + '/error/regression';
                    return $http.post(url, hypLayers);
                }
            }
        }
    ])

    .factory('Session', ['$http', 'DataRoot',
        function ($http, DataRoot) {

            return {

                isLogged: false,
                username: undefined,

                login: function (credentials) {
                    var url = DataRoot + '/login';
                    return $http.post(url, credentials, {
                        withCredentials: true
                    });
                },

                logout: function () {
                    var url = DataRoot + '/logout';
                    return $http.get(url, {
                        withCredentials: true
                    });
                }
            }
        }
    ])

    .factory('DateUtils', function () {
        return {
            parseDate: function (nSec) {
                var parseFunc = d3.time.format("%H:%M:%S.%L").parse;

                var secToTime = function (s) {
                    function addZ(n) {
                        return (n < 10 ? '0' : '') + n;
                    }

                    var ms = s % 1;
                    s = Math.floor(s);
                    var secs = s % 60;
                    s = (s - secs) / 60;
                    var mins = s % 60;
                    var hrs = (s - mins) / 60;

                    // hack to force ms with 3 decimal parts
                    ms = parseFloat(ms.toString()).toFixed(3).slice(2);

                    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
                };

                return parseFunc(secToTime(nSec));
            },
            timestampFormat: function (date) {
                return (d3.time.format("%H:%M:%S.%L"))(date);
            }

        };
    })

    .factory('LangUtils', function () {
        return {
            is_array: function (value) {
                return value &&
                    typeof value === 'object' &&
                    typeof value.length === 'number' &&
                    typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
            }
        };
    })

// palette of categorical colors for use throughout the application.
// was especially thought to avoid confusion with green, red and yellow,
// reserved for other usages (see diff and regressionMapping
    .value('palette', ["#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#A65628", "#F781BF", "#66C2A5",
        "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#E5C494", "#8DD3C7", "#FFFFB3", "#BEBADA",
        "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5",
        "#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC",
        "#F2F2F2", "#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC",
        "#CCCCCC" ])

// default values and functions for the application
// the function(){}() pattern allows the definition of a private scope and reusable utilities.
    .value('defaults', function () {
        var keyFunc = function (d) {
            return d.data[0];
        };

        return {
            'keyFunc': keyFunc,
            'tooltip': keyFunc,
            'diffMapping': {
                'colors': {
                    "selection_color": "#FF0000",
                    "correct": "#00FF00",
                    "missed detection": "#E6FF00",
                    "false alarm": "#FFE600",
                    "confusion": "#FF0000"
                },
                'getKey': keyFunc
            },
            'regressionMapping': {
                'colors': {
                    "selection_color": "#FF0000",
                    "both_correct": "#FFFF00",
                    "both_incorrect": "#666666",
                    "improvement": "#00FF00",
                    "regression": "#FF0000"
                },
                'getKey': keyFunc
            }
        }
    }());
