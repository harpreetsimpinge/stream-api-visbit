'use strict';

// Streaming controller
angular.module('streaming').controller('FieldsController', ['$scope', 'Authentication', '$http', 'toastr',
    function($scope, Authentication, $http, toastr) {
        $scope.authentication = Authentication;
        $scope.cats = [];

        $scope.getFields = function() {
            $http.get('/api/fields/all-fields').
            then(function(response) {
                    console.log(response);
                    $scope.fields = response.data;
                    $scope.splitFileds = {};

                    for (var j in response.data) {
                        var found = false;
                        for (var i in $scope.cats) {
                            if ($scope.cats[i] === response.data[j].category)
                                found = true;
                        }
                        if (found === false) {
                            $scope.cats.push(response.data[j].category);
                            $scope.splitFileds[response.data[j].category] = {};
                        }
                    }
                    for (var k in $scope.fileds) {
                        var cat = $scope.fields[k].category;
                        $scope.splitFileds[cat].push($scope.fields[k]);
                    }
                }, function(response) {
                    $scope.data = response.data || "Request failed";
                }

            );
        };
        $scope.getFields();

        $scope.addLineToFilds = function() {
            var line = {
                type: "text",
                required: $scope.newFiled.required,
                name: $scope.newFiled.value,
                category: $scope.newFiled.cat,
                order: 1,
                key: $scope.newFiled.value.replace(/[^A-Z0-9]/ig, '') + $scope.newFiled.cat.replace(/\s+/g, '')
            };
            console.log(line);
            create(line);
        };

        $scope.update = function() {
            var fields = $scope.fields;
            $http.post('/api/fields', fields).
            then(function(response) {

            }, function(response) {});
        };

        $scope.showUpdate = function() {
            toastr.success('Fields Updated');
        };

        $scope.delete = function(id) {
            $http.delete('/api/fields/' + id).
            then(function(response) {
                if (response.statusText === "OK") {
                    toastr.warning('Field deleted');
                    for (var k in $scope.fields) {
                        if ($scope.fields[k]._id === id) {
                            $scope.fields.splice(k, 1);
                            break;
                        }
                    }
                }

            }, function(response) {
                $scope.data = response.data || "Request failed";
            });
        };

        function create(line) {

            $http.post('/api/fields/newfields', line).
            then(function(response) {
                if (response.statusText === "OK")
                    toastr.success('Fields Added');
                $scope.fields.push(response.data);
            }, function(response) {});
        }

        $scope.moveDown = function(index, cat) {
            var up, down;
            for (var k in $scope.fields) {
                if ($scope.fields[k].category === cat && $scope.fields[k].order === index) {
                    //console.log(k , $scope.fields[k]);
                    up = $scope.fields[k];
                    // $scope.fields[k]++;
                }
                if ($scope.fields[k].category === cat && $scope.fields[k].order === index + 1) {
                    //console.log(k , $scope.fields[k]);
                    //$scope.fields[k]--;
                    down = $scope.fields[k];
                }

            }
            if (down.order > 0 && up.order !== $scope.fields.length) {
                up.order++;
                down.order--;
                $scope.update();
            }
            for (var k in $scope.fileds) {}
        };

        $scope.moveUp = function(index, cat) {
            var up, down;
            for (var k in $scope.fields) {
                if ($scope.fields[k].category === cat && $scope.fields[k].order === index) {
                    //console.log(k , $scope.fields[k]);
                    up = $scope.fields[k];
                    // $scope.fields[k]++;
                }
                if ($scope.fields[k].category === cat && $scope.fields[k].order === index - 1) {
                    //console.log(k , $scope.fields[k]);
                    //$scope.fields[k]--;
                    down = $scope.fields[k];
                }

            }
            if (up.order > 0 && up.down !== $scope.fields.length) {
                up.order--;
                down.order++;
                $scope.update();
            }
        };

        $scope.addDropdown = function(item) {
            if (item.type !== "dropdown")
                return;
            if (!item.hasOwnProperty("value")) {
                item.values = [];
            }
        };

        $scope.addToDropdown = function(item) {
            if (item.type !== "dropdown")
                return;
            if (!item.hasOwnProperty("values")) {
                item.values = [];
            }
            item.values.push(item.new);
            item.new = "";
        };

        $scope.removeFromValues = function(i, item) {
            if (item.type !== "dropdown")
                return;
            item.values.splice(i, 1);

        };

    }
]);