'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    mongoose = require('mongoose'),
    Note = mongoose.model('Note'),
    User = mongoose.model('User'),
    OldNote = mongoose.model('OldNote'),
    FollowUp = mongoose.model('FollowUp'),
    Workface = mongoose.model('Workfaces'),
    File = mongoose.model('File'),
    moment = require('moment'),
    AWS = require('aws-sdk'),
    crypto = require('crypto'),
    multer = require('multer'),
    async = require('async'),
    email = require("emailjs"),
    config = require(path.resolve('./config/config')),
    fs = require("fs"),
    j = require(path.resolve('./modules/streaming/server/controllers/json2.json')),
    dropdoc = require(path.resolve('./modules/library/server/controllers/dropdoc.server.controller')),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

AWS.config.region = 'us-east-1';
AWS.config.update({
    accessKeyId: 'AKIAJX2OHAMRAOLYCXVQ',
    secretAccessKey: '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'
});

var s3 = new AWS.S3();


/**
 * Create a note
 */
exports.create = function(req, res) {
    var isAssign = false;
    var note = new Note(req.body);
    note.creator = req.user._id;
    note.date = new Date(note.date);
    note.date.setUTCHours(12, 0, 0, 0);
    console.log("adding the date : ", note.date);
    note.save(function(err) {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            //console.log(note);
            /*Note.findOne(note).populate('files').exec(function(err, item) {*/

            Note.findOne(note).populate("files").populate("creator").populate({
                path: 'workface',
                populate: {
                    path: 'workstatusid',
                    model: 'Workstatus'
                }
            }).exec(function(err, item) {
                //Attachment
                for (var k in item.files) {
                    File.findOneAndUpdate({ _id: item.files[k]._id }, { case: item._case, note: item._id, type: ["case", "note"] }, { upsert: false }, function(err, doc) {
                        if (err)
                            console.log(err);
                        else {
                            console.log("File updated to note");
                            //console.log(item.files[k]._id);
                            item.files[k]._id = doc;
                            //console.log(doc);
                        }
                    });
                }
                //followup
                if (note.followUp !== null) {
                    var followDate = new Date(note.followUp);
                    followDate.setUTCHours(12, 0, 0, 0);
                    var assign;

                    if (note.assign) {

                        assign = note.assign;
                        isAssign = true;
                        User.findOne({ _id: assign }, function(err, doc) {

                            var content = "<h1><b>You have a new assignment</b></h1><br> <b>Title:</b> " + note.title + "<br><br><b>Date:</b> " + note.followUp + "<br><br><b>Content:</b>" + note.content + "<br><br>";
                            var emailServer = email.server.connect({
                                user: req.user.email,
                                password: req.user.emailPassword,
                                host: "gator2004.hostgator.com",
                                ssl: true
                            });
                            emailServer.send({
                                from: req.user.displayName + " <" + req.user.email + ">",
                                to: doc.email,
                                subject: "New Followup Assignment from " + doc.firstName + " " + doc.lastName,
                                attachment: [
                                    { data: content, alternative: true }
                                ]

                            }, function(err, message) {
                                console.log(err || message);
                                if (!err) {} else {
                                    console.log("email fails");
                                }
                            });

                        });
                    } else {
                        assign = req.user._id;
                    }

                    var follow = new FollowUp({
                        date: followDate,
                        originalDate: followDate,
                        id: item._id,
                        _case: item._case,
                        creator: assign,
                        original: req.user._id,
                        assigned: isAssign
                    });
                    follow.save(function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            res.json(item);
                        }
                    });
                } else {
                    res.json(item);
                }
            });
        }
    });
};

/**
 * Show the current note
 */
exports.read = function(req, res) {
    var query = Note.find();
    query.where("_case").equals(req.user._id).sort('-date').populate('user', 'displayName').exec(function(err, streaming) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(streaming);
        }
    });
};


/**
 * Update a note
 */
