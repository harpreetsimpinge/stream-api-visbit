'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var generator = require('mongoose-gen');

var NoteSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    followUp: {
        type: Date,
        default: ''
    },
    stream: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: '',
        required: true
    },
    title: {
        type: String,
        default: '',
        required: true
    },
    creator: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    _case: {
        type: String,
        default: '',
        ref: 'Stream'
    },
    assign: {
        type: String,
        ref: 'User'
    },
    workface: {
        type: Schema.ObjectId,
        ref: 'Workfaces'
    },
    files: {
        type: [{ type: Schema.ObjectId, ref: 'File' }]
    },
    id: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        default: 'open'
    },
    email_sent: {
        type: Boolean,
        default: false
    },
});



var fieldsSchema = new Schema({
    name: {
        type: String,
        default: '',
        required: true
    },
    type: {
        type: String,
        default: '',
        required: true
    },
    key: {
        type: String,
        ref: 'Note'
    },
    category: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 1
    },
    required: {
        type: Boolean,
        default: false
    },
    sql: {
        type: String
    },
    values: {
        type: [String]
    }

});
var FollowUpSchema = new Schema({
    date: {
        type: Date,
        default: ''
    },
    originalDate: {
        type: Date,
        default: ''
    },
    id: {
        type: String,
        default: '',
        ref: 'Note'
    },
    _case: {
        type: Schema.ObjectId,
        ref: 'Stream'
    },
    creator: {
        type: Schema.ObjectId,
        ref: 'Note'
    },
    status: {
        type: String,
        default: 'open'
    },
    orignal: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    assigned: {
        type: Boolean,
        default: false
    }

});

var searchHistorySchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    params: {
        type: Schema.Types.Mixed
    },
    type: {
        type: String
    }


});

var oldNoteSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    followUp: {
        type: Date,
        default: ''
    },
    stream: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: '',
        required: true
    },
    title: {
        type: String,
        default: '',
        required: true
    },
    creator: {
        type: String,
        default: '',
        ref: 'User'
    },
    _case: {
        type: String,
        default: '',
        ref: 'Stream'
    },
    files: {
        name: {
            type: String,
            default: '',
        },
        url: {
            type: String,
            default: '',
        }
    },
    id: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        default: 'open'
    }
});


mongoose.model('Note', NoteSchema);
mongoose.model('Fields', fieldsSchema);
mongoose.model('FollowUp', FollowUpSchema);
mongoose.model('Search', searchHistorySchema);
mongoose.model('OldNote', oldNoteSchema);


var Fields = mongoose.model('Fields');
var fields = {};
Fields.find().exec(function(error, output) {

    //var fields = output;
    for (var i in output) {
        var type;
        if (typeof output === "object" && output !== null && output[i].key !== "" && output[i].name !== "") {
            if (output[i].type === "date") {
                type = "Date";
                fields[output[i].key] = { id: { "type": "ObjectId", "ref": "Fields", "index": "true" }, value: { "type": type } };
            } else if (output[i].type === "text" || output[i].type === "dropdown") {
                type = "String";
                fields[output[i].key] = { id: { "type": "ObjectId", "ref": "Fields", "index": "true" }, value: { "type": type } };
            }
        }
    }

    //setting the stone fields
    fields.user = { "type": "ObjectId" };
    fields.status = { "type": "String" };
    fields.oldId = { "type": "String" };
    fields.oldCreator = { "type": "String" };
    fields.permissions = [{ "type": "ObjectId", "ref": "User" }];
    fields.legacy = [{ "type": "Mixed" }];
    fields.workface = { "type": "ObjectId", "ref": "Workfaces" };
    fields.price = { "type": "String" };

    var StreamSchema = new mongoose.Schema(generator.convert(fields)); //convert the json to schema

    mongoose.model('Stream', StreamSchema); // register the schema
});