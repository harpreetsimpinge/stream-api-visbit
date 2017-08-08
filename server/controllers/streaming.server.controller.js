'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    mongoose = require('mongoose'),
    //Stream = mongoose.model('Stream'),
    Note = mongoose.model('Note'),
    Fields = mongoose.model('Fields'),
    User = mongoose.model('User'),
    Search = mongoose.model('Search'),
    File = mongoose.model('File'),
    Stream = require('./../models/stream.server.model.js'),
    XLSX = require('xlsx'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/*
 var workbook = XLSX.readFile('/home/barak/mean.js/meanjs/modules/exports/server/controllers/CONTACT.xlsx');
 var first_sheet_name = workbook.SheetNames[0];
 var worksheet = workbook.Sheets[first_sheet_name];
 var js = XLSX.utils.sheet_to_json(worksheet);
 */

var fields;
Fields.find().exec(function(error, output) { fields = output; });
/**
 * Create a stream
 */
exports.create = function(req, res) {
    var Stream = mongoose.model('Stream');
    var data = {};
    for (var i in req.body.data) {
        //if (!req.body[i].hasOwnProperty('undefined'))
        //req.body[i].undefined = " ";
        data[req.body.data[i].key] = { value: req.body.data[i].value, id: req.body.data[i].id };
    }

    var stream = new Stream(data);
    stream.user = req.user;
    stream.status = "open";
    stream.permissions = req.body.permissions;
    //console.log(stream);
    stream.save(function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(stream);
        }
    });
};

exports.getStatus = function(req, res) {
    var Stream = mongoose.model('Stream');

    Stream.findOne({ _id: req.body.streamId }, function(err, doc) {
        if (err) {
            res.send(500, { error: err });
            return;
        } else {
            res.status(200).json(doc);
        }
    });
};

exports.updateStatus = function(req, res) {
    var Stream = mongoose.model('Stream');
    Stream.update({ _id: req.body.streamId }, req.body, { upsert: false }, function(err, doc) {
        if (err) {
            res.send(500, { error: err });
            return;
        } else {
            res.status(200).json(doc);
        }
    });
};

/**
 * Show the current stream
 */
exports.read = function(req, res) {
    res.status(200).json(req.stream);
};

/**
 * Update a stream
 */
exports.update = function(req, res) {
    var Stream = mongoose.model('Stream');
    //console.log(req.body.permissions);
    Stream.update({ _id: req.body._id }, req.body, { upsert: false }, function(err, doc) {
        console.log(err, doc);
        if (err) {
            res.send(500, { error: err });
        } else {
            res.status(200).json("OK");
        }
    });

};

/**
 * Delete an stream
 */
exports.delete = function(req, res) {
    var Stream = mongoose.model('Stream');
    var stream = req.stream;
    Stream.remove({ _id: stream._id }, function(err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(stream);
        }
    });
};

/**
 * List of Streams
 */
