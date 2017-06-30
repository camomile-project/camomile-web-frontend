/**
 * Created by stefas on 04/12/15.
 */
angular.module('myApp.directives')
    .directive('cmPersonVignette', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div id="personDirective"></div>',
            link: function (scope) {
                console.log("PersonDirective installed");

                scope.model.personData = {};

                var initData = function()
                {
                    scope.model.personData.name = scope.model.selectedElement.name;

                    // TODO: this image has to be encoded server side
                    scope.model.personData.image = scope.model.selectedElement.image;
                };

                var updateDirective = function() {

                    initData();

                    var directive = d3.select("#personDirective");

                    var oldDirective = directive.selectAll("label");
                    if (oldDirective) {
                        oldDirective.remove();
                    }

                    oldDirective = directive.selectAll("img");
                    if (oldDirective) {
                        oldDirective.remove();
                    }

                    directive.append('label').html(scope.model.personData.name);
                    directive.append('img').attr('src', scope.model.personData.image).style('margin-left', '20px');
                };


                scope.$watch('model.detailIsDisplayed', function(newValue){
                    if(newValue != false)
                    {
                        updateDirective();

                    }
                });
            }
        }
    }]);
