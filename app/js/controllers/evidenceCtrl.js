/**
 * Created by isc on 12/05/15.
 */
angular.module('myApp.controllers')
	.controller('EvidenceCtrl', ['$sce', '$scope', '$http',
		'defaults', '$controller', '$cookieStore', 'Session', '$rootScope', '$routeParams', 'camomileService',
		function ($sce, $scope, $http, defaults, $controller, $cookieStore, Session, $rootScope, $routeParams, camomileService) {

			$controller('CommonCtrl', {
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

			$scope.model.boundingBox = {};

			$scope.model.queueType = $routeParams.type;

			$(function () {
				$("#entry_input").autocomplete({
					source: $scope.model.availableEntry
				});
			});

			// store the entry typed in the textbox
			$scope.model.entryTyped = "";

			// Store the selected table's line
			$scope.model.selectedQueueLineIndex = "";

			$scope.model.resetTransparentPlan = function () {
				var transparentPlan = d3.select("#transparent-plan");
				// Remove old element
				transparentPlan.selectAll("svg").remove();

				$scope.model.boundingBox = {};
			};

			$scope.model.updateIsDisplayedVideo = function (activate) {
				$scope.model.isDisplayedVideo = activate;
			};

			// PBR : get queue data from config
			$scope.model.incomingQueue = $rootScope.queues.evidenceIn;
			$scope.model.outcomingQueue = $rootScope.queues.evidenceOut;

			// initialize page state
			$scope.model.updateIsDisplayedVideo(false);

			$scope.model.updateTransparentPlan = false;

			$scope.model.description_flag = false;

			$scope.model.displayDescription = function () {
				$scope.model.description_flag = true;
			};

			// Initializes the data from the queue
			// rename from "initQueueData" to "popQueueElement"
			$scope.model.popQueueElement = function () {
				{

					// Get queue first element and pop it from the queue
					camomileService.dequeue($scope.model.incomingQueue, function (err, data) {
						if (!err) {
							$scope.model.resetTransparentPlan();

							// Update the next button's status
							$scope.model.updateIsDisplayedVideo(true);

							$scope.model.queueData = data;
							$scope.model.corrected_data = "";
							$scope.model.queueTableData = [];

							//                        var date = new Date(); // already UTC date in JSON Format...
							$scope.model.initialDate = new Date(); // already UTC date in JSON Format...

							if ($scope.model.queueData.data != undefined) {

								$scope.model.corrected_data = $scope.model.queueData.data.person_name;
								$scope.model.initialData = $scope.model.queueData.data.person_name;
							}

							// Update the add entry button's status
							$scope.model.updateIsDisplayedVideo($scope.model.corrected_data != "");

							// Get the video
							if ($scope.model.queueData.fragment.id_medium != undefined) {

								// Get queue element medium
								camomileService.getMedium($scope.model.queueData.fragment.id_medium, function (err, data) {
									if (!err) {
										$scope.$apply(function () {
											$scope.model.videoMetaData = data;
										});
									} else {
										console.log(data);
										alert(data.error);
									}

								});

								//								$scope.model.video = $sce.trustAsResourceUrl($rootScope.dataroot + "/medium/" + $scope.model.queueData.fragment.id_medium + "/video");

								if ($scope.model.useDefaultVideoPath) {
									$scope.model.video = $sce.trustAsResourceUrl(camomileService.getMediumURL($scope.model.queueData.fragment.id_medium, 'webm'));
								} else {
									camomileService.getMedium($scope.model.queueData.fragment.id_medium, function (err, data) {
										$scope.model.video = $sce.trustAsResourceUrl($scope.model.videoPath + '/' + data.url + '.mp4');

									});
								}
								if ($scope.model.queueData !== undefined && $scope.model.queueData.fragment !== undefined && $scope.model.queueData.fragment.start !== undefined && $scope.model.queueData.fragment.end !== undefined) {
									$scope.model.restrict_toggle = 2;

									$scope.model.current_time_temp = $scope.model.queueData.fragment.start;

									$scope.model.infbndsec = parseFloat($scope.model.queueData.fragment.start || 0);
									if ($scope.model.infbndsec < 0) {
										$scope.model.infbndsec = 0;
									}
									$scope.model.supbndsec = parseFloat($scope.model.queueData.fragment.end || 0);
									if ($scope.model.supbndsec > $scope.model.fullDuration) {
										$scope.model.supbndsec = $scope.model.fullDuration;
									}

									$scope.model.duration = $scope.model.supbndsec - $scope.model.infbndsec;

									// FIXME : c'est un callback ===> $apply peut être nécessaire
									//FIXME: C'est ici que c'est fait au "mauvais moment"
									$scope.$apply(function () {
										$scope.model.current_time = $scope.model.queueData.fragment.start;
									});

									//                                console.log("nouveau current:",$scope.model.current_time)

								}
							} else {
								$scope.model.video = undefined;
							}

						} else {
							$scope.$apply(function () {
								console.log(data);
								alert(data.error);
								$scope.model.video = undefined;
								$scope.model.isDisplayedVideo = false;
								$scope.model.queueTableData = [];
								$scope.model.queueData.data = [];
								$scope.model.updateIsDisplayedVideo(false);
							})

						}
					});
				}
			};

			// Event launched when click on the save button.
			$scope.model.saveQueueElement = function (isEvidence) {

				var proceedPopQueue = true;
				// Test if the entry has been added
				if ($scope.model.boundingBox.w == undefined || $scope.model.boundingBox.w == 0) {

					alert("You must place a bounding box around the speaker");
					proceedPopQueue = false;
				}

				if (proceedPopQueue) {
					// Get the queue
					camomileService.getQueue($scope.model.outcomingQueue, function (err, data) {

						if (!err) {
							var newOutcomingQueue;
							newOutcomingQueue = data;

							var dataToPush = {};

							var date = new Date(); // already UTC ddate in JSON Format...

							var user = $cookieStore.get("current.user");

							dataToPush["id_evidence"] = $scope.model.queueData.id_evidence
							dataToPush["is_evidence"] = isEvidence;
							dataToPush["person_name"] = $scope.model.initialData;
							dataToPush["corrected_person_name"] = $scope.model.corrected_data;
							dataToPush["source"] = $scope.model.queueData.data.source;
							dataToPush["display"] = {};
							dataToPush["display"]["time"] = $scope.model.current_time;
							dataToPush["display"]["bounding_box"] = $scope.model.boundingBox;

							//$scope.model.queueData.data = dataToPush;

							newOutcomingQueue.list = [dataToPush];

							// Update the queue by adding list element to the end of it
							camomileService.enqueue(newOutcomingQueue._id, newOutcomingQueue.list, function (err, data) {
								if (err) {
									alert(data.error);
									console.log(data);
								}
							});
						} else {
							console.log(data);
							alert(data.error);
						}

					});

					console.log("save");
					$scope.model.popQueueElement();
				}
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
					$scope.model.boundingBox.x = originPosition[0] / player.width();
					$scope.model.boundingBox.z = originPosition[1] / player.height();
					$scope.model.boundingBox.h = size / player.width();
					$scope.model.boundingBox.w = size / player.height();

				});

			transparentPlan.call(drag);

			$scope.initPopup = function () {
				if ($scope.isLogged()) {
					$("#myModal").modal('show');
				}
			};

			var tooltip = d3.select("#button-tooltip");
			d3.select("#evidence_button_id").on("mouseover", function (d) {
				tooltip.transition()
					.duration(200)
					.style("opacity", .9);
				tooltip.html("This is an evidence")
					.style("left", (d3.event.pageX + 20) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
			}).on("mouseout", function (d) {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

			d3.select("#not_evidence_button_id").on("mouseover", function (d) {
				tooltip.transition()
					.duration(200)
					.style("opacity", .9);
				tooltip.html("This isn't an evidence")
					.style("left", (d3.event.pageX + 20) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
			}).on("mouseout", function (d) {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		}
	]);