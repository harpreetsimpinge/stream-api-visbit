  'use strict';

  /**
   * Module dependencies.
   */
  var path = require('path'),
      mongoose = require('mongoose'),
      Fields = mongoose.model('Fields'),
      moment = require('moment'),
      errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

  /**
   * Create a note
   */
  exports.create = function(req, res) {
      var fields = new Fields(req.body);
      fields.save(function(err, field) {
          if (err) {
              console.log(err);
              return res.status(500).send({
                  message: errorHandler.getErrorMessage(err)
              });
          } else {
              console.log(field);
              res.json(field);
          }
      });
  };

  /**
   * Show the current note
   */
  exports.read = function(req, res) {
      var query = Fields.find();
      query.where("_case").equals(req.user._id).sort('-date').populate('user', 'displayName').exec(function(err, streaming) {
          if (err) {
              return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
              });
          } else {
              console.log(streaming);
              res.json(streaming);
          }
      });
  };

  /**
   * Update a note
   */
  exports.update = function(req, res) {
      var fields = req.body;
      for (var k in fields) {
          if (fields[k].type === "dropdown")
              console.log(fields[k]);
          var query = { '_id': fields[k]._id };
          Fields.findOneAndUpdate(query, fields[k], { upsert: false }, function(err, doc) {
              if (err) {
                  res.send(500, { error: err });
              } else {

              }
          });
      }
      res.json("OK");
  };

  /**
   * Delete an note
   */
  exports.delete = function(req, res) {
      console.log(req.params.fieldId);
      var query = Fields.find({ _id: req.params.fieldId });
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

  /**
   * List of Fieldss after today
   */
  exports.list = function(req, res) {

      var query = Fields.find();

      query.sort({ required: 'desc', key: '1' }).populate('field').exec(function(err, notes) {
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
   * List of Fieldss after today
   */
  exports.singleField = function(req, res) {



      Fields.findOne({ key: req.params.fieldKey }).exec(function(err, notes) {
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
   * List of Fieldss By User
   */
  exports.listByDate = function(req, res) {
      var query = Fields.find();
      query.where("creator").equals(req.user._id);
      query.where("date").equals(req.params.datePicker);
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
   * List of Fieldss By Creator
   */
  exports.listByCreator = function(req, res) {
      var query = Fields.find();
      //var lastMonth = moment().subtract(1,'month');
      var lastMonth = new Date();
      var allYear = new Date();

      allYear.setFullYear(allYear.getFullYear() + 1);
      lastMonth.setDate(lastMonth.getDate() - 31);

      console.log(lastMonth + " " + allYear);

      query.where("creator").equals(req.user._id);
      query.where("date").gte(lastMonth);
      query.where("date").lte(allYear);

      query.sort('-created').populate('creator').exec(function(err, notes) {
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
   * Fields middleware
   */
  exports.noteByID = function(req, res, next, id) {

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).send({
              message: 'Fields is invalid'
          });
      }

      Fields.findById(id).populate('user', 'displayName').exec(function(err, note) {
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