exports.update = function(req, res) {



    var Stream = mongoose.model('Stream');
    var xnote = Note.findOne({ _id: req.body._id }).exec(function(err, nres) {
        //console.log("note", res);
        if (nres.workface != undefined) {
            var oldWorkFace = Workface.findOne({ _id: nres.workface }).exec(function(error, oldworkface) {
                var oldPrice = oldworkface.price;
                var newWorkFace = Workface.findOne({ _id: req.body.workface }).exec(function(error, newworkface) {
                    var newprice = newworkface.price;
                    var nStream = Stream.findOne({ _id: nres.stream }).exec(function(error2, stream) {
                        if (stream != undefined && stream.price != undefined) {
                            var aprice = stream.price - parseInt(oldPrice) + parseInt(newprice);
                            Stream.where({ _id: stream._id }).update({ $set: { "price": aprice } }).exec(function(er, resp) {
                                console.log(er, resp);
                            });
                        }
                    });

                });
            });
        }
    });


    var xnote = Note.findOne({ _id: req.body._id }).update({ $set: { "workface": req.body.workface } }).exec(function(err, nres) {

    });

    Note.update({ _id: req.body._id }, req.body, function(err, doc) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (req.body.type == "closing") {
                Note.findOne({
                    _id: req.body._id
                }, function(err, user) {
                    if (err) {
                        return done(err);
                    }



                    mongoose.connection.db.collection('streaming').findOneAndUpdate({ "_id": user.stream }, { $set: { "DateClosedFocusInformation": "date" } });

                    var MongoClient = require('mongodb').MongoClient,
                        format = require('util').format;

                    MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
                        if (err) throw err;
                        db.collection('streaming').findAndModify({ _id: "5845fc4d7caa400f00604fc7" }, // query
                            { $set: { "DateClosedFocusInformation.value": "2017-5-11" } }, { update: true },
                            function(err, object) {
                                if (err) {
                                    res.status(200).json(err.message);
                                } else {
                                    console.dir(object);
                                    res.status(200).json(object);
                                }
                            });
                    });
                });
            } else {
                res.status(200).json("else");
            }

        }
    });

};

/**
 * Delete an note
 */
exports.delete = function(req, fres) {

    var Stream = mongoose.model('Stream');
    var xnote = Note.findOne({ _id: req.params.noteId }).exec(function(err, res) {

        if (res.workface != undefined && res.stream != undefined && res.stream != '') {
            var nWorkFace = Workface.findOne({ _id: res.workface }).exec(function(error, workface) {
                var nStream = Stream.findOne({ _id: res.stream }).exec(function(error2, stream) {
                    var aprice = stream.price - parseInt(workface.price)
                    Stream.where({ _id: stream._id }).update({ $set: { "price": aprice } }).exec(function(er, resp) {
                        console.log(er, resp);

                        //now delete
                        var query = Note.find({ _id: req.params.noteId });
                        query.remove(function(err) {
                            if (err) {
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(err)
                                });
                            } else {
                                fres.json("OK");
                            }
                        });

                    });
                });

            });
        } else {
            //now delete
            var query = Note.find({ _id: req.params.noteId });
            query.remove(function(err) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    fres.json("OK");
                }
            });
        }
    });
};

/**
 * List of Notes after today
 */
exports.list = function(req, res) {

    //get Stream medical status

    var Stream = mongoose.model('Stream');
    var query = Note.find();
    var d1 = new Date(new Date().setUTCHours(12, 0, 0, 0));
    var d2 = new Date(new Date().setUTCHours(12, 0, 0, 0));
    d1.setDate(d2.getDate() - 1);
    //query.where('date').gte(d1);
    //query.where("date").gte(new Date().setUTCHours(12,0,0,0));
    query.where("_case").equals(req.params.noteId);
    //query.populate("files creator workface");
    query.populate("files").populate("creator");
    query.populate({
        path: 'workface',
        populate: {
            path: 'workstatusid',
            model: 'Workstatus'
        }
    });
    query.sort('-created').exec(function(err, notes) {
        if (err) {
            console.log(err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            /* var cck = [];
            for(var nk in notes){ 
            	if(typeof notes[nk].stream != "undefined"){
            		Stream.findOne({_id: notes[nk].stream}).exec(function (error2, streamData) {			
            			if(typeof streamData.StatusFocusInformation.value != "undefined"){
            				console.log(streamData.StatusFocusInformation.value)
            				cck.push(streamData.StatusFocusInformation.value);
            			}
            		});				
            	}
            }
            console.log("=======notes============="+cck); */
            res.json(notes);
        }
    });
};

exports.followup = function(req, res) {
    var query = FollowUp.find();
    //query.where("date").gte(new Date().setUTCHours(12,0,0,0));
    query.where("creator").equals(req.user._id);
    query.populate('_case');
    query.populate('id');
    var options = {
        path: 'id.files',
        model: 'File'
    };

    query.exec(function(err, notes_) {
        if (err) {
            console.log(err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            FollowUp.populate(notes_, options, function(err, notes) {
                res.json(notes);
            });
        }
    });
};

exports.followupPaging = function(req, res) {
    var limit = 150;
    var query = FollowUp.find();
    //query.where("date").gte(new Date().setUTCHours(12,0,0,0));
    query.where("creator").equals(req.user._id);
    query.populate('_case');
    query.populate('id');
    query.skip(req.params.start * limit);
    query.limit(limit);
    query.sort('date');
    var options = {
        path: 'id.files',
        model: 'File'
    };

    query.exec(function(err, notes_) {
        if (err) {
            console.log(err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            FollowUp.populate(notes_, options, function(err, notes) {
                var more = false;
                if (notes.length > 0)
                    more = true;
                var re = {
                    items: notes,
                    more: more,
                    currentUser: req.user._id
                };
                res.send(re);
            });


        }
    });
};




exports.followupByDate = function(req, res) {
    var date = new Date(req.params.date);
    date.setUTCHours(12, 0, 0, 0);
    var query = FollowUp.find();
    query.where("date").equals(date);
    query.populate('_case');
    query.populate('id').exec(function(err, notes) {
        if (err) {
            console.log(err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(notes);
        }
    });
};

/**
 * List of Notes By User
 */
exports.listByDate = function(req, res) {
    var date = new Date(req.params.datePicker);
    date.setUTCHours(12, 0, 0, 0);
    var query = Note.find();
    console.log(date);
    query.where("creator").equals(req.user._id);
    query.where("date").equals(date);
    query.populate('creator files');
    query.populate('_case').sort('-created').exec(function(err, notes) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(notes);
        }
    });
};

/**
 * List of Notes By Creator
 */
exports.listByCreator = function(req, res) {
    var query = Note.find();
    //var lastMonth = moment().subtract(1,'month');
    var lastMonth = new Date();
    var allYear = new Date();

    allYear.setFullYear(allYear.getFullYear() + 1);
    lastMonth.setDate(lastMonth.getDate() - 31);

    console.log(lastMonth + " " + allYear);

    query.where("creator").equals(req.user._id);
    query.where("date").gte(lastMonth);
    query.where("date").lte(allYear);

    query.sort('-created').populate('creator files').exec(function(err, notes) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(notes);
        }
    });
};
/**
 * Note middleware
 */
