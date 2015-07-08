/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives')
    .directive('cmEditModal', [ function () {

        // edit form based on properties in model.edit_data
        // inspect properties, form with same structure and names
        // - if edit_data is a string: edit value
        // - if is an array: edit value_i
        // - if is a regular object: edit string properties with appropriate labels
        return {
            restrict: 'C',
            link: function (scope, element) {

                scope.$watch("model.edit_flag", function (newValue) {
                    // a bit tedious procedure, to allow for extensions such as array or object data
                    // (instead of mere string)
                    if (newValue === true) {
                        if (typeof scope.model.edit_data === 'string') {
                            scope.model.edit_items = [
                                {
                                    id: '',
                                    value: scope.model.edit_data
                                }
                            ];
                        }

                        scope.model.edit_flag = false;
                        element.modal('show');

                        // get the middle screen Y position
                        var y = (scope.f_clientHeight() / 2 - document.getElementById("modal-dialog").offsetHeight / 4);

                        $("#modal-dialog").css({
                            marginTop: y
                        });

//                        element.modal('show');

                    }
                });

                scope.model.edit_save = function () {

                    scope.model.edit_save_element(scope.model.edit_items);
                    element.modal('hide');

                };

            }
        };


    }]);