exports.list = function(req, res) {
    documentSearch(req.body, "normal", req.user._id);
    var Stream = mongoose.model('Stream');
    //var selectedFields = "FirstnameContact LastnameContact  ClaimContact";
    var query = Stream.find();
    for (var k in req.body) {

        if (req.body[k].type === "text")
            query.where(k + '.value').equals(new RegExp(req.body[k].value, 'i'));
        if (req.body[k].type === "date") {
            var d1 = new Date(req.body[k].value);
            var d2 = new Date(req.body[k].value);
            d2.setDate(d2.getDate() + 1);
            query.where(k + '.value').gte(d1).lte(d2);
        }
    }

    var orArr = [];
    if (req.body.closed === "open") {
        var d1 = new Date(new Date(1969, 1, 1));
        var d2 = new Date(new Date(1970, 1, 2));
        orArr.push({
            $or: [{ 'DateClosedFocusInformation.value': null }, { 'DateClosedFocusInformation.value': { $gte: d1, $lte: d2 } }]
        });

    } else if (req.body.closed === "closed") {
        orArr.push({
            $or: [{ 'DateClosedFocusInformation.value': { $gte: new Date(1970, 1, 1) } }]
        });
    }

    for (var i in fields) {
        var populate = fields[i].key + ".id";
        query.populate(populate);
    }

    if (req.user.roles.indexOf("admin") === -1 && req.user.roles.indexOf("admin2") === -1) {
        orArr.push({
            $or: [{ permissions: req.user._id }, { user: req.user._id }]
        });

    }

    // @ Search Assign case to user
    var newStreamArray = [];
    // if(req.user.roles[0] === 'user') {
    //     Note.find({'assign': req.user._id}).exec(function (errs, noteResponse) {
    //
    //         for(var linkedStreams in noteResponse) {
    //             Stream.find({'_id': noteResponse[linkedStreaming].stream}).lean()
    //                 .limit(1000)
    //                 .exec(function (err, allstreaming) {
    //                     for(var i in allstreaming) {
    //                         newStreamArray.push(allstreaming[i]);
    //                     }
    //                 });
    //         }
    //     });
    // }

    if (req.user.roles[0] === 'user') {
        Stream.find({ 'user': req.user._id }).lean()
            .limit(1000)
            .exec(function(err, allstreaming) {
                for (var i in allstreaming) {
                    newStreamArray.push(allstreaming[i]);
                }
            });
    }

    if (orArr.length !== 0) {
        query.and(orArr);
    }
    //console.log(orArr);

    query.populate('permissions', 'displayName _id');

    query
    //.select(selectedFields)
    //.sort('-created')
        .lean()
        .limit(1000)
        .exec(function(err, streaming) {
            if (err) {
                //console.log(err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                if (newStreamArray.length > 0) {
                    res.json(newStreamArray);
                } else {
                    res.json(streaming);
                }

            }
        });
};

/**
 * Stream middleware
 */
exports.streamByID = function(req, res, next, id) {
    var Stream = mongoose.model('Stream');
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send({
            message: 'Stream is invalid'
        });
    }
    var query = Stream.findOne();
    query.where("_id").equals(id);
    query.select('-legacy');

    for (var i in fields) {
        var populate = fields[i].key + ".id";
        query.populate(populate);
    }
    query.lean().exec(function(err, stream) {
        if (err) {
            return next(err);
        } else if (!stream) {
            return res.status(404).send({
                message: 'No stream with that identifier has been found'
            });
        }
        req.stream = stream;
        next();
    });

};

exports.smartSearch = function(req, res) {
    var Stream = mongoose.model('Stream');
    var query = Stream.find();
    var smartList = req.body;


    for (var k in smartList) {
        var field = smartList[k].field;
        var value = smartList[k].text;
        if (field === "closed") {
            //console.log(smartList[k]);
            if (value === "open") {
                query.where('DateClosedFocusInformation.value').lte(new Date(1970, 1, 2));
                query.where('DateClosedFocusInformation.value').equals("");
            } else if (value === "closed") {
                query.where('DateClosedFocusInformation.value').lte(new Date());
            }
            continue;
        }

        var re = new RegExp(value, 'i');
        if (smartList[k].type === "text" || smartList[k].type === "dropdown") {
            if (smartList[k].option === "contains")
                query.where(field + '.value').equals(new RegExp(value, 'i'));
            else if (smartList[k].option === "starting")
                query.where(field + '.value').equals(new RegExp("^" + value, "i"));
            else if (smartList[k].option === "not")
                query.where(field + '.value').ne(value);
            else if (smartList[k].option === "exact")
                query.where(field + '.value').equals(new RegExp("^" + value + "$", "i"));
        } else if (smartList[k].type === "date") {
            //query.where(field).equals(value);
            if (smartList[k].option !== "range") {
                var date = new Date(value);
                date.setUTCHours(12, 0, 0, 0);

                if (smartList[k].option === "earlier") {
                    query.where(field + '.value').lt(date);
                    query.where(field + '.value').ne(null);
                    query.where(field + '.value').ne("");
                    query.where(field + '.value').ne(" ");
                } else if (smartList[k].option === "exactly") {
                    var d1 = new Date(value);
                    var d2 = new Date(value);
                    d2.setDate(d2.getDate() + 1);
                    //console.log(d1,d2);
                    query.where(field + '.value').gte(d1).lte(d2);
                } else if (smartList[k].option === "later") {
                    console.log(field + '.value' + " - later than " + date.toISOString());
                    query.where(field + '.value').gt(date.toISOString());
                }
            } else if (smartList[k].option === "range") {
                var start_date = new Date(value.startDate);
                start_date.setUTCHours(12, 0, 0, 0);
                var end_date = new Date(value.endDate);
                end_date.setUTCHours(12, 0, 0, 0);
                //console.log(end_date , " " , start_date);
                query.where(field + '.value').gt(start_date).lt(end_date);
            }
        }
    }
    for (var i in fields) {
        var populate = fields[i].key + ".id";
        query.populate(populate);
    }

    if (req.user.roles.indexOf("admin") === -1 && req.user.roles.indexOf("admin2") === -1) {
        //query.where("user").equals(req.user._id);
        //query.where("permissions").equals(req.user._id);
        query.or([{ permissions: req.user._id }, { user: req.user._id }]);
    }

    query.sort('-created')
        .lean()
        //.limit(1000)
        .exec(function(err, streaming) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                ////console.log(streaming);

                res.json(streaming);
            }
        });

};