exports.noteByID = function(req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Note is invalid'
        });
    }

    Note.findById(id).populate('user', 'displayName', 'files').exec(function(err, note) {
        if (err) {
            return next(err);
        } else if (!note) {
            return res.status(404).send({
                message: 'No note with that identifier has been found'
            });
        }
        req.note = note;
        next();
    });
};

/**
 * Add File to Note
 */
exports.addFileToNote = function(req, res) {

    var file = req.file;
    var date = new Date();
    var randomName = date.getTime().toString() + crypto.randomBytes(10).toString('hex') + file.originalname;
    //console.log(randomName);
    // build file name
    var key = req.user._id + '/' + randomName;
    var params = { Bucket: 'focusdev', Key: key, Body: file.buffer, ACL: 'public-read' };
    s3.upload(params, function(err, data) {
        if (err) {
            console.log('s3 original');
            console.log(err);
            return;
        }
        data.name = file.originalname;
        res.json(data);

    });
};

exports.allFiles = function(req, res) {


};

exports.deleteFollowUp = function(req, res) {
    var query = FollowUp.find({ _id: req.params.followUpId });
    query.remove(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json("OK");
        }
    });
};

exports.getFollowupForUser = function(req, res) {
    var query = FollowUp.find();
    //query.where("date").gte(new Date().setUTCHours(12,0,0,0));
    query.where("_case").equals(req.params.followUpId);
    query.populate('id').exec(function(err, notes) {
        if (err) {
            console.log(err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(notes);
        }
    });
};

exports.getFollowupForUserPage = function(req, res) {
    var skip = 10;
    var query = FollowUp.find();
    //query.where("date").gte(new Date().setUTCHours(12,0,0,0));
    // query.skip(req.params.start * skip);
    query.where("_case").equals(req.params.followUpId);
    query.populate('id').exec(function(err, notes) {
        console.log(notes);
        if (err) {
            console.log(err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            var more = false;
            if (notes.lenght > 0)
                more = true;
            var re = {
                items: notes,
                more: more
            }
            res.json(re);
        }
    });
};

exports.changeStatus = function(req, res) {
    //console.log(req.params.noteId + "hello cook");
    var query = Note.findOne();
    query.where("_id").equals(req.params.noteId);
    query.exec(function(err, note) {
        if (err) {

        } else {
            if (note !== null) {
                var note_ = note;

                if (note.status === "open") {
                    note_.status = "close";
                } else {
                    note_.status = "open";
                }

                note_.save(function(err) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        res.json(note_);
                        return;
                    }
                });

                FollowUp.update({ id: note._id }, { $set: { status: note_.status } }, function(err, change) {
                    console.log(err, change);
                });



            } else {
                var query2 = FollowUp.findOne();
                query2.where("_id").equals(req.params.noteId);

                query2.exec(function(err, followup) {

                    if (err) {
                        console.log(err);
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        var query = Note.findOne();
                        query.where("_id").equals(followup.id);
                        query.exec(function(err, notes) {
                            if (err) {
                                return false;
                            }

                            var notes_ = notes;

                            if (notes.status === "open") {
                                notes_.status = "close";
                            } else {
                                notes_.status = "open";
                            }

                            notes_.save(function(err) {
                                if (err) {
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(err)
                                    });
                                }
                            });
                        });

                        if (followup === null) {
                            res.json("fail");
                            return;
                        }
                        var followup_ = followup;
                        if (followup.status === "open") {
                            followup_.status = "close";
                        } else {
                            followup_.status = "open";
                        }

                        followup_.save(function(err) {
                            if (err) {
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(err)
                                });
                            } else {
                                res.json(followup_);
                            }
                        });
                    }
                });
            }
        }
    });
};

