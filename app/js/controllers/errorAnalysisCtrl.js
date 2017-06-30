/**
 * Created by stefas on 25/03/16.
 */
angular.module('myApp.controllers')
    .controller('ErrorAnalysisCtrl', ['$scope', '$rootScope',
        function ($scope, $rootScope) {

            $scope.model = {};
            $scope.model.singleAnalysisData = {};
            $scope.model.multipleAnalysisData = [];
            $scope.model.multipleAnalysisFeatureData = [];
            $scope.model.selectedmultipleAnalysisElement = undefined;

            // boolean used to invert color and size
            $scope.model.invertMode = false;

            // initialise fermata so the request will be available
            $scope.model.request = fermata.json($rootScope.refDomain + ":8074");

            $scope.model.isLoading = false;

            // event when add or remove a feature
            $scope.AddorRemoveFeature = function(name, boolean)
            {
                // reset selection
                $scope.model.selectedmultipleAnalysisElement = undefined;

                // Current data becomes base data.
                if($scope.model.multipleAnalysisCurrentData != undefined)
                {
                    $scope.model.multipleAnalysisBaseData = clone($scope.model.multipleAnalysisCurrentData);
                }

                // update current data
//                var name = $scope.model.multipleAnalysisBaseData[0].algo[0].features[index].name;
                if(boolean)
                {
                    $scope.updateCurrentData("add", name);
                }
                else
                {
                    $scope.updateCurrentData("del", name);
                }
            };

            // Compute the delta between selected element and each other
            $scope.computeDelta = function(){

                // enable loading image
                $scope.model.isLoading = true;

                // Initialize delta data
                $scope.model.multipleAnalysisDeltaData = {};
                $scope.model.multipleAnalysisDeltaData.data = [];

                // Get selected element
                var selectedElementValues = $scope.model.selectedmultipleAnalysisElement;

                if(selectedElementValues != undefined)
                {
                    selectedElementValues = d3.select("#"+$scope.model.selectedmultipleAnalysisElement);
                    // Gets its properties
                    selectedElementValues = {rate: selectedElementValues.attr("rate"),accuracy: selectedElementValues.attr("kappa")};

                    var newElement = {}, maxRate = 0, maxAccuracy = 0,maxValue = 0, tempValue = 0, otherVal = 0, selectedVal = 0;


                    // Check if its on previous or current classifiers
                    if($scope.model.selectedmultipleAnalysisElement.indexOf("previous") != -1)
                    {
                        // Create elements of the delta list, computed by the difference between selected element and the others
                        for(var targetIndex = 0, maxTargetIndex = $scope.model.multipleAnalysisBaseData.length; targetIndex < maxTargetIndex; targetIndex++)
                        {
                            newElement = {};
                            newElement.name=$scope.model.multipleAnalysisBaseData[targetIndex].name;
                            newElement.rate = $scope.model.multipleAnalysisBaseData[targetIndex].rate - selectedElementValues.rate;
                            newElement.algo = [];

                            maxRate = Math.max(maxRate, Math.abs(newElement.rate));
                            for(var algoIndex = 0, maxAlgoIndex = $scope.model.multipleAnalysisBaseData[targetIndex].algo.length; algoIndex < maxAlgoIndex; algoIndex++)
                            {
                                var newData = {};
                                newData.name = $scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].name;
                                newData.accuracy = $scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy - selectedElementValues.accuracy;

                                // Compute the value to compare with
                                tempValue = (1 -  Math.max($scope.model.multipleAnalysisBaseData[targetIndex].rate, 1 - $scope.model.multipleAnalysisBaseData[targetIndex].rate));
                                tempValue = tempValue + (tempValue == 0 ? 1 : 0);
                                otherVal = ($scope.model.multipleAnalysisBaseData[targetIndex].algo[algoIndex].accuracy - Math.max($scope.model.multipleAnalysisBaseData[targetIndex].rate, 1 - $scope.model.multipleAnalysisBaseData[targetIndex].rate))/ tempValue;

                                // Compute the value of the selected element
                                tempValue = (1 -  Math.max(selectedElementValues.rate, 1 - selectedElementValues.rate));
                                tempValue = tempValue + (tempValue == 0 ? 1 : 0);
                                selectedVal = (selectedElementValues.accuracy - Math.max(selectedElementValues.rate, 1 - selectedElementValues.rate))/ tempValue;

                                // Compute delta
                                newData.value = otherVal - selectedVal;
                                newElement.algo.push(newData);

                                maxAccuracy = Math.max(maxAccuracy, Math.abs(newData.accuracy));
                                maxValue = Math.max(maxValue, Math.abs(newData.value));
                            }

                            $scope.model.multipleAnalysisDeltaData.maxRate = maxRate;
                            $scope.model.multipleAnalysisDeltaData.maxAccuracy = maxAccuracy;
                            $scope.model.multipleAnalysisDeltaData.maxValue = maxValue;
                            $scope.model.multipleAnalysisDeltaData.data.push(newElement);
                        }
                    }
                    else
                    {
                        // Create elements of the delta list, computed by the difference between selected element and the others
                        for(var targetIndex = 0, maxTargetIndex = $scope.model.multipleAnalysisCurrentData.length; targetIndex < maxTargetIndex; targetIndex++)
                        {
                            newElement = {};
                            newElement.name=$scope.model.multipleAnalysisCurrentData[targetIndex].name;
                            newElement.rate = $scope.model.multipleAnalysisCurrentData[targetIndex].rate - selectedElementValues.rate;
                            newElement.algo = [];

                            maxRate = Math.max(maxRate, Math.abs(newElement.rate));
                            for(var algoIndex = 0, maxAlgoIndex = $scope.model.multipleAnalysisCurrentData[targetIndex].algo.length; algoIndex < maxAlgoIndex; algoIndex++)
                            {
                                var newData = {};
                                newData.name = $scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].name;
                                newData.accuracy = $scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy - selectedElementValues.accuracy;

                                // Compute the value to compare with
                                tempValue = (1 -  Math.max($scope.model.multipleAnalysisCurrentData[targetIndex].rate, 1 - $scope.model.multipleAnalysisCurrentData[targetIndex].rate));
                                tempValue = tempValue + (tempValue == 0 ? 1 : 0);
                                otherVal = ($scope.model.multipleAnalysisCurrentData[targetIndex].algo[algoIndex].accuracy - Math.max($scope.model.multipleAnalysisCurrentData[targetIndex].rate, 1 - $scope.model.multipleAnalysisCurrentData[targetIndex].rate))/ tempValue;

                                // Compute the value of the selected element
                                tempValue = (1 -  Math.max(selectedElementValues.rate, 1 - selectedElementValues.rate));
                                tempValue = tempValue + (tempValue == 0 ? 1 : 0);
                                selectedVal = (selectedElementValues.accuracy - Math.max(selectedElementValues.rate, 1 - selectedElementValues.rate))/ tempValue;

                                // Compute delta
                                newData.value = otherVal - selectedVal;

                                newElement.algo.push(newData);

                                maxAccuracy = Math.max(maxAccuracy, Math.abs(newData.accuracy));
                                maxValue = Math.max(maxValue, Math.abs(newData.value));
                            }

                            $scope.model.multipleAnalysisDeltaData.maxRate = maxRate;
                            $scope.model.multipleAnalysisDeltaData.maxAccuracy = maxAccuracy;
                            $scope.model.multipleAnalysisDeltaData.maxValue = maxValue;
                            $scope.model.multipleAnalysisDeltaData.data.push(newElement);
                        }
                    }

                }
                // Remove loading image
                $scope.model.isLoading = false;
            };

            // Get the max value from criterion values
            var getMaxFeatureScore = function(criterion){

                var max = d3.max(criterion, function(d){
                    return Math.abs(d.score);
                });

//                if(max == 0)
//                {
//                    return 1;
//                }
//                else
//                {
                return max;
//                }
            };

            // Initialise criteria objects and the structure used to display them
            $scope.initCriteriaData = function()
            {
                $scope.model.multipleAnalysisCriteriaData = [];
                $scope.model.multipleAnalysisCriteriaMaximalValue=0;

                var elementToAdd, tempObject = {}, feature, keys, name, target, algo, maxValue = 0;

                // init from current data
                if($scope.model.multipleAnalysisCurrentData != undefined && $scope.model.multipleAnalysisCurrentData.length != 0)
                {
                    for(var targetIndex = 0, maxTarget = $scope.model.multipleAnalysisCurrentData.length; targetIndex < maxTarget; targetIndex++)
                    {
                        target = $scope.model.multipleAnalysisCurrentData[targetIndex];
                        for(var algoIndex = 0, maxAlgo = target.algo.length; algoIndex < maxAlgo; algoIndex++)
                        {
                            algo = target.algo[algoIndex];
                            for(var featureIndex = 0, maxFeature = algo.features.length; featureIndex < maxFeature; featureIndex++)
                            {
                                feature = algo.features[featureIndex];

                                if(tempObject[feature.name] == undefined)
                                {
                                    tempObject[feature.name] = [];
                                }

                                tempObject[feature.name].push({
                                    type:feature.type,
                                    score:feature.score,
                                    targetName:target.name,
                                    targetIndex:targetIndex,
                                    algorithmName:algo.name,
                                    algoIndex:algoIndex
                                });
                            }
                        }
                    }

                    keys = Object.keys(tempObject);
                    for(var keyIndex = 0, keysLength = keys.length; keyIndex < keysLength; keyIndex++)
                    {
                        name = keys[keyIndex];
                        elementToAdd = {};
                        elementToAdd.name = name;
                        elementToAdd.index = keyIndex;
                        elementToAdd.criteria = tempObject[name];
                        elementToAdd.maxValue = getMaxFeatureScore(elementToAdd.criteria);
                        elementToAdd.type = elementToAdd.criteria[0].type;
                        $scope.model.multipleAnalysisCriteriaData.push(elementToAdd);
                        $scope.model.multipleAnalysisCriteriaMaximalValue = Math.max($scope.model.multipleAnalysisCriteriaMaximalValue, elementToAdd.maxValue);
                    }
                }
                // init from base data
                else
                {
                    for(var targetIndex = 0, maxTarget = $scope.model.multipleAnalysisBaseData.length; targetIndex < maxTarget; targetIndex++)
                    {
                        target = $scope.model.multipleAnalysisBaseData[targetIndex];
                        for(var algoIndex = 0, maxAlgo = target.algo.length; algoIndex < maxAlgo; algoIndex++)
                        {
                            algo = target.algo[algoIndex];
                            for(var featureIndex = 0, maxFeature = algo.features.length; featureIndex < maxFeature; featureIndex++)
                            {
                                feature =algo.features[featureIndex];

                                if(tempObject[feature.name] == undefined)
                                {
                                    tempObject[feature.name] = [];
                                }

                                tempObject[feature.name].push({
                                    type:feature.type,
                                    score:feature.score,
                                    targetName:target.name,
                                    targetIndex:targetIndex,
                                    algorithmName:algo.name,
                                    algoIndex:algoIndex
                                });
                            }
                        }
                    }

                    // make the structure recognised by the directive displaying it
                    keys = Object.keys(tempObject);
                    for(var keyIndex = 0, keysLength = keys.length; keyIndex < keysLength; keyIndex++)
                    {
                        name = keys[keyIndex];
                        elementToAdd = {};
                        elementToAdd.name = name;
                        elementToAdd.index = keyIndex;
                        elementToAdd.criteria = tempObject[name];
                        elementToAdd.maxValue = getMaxFeatureScore(elementToAdd.criteria);
                        elementToAdd.type = elementToAdd.criteria[0].type;
                        $scope.model.multipleAnalysisCriteriaData.push(elementToAdd);
                        $scope.model.multipleAnalysisCriteriaMaximalValue = Math.max($scope.model.multipleAnalysisCriteriaMaximalValue, elementToAdd.maxValue);
                    }
                }
            };

            $scope.updateCurrentData = function(action, name)
            {
                $scope.model.isLoading = true;
                $scope.model.request(action).post({
                    "name":name
                }, function(err, data)
                {
                    $scope.$apply(function(){
                        if(err == null )
                        {
                            $scope.model.multipleAnalysisCurrentData = data;

                            $scope.initCriteriaData();
                            $scope.model.isLoading = false;
                        }
                        else
                        {
                            console.log('Error', err);
                            $scope.model.multipleAnalysisCurrentData = undefined;
                            $scope.model.multipleAnalysisCurrentData = [
                                {
                                    "name": "error08baseline.primary",
                                    "rate": 0.6864791288566243,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.6864791288566243,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 79.225589366326,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 5.570487677280833,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 1.3404534485375073,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 7.624618986159398,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 5.289583244282163,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.6864791288566243,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 79.225589366326,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 2.7496550571807017,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 1.401991114223229,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 2.5801817181230793,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0.7915872533731979,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08eumssi.primary",
                                    "rate": 0.44101633393829404,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.558983666061706,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 50.19674937303786,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 13.610012050416245,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 8.372416563327251,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 1.7934844341857727,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 7.971517379242116,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 10.21990432538374,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 31.764453838906764,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 4.661334678336161,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 33.34343232001421,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 29.199794377179813,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 13.971008690827512,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 12.10312136786526,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 16.609964427686677,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 12.693457144208137,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 9.311420796726601,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.558983666061706,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 50.19674937303786,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 13.610012050416245,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0.46664516296101693,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 1.6495494019541916,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0.4635304846999947,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 1.3862943611198904,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 7.386017550367517,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 31.764453838906764,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 4.661334678336161,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 33.34343232001421,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 29.199794377179813,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 16.609964427686677,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 2.772588722239781,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0.8581392945352156,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 1.1981305287017066,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 2.546519766596466,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08eumssi.speaker_filtered_by_face",
                                    "rate": 0.455989110707804,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.544010889292196,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 62.61235780434124,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 14.32210272000366,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 9.435214699472573,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 2.6331700948600285,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 13.092661893260164,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 7.037966140803315,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 13.576948364408928,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 33.63979577058395,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 5.149424999359545,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 37.72222523088173,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 31.06948619418523,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 19.277888932309338,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 22.037962525205895,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 16.609964427686677,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 20.879637706348838,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 13.917611022153393,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.544010889292196,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 62.61235780434124,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 14.32210272000366,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0.9752830948185331,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 11.340046854206593,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 5.599835295503522,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 1.9416771773750503,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 7.037966140803315,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 1.3862943611198904,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 8.838975059063523,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 33.63979577058395,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 5.149424999359545,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 37.72222523088173,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 31.06948619418523,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 16.849048073285935,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 12.166111900430602,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 2.772588722239781,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 1.717215626677852,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 19.627615662973426,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0.9631376165688851,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 2.546519766596466,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08linkedmediassig.faceaudio",
                                    "rate": 0.7881125226860254,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.7881125226860254,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.7881125226860254,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0.31943077076636095,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08linkedmediassig.faceonly",
                                    "rate": 0.4251361161524501,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.5748638838475499,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 34.051044211688826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 6.105197883789695,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 5.286859581949368,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 4.1329519353001345,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 2.4400263672274067,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 3.7258377681676564,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 4.213611107761426,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 26.599337888978393,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 31.31929872589898,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 19.62496288347153,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 19.497743591049176,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 11.124347373107883,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 10.185002202816385,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 7.04830973509231,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 4.375493903940559,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.5748638838475499,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 34.051044211688826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 6.105197883789695,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0.2824872555746768,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 1.1102230246251565e-16,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 4.440892098500627e-16,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 2.4400263672274067,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 1.3862943611198904,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 3.7258377681676564,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 2.0372582685679346,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 26.599337888978393,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 31.31929872589898,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 19.62496288347153,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 8.946466632841572,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 2.772588722239781,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0.23505503248176368,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 1.6647015447839202,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                }
                            ];

                            $scope.initCriteriaData();
                            $scope.model.isLoading = false;

                        }
                    });
                });
            };

            // Initializes the data (used only once per refresh)
            $scope.initializeData = function()
            {
                $scope.model.isLoading = true;
                $scope.model.request('init').post({}, function(err, data) {

                    $scope.$apply(function(){
                        if(err == null )
                        {
                            $scope.model.multipleAnalysisCurrentData = data;
                            $scope.initCriteriaData();
                            $scope.model.isLoading = false;
                        }
                        else
                        {
                            console.log('Error', err);
                            $scope.model.multipleAnalysisCurrentData = undefined;
                            $scope.model.multipleAnalysisCurrentData = [
                                {
                                    "name": "error08baseline.primary",
                                    "rate": 0.6864791288566243,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.6864791288566243,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 79.225589366326,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 5.570487677280833,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 1.3404534485375073,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 7.624618986159398,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 5.289583244282163,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.6864791288566243,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 79.225589366326,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 2.7496550571807017,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 1.401991114223229,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 2.5801817181230793,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0.7915872533731979,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08eumssi.primary",
                                    "rate": 0.44101633393829404,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.558983666061706,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 50.19674937303786,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 13.610012050416245,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 8.372416563327251,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 1.7934844341857727,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 7.971517379242116,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 10.21990432538374,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 31.764453838906764,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 4.661334678336161,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 33.34343232001421,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 29.199794377179813,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 13.971008690827512,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 12.10312136786526,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 16.609964427686677,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 12.693457144208137,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 9.311420796726601,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.558983666061706,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 50.19674937303786,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 13.610012050416245,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0.46664516296101693,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 1.6495494019541916,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0.4635304846999947,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 1.3862943611198904,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 7.386017550367517,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 31.764453838906764,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 4.661334678336161,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 33.34343232001421,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 29.199794377179813,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 16.609964427686677,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 2.772588722239781,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0.8581392945352156,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 1.1981305287017066,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 2.546519766596466,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08eumssi.speaker_filtered_by_face",
                                    "rate": 0.455989110707804,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.544010889292196,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 62.61235780434124,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 14.32210272000366,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 9.435214699472573,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 2.6331700948600285,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 13.092661893260164,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 7.037966140803315,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 13.576948364408928,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 33.63979577058395,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 5.149424999359545,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 37.72222523088173,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 31.06948619418523,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 19.277888932309338,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 22.037962525205895,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 16.609964427686677,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 20.879637706348838,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 13.917611022153393,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.544010889292196,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 62.61235780434124,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 14.32210272000366,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0.9752830948185331,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 11.340046854206593,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 5.599835295503522,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 1.9416771773750503,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 4.378755879733826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 7.037966140803315,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 1.3862943611198904,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 5.381414296062877,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 8.838975059063523,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 33.63979577058395,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 5.149424999359545,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 37.72222523088173,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 31.06948619418523,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 16.849048073285935,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 12.166111900430602,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 2.772588722239781,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 1.717215626677852,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 19.627615662973426,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0.9631376165688851,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 2.546519766596466,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08linkedmediassig.faceaudio",
                                    "rate": 0.7881125226860254,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.7881125226860254,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.7881125226860254,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0.31943077076636095,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                },
                                {
                                    "name": "error08linkedmediassig.faceonly",
                                    "rate": 0.4251361161524501,
                                    "algo": [
                                        {
                                            "name": "dt",
                                            "accuracy": 0.5748638838475499,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 34.051044211688826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 6.105197883789695,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 5.286859581949368,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 4.1329519353001345,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 2.4400263672274067,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 3.7258377681676564,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 4.213611107761426,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 26.599337888978393,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 31.31929872589898,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 19.62496288347153,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 19.497743591049176,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 11.124347373107883,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 10.185002202816385,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 7.04830973509231,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 4.375493903940559,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        },
                                        {
                                            "name": "glm",
                                            "accuracy": 0.5748638838475499,
                                            "features": [
                                                {
                                                    "name": "overlaidName",
                                                    "type": "A",
                                                    "score": 34.051044211688826,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "overlaidNameVideo",
                                                    "type": "A",
                                                    "score": 245.37410191822062,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headMove",
                                                    "type": "A",
                                                    "score": 6.105197883789695,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headBack",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "head3_4",
                                                    "type": "A",
                                                    "score": 0.2824872555746768,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headProfile",
                                                    "type": "A",
                                                    "score": 1.1102230246251565e-16,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_fixed",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_glasses",
                                                    "type": "A",
                                                    "score": 4.440892098500627e-16,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_micro",
                                                    "type": "A",
                                                    "score": 2.4400263672274067,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_shadow",
                                                    "type": "A",
                                                    "score": 4.539959341202909,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_gros_plan",
                                                    "type": "A",
                                                    "score": 1.3862943611198904,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_hair",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_make_up",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_masque",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_parapluie",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headComments_tilted",
                                                    "type": "A",
                                                    "score": 3.7258377681676564,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "headSmall",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "nbOtherFrontHead",
                                                    "type": "A",
                                                    "score": 2.0372582685679346,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NotUnderstandable",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "music",
                                                    "type": "A",
                                                    "score": 26.599337888978393,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "noise",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "sing",
                                                    "type": "A",
                                                    "score": 31.31929872589898,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "NbOtherSF",
                                                    "type": "A",
                                                    "score": 19.62496288347153,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceAlone",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOthers",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceOverlapping",
                                                    "type": "A",
                                                    "score": 8.946466632841572,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_cry",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_doublage",
                                                    "type": "A",
                                                    "score": 2.772588722239781,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_echo",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_haut_parleur",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_low",
                                                    "type": "A",
                                                    "score": 9.480916976525027,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_micro",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_music",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_out_of_breath",
                                                    "type": "A",
                                                    "score": 0.6931471805599453,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_sings",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "voiceComments_voice_off",
                                                    "type": "A",
                                                    "score": 0.23505503248176368,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityFront",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivity3_4",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityProfile",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_micro",
                                                    "type": "A",
                                                    "score": 1.6647015447839202,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                },
                                                {
                                                    "name": "lipActivityComments_shadow",
                                                    "type": "A",
                                                    "score": 0,
                                                    "r_type": "vector",
                                                    "r_attributes": {
                                                        "names": [
                                                            "name",
                                                            "type",
                                                            "score"
                                                        ]
                                                    }
                                                }
                                            ],
                                            "r_type": "vector",
                                            "r_attributes": {
                                                "names": [
                                                    "name",
                                                    "accuracy",
                                                    "features"
                                                ]
                                            }
                                        }
                                    ],
                                    "r_type": "vector",
                                    "r_attributes": {
                                        "names": [
                                            "name",
                                            "rate",
                                            "algo"
                                        ]
                                    }
                                }
                            ];

                            $scope.initCriteriaData();
                            $scope.model.isLoading = false;
                        }
                    });
                });
            };

            function clone(obj) {
                if (null == obj || "object" != typeof obj) return obj;
                var copy = obj.constructor();
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
                }
                return copy;
            };
        }
    ]);
