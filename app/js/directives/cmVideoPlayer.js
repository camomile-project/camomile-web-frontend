/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives')
	.directive('cmVideoPlayer', ['DateUtils', function (DateUtils) {
		return {
			restrict: 'A',
			link: function (scope, element) {
				scope.model.play_state = false;
				scope.model.current_time = 0;
				scope.model.restrict_toggle = 0;
				scope.model.infbndsec = 0;
				scope.model.loop = true;
				scope.model.loop_display = function() {
                  			scope.model.loop = !scope.model.loop;
                		};

				scope.model.toggle_play = function (value) {
					if (scope.model.play_state !== undefined) {
						if (value !== undefined) {
							scope.model.play_state = value;
						} else {
							scope.model.play_state = !scope.model.play_state;
						}

						if (scope.model.play_state) {
							element[0].play();
						} else {
							element[0].pause();
						}
					}
				};

				var save_state;

				$('#seek-bar').on('mousedown',function () {
					save_state = scope.model.play_state;
					scope.$apply(function () {
						scope.model.toggle_play(false);
					});

				}).on('mouseup', function () {
						scope.$apply(function () {
							scope.model.toggle_play(save_state);
						});
					});

				scope.model.play_label = "Play";

				element[0].addEventListener("loadedmetadata", function () {
					scope.$apply(function () {

						scope.model.duration = scope.model.fullDuration = element[0].duration;

						element[0].currentTime = scope.model.current_time;
						if (scope.model.supbndsec === undefined) {
							scope.model.supbndsec = scope.model.duration;
						}

						// used to force the time-line to adapt its min/max
						scope.model.reinit_video_size = true;

						// Remove previous brush and update it with new layers
						// update and remove should be triggered when handling reinit_video_size change
						// player is agnostic of any brush or whatsoever
						//scope.model.brushUpdate = true;
						//scope.model.brushRemove = true;
					});
				});

				element[0].addEventListener("timeupdate", function () {
					scope.$apply(function () {
						// if player paused,  has been changed for exogenous reasons
						if (!element[0].paused) {
							if (element[0].currentTime > scope.model.supbndsec) {
                               					if (scope.model.loop === false) {
                                    					scope.model.toggle_play(false);
                                    					scope.model.current_time = scope.model.supbndsec;
                                				}else {
                                    					scope.model.toggle_play(true);
                                    					scope.model.current_time = scope.model.infbndsec;
                               				}
                            			} else {
                                			scope.model.current_time = element[0].currentTime;
                            				}	
						}
					});
				});

				scope.$watch("model.current_time", function (newValue) {
					if (newValue !== undefined  && element[0].id != "thumbnail") {
						scope.model.current_time_display = DateUtils.timestampFormat(DateUtils.parseDate(scope.model.current_time));
						if (element[0].readyState !== 0) {
							element[0].currentTime = newValue;
						}
					}
				});

				scope.$watch("model.play_state", function (newValue) {
					if (newValue) {
						scope.model.play_label = "Pause";
					} else {
						scope.model.play_label = "Play";
					}
				});

			}
		};
	}]);
