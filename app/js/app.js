'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers'])
		.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'partials/inspect.html'}); // no need for controller property
																																			// - no need for root controller
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
