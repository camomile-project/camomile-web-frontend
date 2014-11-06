'use strict';

// Declare app level module which depends on filters, and services
angular.module(
        'myApp',
        ['myApp.filters',
            'myApp.config',
            'myApp.services',
            'myApp.directives',
            'myApp.controllers',
            'ngRoute',
            'ngCookies',
            'ngSanitize',
            'mgcrea.ngStrap'
        ])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/diff', {templateUrl: 'partials/diff.html'});
        $routeProvider.when('/regression', {templateUrl: 'partials/regression.html'});
        $routeProvider.when('/fusion', {templateUrl: 'partials/fusion.html'});
        $routeProvider.when('/shotqueue', {templateUrl: 'partials/queue.html'});
				$routeProvider.when('/headqueue', {templateUrl: 'partials/queue.html'});
				$routeProvider.when('/queue', {templateUrl: 'partials/queue.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]);
