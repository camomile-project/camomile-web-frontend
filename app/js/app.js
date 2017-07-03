'use strict';

// Snippet picked from: https://www.abeautifulsite.net/parsing-urls-in-javascript
var parseURL = function(url) {
    var parser = document.createElement('a'),
        searchObject = {},
        queries, split, i;
    // Let the browser do the work
    parser.href = url;
    // Convert query string to object
    queries = parser.search.replace(/^\?/, '').split('&');
    for( i = 0; i < queries.length; i++ ) {
        split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject: searchObject,
        hash: parser.hash
    };
};


// Declare app level module which depends on filters, and services
angular.module('myApp.controllers', ['myApp.services']);
angular.module('myApp.directives', ['myApp.filters', 'myApp.services']);
angular.module('myApp.services', ['ngResource']);

angular.module(
        'myApp', ['myApp.filters',
            'myApp.services',
            'myApp.directives',
            'myApp.controllers',
            'ngRoute',
            'ngSanitize',
            'mgcrea.ngStrap'
        ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/regression', {
            templateUrl: 'partials/regression.html'
        });
        $routeProvider.when('/fusion', {
            templateUrl: 'partials/fusion.html'
        });
        $routeProvider.when('/queue', {
            templateUrl: 'partials/queue.html'
        });
        $routeProvider.when('/diff', {
            templateUrl: 'partials/diff.html'
        });
        $routeProvider.when('/evidence', {
            templateUrl: 'partials/evidence.html'
        });
        $routeProvider.when('/label', {
            templateUrl: 'partials/label.html'
        });
        $routeProvider.when('/error', {
            templateUrl: 'partials/errorAnalysis.html'
        });        
        $routeProvider.otherwise({
            redirectTo: '/'
        });
    }])



// Store config for data and tool access in the rootScope after promise resolution
.run(['$resource', '$location', '$rootScope', function ($resource, $location, $rootScope) {
    // remove /# and everything following to ensure we get host root url (and everything between / and #)

    var parsed = parseURL($location.absUrl());

    $rootScope.host = parsed.host;
    $rootScope.hostname = parsed.hostname;
    $rootScope.port = parsed.port;
    $rootScope.protocol = parsed.protocol;
    $rootScope.absUrl = parsed.protocol + '//' + parsed.host;
    
    //$rootScope.refDomain = $rootScope.absUrl.match(/(.*):/);
    //if ($rootScope.refDomain.length > 1) {
    //    $rootScope.refDomain = $rootScope.refDomain[1];
    //}
    //$rootScope.refPort = $rootScope.absUrl.match(/:(\d+)/);
    //if ($rootScope.refPort.length > 1) {
    //    $rootScope.refPort = $rootScope.refPort[1];
    //}
    //
    //
    //var index = $rootScope.absUrl.indexOf('lig');
    //if (index == -1) {
    //    index = $rootScope.absUrl.indexOf('limsi');
    //}
    //if (index != -1) {
    //    $rootScope.absUrl = $rootScope.absUrl.substr(0, index - 1);
    //}

}]);
