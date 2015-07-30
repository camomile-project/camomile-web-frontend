/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
    .controller('labelCtrl', ['$document', '$sce', '$scope', '$http',
        'defaults', '$controller', 'Session', '$rootScope', 'camomileService',
        function ($document, $sce, $scope, $http, defaults, $controller, Session, $rootScope, camomileService) {

            $controller('CommonCtrl', {
                $scope: $scope,
                $http: $http,
                defaults: defaults,
                Session: Session
            });

            $scope.validating = true;

            var _getTestCorpus = function (callback) {

                var corpusName = 'mediaeval.test';
                var options = {};
                options.filter = {};
                options.filter.name = corpusName;

                camomileService.getCorpora(
                    function (error, corpora) {
                        if (error || corpora.length !== 1) {
                            callback('Could not find test corpus.', undefined);
                        } else {
                            callback(null, corpora[0]._id);
                        }
                    }, options);
            };

            var _getVideo = function (id_medium, callback) {

                if ($scope.model.videoPath === "") {
                    // stream from Camomile server
                    callback(null, $sce.trustAsResourceUrl(camomileService.getMediumURL(id_medium, 'webm')));
                } else {
                    // stream from user-provided server
                    camomileService.getMedium(id_medium, function (err, medium) {
                        callback(err, $sce.trustAsResourceUrl($scope.model.videoPath + '/' + medium.url + '.mp4'));
                    });
                }
            };

            // cache
            $scope.cache = {};
            $scope.cache.mugshotLayer = undefined;
            $scope.cache.png = {};
            $scope.cache.PNG = {};

            var _getMugshotLayer = function (callback) {

                // if ID of mugshot layer is not known yet
                if ($scope.cache.mugshotLayer === undefined) {

                    _getTestCorpus(function (error, corpus) {

                        if (error) {
                            callback(error, undefined);
                            return;
                        }

                        var layerName = 'mediaeval.groundtruth.evidence.mugshot';
                        var options = {};
                        options.filter = {};
                        options.filter.name = layerName;
                        options.filter.id_corpus = corpus;

                        camomileService.getLayers(
                            function (error, layers) {
                                if (error || layers.length !== 1) {
                                    callback('Could not find mugshot layer.', undefined);
                                } else {
                                    $scope.cache.mugshotLayer = layers[0]._id;

                                    var personNames = [];
                                    for (var key in layers[0].description.mugshots) {
                                        personNames.push(key);
                                    }

                                    $scope.$apply(function () {
                                        $scope.cache.mugshots = personNames;
                                    });

                                    callback(null, $scope.cache.mugshotLayer);
                                }

                            }, options);
                    });
                } else {

                    // if ID of mugshot layer is already known
                    // returns it directly
                    callback(null, $scope.cache.mugshotLayer);
                }
            };

            var _getPng = function (personName, callback) {

                // if we reach this point, it means that
                // we know the ID of mugshot layer

                // if personName's mugshot has not been cached yet
                if ($scope.cache.png[personName] === undefined) {

                    // get ready for getting personName's mugshot
                    var options = {};
                    options.filter = {};
                    options.filter.fragment = personName;
                    options.filter.id_layer = $scope.cache.mugshotLayer;

                    // get
                    camomileService.getAnnotations(
                        function (error, annotations) {

                            // if an error occurred, returns it
                            if (error) {
                                callback(error, undefined);
                                return;
                            }

                            // if no mugshot exist for this personName
                            // returns an error and an undefined png
                            if (annotations.length === 0) {
                                callback('Could not find any mugshot for ' + personName, undefined);
                                return;
                            }

                            // if more than one mugshot exist for this personName
                            // returns an error and an undefined png
                            if (annotations.length > 1) {
                                callback('Found more than one mugshot for ' + personName, undefined);
                                return;
                            }

                            // in any other cases (ie exactly one mugshot exists)
                            // cache the png...
                            $scope.$apply(
                                function () {
                                    var png = 'data:image/png;base64,' + annotations[0].data.png;
                                    var PNG = 'data:image/png;base64,' + annotations[0].data.PNG;
                                    $scope.cache.png[personName] = png;
                                    $scope.cache.PNG[personName] =  PNG !== undefined? PNG: png;
                                });

                            // ... and returns it with no error
                            callback(null, $scope.cache.png[personName]);
                        }, options);

                } else {

                    // if we reach this point, it means that we
                    // already have cached personName's mugshot
                    callback(null, $scope.cache.png[personName]);
                }
            };

            $scope.setFaceState = function (personName, newState) {
                $scope.model.output.known[personName] = newState;
            };

            // Initializes the data from the queue
            // rename from "initQueueData" to "popQueueElement"
            $scope.model.popQueueElement = function () {

                // don't pop if local video server is not set
                if ($scope.model.videoPath === "") {
                    alert('Please setup a local video server.');
                    return;
                }

                // Get queue first element and pop it from the queue
                camomileService.dequeue($rootScope.queues.labelIn, function (error, item) {

                    // this usually happens when the queue is empty
                    if (error) {
                        console.log(item.error);
                        $scope.$apply(function () {
                            $scope.model.video = undefined;
                        });

                        return;
                    }

                    // if current user already annotated this shot
                    // just try next one...
                    if (item.annotated_by.indexOf(Session.username) > -1) {
                        $scope.model.popQueueElement();
                        return;
                    }

                    $scope.validating = false;

                    $scope.model.input = item;
                    $scope.model.output = {};
                    $scope.model.output.unknown = false;
                    $scope.model.output.known = {};

                    // person names shown in (+) modal
                    $scope.model.candidates = [];
                    for (var i = item.others.length - 1; i >= 0; i--) {
                        $scope.model.candidates.push(item.others[i]);
                    };

                    // person names selected from (+) modal
                    $scope.model.missing = [];

                    // defaults all hypotheses to "no face"
                    for (var i = item.hypothesis.length - 1; i >= 0; i--) {
                        var personName = item.hypothesis[i];
                        $scope.setFaceState(personName, 'noFace');
                    };

                    async.parallel({
                        // path to video
                        video: function (callback) {
                            _getVideo($scope.model.input.id_medium, callback);
                        },
                        // server date
                        serverDate: function (callback) {
                            camomileService.getDate(function (err, data) {
                                callback(null, data.date);
                            });
                        },

                        pngs: function (callback) {

                            // get mugshot layer...
                            _getMugshotLayer(
                                // ... and, then only, get mugshots
                                function () {
                                    var personNames = item.hypothesis.concat($scope.model.candidates);
                                    async.map(personNames, _getPng, callback);
                                }
                            );
                        }

                    }, function (err, results) {

                        $scope.model.video = results.video;
                        $scope.model.serverDate = results.serverDate;
                        $scope.model.clientDate = Date.now();

                        $scope.model.restrict_toggle = 2;

                        $scope.model.infbndsec = parseFloat($scope.model.input.start);
                        $scope.model.supbndsec = parseFloat($scope.model.input.end);
                        $scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

                        $scope.$apply(function () {
                            $scope.model.current_time = $scope.model.input.start;
                        });

                    });

                });
            };

            $scope.showAddPersonModal = function () {
                $("#addPersonModal").modal('show');
            };

            $scope.manualAddPerson = function (personName) {

                if ($scope.model.missing.indexOf(personName) === -1 &&
                    $scope.model.output.known[personName] === undefined &&
                    $scope.cache.mugshots.indexOf(personName) > -1) {
                    _getPng(personName, function () {});
                    $scope.addPerson(personName);
                }
            };

            $scope.addPerson = function (personName) {

                // push this person to the "missing" list
                $scope.model.missing.push(personName);

                // remove this person from the "candidate" list
                var index = $scope.model.candidates.indexOf(personName);
                if (index > -1) {
                    $scope.model.candidates.splice(index, 1);
                }

                // defaults this person to "speaking face"
                $scope.setFaceState(personName, 'speakingFace');
                //the last row will be highlighted in the html
                _removeHighlighted();

            };

            $scope.addUnknown = function (personName) {
                $scope.model.output.unknown = true;
                _removeHighlighted();
            };

            $scope.removeUnknown = function (personName) {
                $scope.model.output.unknown = false;
                _highlightedlastRow();
            };

            $scope.removePerson = function (personName) {

                // push this person back to the "candidate" list
                $scope.model.candidates.push(personName);

                // remove this person from the "missing" list
                var index = $scope.model.missing.indexOf(personName);
                $scope.model.missing.splice(index, 1);

                // remove this person from the output
                $scope.setFaceState(personName, undefined);
                _highlightedlastRow();
            };

            $scope.model.validate = function () {

                $scope.validating = true;

                var item = {};
                item.input = $scope.model.input;
                item.output = $scope.model.output;
                item.log = {};
                item.log.user = Session.username;
                item.log.date = $scope.model.serverDate;
                item.log.duration = Date.now() - $scope.model.clientDate;

                camomileService.enqueue(
                    $rootScope.queues.labelOut, item,
                    function (error, data) {
                        if (error) {
                            console.log(data.error);
                            return;
                        }
                        $scope.model.popQueueElement();
                    });
            };

            $scope.model.skip = function () {
                $scope.validating = true;
                $scope.model.popQueueElement();
            };

            $document.on(
                "keydown",
                function (event) {

                    var targetID = event.target.id;
                    var button_checked = false;
                    if (targetID == 'confirm' || targetID == 'cancel') {
                        button_checked = true;
                    }
                    //enter
                    if (event.keyCode == 13 && targetID != 'localServerInput' && targetID != 'personNameInput') {
                        //If the focus is on the check buttons, blur the focus first
                        if (button_checked) {
                            event.target.blur();
                        }
                        $scope.$apply(function () {
                            $scope.model.validate();
                        });
                    }
                    //space
                    if (event.keyCode == 32 && targetID != "entry_input") {
                        if (button_checked) {
                            event.target.blur();
                        }
                        $scope.$apply(function () {
                            $scope.model.toggle_play();
                        });
                    }
                    //esc -> skip
                    if (event.keyCode == 27) {
                        $scope.$apply(function () {
                            $scope.model.skip();
                        });

                    }

                    if(event.keyCode === 38 || event.keyCode === 40){
                        //Up | Down
                        event.preventDefault();
                        _mugChangeRow(event.keyCode);
                    }

                    if(event.keyCode === 37 || event.keyCode === 39){
                        //Left  | Right
                        var trs = $("#clickable-table  > tbody > tr");
                        var highlighted =  $("#clickable-table  > tbody > tr.highlighted")[0];
                        var personName = highlighted.id;
                        if(highlighted.classList.contains('hypothesis')){
                             // console.log('hypothesis/left');
                            var checked =  $(highlighted).find('td.checked')[0];
                            var state_index =  parseInt(checked.id[0]);

                            var new_state = _mugChangeState(state_index, event.keyCode);
                            $scope.$apply(function () {
                                $scope.setFaceState(personName, new_state);
                            });
                        }else if(highlighted.classList.contains('missing')){
                            $scope.$apply(function () {
                                $scope.removePerson(personName);
                            });
                        }else{
                            $scope.$apply(function () {
                                $scope.removeUnknown();
                            });
                        }

                    }
                });

                var _mugChangeState = function(state_index, direction){

                    var state_next;
                    var states = ['dontKnow', 'noFace', 'silentFace', 'speakingFace'];
                    if(direction === 37){
                       state_next = state_index - 1;
                       state_next = state_next<0? 3 : state_next;
                    }else if(direction === 39){
                       state_next = state_index + 1;
                       state_next = state_next>3? 0 : state_next;
                        
                    }
                    return states[state_next];
                };

                var _mugChangeRow = function(direction){
                    var next;
                    var trs = $("#clickable-table  > tbody > tr");

                    if(!trs.hasClass('highlighted')){
                        //make the first highlighted area
                        if (direction === 40){
                            next = $(trs).first()[0];
                        }else if(direction === 38){
                            next = $(trs).last()[0];
                        }
                    }else{
                        var highlighted =  $("#clickable-table  > tbody > tr.highlighted")[0];
                        if (highlighted === undefined)
                            return null;
                        if (direction === 40){
                            next = $(highlighted).closest('tr').next()[0];
                            if(next === undefined)
                                next = $(trs).first()[0];
                        }else if(direction === 38){
                            next = $(highlighted).closest('tr').prev()[0];
                            if(next === undefined)
                                next = $(trs).last()[0];
                        }
                    }
                    $(trs).removeClass('highlighted');
                    $(next).addClass('highlighted');
                };

                var _highlightedlastRow =  function(){
                    var trs = $("#clickable-table  > tbody > tr");
                    var last =  trs[trs.length-2];
                    $(trs).removeClass('highlighted');
                    $(last).addClass('highlighted');
                };

                var _removeHighlighted =  function(){
                    var trs = $("#clickable-table  > tbody > tr");
                    var last =  trs.last();
                    $(trs).removeClass('highlighted');
                };


            $scope.switchImage = function(e){
                var x = e.clientX;
                var image = e.target;
                var num =  image.width/image.height;
                 
                if(num === 1 || isNaN(num)){
                    return;
                }
                var original = $(e.target).parent().offset().left;
                var relativeX =  x - original;
                index = Math.floor(relativeX/(80/num));
                if(index < 0){
                    return;
                }
                e.target.style.left = -80 * index + "px" ;
            };
        }
    ]);
