/**
 * Created by stefas on 12/03/15.
 */
'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp.controllers', []);
angular.module('myApp.directives', []);
angular.module('myApp.services', []);

angular.module(
    'myApp',
    ['myApp.directives',
        'myApp.controllers',
        'myApp.services'
    ]);
