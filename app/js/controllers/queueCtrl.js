/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.controllers')
    .controller('QueueCtrl', ['$sce', '$scope', '$http',
        'defaults', '$controller', '$cookieStore', 'Session', '$rootScope', '$routeParams', 'camomileService',
        function ($sce, $scope, $http, defaults, $controller, $cookieStore, Session, $rootScope, $routeParams, camomileService) {

            $controller('CommonCtrl',
                {
                    $scope: $scope,
                    $http: $http,
                    defaults: defaults,
                    Session: Session
                });

            $scope.queues = [];
            $scope.model.queueTableData = [];
            $scope.model.incomingQueue = {};
            $scope.model.outcomingQueue = {};
            $scope.model.queueData = {};
            $scope.model.availableEntry = [];
            $scope.model.videoMetaData = "";

            var DEFAULT_CONTEXT_VALUE;

            $scope.model.queueType = $routeParams.type;

            // Initialize the default context value
            if ($scope.model.queueType === 'head') {
                DEFAULT_CONTEXT_VALUE = 0;
            } else if ($scope.model.queueType === 'shot') {
                DEFAULT_CONTEXT_VALUE = 5;
            }

            $(function () {
                $("#entry_input").autocomplete({
                    source: $scope.model.availableEntry
                });
            });

            // default for annotation context
            $scope.model.context_size = DEFAULT_CONTEXT_VALUE;


            // store the entry typed in the textbox
            $scope.model.entryTyped = "";

            // Store the selected table's line
            $scope.model.selectedQueueLineIndex = "";

            // add context menu to the table's lines
            $scope.model.contextMenu = function (event) {
                var $contextMenu = $("#contextMenu");

                $scope.model.selectedQueueLineIndex = event.currentTarget.rowIndex - 1;

                $scope.model.edit_items = [
                    {id: '', value: $scope.model.queueTableData[$scope.model.selectedQueueLineIndex]}
                ];

                $contextMenu.css({
                    display: "block",
                    left: event.pageX,
                    top: event.pageY
                });


                return false;
            };

            // Add typed entry to queue entries
            $scope.model.addEntry = function () {
                $scope.model.entryTyped = document.getElementById("entry_input").value;
                $scope.model.queueTableData.push($scope.model.entryTyped);
                if ($scope.model.availableEntry.indexOf($scope.model.entryTyped) == -1) {
                    $scope.model.availableEntry.push($scope.model.entryTyped);
                }
                $scope.model.entryTyped = "";

                // reactivate save button
                $scope.model.updateSaveButtonStatus(true);
            };

            // Remove target element if a confirmation is given by the user
            $scope.model.remove_click = function () {
                if (confirm("Are you sure you want to remove this entry ?")) {
                    $scope.model.queueTableData.splice($scope.model.selectedQueueLineIndex, 1);
                    var elementIndex = $scope.model.queueTableData[$scope.model.selectedQueueLineIndex];
                    elementIndex = $scope.model.availableEntry.indexOf(elementIndex);
                    $scope.model.availableEntry.splice(elementIndex, 1);

                    // reactivate save button
                    $scope.model.updateSaveButtonStatus(true);

                }
            };

            // Override save method from the modal dialog
            $scope.model.edit_save_element = function (edit_items) {
                $scope.model.queueTableData[$scope.model.selectedQueueLineIndex] = edit_items[0].value;
                // reactivate save button
                $scope.model.updateSaveButtonStatus(true);
            };


            $scope.model.updateNextStatus = function (isInit) {
                var buttonNext = document.getElementById("buttonNext");
                if (isInit != undefined) {
                    $scope.model.disableNext = false;
                    buttonNext.innerHTML = "Start";
                    //Also disable add entry button because nothing else to save!
                    $scope.model.updateIsDisplayedVideo(true);
                }
                else {
                    $scope.model.disableNext = $scope.model.queueData.data == undefined;
                    buttonNext.innerHTML = "Skip";
                }
                if ($scope.model.disableNext) {
                    buttonNext.setAttribute("class", "btn btn-primary disabled");
                    // also disable save button because nothing else to save!
                    $scope.model.updateSaveButtonStatus(false);
                    //Also disable add entry button because nothing else to save!
                    $scope.model.updateIsDisplayedVideo(true);
                    // Removes all element from table
                    $scope.model.queueTableData = undefined;
                }
                else {
                    buttonNext.setAttribute("class", "btn btn-primary");
                }
            };


            $scope.model.updateSaveButtonStatus = function (activate) {
                $scope.model.disableSaveButton = !activate;
                var buttonSave = document.getElementById("buttonSave");
                if ($scope.model.disableSaveButton) {
                    // Disables save button
                    buttonSave.setAttribute("class", "btn btn-success disabled");
                }
                else {
                    buttonSave.setAttribute("class", "btn btn-success");
                }
            };


            $scope.model.resetTransparentPlan = function () {
                var transparentPlan = d3.select("#transparent-plan");
                // Remove old element
                transparentPlan.selectAll("svg").remove();
            };


            $scope.model.updateIsDisplayedVideo = function (activate) {
                $scope.model.isDisplayedVideo = !activate;
                var addEntryButton = document.getElementById("addEntryButton");
                var defaultButton = document.getElementById("defaultButtonId");
                var moreButton = document.getElementById("moreButtonId");
                if ($scope.model.isDisplayedVideo) {
                    // Disables add entry button
                    addEntryButton.setAttribute("class", "btn btn-default disabled");
                    defaultButton.setAttribute("class", "btn btn-default disabled");
                    moreButton.setAttribute("class", "btn btn-default disabled");
                    // Remove previous rects
                    $scope.model.resetTransparentPlan();
                }
                else {
                    addEntryButton.setAttribute("class", "btn btn-default");
                    defaultButton.setAttribute("class", "btn btn-default");
                    moreButton.setAttribute("class", "btn btn-default");
                    if ($scope.model.queueTableData == undefined) {
                        $scope.model.queueTableData = [];
                    }
                }
            };


            // PBR : get queue data from config
            if ($scope.model.queueType === "head") {
                $scope.model.incomingQueue = $rootScope.queues.headIn;
                $scope.model.outcomingQueue = $rootScope.queues.headOut;
            } else {
                $scope.model.incomingQueue = $rootScope.queues.shotIn;
                $scope.model.outcomingQueue = $rootScope.queues.shotOut;
            }

            // initialize page state
            $scope.model.updateNextStatus(true);
            $scope.model.updateSaveButtonStatus(false);
            $scope.model.updateIsDisplayedVideo(false);

            $scope.model.updateTransparentPlan = false;

            $scope.model.description_flag = false;

            $scope.model.displayDescription = function () {
                $scope.model.description_flag = true;
            };

            $scope.model.defaultContextButtonClicked = function () {
                $scope.model.context_size = DEFAULT_CONTEXT_VALUE;
            };

            // Initializes the data from the queue
            // rename from "initQueueData" to "popQueueElement"
            $scope.model.popQueueElement = function () {

                var proceedPopQueue = true;
                // Test if the entry has been added
                if ($scope.model.entryTyped != "") {

                    proceedPopQueue = confirm("Are you sure ? The entry hasn't been added");
                }

                if (proceedPopQueue) {
                    // Update the next button's status
                    $scope.model.updateNextStatus();
                    $scope.model.updateSaveButtonStatus(true);
                    $scope.model.updateIsDisplayedVideo(true);

                    // Get queue first element and pop it from the queue
                    camomileService.dequeue($scope.model.incomingQueue, function (err, data) {
                        $scope.model.queueData = data;
                        $scope.model.inData = [];
                        $scope.model.queueTableData = [];

//                        var date = new Date(); // already UTC date in JSON Format...
                        $scope.model.initialDate  = new Date(); // already UTC date in JSON Format...

                        // Re init the context_size value
                        $scope.model.context_size = DEFAULT_CONTEXT_VALUE;

                        if($scope.model.queueData.data != undefined)
                        {
                            //copy initial data
                            //for (var i in $scope.model.queueData.data) {
                            for (var i  = 0, maxI = $scope.model.queueData.data.length; i<maxI; i++){
                                $scope.model.inData[i] = $scope.model.queueData.data[i];
                                $scope.model.queueTableData[i] = $scope.model.queueData.data[i];
                                if ($scope.model.availableEntry.indexOf($scope.model.queueData.data[i]) == -1) {
                                    $scope.model.availableEntry.push($scope.model.queueData.data[i]);
                                }
                            }
                        }

                        // Update the next button's status
                        $scope.model.updateNextStatus();

                        // Update the add entry button's status
                        $scope.model.updateIsDisplayedVideo($scope.model.inData.length != 0);

                        // Get the video
                        if ($scope.model.queueData.id_medium != undefined) {

                            // Get queue element medium
                            camomileService.getMedium($scope.model.queueData.id_medium, function(err, data)
                            {
                                $scope.$apply(function(){
                                    $scope.model.videoMetaData = data;
                                });
                            });

                            $scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/media/" + $scope.model.queueData.id_medium + "/video");
                            $scope.model.videoThumbnail = $scope.model.video;
                            if ($scope.model.queueData !== undefined && $scope.model.queueData.fragment !== undefined && $scope.model.queueData.fragment.start !== undefined && $scope.model.queueData.fragment.end !== undefined) {
                                $scope.model.restrict_toggle = 2;

                                $scope.model.current_time_temp = $scope.model.queueData.fragment.start;

                                $scope.model.infbndsec = parseFloat($scope.model.queueData.fragment.start) - (parseInt($scope.model.context_size) || 0);
                                if ($scope.model.infbndsec < 0) {
                                    $scope.model.infbndsec = 0;
                                }
                                $scope.model.supbndsec = parseFloat($scope.model.queueData.fragment.end) + (parseInt($scope.model.context_size) || 0);
                                if ($scope.model.supbndsec > $scope.model.fullDuration) {
                                    $scope.model.supbndsec = $scope.model.fullDuration;
                                }

                                $scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

                                //FIXME: C'est ici que c'est fait au "mauvais moment"
                                $scope.model.current_time = $scope.model.queueData.fragment.start;

//                                console.log("nouveau current:",$scope.model.current_time)

                                //TODO: Commenter le test pour mettre le plan transparent partout
                                if ($scope.model.queueType === 'head') {
                                    // at the end of video loading, draw a rectangle on head as described in "position"
                                    $scope.model.updateTransparentPlan = true;
                                }

                            }
                        }
                        else {
                            $scope.model.video = undefined;
                        }

                    });
                }

            };


            // Event launched when click on the save button.
            $scope.model.saveQueueElement = function () {
                // Get the queue
                camomileService.getQueue($scope.model.outcomingQueue, function (err, data) {
                    var newOutcomingQueue;
                    newOutcomingQueue = data;

                    var dataToPush = {};
                    dataToPush["inData"] = {};
                    dataToPush["inData"]["data"] = $scope.model.inData;
                    dataToPush["inData"]["date"] = $scope.model.initialDate;
                    dataToPush["outData"] = {};

                    var date = new Date(); // already UTC ddate in JSON Format...

                    var user = $cookieStore.get("current.user");
                    var newData = [];
                    var modified = false;

//                    for (var i in $scope.model.queueTableData) {
                    for (var i = 0, maxI = $scope.model.queueTableData.length; i< maxI; i++) {
                        newData[i] = $scope.model.queueTableData[i];
                    }

                    if ($scope.model.inData.length == newData.length) {
//                        for (var j in newData) {
                        for (var j = 0, maxJ = newData.length; j < maxJ; j++) {
                            if (newData[j] != $scope.model.inData[j]) {
                                modified = true;
                            }
                        }
                    }
                    else {
                        modified = true;
                    }
                    dataToPush["outData"]["date"] = date;
                    dataToPush["outData"]["duration"] = date - $scope.model.initialDate;
                    dataToPush["outData"]["user"] = user;
                    dataToPush["outData"]["data"] = newData;

                    //status
                    if (modified) {
                        dataToPush["status"] = "MODIFIED";
                    }
                    else {
                        dataToPush["status"] = "VALIDATED";
                    }

                    $scope.model.queueData.data = dataToPush;

                    newOutcomingQueue.list = [$scope.model.queueData];

                    // Update the queue by adding list element to the end of it
                    camomileService.enqueue(newOutcomingQueue._id, newOutcomingQueue);

                    // call only if button have to be disabled
                    //$scope.model.updateSaveButtonStatus(false);
                });


                console.log("save");
                $scope.model.popQueueElement();
            };

            // Event launched when click on the next button
            $scope.model.nextQueueElement = function () {

                var buttonNext = document.getElementById("buttonNext");

                buttonNext['data-title'] = "Skip this element and load the next one";

                // Push queue ONLY if a "Skip" as been done. NOT when "Start" has been pressed.
                if (buttonNext.innerHTML === "Skip") {
                    // Get the queue
                    camomileService.getQueue($scope.model.outcomingQueue,function (err, data) {
                        var updatedQueue;
                        updatedQueue = data;

                        var dataToPush = {};
                        dataToPush["inData"] = {};
                        dataToPush["inData"]["data"] = $scope.model.inData;
                        dataToPush["inData"]["date"] = $scope.model.initialDate;
                        dataToPush["outData"] = {};

                        var date = new Date(); // already UTC ddate in JSON Format...

                        var user = $cookieStore.get("current.user");
                        var newData = [];
//                        for (var i in $scope.model.queueTableData) {
                        for (var i = 0, maxI = $scope.model.queueTableData.length; i< maxI; i++) {
                            newData[i] = $scope.model.queueTableData[i];
                        }
                        dataToPush["outData"]["date"] = date;
                        dataToPush["outData"]["duration"] = date - $scope.model.initialDate;
                        dataToPush["outData"]["user"] = user;
                        dataToPush["outData"]["data"] = newData;

                        //status
                        dataToPush["status"] = "SKIP";

                        $scope.model.queueData.data = dataToPush;

                        updatedQueue.list = [$scope.model.queueData];

                        // Update the queue by adding list element to the end of it
                        camomileService.enqueue(updatedQueue._id, updatedQueue);

                        // call only if button have to be disabled
                        //$scope.model.updateSaveButtonStatus(false);
                    });


                    console.log("skip");
                }

                $scope.model.popQueueElement();
            };

            $scope.model.addFakeValues = function () {

                if ($scope.isLogged()) {
                    // get queue
                    camomileService.getQueue($rootScope.queues.shotIn,function (err, data) {
                        var queue;
                        queue = data;

                        queue.list = [
                            {
                                id_corpus: "52fb49016ed21ede00000009",
                                id_medium: "546cb4cc157a4908003c2e4c",
                                _id: "52fe3fd811d4fade00007c2a",
                                id_layer: "546cb4be157a4908003c2e47",
                                data: ["Olivier_TRUCHOT"],
                                fragment: {
                                    start: 258.9,
                                    end: 314.29,
                                    context: {
                                        _id: "546cb4be157a4908003c2e47",
                                        id_corpus: "52fe3fd811d4fade00007c2c",
                                        id_medium: "546cb4cc157a4908003c2e4c"
                                    }
                                }
                            },
                            {
                                id_corpus: "52fb49016ed21ede00000009",
                                id_medium: "546cb4cc157a4908003c2e4c",
                                _id: "52fe3fd811d4fade00007c2b",
                                id_layer: "546cb4be157a4908003c2e47",
                                data: ["Olivier_TRUCHOT"],
                                fragment: {
                                    start: 330.21,
                                    end: 340.27,
                                    context: {
                                        _id: "546cb4be157a4908003c2e47",
                                        id_corpus: "52fe3fd811d4fade00007c2c",
                                        id_medium: "546cb4cc157a4908003c2e4c"
                                    }
                                }
                            },
                            {
                                id_corpus: "52fe3fd811d4fade00007c2c",
                                id_medium: "546cb4cc157a4908003c2e4c",
                                _id: "52fb49016ed21ede00000009",
                                id_layer: "546cb4be157a4908003c2e47",
                                data: ["Rachid_M_BARKI"],
                                fragment: {
                                    start: 340.27,
                                    end: 362.18,
                                    context: {
                                        _id: "546cb4be157a4908003c2e47",
                                        id_corpus: "52fe3fd811d4fade00007c2c",
                                        id_medium: "546cb4cc157a4908003c2e4c"
                                    }
                                }
                            }
                        ];


                        // update it on server
                        camomileService.enqueue(queue._id, queue);


                    });

                    // get queue
                    camomileService.getQueue($rootScope.queues.headIn, function (err, data) {
                        var queue;
                        queue = data;
                        queue.list = [
                            {
                                id_corpus: "52fe3fd811d4fade00007c2c",
                                id_medium: "546cb4cc157a4908003c2e4c",
                                _id: "52fb49016ed21ede00000009",
                                id_layer: "546cb4be157a4908003c2e47",
                                data: ["Rachid_M_BARKI"],
                                fragment: {
                                    start: 340.27,
                                    end: 340.27,
                                    "position": {
                                        "top": 0.3,
                                        "left": 0.506,
                                        "width": 0.1,
                                        "height": 0.2
                                    }
                                }

                            },

                            {
                                id_corpus: "52fb49016ed21ede00000009",
                                id_medium: "546cb4cc157a4908003c2e4c",
                                _id: "52fe3fd811d4fade00007c2b",
                                id_layer: "546cb4be157a4908003c2e47",
                                data: ["second test"],
                                fragment: {
                                    start: 200.27,
                                    end: 200.27,
                                    "position": {
                                        "top": 0.1,
                                        "left": 0.1,
                                        "width": 0.1,
                                        "height": 0.2
                                    }
                                }

                            }
                            ,

                            {
                                id_corpus: "52fe3fd811d4fade00007c2c",
                                id_medium: "546cb4cc157a4908003c2e4c",
                                _id: "52fb49016ed21ede00000009",
                                id_layer: "546cb4be157a4908003c2e47",
                                data: ["troisieme test"],
                                fragment: {
                                    start: 300.27,
                                    end: 300.27,
                                    "position": {
                                        "top": 0.9,
                                        "left": 0.9,
                                        "width": 0.1,
                                        "height": 0.2
                                    }
                                }

                            }
                        ];


                        // update it on server
                        camomileService.enqueue(queue._id, queue);

                    });
                }
            };

            //TODO uniquement si on veut pouvoir dessiner un rectangle au click!!!
//            					var transparentPlan = d3.select("#transparent-plan");
//            					transparentPlan.on("click", function()
//            					{
//            						var mouse = d3.mouse(this);
//            						// Remove old element
//            						transparentPlan.selectAll("svg").remove();
//
//            						// Circle style!
//            						transparentPlan.append("svg")
//            							.style("width", "100%")
//            							.style("height", "100%")
//            							.append("circle")
//            							.attr("cx",mouse[0])
//            							.attr("cy", mouse[1])
//            							.attr("r", 30)
//            							.style("fill", "none")
//            							.style("stroke", "red")
//            							.style("stroke-width",5);
//
//            						// Rectangle style
////            						transparentPlan.append("svg")
////            							.style("width", "100%")
////            							.style("height", "100%")
////            							.append("rect")
////            							.attr("x",mouse[0]-30)
////            							.attr("y", mouse[1]-30)
////            							.attr("width",60)
////            							.attr("height",60)
////            							.style("fill", "none")
////            							.style("stroke", "red")
////            							.style("stroke-width",5);
//
//            						console.log(document.getElementById("player").videoWidth, document.getElementById("player").videoHeight);
//
//            					});

            // TODO: This have to be uncommented only for tests. it creates queues on the server. Also, latest server version do it its own way, so not necessary
            //	          $scope.model.createFakeQueue();
            //TODO:  This have to be uncommented only for tests. It add fake values in queues stored server side. Will be removed when all will be ok.
            $scope.model.addFakeValues();

            // reset all queues
            //    db.queues.update({},{ $set: { queue: [] } }, {multi:true})

            // hack for sending events through controlsoverlay
            function fireEvent(node, eventName, origEvent) {
                // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
                var doc;
                if (node.ownerDocument) {
                    doc = node.ownerDocument;
                } else if (node.nodeType == 9) {
                    // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
                    doc = node;
                } else {
                    throw new Error("Invalid node passed to fireEvent: " + node.id);
                }

                var event;
                if (node.dispatchEvent) {
                    // Gecko-style approach (now the standard) takes more work
                    var eventClass = "";

                    // Different events have different event classes.
                    // If this switch statement can't map an eventName to an eventClass,
                    // the event firing is going to fail.
                    switch (eventName) {
                        case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
                        case "mousedown":
                        case "mouseup":
                        case "mouseover":
                        case "mouseout":
                        case "mousemove":
                            eventClass = "MouseEvents";
                            break;

                        case "focus":
                        case "change":
                        case "blur":
                        case "select":
                            eventClass = "HTMLEvents";
                            break;

                        default:
                            throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                            break;
                    }
                    event = doc.createEvent(eventClass);

                    //FIXME: unused var
//                    var bubbles = eventName == "change" ? false : true;
//                    var bubbles = eventName !== "change";
                    event.initMouseEvent(eventName, true, true, window, 1, origEvent.screenX, origEvent.screenY,
                        origEvent.clientX, origEvent.clientY);

                    event.synthetic = true; // allow detection of synthetic events
                    // The second parameter says go ahead with the default action
                    node.dispatchEvent(event, true);
                } else if (node.fireEvent) {
                    // IE-old school style
                    event = doc.createEventObject();
                    event.synthetic = true; // allow detection of synthetic events
                    node.fireEvent("on" + eventName, event);
                }
            }

            // transmit events to SVG
            $("#controlsoverlay").mousemove(function (e) {
                fireEvent($("#controlsvg")[0], "mousemove", e);
            })
                .mouseout(function (e) {
                    fireEvent($("#controlsvg")[0], "mouseout", e);
                });

            $scope.$watch('model.updateTransparentPlan', function (newValue) {
                if (newValue == true) {
                    // Remove previous rects
                    $scope.model.resetTransparentPlan();

                    // Rectangle style: draw a rectangle at the described position (in position)
                    var transparentPlan = d3.select("#transparent-plan");
                    var player = $("#player");
                    transparentPlan.append("svg")
                        .style("width", "100%")
                        .style("height", "100%")
                        .append("rect")
                        .attr("x", function () {
                            return ((player.width()) * $scope.model.queueData.fragment.position.left - (player.width() * $scope.model.queueData.fragment.position.width) / 2) + "px";
                        })
                        .attr("y", function () {
                            return (player.height() * $scope.model.queueData.fragment.position.top) - (player.height() * $scope.model.queueData.fragment.position.height) / 2 + "px";
                        })
                        .attr("width", player.width() * $scope.model.queueData.fragment.position.width)
                        .attr("height", player.height() * $scope.model.queueData.fragment.position.height)
                        .style("fill", "none")
                        .style("stroke", "red")
                        .style("stroke-width", 5);

                    $scope.model.updateTransparentPlan = false;
                }
            });

            $scope.$watch('model.context_size', function (newValue) {
                newValue = parseInt(newValue);
                if (isNaN(newValue)) {
                    newValue = 0;
                }
                if ($scope.model.queueData !== undefined
                    && $scope.model.queueData.fragment !== undefined
                    && $scope.model.queueData.fragment.start !== undefined) {
                    $scope.model.infbndsec = parseFloat($scope.model.queueData.fragment.start) - (parseInt(newValue) || 0);
                    if ($scope.model.infbndsec < 0) {
                        $scope.model.infbndsec = 0;
                    }
                    $scope.model.supbndsec = parseFloat($scope.model.queueData.fragment.end) + (parseInt(newValue) || 0);
                    if ($scope.model.supbndsec > $scope.model.fullDuration) {
                        $scope.model.supbndsec = $scope.model.fullDuration;
                    }
                    $scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;
                    if ($scope.model.current_time < $scope.model.infbndsec) {
                        $scope.model.current_time = $scope.model.infbndsec;
                    }
                    if ($scope.model.current_time > $scope.model.supbndsec) {
                        $scope.model.current_time = $scope.model.supbndsec;
                    }
                }
            });

        }]);