angular.module('streaming').controller('bulkController', ['$scope', '$location', 'Streaming', '$http', 'Authentication', 'FileUploader', 'toastr', '$filter', '$window', 'ngDialog', 'fileUpload', '$sce',
    function($scope, $location, Streaming, $http, Authentication, FileUploader, toastr, $filter, $window, ngDialog, fileUpload, $sce) {
        $scope.smartList = [];
        $scope.fields = [];
        $scope.showFields = [];

        $scope.getFields = function() {
            $http.get('/api/fields/all-fields').
            then(function(response) {
                //console.log(response.data);
                $scope.fields = response.data;
            });
        };
        $scope.getFields();

        $scope.addLineToSmartSearch = function() {
            //console.log($scope.smartSearch.currentField);
            /*if($scope.smartSearch.currentField === undefined){
              toastr.warning("Please select searching field");
              return;
            }*/
            if ($scope.smartSearch.option === "" || !$scope.smartSearch.option) {
                toastr.warning("Please select searching option");
                return;
            }

            if ($scope.smartSearch.currentField === "" || !$scope.smartSearch.currentField) {
                toastr.warning("Please select field");
                return;
            }

            if ($scope.smartSearch.input === "" || !$scope.smartSearch.input) {
                toastr.warning("Please insert a date/text");
                return;
            }
            $scope.smartList.push({
                "type": $scope.smartSearch.currentField.type,
                "field": $scope.smartSearch.currentField.key,
                "link": $scope.smartSearch.link,
                "option": $scope.smartSearch.option,
                "text": $scope.smartSearch.input,
                "fieldName": $scope.smartSearch.currentField.name
            });
            $scope.smartSearch.field = "";
            $scope.smartSearch.option = "";
            $scope.smartSearch.currentField = "";
            $scope.smartSearch.input = "";

        };

        $scope.removeFromSmartList = function(index) {
            console.log(index);
            $scope.smartList.splice(index, 1);
        };

        $scope.doSmartSearch = function() {
            if ($scope.smartList.length < 1) {
                toastr.warning("Please insert at list one searching row");
                return;
            }
            $scope.search = true;
            var found = false;
            for (var k in $scope.smartList) {
                if ($scope.smartList[k].field === "DateClosedFocusInformation")
                    found = true;
            }
            if (!found) {
                $scope.smartList.push({
                    "field": "closed",
                    "text": $scope.closed
                });
            }
            $http.post('/api/streaming/smart-search', $scope.smartList).
            then(function(response) {
                $scope.smartList.pop();
                $scope.search = false;
                if (response.data.length === 0)
                    toastr.warning("No Claimants Found");
                else
                    toastr.info(response.data.length + " Claimants Found");
                console.log(response.data);
                for (var k in response.data) {
                    for (var i in response.data[k]) {
                        if (response.data[k][i].id && response.data[k][i].id.type === "date") {
                            response.data[k][i].value = new Date(response.data[k][i].value);
                            if (response.data[k][i].value.getTime() === 0)
                                response.data[k][i].value = "";
                        }
                    }
                }
                $scope.streaming = response.data;
            }, function(response) {

                $scope.data = response.data || "Request failed";
            });
        };

        $scope.affField = function() {
            console.log($scope.filedsList);
            if ($scope.showFields.length > 3)
                return;
            for (var k in $scope.showFields) {
                if ($scope.showFields[k]._id === $scope.filedsList._id)
                    return;
            }
            $scope.showFields.push($scope.filedsList);
        };

        $scope.showField = function(i) {
            for (var k in $scope.showFields) {
                if (!i.id)
                    return false;
                if ($scope.showFields[k]._id === i.id._id) {
                    return true;
                }
            }
            return false;
        };

        $scope.editSingle = function(i) {
            $http.put('/api/streaming/' + $scope.streaming[i]._id, $scope.streaming[i]).
            then(function(response) {
                console.log(response.data);
                if (response.data === "OK")
                    toastr.success("Claimants edit success");
            });
        };

        $scope.editAll = function() {
            $scope.streaming.forEach(function(single, i) {
                console.log(i);
                $scope.editSingle(i);
            });

        };

        $scope.pushChange = function(index, field) {
            console.log(index, field, field.value);
            for (var k in $scope.streaming[index]) {
                console.log($scope.streaming[index][k]);
                if ($scope.streaming[index][k].id._id === field._id) {
                    $scope.streaming[index][k].value = field.value;
                }
            }
            console.log($scope.streaming[index]);
        };
    }
]);