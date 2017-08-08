'use strict';

// Edit Stream controller
angular.module('streaming').controller('EditStream', ['$scope', '$location', 'Streaming', '$http', 'Authentication', 'toastr',
    function($scope, $location, Streaming, $http, Authentication, toastr) {
        $scope.stream = $scope.ngDialogData.stream;
        $scope.fields = $scope.ngDialogData.fields;
        $scope.cats = $scope.ngDialogData.cats;
        console.log($scope.stream);
        //split the data for reqired and non-required fields
        /*
    $scope.splitFields = function(){
      $scope.requiredFileds = [];
      $scope.allStreaming = [];
      var obj = {};
      for(var k in $scope.fields){
        var found = false;
        for(var i in $scope.stream){
          var currentFiedld;
          if(i === $scope.fields[k].key){
            if(i === "_id" || i === "user" || i === "__v" || i === "$$hashKey")
              continue; 
            currentFiedld = $scope.fields[k];
            found = true;
            obj = {
              key : i,
              value : stream[i],
              type : currentFiedld.type,
              name : currentFiedld.name
            };           
              $scope.allStreaming.push(obj);
          }  
        }
      }
        //console.log($scope.otherFileds);
        //console.log($scope.allStreaming);
    };
    */
        $scope.onlyCategory = function(cat, item) {
            return item.id.category !== cat;
        };

        $scope.sendEditStream = function(isValid) {
            if (isValid) {
                toastr.warning('Please fill up all fields');
                return false;
            }
            $http.put('/api/streaming/' + $scope.stream._id, $scope.stream).
            then(function(response) {
                //$scope.stream = response;
                console.log(response);
                toastr.success('Claimant Saved');
            }, function(response) {
                console.log("no");
                toastr.error('Error Saving');
            });
        };

        $scope.addNote = function(isValid) {
            //console.log("add note");
            /*if (!isValid) {
              $scope.$broadcast('show-errors-check-validity', 'streamForm');
              return false;
            }*/
            $scope.error = null;
            var note = new Streaming({
                date: $scope.newNote.date,
                stream: $scope.stream._id,
                content: $scope.newNote.text,
                type: $scope.newNote.type,
                title: $scope.newNote.title,
                _case: $scope.ngDialogData.stream._id
            });
            $http.post('/api/streaming/note', note).
            then(function(response) {
                console.log(response);
                toastr.success('New note Saved');
                $scope.notes.push(response.data);
            }, function(response) {
                $scope.data = response.data || "Request failed";
                toastr.success('Error adding new note');
            });
        };

        $scope.getNotes = function() {
            $http.get('/api/streaming/note/' + $scope.stream._id).
            then(function(response) {
                $scope.notes = response.data;
            }, function(response) {
                $scope.data = response.data || "Request failed";
            });
        };

        $scope.deleteNote = function(note) {
            $http.delete('/api/streaming/note/' + note).
            then(function(response) {
                if (response.statusText === "OK")
                    toastr.warning('Note deleted');
                $('#' + note).fadeOut(300, function() { $(this).remove(); });

            }, function(response) {
                $scope.data = response.data || "Request failed";
                console.log($scope.todayNotes);
            });
        };

        // Update existing Stream
        $scope.update = function(isValid) {
            $scope.error = null;

            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'streamForm');

                return false;
            }

            var stream = $scope.stream;
            console.log(stream);

            stream.$update(function() {
                $location.path('streaming/' + stream._id);
            }, function(errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        //function to run for the page
        $scope.getNotes();
        $scope.splitFields();
    }
]);