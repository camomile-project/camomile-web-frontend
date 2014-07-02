'use strict';

// Declare app level module which depends on filters, and services
angular.module(
    'myApp',
    ['myApp.filters',
			'myApp.services',
			'myApp.directives',
			'myApp.controllers',
			'ngRoute',
			'ngCookies',
			'ngSanitize',
			'mgcrea.ngStrap'
		])
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/diff', {templateUrl: 'partials/diff.html'});
    $routeProvider.when('/regression', {templateUrl: 'partials/regression.html'});
    $routeProvider.when('/fusion', {templateUrl: 'partials/fusion.html'});
    $routeProvider.otherwise({redirectTo: '/'});
}]);
