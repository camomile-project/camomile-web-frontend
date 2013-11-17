'use strict';

// Declare app level module which depends on filters, and services
angular.module(
    'myApp',
    ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers', 'ngRoute'])
.config(['$routeProvider', function($routeProvider) {
    // $routeProvider.when('/analysis', {templateUrl: 'partials/analysis.html'});
    $routeProvider.when('/diff', {templateUrl: 'partials/diff.html'});
    $routeProvider.when('/regression', {templateUrl: 'partials/regression.html'});
    $routeProvider.when('/errare', {templateUrl: 'partials/errare.html'});
    $routeProvider.otherwise({redirectTo: '/'});
}]);
