'use strict';

// Streaming controller
angular.module('streaming').controller('streamActionController', ['$scope', '$state', '$location', '$timeout', 'Streaming', '$http', 'Authentication', 'FileUploader', 'toastr', '$filter', '$window', 'ngDialog', 'fileUpload', '$sce', '$rootScope',
    function($scope, $state, $location, $timeout, Streaming, $http, Authentication, FileUploader, toastr, $filter, $window, ngDialog, fileUpload, $sce, $rootScope) {
        $scope.stream = $scope.ngDialogData.stream;

        $scope.fields = $scope.ngDialogData.fields;
        $scope.cats = $scope.ngDialogData.cats;
        //$scope.users = $scope.ngDialogData.users;
        $scope.allworkfaces = $scope.ngDialogData.allworkfaces;
        $scope.allNotesWorkstatusPrice = 0;
        $scope.loadFile = false;
        $scope.loadSuccess = false;
        $scope.editDoc = null;
        $scope.notes = [];
        $scope.authentication = Authentication;
        $scope.sortType = 'date';
        $scope.emailAttachment = [];
        $scope.newNote = {
            files: [],
            filesShow: [],
            date: new Date(),
            // followup: new Date()
        };
        $scope.editNote = {
            files: []
        };
        $scope.dropdoc = {
            perPage: 8,
            n: 0,
            search: false,
            sortType: 'date',
            sortReverse: true
        };
        $scope.allFiles = [];
        $scope.sortReverse = true; //for Notes
        $scope.date = new Date();
        $scope.calculator = {};
        $scope.isLegacy = false;
        $scope.loading = false;
        $scope.confirmLegacy = "";
        $scope.permissions = [];
        var fileAction = "";
        var uploadType = {};

        //var allNotesWorkstatusPrice = 0;

        // $scope.stream.RTWregpermFocusInformation = $scope.stream.RTWregpermFocusInformation || {value: new Date()};
        // $scope.stream.RTWtransFocusInformation = $scope.stream.RTWtransFocusInformation || {value: new Date()};

        // if ($scope.users && $scope.users.length) {
        //   for (var i = 0, len = $scope.users.length; i < len; i++) {
        //     if ($scope.users[i].hasOwnProperty('ticked'))
        //       delete $scope.users[i].ticked;
        //   }
        // }
        // console.log('users', $scope.users);
        //
        $scope.froalaOptions = {
            toolbarButtons: ["bold", "italic", "underline", "strikeThrough", "fontSize", "fontFamily", "color",
                "|", "formatBlock", "blockStyle", "align", "insertOrderedList", "insertUnorderedList", "outdent", "indent",
                "|", "createLink", "insertImage", "insertVideo", "insertHorizontalRule", "undo", "redo", "html"
            ],
            key: 'md1hkC-11ydbdmcE-13dvD1wzF-7=='
        };

        $scope.uploaderDoc = new FileUploader({
            url: '/api/exports/renderDoc/' + $scope.stream._id,
            alias: 'docRender',
            responseType: 'buffer',
            removeAfterUpload: true
                //headers: {'responseType':'buffer'}
        });

        $scope.bAllowedToChangeInfo = false;
        if ($scope.authentication.user.roles.indexOf('admin2') !== -1 || $scope.authentication.user.roles.indexOf('admin') !== -1)
            $scope.bAllowedToChangeInfo = true;

        $scope.uploaderDoc.onSuccessItem = function(fileItem, response, status, headers) {
            console.log(response);
            //if(response._id){
            var blob = new Blob([response.base64], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            //saveAs(blob, "export.docx");
            // var Docxgen = $window.doc;

            var aTag = document.createElement('a');
            aTag.setAttribute('href', response.content);
            aTag.setAttribute('download', "template.docx");
            aTag.setAttribute('id', "docxtrigger");
            aTag.setAttribute('target', "_self");
            aTag.click();

            //var output = new Docxgen(response).getZip().generate({type: "blob"});
            //saveAs(output, "raw.docx");
            toastr.success('File Rendered');
            $scope.getFiles();
            // $scope.uploaderDoc.clearQueue();
            //document.getElementById('renderFile').value = "";
            //}

        };

        $scope.uploader = new FileUploader({
            url: $scope.uploadApiUrl,
            alias: 'uploadFile'
        });

        $scope.uploader.onAfterAddingFile = function() {
            $scope.loadFile = true;
            $scope.uploader.uploadAll();
        };

        $scope.changeUploadType = function(action, para) {
            fileAction = action;
            uploadType.note = para.note;
            uploadType.followup = para.followup;
            uploadType.case = para.case;
            uploadType.id = para.id;
            if (fileAction === 'newFileNote') {
                $scope.uploader.url = "/api/dropdpc/uploadfile";
            } else if (action === 'modifyFile') {
                $scope.uploader.url = "/api/dropdpc/modifyfile";
            } else if (action === 'newEmailAttachment') {
                $scope.uploader.url = "/api/dropdpc/uploadfile";
            } else if (fileAction === "newCaseFile") {
                $scope.uploader.url = "/api/dropdpc/uploadfile";
            } else if (action === 'editNote') {
                $scope.uploader.url = "/api/dropdpc/uploadfile";
            } else {
                toastr.error('Error in file upload');
            }
            $scope.uploader.formData = [uploadType];
        };

        $scope.uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.log(response);
            $scope.loadFile = false;
            if (status === 200) {

                toastr.success('File upload success');
                if (fileAction === "newFileNote") {
                    $scope.newNote.filesShow.push(response);
                    $scope.newNote.files.push(response._id);
                    //$scope.files.push(response);
                } else if (fileAction === "modifyFile") {
                    console.log("modifyFile");
                    for (var k in $scope.files) {
                        if ($scope.files[k]._id === response._id) {
                            $scope.files.splice(k, 1);
                            $scope.files.push(response);
                            $scope.allFiles.push(response);
                        }
                    }
                } else if (fileAction === "newEmailAttachment") {
                    $scope.note.files.push({ originalName: response.originalName, url: response.Location });
                    $scope.files.push(response);
                    $scope.emailAttachment.push(response);
                } else if (fileAction === "newCaseFile") {
                    $scope.files.push(response);
                    $scope.allFiles.push(response);
                    $scope.searchAndDisplay("");
                } else if (fileAction === "editNote") {
                    $scope.editNote.files.push(response);

                }

                $scope.loadSuccess = true;

                $scope.getFiles();
            } else
                toastr.warning('Error file upload');
        };

        $scope.cancelUpload = function() {
            $scope.uploader.clearQueue();
        };

        $scope.deleteFileDropdoc = function(id, i) {
            $http.delete('/api/dropdpc/deletefile/' + id)
                .then(function(response) {
                    console.log(response);
                    if (response.data !== "") {
                        toastr.success("Delete File Suceess");
                        $scope.files.splice(i, 1);
                    } else
                        toastr.error("Delete failed");
                }, function(response) {
                    toastr.error('Error Deleting file');
                });
        };

        $scope.sendNoteByEmail = function(email, id) {
            toastr.info("Sending email...");
            console.log(email, id);
            $http.get('/api/exports/sendNoteByEmail/' + id + "/" + email)
                .then(function(response) {
                    console.log(response);
                    if (response.data === "ok")
                        toastr.success("Email sent");
                    else
                        toastr.error("Sending failed");
                }, function(response) {
                    toastr.error('Error sending email');
                });
        };

        $scope.getFiles = function() {
            $http.get('/api/dropdpc/getbyclaimant/' + $scope.stream._id)
                .then(function(response) {
                    $scope.files = response.data;
                    $scope.allFiles = response.data;
                    $scope.pageLength = Math.ceil(response.data.length / $scope.dropdoc.perPage);
                    $scope.seize(0);
                }, function(response) {
                    toastr.error('Error Loading files');
                });
        };

        $scope.splitFields = function() {
            $scope.allStreaming = [];
            var obj = {};
            for (var k in $scope.fields) {
                var found = false;
                for (var i in $scope.stream) {
                    var currentFiedld;
                    if (i === $scope.fields[k].key) {
                        if (i === "_id" || i === "user" || i === "__v" || i === "$$hashKey")
                            continue;
                        currentFiedld = $scope.fields[k];
                        found = true;
                        obj = {
                            key: i,
                            value: stream[i],
                            type: currentFiedld.type,
                            name: currentFiedld.name
                        };
                        $scope.allStreaming.push(obj);
                    }
                }
            }
            //console.log($scope.otherFileds);
            //console.log($scope.allStreaming);
        };

        $scope.onlyCategory = function(cat, item) {
            return item.id.category !== cat;
        };

        $scope.sendEditStream = function(isValid) {
            if (isValid) {
                //toastr.warning('Please fill up all fields');
                //return false;
            }

            $scope.stream.permissions = angular.copy($scope.permissions);
            console.log("permissions: ", $scope.permissions);
            var send = angular.copy($scope.stream);
            send.workface = $scope.newNote.workface;
            send.price = $scope.allNotesWorkstatusPrice;
            console.log("send.price: ", send.price);

            console.log("Edit stream when note add");

            delete send.legacy;
            $http.put('/api/streaming/' + $scope.stream._id, send)
                .then(function(response) {
                    //$scope.stream = response;
                    toastr.success('Claimant Saved');
                }, function(response) {
                    toastr.error('Error Saving');
                });
        };

        $scope.permissionsChange = function(data) {
            if ($scope.permissions.length === 0) {
                $scope.permissions.push({
                    _id: data._id,
                    displayName: data.displayName
                });
                return;
            } else {
                for (var k in $scope.permissions) {
                    if ($scope.permissions[k]._id === data._id) {
                        $scope.permissions.splice(Number(k), 1);
                        return;
                    }
                }
                $scope.permissions.push({
                    _id: data._id,
                    displayName: data.displayName
                });
            }
        }

        $scope.addNote = function(isValid) {
            console.log("add note");
            /*if (!isValid) {
              $scope.$broadcast('show-errors-check-validity', 'streamForm');
              return false;
            }*/
            $scope.error = null;
            var date = new Date($scope.newNote.date);
            var followupdate = new Date($scope.newNote.followup);
            date.setUTCHours(12, 0, 0, 0);
            followupdate.setUTCHours(12, 0, 0, 0);
            var note = new Streaming({
                date: date,
                stream: $scope.stream._id,
                content: $scope.newNote.text,
                type: $scope.newNote.type,
                title: $scope.newNote.title,
                _case: $scope.ngDialogData.stream._id,
                files: $scope.newNote.files,
                followUp: followupdate,
                assign: $scope.newNote.assign,
                workface: $scope.newNote.workface
            });


            if ($scope.loadFile) {
                toastr.warning('Uploading file...');
                return;
            }
            $http.post('/api/streaming/note', note)
                .then(function(response) {
                    $scope.sendEditStream(true);
                    console.log(response);
                    toastr.success('New note Saved');
                    $scope.notesUnfilter.push(response.data);
                    $scope.newNote = { files: [] };
                    $scope.newNoteId = response.data.id;
                    $scope.uploader.clearQueue();
                    $scope.loadSuccess = false;
                    $scope.newNote.filesShow = [];
                    $scope.searchAndDisplay();
                    $scope.emailAttachment = [];
                    for (var k in response.data.files) {
                        $scope.files.push(response.data.files[k]);
                    }
                    if (note.type === "closing") {
                        closeFile();
                    }
                }, function(response) {
                    $scope.data = response.data || "Request failed";
                    toastr.error('Error adding new note');
                });
        };



        $scope.getNotes = function() {
            $http.get('/api/streaming/note/' + $scope.stream._id).
            then(function(response) {
                $scope.notesUnfilter = response.data;
                for (var k in response.data) {
                    if (response.data[k].date !== null)
                        response.data[k].date = new Date(response.data[k].date);

                    if (response.data[k].followUp !== null)
                        response.data[k].followup = new Date(response.data[k].followUp);
                }
                $scope.searchAndDisplay();
                //$state.forceReload();
            }, function(response) {
                $scope.data = response.data || "Request failed";
                // console.log($scope.data); 
            });
        };

        $scope.deleteNote = function(note) {
            if (!$scope.canEditNote(note)) return;

            note = note._id;

            $http.delete('/api/streaming/note/' + note)
                .then(function(response) {
                    if (response.statusText === "OK")
                        toastr.warning('Note deleted');
                    $('#' + note).fadeOut(300, function() { $(this).remove(); });

                }, function(response) {
                    $scope.data = response.data || "Request failed";
                });
        };

        $scope.deleteFollowUp = function(note) {
            if (!$scope.canEditNote(note)) return;

            note = note._id;

            $http.delete('/api/notes/followup/' + note)
                .then(function(response) {
                    if (response.statusText === "OK")
                        toastr.warning('Note deleted');
                    $('#' + note).fadeOut(300, function() { $(this).remove(); });

                }, function(response) {
                    $scope.data = response.data || "Request failed";
                });
        };

        $scope.update = function(isValid) {
            $scope.error = null;
            /*
            if (!isValid) {
              $scope.$broadcast('show-errors-check-validity', 'streamForm');

              return false;
            }*/
            var stream = $scope.stream;
            stream.permissions = $scope.permissions;

            stream.$update(function() {
                $location.path('streaming/' + stream._id);
            }, function(errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        $scope.getFollowUp = function() {
            $http.get('/api/notes/followup/' + $scope.stream._id)
                .then(function(response) {
                        $scope.followup = response.data;
                        for (var k in $scope.followup) {
                            /*$scope.notes.push({
                             _id: $scope.followup[k]._id,
                             stream: $scope.followup[k].id.stream,
                             class: "followupNote",
                             content: $scope.followup[k].id.content,
                             created: $scope.followup[k].id.created,
                             creator: $scope.followup[k].id.creator,
                             date: $scope.followup[k].date,
                             followUp: $scope.followup[k].id.followUp,
                             icon: "fa-certificate",
                             title: "F.U " + $scope.followup[k].id.title,
                             type: $scope.followup[k].id.type,
                             url: $scope.followup[k].url,
                             status: $scope.followup[k].status,
                             id: $scope.followup[k].id
                            });*/
                        }
                    }, function(response) {
                        $scope.data = response.data || "Request failed";
                    }

                );
        };

        $scope.reloadNotes = function() {
            $scope.getNotes();
        }

        $scope.updateAllNotes = function() {
            $scope.getNotes();
            $scope.getFollowUp();
        };

        $scope.exportStreamToPdf = function() {
            var art = $scope.stream;
            var art2 = sortFields($scope.stream);
            var notes = $scope.notes;
            var obj = {};
            var html = "<div style='font-family:arial;'>";
            html += '<div><font style="font-size:30px">' + art.FirstnameContact.value + ' ' + art.LastnameContact.value + '</font></div><br>';
            html += '<div><font style="font-size:24px">Claim #' + art.ClaimContact.value + '</font></div><br>';
            html += '<div><font style="font-size:24px">DOI ' + $filter('date')(art.DOIContact.value, "MM/dd/yy") + '</font></div><br><br>';
            for (var k in art2) {
                if (art2[k].hasOwnProperty("id") && art2[k].value !== "" &&
                    art2[k].value !== " " &&
                    art2[k].id.key !== "NorthorCentralorStatewideFocusInformation" &&
                    art2[k].id.key !== "DateassignedFocusInformation" &&
                    art2[k].id.category !== "System" &&
                    !angular.isUndefined(art2[k].value) &&
                    !angular.isUndefined(art2[k].id.category)
                ) {
                    if (!obj.hasOwnProperty(art2[k].id.category)) {
                        obj[art2[k].id.category] = [];
                    }
                    if (art2[k].id.type === "date") {
                        obj[art2[k].id.category].push({
                            "name": art2[k].id.name.replace(/(\r\n|\n|\r)/gm, ""),
                            "value": $filter('date')(art2[k].value, "MM/dd/yy")
                        });
                    } else if ((art2[k].id.type === "text" || art2[k].id.type === "dropdown") && art2[k].id.key !== "FirstnameContact" && art2[k].id.key !== "LastnameContact") {
                        obj[art2[k].id.category].push({
                            "name": art2[k].id.name.replace(/(\r\n|\n|\r)/gm, ""),
                            "value": art2[k].value.replace(/(\r\n|\n|\r)/gm, "")
                        });
                    }
                    console.log(obj[art2[k].id.category]);
                }
            }
            html += "<div>";
            for (var k in obj) {
                if (k === "Contact") {
                    for (var i in obj[k]) {
                        html += "<p style='margin:0px'>" + obj[k][i].name + " : " + obj[k][i].value + "</p><br>";
                    }
                }
            }
            html += "</div>";
            for (var k in obj) {
                if (k !== "Contact") {
                    html += "<p><font style='font-size:24px;'>" + k + "</font><br></p>";
                    for (var i in obj[k]) {
                        html += "<p style='margin:0px'>" + obj[k][i].name + " : " + obj[k][i].value + "</p><br>";
                    }
                }
            }
            html += "</div>";
            console.log(html);
            // Save the PDF
            var pdf = new jsPDF('p', 'pt', 'letter');

            var specialElementHandlers = {
                '#bypassme': function(element, renderer) {
                    return true;
                }
            };
            var margins = {
                top: 10,
                bottom: 10,
                left: 40,
                width: 522
            };
            pdf.fromHTML(
                html, // HTML string or DOM elem ref.
                margins.left, // x coord
                margins.top, { // y coord
                    'width': margins.width, // max width of content on PDF
                },
                function(dispose) {
                    pdf.save('Focus-On-Intervention-' + art.FirstnameContact.value + '-' + art.LastnameContact.value + '.pdf');
                }, margins);
        };

        $scope.decodeHtml = function(text) {
            $scope.render = text;
            for (var k in $scope.stream) {
                if ($scope.stream[k] !== undefined && angular.isObject($scope.stream[k]) && k !== "permissions") {
                    var re = "\*\*" + $scope.stream[k].id.key + "\*\*";
                    $scope.render = $scope.render.replace(re, $scope.stream[k].value);
                }
            }
            var pdf = new jsPDF('p', 'pt', 'letter');
            var source = $scope.render;

            var specialElementHandlers = {
                '#bypassme': function(element, renderer) {
                    return true;
                }
            };
            var margins = {
                top: 10,
                bottom: 10,
                left: 40,
                width: 522
            };
            pdf.fromHTML(
                source, // HTML string or DOM elem ref.
                margins.left, // x coord
                margins.top, { // y coord
                    'width': margins.width, // max width of content on PDF
                    'elementHandlers': specialElementHandlers
                },
                function(dispose) {
                    pdf.save('Focus-On-Intervention-' + $scope.stream.FirstnameContact.value + '-' + $scope.stream.LastnameContact.value + '.pdf');
                }, margins);


        };

        $scope.emailExport = function() {
            $http.get('/api/templates')
                .then(function(response) {
                    $scope.templates = response.data;

                }, function(response) {

                });
        };

        $scope.editDocFun = function(doc) {
            $scope.tempDoc = doc;
            $scope.editDoc = doc;
        };

        $scope.changeStatus = function(note) {
            if (!$scope.canEditNote(note)) return;

            var id = note._id;

            $http.get('/api/notes/changestatus/' + id)
                .then(function(response) {
                    for (var k in $scope.notes) {
                        if ($scope.notes[k]._id === response.data._id) {
                            $scope.notes[k].status = response.data.status;
                        }
                    }

                }, function(response) {

                });
        };

        $scope.changeEmailSent = function(note) {
            if (!$scope.canEditNote(note)) return;

            var id = note._id;

            $http.get('/api/notes/change_emailsent/' + id)
                .then(function(response) {
                    for (var k in $scope.notes) {
                        if ($scope.notes[k]._id === response.data._id) {
                            $scope.notes[k].email_sent = response.data.email_sent;
                        }
                    }

                }, function(response) {

                });
        };

        $scope.renderDocument = function() {
            console.log("here");
            $scope.uploaderDoc.uploadAll();
            /*
            $http.post('/api/exports/renderDoc', $scope.stream)
              .then(function(response) {
                  console.log(response.data);
                }, function(response) {
                  $scope.data = response.data || "Request failed";
                  toastr.error('Error adding new note');
                }
                );
              */
        };

        $scope.emailDialog = function(note) {
            $scope.note = note;
            $scope.emailAttachment = angular.copy(note.files);
            console.log(note, $scope.note);
            $scope.dialog2 = ngDialog.open({
                template: 'emailTemplate',
                scope: $scope,
                className: 'ngdialog-overlay ngdialog-custom dialog-medium-size',
                closeByEscape: true,
                showClose: false,
                overlay: false,
            });
        };

        $scope.emailDialogDropDoc = function(file) {
            console.log(file);
            $scope.note = {};
            $scope.note.files = [];
            $scope.note.files.push(file);
            $scope.emailAttachment.push(file);
            $scope.dialog2 = ngDialog.open({
                template: 'emailTemplate',
                scope: $scope
            });
        };

        $scope.sendEmail = function() {
            console.log($scope.emailAttachment);
            var att = "<br>---<br>Attached files<br>";
            for (var k in $scope.emailAttachment) {
                att += "<a href='" + $scope.emailAttachment[k].url + "'>" + $scope.emailAttachment[k].originalName + "</a><br>";
            }
            var sendNote = $scope.note;

            if ($scope.emailAttachment.length > 0)
                sendNote.content += att;
            delete sendNote._case;
            $http.post('/api/exports/sendNoteByEmail', sendNote)
                .then(function(response) {
                    if (response.status !== 200)
                        toastr.warning("Email not sent");
                    else
                        toastr.success("Email Sent Successfully");
                    $scope.streaming = response.data;
                }, function(response) {

                    $scope.data = response.data || "Request failed";
                });
        };

        $scope.isClosed = function(date) {
            return angular.isDate(date);
        };

        $scope.openFile = function() {
            $scope.stream.DateClosedFocusInformation.value = "";
            toastr.info("Claimate Open");
        };

        $scope.deleteFile = function(item) {
            if (!$scope.confirm === 'DELETE')
                return;
            $http.delete('/api/streaming/' + item._id)
                .then(function(response) {
                    toastr.info("Claimate deleted");
                }, function(response) {

                });
        };

        $scope.flipSortReverse = function() {
            $scope.sortReverse = !$scope.sortReverse;
        }

        $scope.searchAndDisplay = function() {
            console.log("Notes for stream", $scope.notesUnfilter);
            $scope.isNotesReady = false;

            $scope.notes = $scope.notesUnfilter;
            $scope.notes = $filter('filter')($scope.notes, {
                $: $scope.search
            });

            var regular = [];
            var prior = [];
            for (var k in $scope.notes) {
                if ($scope.notes[k].type === "newInfo") {
                    prior.push($scope.notes[k]);
                } else {
                    regular.push($scope.notes[k]);
                }
            }

            console.log('sortReverse', $scope.sortReverse);

            prior = $filter('orderBy')(prior, "date", $scope.sortReverse);
            regular = $filter('orderBy')(regular, "date", $scope.sortReverse);

            $scope.notes = prior.concat(regular);

            var allNotesWorkstatusPrice = 0;
            $scope.isNotesReady = true;

            for (var k = 0; k < $scope.notes.length; k++) {

                if ($scope.notes[k].workface != undefined && $scope.notes[k].workface.price != undefined) {
                    console.log("workface price = " + $scope.notes[k].workface.price);
                    allNotesWorkstatusPrice = (parseFloat(allNotesWorkstatusPrice) + parseFloat($scope.notes[k].workface.price));
                }

            }
            $scope.allNotesWorkstatusPrice = allNotesWorkstatusPrice;

            $scope.isNotesReady = true;
        };

        $scope.canEditNote = function(note) {
            if ($scope.authentication.user.roles.indexOf('admin') !== -1)
                return true;

            if ($scope.authentication.user.roles.indexOf('admin1') !== -1)
                return false;

            if ((note.creator.hasOwnProperty('_id') && note.creator._id == $scope.authentication.user._id) || (!note.creator.hasOwnProperty('_id') && note.creator == $scope.authentication.user._id)) {
                var createdAt = new Date(note.created).getTime();
                var now = new Date().getTime();

                if (parseInt(now) - parseInt(createdAt) < 86400 * 1000) return true;
            }

            return false;
        }

        $scope.updateNote = function(i) {
            $http.post('/api/notes', $scope.editNote)
                .then(function(response) {
                    toastr.success('Success Updating Note');
                }, function(response) {
                    $scope.data = response.data || "Request failed";
                    toastr.error('Error update ');
                });
        };

        $scope.editNoteDialog = function(note) {
            $scope.editNote = note;
            $scope.dialog3 = ngDialog.open({
                template: 'editNoteTemplate',
                scope: $scope
            });
        };

        $scope.showPdfDialog = function(url) {
            console.log(url);
            var config = {
                headers: {
                    "X-Testing": "testing",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Origin": "*",
                    "responseType": 'arraybuffer'
                },
                responseType: 'arraybuffer'
            };
            $scope.loadingPdf = true;
            $http.get(url, config)
                .success(function(response) {
                    $scope.loadingPdf = false;
                    var file = new Blob([response], { type: 'application/pdf' });
                    var fileURL = URL.createObjectURL(file);
                    $scope.url = $sce.trustAsResourceUrl(fileURL);
                });

            $scope.dialog4 = ngDialog.open({
                template: 'PdfTemplate',
                scope: $scope
            });
        };

        $scope.checkIfPdf = function(name) {
            return /\.(pdf|PDF)$/.test(name);
        };

        function addFields() {
            var fields = $scope.fields;
            var file = $scope.stream;
            var save = false;
            var count = 0;
            for (var k in file) {
                if (typeof file[k] === 'object' && file[k] !== null && file[k].hasOwnProperty("value")) {
                    count++;
                }
            }
            //if(fields.length > count){
            for (var i in fields) {
                var find = false;
                if (!file.hasOwnProperty(fields[i].key)) {
                    file[fields[i].key] = { id: fields[i], value: "" };
                    toastr.info('New Field Added: ' + fields[i].name);
                    save = true;
                }
            }
            //}
            $scope.stream = file;
            $scope.stream_sort = sortFields(file);
            if (!$scope.stream.legacy) {
                $scope.stream.legacy = [];
            }
            $scope.stream.legacy.push({ "created": "" });
            if (save === true) {
                $scope.sendEditStream(true);
            }
        }

        function sortFields(input) {
            var array = [];
            var other_arr = [];
            for (var objectKey in input) {
                if (objectKey !== undefined && angular.isObject(input[objectKey]) && objectKey !== "permissions" && objectKey !== "legacy")
                    array.push(input[objectKey]);
                else
                    other_arr.push(input[objectKey]);
            }

            array.sort(function(a, b) {
                //var aPos = parseInt(a.id.order);
                //var bPos = parseInt(b.id.order);
                if (a.id === null || b.id === null)
                    return 0;
                return a.id.order - b.id.order;
            });
            return array;
        }

        function sortFieldsToObj(input) {
            var array = [];
            for (var objectKey in input) {
                if (objectKey !== undefined && angular.isObject(input[objectKey]) && objectKey !== "permissions")
                    array.push(input[objectKey]);
            }

            array.sort(function(a, b) {
                //var aPos = parseInt(a.id.order);
                //var bPos = parseInt(b.id.order);
                return a.id.order - b.id.order;
            });

            var obj = {};
            for (var k in array) {
                console.log(array[k].id.order, " -- ", array[k].id.key);
                var obj2 = { "value": array[k].value, "id": array[k].id };
                obj[array[k].id.key] = obj2;

            }

            console.log(obj);
            return obj;
        }

        function closeFile() {
            $scope.stream.DateClosedFocusInformation.value = new Date();
            $scope.sendEditStream(true);
            toastr.info("Claimate Closed");

        }

        function tickPremissions() {
            //tick the users that exist in the stream:
            for (var k in $scope.users) {
                for (var i in $scope.stream.permissions) {
                    if ($scope.users[k]._id === $scope.stream.permissions[i]._id) {
                        $scope.users[k].ticked = true;
                    }
                }
            }
            var permissions = angular.copy($scope.stream.permissions);
            var ids = permissions.map(function(obj) { return obj._id; });
            $scope.permissions = permissions.filter(function(value, index, self) {
                return ids.indexOf(value._id) === index;
            });
        }

        $scope.docCaseFilter = function(item) {
            return item.case !== '' || item.case !== null;
        };

        $scope.seize = function(n) {
            var lowEnd = n * $scope.dropdoc.perPage;
            var highEnd = n * $scope.dropdoc.perPage + $scope.dropdoc.perPage;
            var arr = [];
            var bigArray = [];
            if ($scope.dropdoc.search === true) {
                bigArray = $scope.searchFiles;
            } else {
                bigArray = $scope.allFiles;
            }
            //console.log(bigArray);
            for (var i = lowEnd; i < highEnd; i++) {
                if (bigArray[i] !== undefined) {
                    arr.push(bigArray[i]);
                }
            }
            $scope.dropdoc.n = n;
            $scope.files = arr;
        };

        $scope.dropdocPrev = function() {
            console.log("prev");
            if ($scope.dropdoc.n < 1)
                return;
            $scope.seize($scope.dropdoc.n - 1);
        };

        $scope.dropdocNext = function() {
            if ($scope.dropdoc.n > $scope.pageLength)
                return;
            $scope.seize($scope.dropdoc.n + 1);
        };

        $scope.dropdoc.searchAndDisplay = function(value) {

            if (value === undefined || value === "") {
                $scope.pageLength = Math.ceil($scope.allFiles.length / $scope.dropdoc.perPage);
                $scope.dropdoc.search = false;
                $scope.orderDropdoc();
                return;
            }
            $scope.files = $filter('filter')($scope.allFiles, value);
            $scope.searchFiles = $scope.files;
            $scope.pageLength = Math.ceil($scope.files.length / $scope.dropdoc.perPage);
            $scope.dropdoc.search = true;
            $scope.orderDropdoc();
        };

        $scope.orderDropdoc = function() {
            $scope.allFiles = $filter('orderBy')($scope.allFiles, $scope.dropdoc.sortType, $scope.dropdoc.sortReverse);
            $scope.seize(0);
        };

        $scope.calculator.changeDate = function() {
            $scope.calc1Error = true;
            console.log($scope.selectToday);
            var unix2, unix1;
            if ($scope.selectToday) {
                $scope.date2 = new Date();
                unix2 = new Date().getTime() / 1000;
            } else {
                $scope.date2 = $scope.stream[$scope.calculator.endingDate.key].value;
                unix2 = $scope.date2.getTime() / 1000;
            }
            $scope.date1 = $scope.stream[$scope.calculator.startingDate.key].value;
            unix1 = $scope.date1.getTime() / 1000;
            $scope.diff = Math.ceil((unix2 - unix1) / (60 * 60 * 25));
            console.log($scope.diff);
            if ($scope.diff < 0) {
                $scope.calc1Error = true;
            } else {
                $scope.calc1Error = false;
            }
        };

        $scope.formatString = function(format) {
            var day = parseInt(format.substring(0, 2));
            var month = parseInt(format.substring(3, 5));
            var year = parseInt(format.substring(6, 10));
            var date = new Date(year, month - 1, day);
            return date;
        };

        $scope.pushToEndingDate = function() {

        };

        $scope.printDiv = function(note) {
            var popupWin = window.open('', '_blank', 'width=500,height=500');
            var date = $filter('date')(note.date, "MM/dd/yyyy mm:HH");
            var content = "<br><div style=''><b>On:</b> " + date + "<br> <b>To:</b> " + note.to + "<br> <b>cc: </b>" + note.cc + "<br> <b>bcc:</b> " + note.bcc + "<br><b>Subject:</b>" + note.title + "<br> <b>Content:</b> <br>" + note.content + "</div>";
            popupWin.document.open();
            popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + content + '</body></html>');
            popupWin.document.close();
        };

        $scope.loadlegacy = function(i) {
            console.log(i);
            if (i.created === "")
                return;
            $scope.stream_sort = sortFields(i);
            console.log($scope.legacy, i);
            $scope.isLegacy = true;
        };

        $scope.disableLegacy = function() {
            $scope.stream_sort = sortFields($scope.stream);
            $scope.isLegacy = false;
        };

        $scope.createLegacy = function(i) {
            if (i !== "LEGACY")
                return;
            $scope.loading = true;
            $http.get('/api/streaming/addlegacy/' + $scope.stream._id)
                .then(function(response) {
                    $scope.loading = false;
                    toastr.success('Legacy Created');
                    $scope.stream = response.data;
                    $scope.legacy.push("");
                    $scope.stream_sort = sortFields($scope.stream);
                    for (var k in $scope.stream_sort) {
                        if ($scope.stream_sort[k].id.category !== "Contact") {
                            if ($scope.stream_sort[k].id.type !== "date")
                                $scope.stream_sort[k].value = "";
                            else
                                $scope.stream_sort[k].value = null;
                        }
                    }
                }, function(response) {
                    $scope.loading = false;
                    toastr.error('To Many Legacies');
                });
        };

        $scope.onFile = function(re) {
            console.log(re.file);
            if (!re.file)
                return;
            $scope.note.files.push(re.file);
            $scope.emailAttachment.push(re.file);
        };

        $scope.onFileNote = function(re) {
            console.log(re.file);
            if (!re.file)
                return;
            $scope.editNote.files.push(re.file);
        };

        $scope.onFileNote2 = function(re) {
            console.log(re.file);
            if (!re.file)
                return;
            $scope.newNote.filesShow.push(re.file);
            $scope.newNote.files.push(re.file._id);
        };

        //function for the page
        //$scope.splitFields();
        $scope.updateAllNotes();
        $scope.getFiles();
        $scope.emailExport();
        addFields();
        tickPremissions();
    }
]);