exports.sql = function(req, res) {

    res.json("ok");
    //start(1);
};

function documentSearch(data, type, user) {
    var obj = {};
    obj.type = type;
    obj.user = user;
    obj.params = data;
    var search = new Search(obj);
    search.save(function(err, doc) {
        if (err) {
            //console.log(err);
        } else {
            //console.log(doc);
        }
    });
}

exports.searchHistory = function(req, res) {
    Search.find({ user: req.user._id }).limit(10).sort({ date: -1 }).exec(function(err, list) {
        if (err) {
            //console.log(err);
            res.json(err);
        } else {
            res.json(list);
        }
    });

};
exports.createLegacy = function(req, res) {
    var Stream = mongoose.model('Stream');
    var query = Stream.findOne();
    var streamRe = {};
    query.select('-premissions');
    query.where("_id").equals(req.params.id);
    for (var i in fields) {
        var populate = fields[i].key + ".id";
        query.populate(populate);
    }
    query.exec(function(err, doc) {
        if (doc.legacy && doc.legacy.length > 3)
            return res.status(400).json("to many legacies");
        var old = JSON.parse(JSON.stringify(doc));
        old.created = new Date();
        for (var k in old) {
            if (old[k].hasOwnProperty("id") && old[k].id.hasOwnProperty("_id")) {
                //old[k].id = old[k].id._id;
            }
        }
        for (var k in doc) {
            if (typeof doc[k] === 'object' && doc[k].hasOwnProperty("id") && typeof doc[k].id === 'object') {
                if (doc[k].id.category !== "Contact") {
                    doc[k].value = "";
                }
                //doc[k].id = doc[k].id._id;
            }
        }
        Note.update({ "stream": doc._id }, { $set: { status: 'legacy' } }, function(err, update) {
            console.log(err, update);
        });
        //console.log("doc legacy: " , doc.legacy);
        if (!doc.legacy)
            doc.legacy = [];
        doc.legacy.push(old);
        ////console.log(doc._id);
        doc.save({ "upsert": false }, function(err, re) {
            console.log(err);
            res.json(doc);
        });
        ////console.log(doc);
    });
};

exports.checkClaim = function(req, res) {
    //updateCompany();
    //findExtra();
    var Stream = mongoose.model('Stream');
    Stream.where("ClaimContact.value").equals(req.params.val).find(function(err, re) {
        console.log(err, re.length);
        if (re.length === 0)
            res.json(true);
        else
            res.status(200).json(false);
    });

};

