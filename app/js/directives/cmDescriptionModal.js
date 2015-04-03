/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives')
    .directive('cmDescriptionModal', ['LangUtils', function () {
        // LangUtils : isarray func.

        // edit form based on properties in model.edit_data
        // inspect properties, form with same structure and names
        // - if edit_data is a string: edit value
        // - if is an array: edit value_i
        // - if is a regular object: edit string properties with appropriate labels
        return {
            restrict: 'C',
            link: function (scope, element) {

                scope.$watch("model.description_flag", function (newValue) {
                    // a bit tedious procedure, to allow for extensions such as array or object data
                    // (instead of mere string)
                    if (newValue === true) {

                        //TODO mettre à jour la modale
                        var child;
                        var modalContent = document.getElementById('description-content');
                        if (modalContent.childNodes.length != 0) {
                            child = modalContent.childNodes[0];
                            modalContent.removeChild(child);
                        }

//                        modalContent.appendChild(JsonHuman.format({
//                                "name": "json.human",
//                                "description": "Convert\n JSON to human readable\r HTML",
//                                "author": "Mariano Guerra <mariano@marianoguerra.org>",
//                                "tags": ["DOM", "HTML", "JSON", "Pretty Print"],
//                                "version": "0.1.0",
//                                "main": "json.human.js",
//                                "license" : "MIT",
//                                "dependencies": {
//                                    "crel": "1.0.0"
//                                },
//                                "repository": {
//                                    "type": "git",
//                                    "url": "git://github.com/marianoguerra/json.human.js.git"
//                                },
//                                "bugs": {
//                                    "url": "http://github.com/marianoguerra/json.human.js/issues"
//                                },
//                                "contributors": [],
//                                "config": {
//                                    "what?": "this object is just to show some extra stuff",
//                                    "how?": ["add json.human.js", "add json.human.css", "???", "profit!"],
//                                    "customization?": ["customize the css prefix", "change the css file"],
//                                    "integer": 42,
//                                    "float": 12.3,
//                                    "bool": true,
//                                    "emptyString": "",
//                                    "emptyArray": [],
//                                    "emptyObject": {},
//                                    "htmlEntities": "   <- trailing <em>   & </em> and some html   "
//                                }
//                            }
//                        ));

                        modalContent.appendChild(JsonHuman.format(scope.model.videoMetaData.description));

                        scope.model.description_flag = false;
                        element.modal('show');

                        // get the middle screen Y position
                        var y = (scope.f_clientHeight() / 2 - document.getElementById("description-modal-dialog").offsetHeight / 4);

                        $("#description-modal-dialog").css({
                            marginTop: y
                        });

                    }
                });

            }
        };


    }]);