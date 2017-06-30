/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
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