function findExtra() {
    var arr = [""];
    var Stream = mongoose.model('Stream');
    var query = Stream.find();
    /*query.where("CompanyNameClaimsRepresentative.value").ne("American Claims Management");
     query.where("CompanyNameClaimsRepresentative.value").ne("Berkshire Hathaway Home State Companies");
     query.where("CompanyNameClaimsRepresentative.value").ne("Cyprus insurance company");
     query.where("CompanyNameClaimsRepresentative.value").ne("Department of Motor Vehicles");
     query.where("CompanyNameClaimsRepresentative.value").ne("Eastridge");
     query.where("CompanyNameClaimsRepresentative.value").ne("Gallagher Bassett Services");
     query.where("CompanyNameClaimsRepresentative.value").ne("Insurance Company of the West (ICW)");
     query.where("CompanyNameClaimsRepresentative.value").ne("Metropolitan Transit System");
     query.where("CompanyNameClaimsRepresentative.value").ne("San Diego Housing Commission");
     query.where("CompanyNameClaimsRepresentative.value").ne("SDUSD-Safety Program");
     query.where("CompanyNameClaimsRepresentative.value").ne("Sedgwick Claims Management Services, Inc.");
     query.where("CompanyNameClaimsRepresentative.value").ne("Sentry Insurance");
     query.where("CompanyNameClaimsRepresentative.value").ne("Windham injury Management Group Incorporated");
     query.where("CompanyNameClaimsRepresentative.value").ne("Zenith insurance company");
     query.where("CompanyNameClaimsRepresentative.value").ne(" ");*/
    query.lean().exec(function(err, doc) {
        console.log(err, doc.length);
        for (var k in doc) {
            if (Number(k) % 100 === 0)
                console.log(k, arr.length);
            var find = true;
            //console.log(doc[k].CompanyNameClaimsRepresentative.value);
            var val = doc[k].CompanyNameClaimsRepresentative.value;
            for (var i in arr) {
                //console.log(arr[i], val);
                if (arr[i] === val) {
                    find = false;
                }
            }
            if (find) {
                arr.push(val);
            }
        }

        console.log(arr.length);
        for (var k in arr) {
            console.log(arr[k]);
        }
    });

}

