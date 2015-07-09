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
                                    $scope.cache.png[personName] = 'data:image/png;base64,' + annotations[0].data.png;
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
                    if (item.annotated_by.indexOf(Session.username) > -1) {

                        if (item.skipped_by === undefined) {
                            item.skipped_by = [];
                        }

                        var count = 0;
                        for (var i = 0; i < item.skipped_by.length; ++i) {
                            if (item.skipped_by[i] === Session.username)
                                count++;
                        }
                        if (count > 2) {
                            // increment a "already skippped by you" counter
                            // and do something based on that number
                            alert('looks like you are the only one working...');
                        } else {
                            item.skipped_by.push(Session.username);
                        }

                        camomileService.enqueue(
                            $rootScope.queues.labelIn, item,
                            function (error, data) {
                                if (error) {
                                    console.log(data.error);
                                    return;
                                }
                                $scope.model.popQueueElement();
                            })
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
            };

            $scope.addUnknown = function (personName) {
                $scope.model.output.unknown = true;
            };

            $scope.removeUnknown = function (personName) {
                $scope.model.output.unknown = false;
            };

            $scope.removePerson = function (personName) {

                // push this person back to the "candidate" list
                $scope.model.candidates.push(personName);

                // remove this person from the "missing" list
                var index = $scope.model.missing.indexOf(personName);
                $scope.model.missing.splice(index, 1);

                // remove this person from the output
                $scope.setFaceState(personName, undefined);
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

                if ($scope.model.input.skipped_by === undefined) {
                    $scope.model.input.skipped_by = [];
                }
                $scope.model.input.skipped_by.push(Session.username);

                camomileService.enqueue(
                    $rootScope.queues.labelIn, $scope.model.input,
                    function (error, data) {
                        if (error) {
                            console.log(data.error);
                            return;
                        }
                        $scope.model.popQueueElement();
                    })
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
                    //Left
                    if (event.keyCode == 37) {
                        $scope.$apply(function () {
                            if ($scope.model.current_time - 0.04 > $scope.model.infbndsec) {
                                $scope.model.current_time = $scope.model.current_time - 0.04;
                            } else {
                                $scope.model.current_time = $scope.model.infbndsec;
                            }
                        });
                    }
                    //Right
                    if (event.keyCode == 39) {
                        $scope.$apply(function () {
                            if ($scope.model.current_time + 0.04 < $scope.model.supbndsec) {
                                $scope.model.current_time = $scope.model.current_time + 0.04;
                            } else {
                                $scope.model.current_time = $scope.model.supbndsec;
                            }
                        });
                    }
                    //Up
                    if (event.keyCode == 38) {
                        $scope.$apply(function () {
                            if ($scope.model.current_time - 1 > $scope.model.infbndsec) {
                                $scope.model.current_time = $scope.model.current_time - 1;
                            } else {
                                $scope.model.current_time = $scope.model.infbndsec;
                            }
                        });

                    }
                    //Down
                    if (event.keyCode == 40) {
                        $scope.$apply(function () {
                            if ($scope.model.current_time + 1 < $scope.model.supbndsec) {
                                $scope.model.current_time = $scope.model.current_time + 1;
                            } else {
                                $scope.model.current_time = $scope.model.supbndsec;
                            }
                        });
                    }
                });

        }
    ]);