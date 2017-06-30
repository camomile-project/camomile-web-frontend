/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
    .factory('LangUtils', function () {
        return {
            // FIXME Is this service still in use ?
            is_array: function (value) {
                return value &&
                    typeof value === 'object' &&
                    typeof value.length === 'number' &&
                    typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
            }
        };
    });