function updateCompany() {
    var Stream = mongoose.model('Stream');
    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Advantage' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage Work Comp' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage Work Comp Services' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage Work Compensation' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage Workcomp' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage Workcomp Services' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage WorkComp Services' },
            { 'CompanyNameClaimsRepresentative.value': 'Advantage Workcomp Services, Inc.' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Advantage WorkComp Services" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'ACM Management' },
            { 'CompanyNameClaimsRepresentative.value': 'ACM' },
            { 'CompanyNameClaimsRepresentative.value': 'American Claims Management' }

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "American Claims Management" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'Ametek' },

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Ametek" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Berkshire Hathaway Home State Companies' },
            { 'CompanyNameClaimsRepresentative.value': 'Natinal Liability and Fire Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'National Liability and Fire Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'National Liability and Fire Insurance Compnay' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Insurance Co.' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Insurance Comany' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Insurance Compnay' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Insurance Compwest' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Insurnace Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Cypress Inusrance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Oak River Insurance Comapny' },
            { 'CompanyNameClaimsRepresentative.value': 'Redwood Fire & Casualty Insurance' },
            { 'CompanyNameClaimsRepresentative.value': 'Redwood Fire & Casualty Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Redwood Fire and Casuaty Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Redwood Fire and Casulaty Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'RedwoodFire and Casualty Insurance Company' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Berkshire Hathaway Homestate" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'Beta Healthcare' },
            { 'CompanyNameClaimsRepresentative.value': 'Beta Healthcare Group' },
            { 'CompanyNameClaimsRepresentative.value': 'BOE' },
            { 'CompanyNameClaimsRepresentative.value': 'Brady Corporation' },
            { 'CompanyNameClaimsRepresentative.value': 'California Compensation Co.' },
            { 'CompanyNameClaimsRepresentative.value': 'Caltrans' },
            { 'CompanyNameClaimsRepresentative.value': 'City of IB' },
            { 'CompanyNameClaimsRepresentative.value': 'City of Imperial Beach' },
            { 'CompanyNameClaimsRepresentative.value': 'City of Oceanside' },
            { 'CompanyNameClaimsRepresentative.value': 'City Of Oceanside' },
            { 'CompanyNameClaimsRepresentative.value': 'Cryobank' },
            { 'CompanyNameClaimsRepresentative.value': 'Department of Financial Institution' },
            { 'CompanyNameClaimsRepresentative.value': 'Department of Motor Vehicles' },
            { 'CompanyNameClaimsRepresentative.value': 'Gab Robbins' },
            { 'CompanyNameClaimsRepresentative.value': 'GAB Robbins' },
            { 'CompanyNameClaimsRepresentative.value': 'GAB Robins' },
            { 'CompanyNameClaimsRepresentative.value': 'Intercare Holdings' },
            { 'CompanyNameClaimsRepresentative.value': 'Keystone Medical Resources, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'Management Trsust-Transpacific' },
            { 'CompanyNameClaimsRepresentative.value': 'Management Trust-Transpacific' },
            { 'CompanyNameClaimsRepresentative.value': 'Midinsights' },
            { 'CompanyNameClaimsRepresentative.value': 'Ms. Kim Minick' },
            { 'CompanyNameClaimsRepresentative.value': 'North County Transit' },
            { 'CompanyNameClaimsRepresentative.value': 'Orange County Public Works/Procurement Services' },
            { 'CompanyNameClaimsRepresentative.value': 'Other' },
            { 'CompanyNameClaimsRepresentative.value': 'Pacific Compensation' },
            { 'CompanyNameClaimsRepresentative.value': 'Port of San Diego' },
            { 'CompanyNameClaimsRepresentative.value': 'Risk Enterprise Management, LTD' },
            { 'CompanyNameClaimsRepresentative.value': 'Saddleback' },
            { 'CompanyNameClaimsRepresentative.value': 'San Diego Housing Commission' },
            { 'CompanyNameClaimsRepresentative.value': 'SAX Insurance Agency' },
            { 'CompanyNameClaimsRepresentative.value': 'SCRMA' },
            { 'CompanyNameClaimsRepresentative.value': 'Starwood Hotels' },
            { 'CompanyNameClaimsRepresentative.value': 'Univision' },
            { 'CompanyNameClaimsRepresentative.value': 'ZURICH' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Other" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'ICS' },
            { 'CompanyNameClaimsRepresentative.value': 'Innovative Claim Solutions' },
            { 'CompanyNameClaimsRepresentative.value': 'Innovative Claim Solutions (ICS)' },
            { 'CompanyNameClaimsRepresentative.value': 'Innovative Claims Solutions' },
            { 'CompanyNameClaimsRepresentative.value': 'Innovative Claims Solutions (ICS)' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Innovative Claim Solutions" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'Insurance Company of the West (ICW)' },

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Insurance Company of the West " } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'NASSCO' },
            { 'CompanyNameClaimsRepresentative.value': 'Nassco' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "NASSCO" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Pinnacle' },
            { 'CompanyNameClaimsRepresentative.value': 'Pinnacle RMS' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Pinnacle RMS" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'SDUSD - Safety Program' },
            { 'CompanyNameClaimsRepresentative.value': 'SDUSD-Safety Program' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "SDUSD - Safety Program" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Broadspire' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Broadspire " } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'Compwest Insurance' },
            { 'CompanyNameClaimsRepresentative.value': 'Compwest insurance' },
            { 'CompanyNameClaimsRepresentative.value': 'Compwest Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Compwest Inusrance' },
            { 'CompanyNameClaimsRepresentative.value': 'Compwset Insurance' },

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Compwest Insurance" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Corvel' },
            { 'CompanyNameClaimsRepresentative.value': 'Corvel Corp' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Corvel Corp" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Eastridge' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Eastridge" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Employers Direct Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Employers Direct Insurance' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Employers Direct Insurance Co" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Gallagher Basset' },
            { 'CompanyNameClaimsRepresentative.value': 'Gallagher Bassett Services' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Gallagher Bassett Services" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Keenan & Associates' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Keenan & Associates" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Metropolitan Transit System' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Metropolitan Transit System" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Sedgwick Claims Management Services' },
            { 'CompanyNameClaimsRepresentative.value': 'Sedgwick Claims Management Services, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'Sedwick' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Sedgwick Claims Management Services" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'Sentry Insurance' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Sentry Insurance" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'SCIF' },
            { 'CompanyNameClaimsRepresentative.value': 'scif' },
            { 'CompanyNameClaimsRepresentative.value': 'State Fund' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "State Compensation Insurance Fund" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////



    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'The Hartford' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "The Hartford" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [
            { 'CompanyNameClaimsRepresentative.value': 'TRISTAR' },
            { 'CompanyNameClaimsRepresentative.value': 'Tristar' },


        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "TRISTAR" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'Windham injury Management Group Incorporated' },
            { 'CompanyNameClaimsRepresentative.value': 'Windham Injury Management Group, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'Windham Group' },

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Windham Injury Management Group, Inc." } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'York' },
            { 'CompanyNameClaimsRepresentative.value': 'York Insurance' },
            { 'CompanyNameClaimsRepresentative.value': 'York Insurance Services Group' },
            { 'CompanyNameClaimsRepresentative.value': 'York Insurance Services Group Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'York Insurance Services Group, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'York Insurance Sevices Group, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'York Insurance Srevices Group, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'York Risk Services' },
            { 'CompanyNameClaimsRepresentative.value': 'York Risk Services Group' },
            { 'CompanyNameClaimsRepresentative.value': 'York RIsk Services Group' },
            { 'CompanyNameClaimsRepresentative.value': 'York Risk Sevices Group' },
            { 'CompanyNameClaimsRepresentative.value': 'York RSG' },
            { 'CompanyNameClaimsRepresentative.value': 'Yorks Insurance Services Group, Inc.' },
            { 'CompanyNameClaimsRepresentative.value': 'Yorjk Insurance Services Group, Inc.' },

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "York Risk Services Group" } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////
    Stream.update({
        $or: [

            { 'CompanyNameClaimsRepresentative.value': 'Zenith' },
            { 'CompanyNameClaimsRepresentative.value': 'Zenith Insurance Company' },
            { 'CompanyNameClaimsRepresentative.value': 'Zenith insurance company' },

        ]
    }, { $set: { 'CompanyNameClaimsRepresentative.value': "Zenith Insurance Co." } }, { upsert: false, multi: true }, function(err, doc) {
        console.log(err, doc);
    });
    ////////////////////////////////////////////////////





}


/*
 function start(i) {
 if( i < 8250 ) {
 doSql(i , function(err) {
 if( err ) {
 //console.log('error: '+err);
 }
 else {
 start(i+1);
 if(i% 100 === 0 )
 //console.log("***  " + i + " ****");
 }
 });
 }
 }

 function doSql(i, callback){
 // i = line in sql

 Fields.find().exec(function(error,fields){
 ////console.log(js[i]);
 if(js[i] ===  undefined)
 return;

 Object.keys(js[i]).forEach(function(key,index) {
 if(js[i][key] === 'NULL' || js[i][key] === '0000-00-00') delete js[i][key];
 });
 var obj = {};
 var Stream = mongoose.model('Stream');
 for(var k in js[i]){

 for(var p in fields){
 if(fields[p].sql === k && js[i][k] !== "NULL"){
 var key = fields[p].key;
 var id = fields[p].id;
 obj[key] = {};
 if(k === "C_DOB" || k === "C_DATE_CLOSED" || k === "C_DATE_RECEIVED" || k === "C_DATE_ASSIGNED" || k === "C_DATE_OF_REOPEN" || k === "C_DATE_CLOSED" || k === "C_DOI"){
 obj[key].value = new Date(js[i][k]);
 ////console.log(obj[key].value);
 }
 else
 obj[key].value = js[i][k];
 obj[key].id = mongoose.Types.ObjectId(fields[p]._id);
 }
 }

 //complete the rest of the fields which are not in the excel table
 for(var j in fields){
 var has = false;
 if(!obj.hasOwnProperty(fields[j].key))
 {
 obj[fields[j].key] = {};
 obj[fields[j].key].value = " ";
 obj[fields[j].key].id =  mongoose.Types.ObjectId(fields[j]._id);
 ////console.log(fields[j].key);
 }
 }
 }
 //match the old user id with the new
 var old_id = js[i]['C_CREATECID'].trim();
 old_id = Number(js[i]['C_CREATECID']);


 var query = User.find();
 query.where("c_id").equals(old_id);
 query.findOne().exec(function(error,user){
 if(error || !user){
 //console.log("======\n",old_id,error);
 return callback();
 }
 ////console.log(user);
 var stream = new Stream(obj);
 stream.status = "open";
 stream.oldCreator = js[i]['C_CREATECID'];
 stream.user = user._id;

 JSON.stringify(obj);
 ////console.log("#"+i);

 stream.save(function (err) {
 if (err) {
 //console.log(err);
 } else {
 ////console.log(stream);
 }
 callback();
 });

 });
 });
 };

 */