exports.changeEmailSent = function(req, res) {
    var query = Note.findOne();
    query.where("_id").equals(req.params.noteId);
    query.exec(function(err, note) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (note !== null) {
                var note_ = note;
                if (note.email_sent === true) {
                    note_.email_sent = false;
                } else {
                    note_.email_sent = true;
                }

                note_.save(function(err) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        res.json(note_);
                        return;
                    }
                });
            } else {
                return res.status(400).send({
                    message: 'Note not found'
                });
            }
        }
    });
};

/* this code pushs all the followups to the next day*/
var cron = require('node-schedule');
var rule = new cron.RecurrenceRule();
rule.second = 0;
rule.hour = 4;
rule.minute = 0;
cron.scheduleJob(rule, function() {
    console.log(new Date(), 'The 30th second of the minute.');
    pushFollowUps();
});

function pushFollowUps() {
    console.log("Update all the old follow ups");

    var query = FollowUp.find();
    query.update({ date: { $lte: new Date() } }, { date: new Date().setUTCHours(12, 0, 0, 0) }, { multi: true },
        function(err, num) {
            console.log(num);
        }
    );

};

exports.changeDateForFollowUp = function(req, res) {
    console.log(req.params.noteId, req.params.date);
    var query = FollowUp.find();
    query.update({ _id: req.params.noteId }, { date: new Date(req.params.date).setUTCHours(12, 0, 0, 0) }, { multi: false },
        function(err, num) {
            console.log(num);
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.json(num);
            }
        }
    );
};


//filter the notes
//for each note:
//create array with all the files
//insert the files
//collect their id
//find the note
//replace with the list
//callback
exports.fileRepalce = function(req, res) {
    res.json("ok");
    replaceFileType2(j)
        //replaceFile(j);
};

function replaceFile(notes) {
    //filter the notes
    var arr = [];
    for (var k in notes) {
        if (notes[k].files[0].url)
            arr.push(notes[k]);
    }
    console.log(arr.length);
    //for each note in the list
    async.eachSeries(arr, function(file, callback) {
        var list = [];
        //each file in the note
        for (var k in file.files) {
            var set = file.files[k];

            var url = set.url;

            if (set.url === "")
                url = set.url.Location;
            //create the file
            var newFile = {
                originalName: set.name,
                key: "",
                url: url,
                user: file.creator,
                LastModify: new Date(),
                type: [
                    "general"
                ],
                permissoins: "open",
                followup: "",
                date: new Date(),
                note: file._id.$oid,
                case: file.case
            };
            list.push(newFile);
        }

        //document the files
        var idList = [];
        var listL = list.length;
        for (var i in list) {

            dropdoc.documentFile(list[i], function(doc) {
                if (doc._id) {
                    idList.push(doc._id);
                    if (idList.length === listL) {
                        updateNote();
                    }
                }
            });
        }
        callback();

        function updateNote() {
            Note.findByIdAndUpdate(file._id.$oid, { files: idList }, { new: false }, function(err, finalNote) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(finalNote);
                    console.log("change for id : " + file._id.$oid);
                }
                //console.log(finalNote);
                callback();
            });
        }
    }, function(err) {
        console.log("done");
    });
}

function replaceFileType2(arr) {
    async.eachSeries(arr, function(file, callback) {
        Note.findByIdAndUpdate(file._id.$oid, { files: [] }, { new: false }, function(err, finalNote) {
            if (err) {
                console.log(err);
            } else {
                //console.log(finalNote);
                console.log("change for id : " + file._id.$oid);
            }
            //console.log(finalNote);
            callback();
        });
    });
}