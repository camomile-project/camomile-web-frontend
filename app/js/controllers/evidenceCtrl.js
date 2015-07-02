/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
	.controller('EvidenceCtrl', ['$document', '$sce', '$scope', '$http',
		'defaults', '$controller', 'Session', '$rootScope', 'camomileService', 

		function ($document, $sce, $scope, $http, defaults, $controller, Session, $rootScope, camomileService) {

			$controller('CommonCtrl', {
				$scope: $scope,
				$http: $http,
				defaults: defaults,
				Session: Session
			});

			$scope.model.incomingQueue = $rootScope.queues.evidenceIn;
			$scope.model.outgoingQueue = $rootScope.queues.evidenceOut;

			$scope.model.q = {};

			$scope.model.user_input = {};
			$scope.model.user_input.boundingBox = {};

			$scope.model.resetTransparentPlan = function () {
				var transparentPlan = d3.select("#transparent-plan");
				transparentPlan.selectAll("svg").remove();
				$scope.model.user_input.boundingBox = {};
			};

			$scope.model.updateIsDisplayedVideo = function (activate) {
				$scope.model.isDisplayedVideo = activate;
			};

			// initialize page state
			$scope.model.updateIsDisplayedVideo(false);
			$scope.model.updateTransparentPlan = false;

			var _getVideo = function (id_medium, callback) {

				if ($scope.model.useDefaultVideoPath) {
					callback(null, $sce.trustAsResourceUrl(camomileService.getMediumURL(id_medium, 'webm')));
				} else {
					camomileService.getMedium(id_medium, function (err, medium) {
						callback(err, $sce.trustAsResourceUrl($scope.model.videoPath + '/' + medium.url + '.mp4'));
					});
				}
			};

			// Initializes the data from the queue
			// rename from "initQueueData" to "popQueueElement"
			$scope.model.popQueueElement = function () {

				// Get queue first element and pop it from the queue
				camomileService.dequeue($scope.model.incomingQueue, function (err, item) {

					if (err) {
						alert(item.error);
						$scope.$apply(function () {
							$scope.model.video = undefined;
							$scope.model.isDisplayedVideo = false;
							$scope.model.updateIsDisplayedVideo(false);
						});

						return;
					}

					$scope.model.resetTransparentPlan();
					$scope.model.updateIsDisplayedVideo(true);

					if (item.source === "audio") {
						alert("Audio evidence");
					}

					$scope.model.q = item;
					$scope.model.user_input.person_name = $scope.model.q.person_name;
					$scope.model.initialData = $scope.model.q.person_name;

					// Update the add entry button's status
					$scope.model.updateIsDisplayedVideo($scope.model.user_input.person_name != "");

					async.parallel({
							video: function (callback) {
								_getVideo($scope.model.q.id_medium, callback);
							},
							serverDate: function (callback) {
								camomileService.getDate(function (err, data) {
									callback(null, data.date);
								});
							}
						},
						function (err, results) {
							$scope.model.video = results.video;
							$scope.model.serverDate = results.serverDate;
							$scope.model.clientDate = Date.now();

							$scope.model.restrict_toggle = 2;
							$scope.model.current_time_temp = $scope.model.q.start;
							$scope.model.infbndsec = parseFloat($scope.model.q.start || 0);
							if ($scope.model.infbndsec < 0) {
								$scope.model.infbndsec = 0;
							}
							$scope.model.supbndsec = parseFloat($scope.model.q.end || 0);
							if ($scope.model.supbndsec > $scope.model.fullDuration) {
								$scope.model.supbndsec = $scope.model.fullDuration;
							}
							$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

							$scope.$apply(function () {
								$scope.model.current_time = $scope.model.q.start;
							});

						});
				});
			};

			// Event launched when click on the save button.
			$scope.model.saveQueueElement = function (isEvidence) {

				if (isEvidence && ($scope.model.user_input.boundingBox.w === undefined || $scope.model.user_input.boundingBox.w === 0)) {
					alert("Please draw a bounding box around the face.");
					return;
				}

				var item = {};

				item.log = {};
				item.log.user = Session.username;
				item.log.date = $scope.model.serverDate;
				item.log.duration = Date.now() - $scope.model.clientDate;

				item.input = {};
				item.input.id_submission = $scope.model.q.id_submission;
				item.input.person_name = $scope.model.initialData;
				item.input.source = $scope.model.q.source;
				item.input.id_medium = $scope.model.q.id_medium;
				item.input.id_shot = $scope.model.q.id_shot;
				item.input.start = $scope.model.q.start;
				item.input.end = $scope.model.q.end;

				item.output = {};
				item.output.is_evidence = isEvidence;
				if (isEvidence) {
					item.output.person_name = $scope.model.user_input.person_name;
					item.output.time = $scope.model.current_time;
					item.output.bounding_box = $scope.model.user_input.boundingBox;
				}

				camomileService.enqueue($scope.model.outgoingQueue, item, function (err, data) {

					if (err) {
						console.log("Something went wrong");
					} else {
						$scope.model.popQueueElement();
					}

				});
			};

			var player = $("#player");
			var transparentPlan = d3.select("#transparent-plan").style("width", "100%")
				.style("height", (player.height()) + "px");

			var originPosition;
			transparentPlan.on("mouseup", function () {
				originPosition = undefined;
			});

			var drag = d3.behavior.drag()
				.origin(Object)
				.on("drag", function () {

					// mouse position
					var mouse = d3.mouse(this);

					originPosition = originPosition ? originPosition : mouse;
					// Remove old element
					transparentPlan.selectAll("svg").remove();

					var size = mouse[0] - originPosition[0];
					size = size > 0 ? size : 0;
					// Rectangle style
					transparentPlan.append("svg")
						.style("width", "100%")
						.style("height", "100%")
						.append("rect")
						.attr("x", originPosition[0])
						.attr("y", originPosition[1])
						.attr("width", size)
						.attr("height", size)
						.style("fill", "none")
						.style("stroke", "red")
						.style("stroke-width", 5);

					// Store bounding box;
					$scope.model.user_input.boundingBox.x = originPosition[0] / player.width();
					$scope.model.user_input.boundingBox.y = originPosition[1] / player.height();
					$scope.model.user_input.boundingBox.w = size / player.width();
					$scope.model.user_input.boundingBox.h = size / player.height();

				});

			transparentPlan.call(drag);

			$document.on(
                "keydown",
                function(event) {
                    var targetID = event.target.id;
                    var button_checked = false;
                    if (targetID == 'confirm' || targetID == 'cancel') {
                        button_checked = true;
                    }
                    console.log(event.target);
                    //enter
                    if (event.keyCode == 13) {
                        //If the focus is on the check buttons, blur the focus first
                        if (button_checked) {
                            event.target.blur();
                        }
                        $scope.$apply(function() {
                            $scope.model.saveQueueElement(true);
                        });
                    }
                    //space
                    if (event.keyCode == 32 && targetID != "entry_input") {
                        if (button_checked) {
                            event.target.blur();
                        }
                        $scope.$apply(function() {
                            $scope.model.toggle_play();
                        });
                    }
                    //esc-> skip
                    if (event.keyCode == 27) {
                        $scope.$apply(function() {
                            //skip
                            $scope.model.saveQueueElement(false);
                        });
                    }
                    //Left
                    if (event.keyCode == 37) {
                        $scope.$apply(function() {
                            if ($scope.model.current_time - 0.04 > $scope.model.infbndsec) {
                                $scope.model.current_time = $scope.model.current_time - 0.04;
                            } else {
                                $scope.model.current_time = $scope.model.infbndsec;
                            }
                        });
                    }
                    //Right
                    if (event.keyCode == 39) {
                        $scope.$apply(function() {
                            if ($scope.model.current_time + 0.04 < $scope.model.supbndsec) {
                                $scope.model.current_time = $scope.model.current_time + 0.04;
                            } else {
                                $scope.model.current_time = $scope.model.supbndsec;
                            }
                        });
                    }
                    //Up
                    if (event.keyCode == 38) {
                        $scope.$apply(function() {
                            if ($scope.model.current_time - 1 > $scope.model.infbndsec) {
                                $scope.model.current_time = $scope.model.current_time - 1;
                            } else {
                                $scope.model.current_time = $scope.model.infbndsec;
                            }
                        });

                    } //Down
                    if (event.keyCode == 40) {
                        $scope.$apply(function() {

                            if ($scope.model.current_time + 1 < $scope.model.supbndsec) {
                                $scope.model.current_time = $scope.model.current_time + 1;
                            } else {
                                $scope.model.current_time = $scope.model.supbndsec;
                            }
                        });
                    }
                }
            );

		}
	]);