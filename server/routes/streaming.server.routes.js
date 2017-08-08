'use strict';

/**
 * Module dependencies.
 */
var streamingPolicy = require('../policies/streaming.server.policy');
var streaming = require('../controllers/streaming.server.controller');
var note = require('../controllers/note.server.controller');
var fields = require('../controllers/fields.server.controller');
var multer = require('multer');

var storage = multer.memoryStorage();
var file = multer({ storage: storage }).single('newNoteFile');

module.exports = function(app) {

    app.route('/api/streaming/searchhistory').all(streamingPolicy.isAllowed)
        .get(streaming.searchHistory);

    app.route('/api/streaming/sql').all(streamingPolicy.isAllowed)
        .get(streaming.sql);

    app.route('/api/fields/newfields').all(streamingPolicy.isAllowed)
        .post(fields.create);

    app.route('/api/fields/all-fields').all(streamingPolicy.isAllowed)
        .get(fields.list);

    app.route('/api/fields/single-fields/:fieldKey').get(fields.singleField);

    app.route('/api/streaming/note/:noteId').all(streamingPolicy.isAllowed)
        .get(note.list)
        .delete(note.delete);

    app.route('/api/streaming/smart-search').all(streamingPolicy.isAllowed)
        .post(streaming.smartSearch);

    app.route('/api/streaming/noteByUser').all(streamingPolicy.isAllowed)
        .get(note.listByCreator);

    app.route('/api/notes/followup/:start').all(streamingPolicy.isAllowed)
        .get(note.getFollowupForUserPage);

    app.route('/api/notes/oldfiles').all(streamingPolicy.isAllowed)
        .get(note.fileRepalce);

    // Create new note
    app.route('/api/streaming/note').all(streamingPolicy.isAllowed)
        .post(note.create);

    app.route('/api/streaming/search').all(streamingPolicy.isAllowed)
        .post(streaming.list);

    // Streaming collection routes
    app.route('/api/streaming').all(streamingPolicy.isAllowed)
        .get(streaming.list)
        .post(streaming.create);

    app.route('/api/streamingtatus').post(streaming.getStatus);
    app.route('/api/streamingtatusUpdate').post(streaming.updateStatus);

    // Single stream routes
    app.route('/api/streaming/:streamId').all(streamingPolicy.isAllowed)
        .get(streaming.read)
        .put(streaming.update)
        .delete(streaming.delete);

    app.route('/api/streaming/notesById/:datePicker').all(streamingPolicy.isAllowed)
        .get(note.listByDate);

    app.route('/api/notes').all(streamingPolicy.isAllowed)
        .post(note.update);

    app.route('/api/notes/followuppagin/:start').all(streamingPolicy.isAllowed)
        .get(note.followupPaging);

    app.route('/api/notes/followup').all(streamingPolicy.isAllowed)
        .get(note.followup);

    app.route('/api/notes/followup/:followUpId').all(streamingPolicy.isAllowed)
        .get(note.getFollowupForUser)
        .delete(note.deleteFollowUp);

    app.route('/api/notes/followupbydate/:date').all(streamingPolicy.isAllowed)
        .get(note.followupByDate);

    app.route('/api/fields').all(streamingPolicy.isAllowed)
        .post(fields.update);

    app.route('/api/fields/:fieldId').all(streamingPolicy.isAllowed)
        .delete(fields.delete);

    app.route('/api/notes/allFiels/:noteId').all(streamingPolicy.isAllowed).all(file)
        .get(note.allFiles);

    app.route('/api/notes/notefile').all(streamingPolicy.isAllowed).all(file)
        .post(note.addFileToNote);

    app.route('/api/notes/changestatus/:noteId').all(streamingPolicy.isAllowed).all(file)
        .get(note.changeStatus);

    app.route('/api/notes/change_emailsent/:noteId').all(streamingPolicy.isAllowed).all(file)
        .get(note.changeEmailSent);

    app.route('/api/notes/changedate/:noteId/:date').all(streamingPolicy.isAllowed).all(file)
        .get(note.changeDateForFollowUp);

    app.route('/api/streaming/addlegacy/:id').all(streamingPolicy.isAllowed).all(file)
        .get(streaming.createLegacy);

    app.route('/api/streaming/checkclain/:val').all(streamingPolicy.isAllowed).all(file)
        .get(streaming.checkClaim);




    // Finish by binding the stream middleware
    app.param('streamId', streaming.streamByID);


    //app.param('datePicker', note.noteByID);



};