'use strict';

var should = require('should'),
    request = require('supertest'),
    path = require('path'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Stream = mongoose.model('Stream'),
    express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, stream;

/**
 * Stream routes tests
 */
describe('Stream CRUD tests', function() {

    before(function(done) {
        // Get application
        app = express.init(mongoose);
        agent = request.agent(app);

        done();
    });

    beforeEach(function(done) {
        // Create user credentials
        credentials = {
            username: 'username',
            password: 'M3@n.jsI$Aw3$0m3'
        };

        // Create a new user
        user = new User({
            firstName: 'Full',
            lastName: 'Name',
            displayName: 'Full Name',
            email: 'test@test.com',
            username: credentials.username,
            password: credentials.password,
            provider: 'local'
        });

        // Save a user to the test db and create new stream
        user.save(function() {
            stream = {
                title: 'Stream Title',
                content: 'Stream Content'
            };

            done();
        });
    });

    it('should be able to save an stream if logged in', function(done) {
        agent.post('/api/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) {
                    return done(signinErr);
                }

                // Get the userId
                var userId = user.id;

                // Save a new stream
                agent.post('/api/streaming')
                    .send(stream)
                    .expect(200)
                    .end(function(streamSaveErr, streamSaveRes) {
                        // Handle stream save error
                        if (streamSaveErr) {
                            return done(streamSaveErr);
                        }

                        // Get a list of streaming
                        agent.get('/api/streaming')
                            .end(function(streamingGetErr, streamingGetRes) {
                                // Handle stream save error
                                if (streamingGetErr) {
                                    return done(streamingGetErr);
                                }

                                // Get streaming list
                                var streaming = streamingGetRes.body;

                                // Set assertions
                                (streaming[0].user._id).should.equal(userId);
                                (streaming[0].title).should.match('Stream Title');

                                // Call the assertion callback
                                done();
                            });
                    });
            });
    });

    it('should not be able to save an stream if not logged in', function(done) {
        agent.post('/api/streaming')
            .send(stream)
            .expect(403)
            .end(function(streamSaveErr, streamSaveRes) {
                // Call the assertion callback
                done(streamSaveErr);
            });
    });

    it('should not be able to save an stream if no title is provided', function(done) {
        // Invalidate title field
        stream.title = '';

        agent.post('/api/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) {
                    return done(signinErr);
                }

                // Get the userId
                var userId = user.id;

                // Save a new Stream
                agent.post('/api/streaming')
                    .send(stream)
                    .expect(400)
                    .end(function(streamSaveErr, streamSaveRes) {
                        // Set message assertion
                        (streamSaveRes.body.message).should.match('Title cannot be blank');

                        // Handle stream save error
                        done(streamSaveErr);
                    });
            });
    });

    it('should be able to update an stream if signed in', function(done) {
        agent.post('/api/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) {
                    return done(signinErr);
                }

                // Get the userId
                var userId = user.id;

                // Save a new stream
                agent.post('/api/streaming')
                    .send(stream)
                    .expect(200)
                    .end(function(streamSaveErr, streamSaveRes) {
                        // Handle stream save error
                        if (streamSaveErr) {
                            return done(streamSaveErr);
                        }

                        // Update stream title
                        stream.title = 'WHY YOU GOTTA BE SO MEAN?';

                        // Update an existing stream
                        agent.put('/api/streaming/' + streamSaveRes.body._id)
                            .send(stream)
                            .expect(200)
                            .end(function(streamUpdateErr, streamUpdateRes) {
                                // Handle stream update error
                                if (streamUpdateErr) {
                                    return done(streamUpdateErr);
                                }

                                // Set assertions
                                (streamUpdateRes.body._id).should.equal(streamSaveRes.body._id);
                                (streamUpdateRes.body.title).should.match('WHY YOU GOTTA BE SO MEAN?');

                                // Call the assertion callback
                                done();
                            });
                    });
            });
    });

    it('should be able to get a list of streaming if not signed in', function(done) {
        // Create new stream model instance
        var streamObj = new Stream(stream);

        // Save the stream
        streamObj.save(function() {
            // Request streaming
            request(app).get('/api/streaming')
                .end(function(req, res) {
                    // Set assertion
                    res.body.should.be.instanceof(Array).and.have.lengthOf(1);

                    // Call the assertion callback
                    done();
                });

        });
    });

    it('should be able to get a single stream if not signed in', function(done) {
        // Create new stream model instance
        var streamObj = new Stream(stream);

        // Save the stream
        streamObj.save(function() {
            request(app).get('/api/streaming/' + streamObj._id)
                .end(function(req, res) {
                    // Set assertion
                    res.body.should.be.instanceof(Object).and.have.property('title', stream.title);

                    // Call the assertion callback
                    done();
                });
        });
    });

    it('should return proper error for single stream with an invalid Id, if not signed in', function(done) {
        // test is not a valid mongoose Id
        request(app).get('/api/streaming/test')
            .end(function(req, res) {
                // Set assertion
                res.body.should.be.instanceof(Object).and.have.property('message', 'stream is invalid');

                // Call the assertion callback
                done();
            });
    });

    it('should return proper error for single stream which doesnt exist, if not signed in', function(done) {
        // This is a valid mongoose Id but a non-existent stream
        request(app).get('/api/streaming/559e9cd815f80b4c256a8f41')
            .end(function(req, res) {
                // Set assertion
                res.body.should.be.instanceof(Object).and.have.property('message', 'No stream with that identifier has been found');

                // Call the assertion callback
                done();
            });
    });

    it('should be able to delete an stream if signed in', function(done) {
        agent.post('/api/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) {
                    return done(signinErr);
                }

                // Get the userId
                var userId = user.id;

                // Save a new stream
                agent.post('/api/streaming')
                    .send(stream)
                    .expect(200)
                    .end(function(streamSaveErr, streamSaveRes) {
                        // Handle stream save error
                        if (streamSaveErr) {
                            return done(streamSaveErr);
                        }

                        // Delete an existing stream
                        agent.delete('/api/streaming/' + streamSaveRes.body._id)
                            .send(stream)
                            .expect(200)
                            .end(function(streamDeleteErr, streamDeleteRes) {
                                // Handle stream error error
                                if (streamDeleteErr) {
                                    return done(streamDeleteErr);
                                }

                                // Set assertions
                                (streamDeleteRes.body._id).should.equal(streamSaveRes.body._id);

                                // Call the assertion callback
                                done();
                            });
                    });
            });
    });

    it('should not be able to delete an stream if not signed in', function(done) {
        // Set stream user
        stream.user = user;

        // Create new stream model instance
        var streamObj = new Stream(Stream);

        // Save the stream
        streamObj.save(function() {
            // Try deleting stream
            request(app).delete('/api/streaming/' + streamObj._id)
                .expect(403)
                .end(function(streamDeleteErr, streamDeleteRes) {
                    // Set message assertion
                    (streamDeleteRes.body.message).should.match('User is not authorized');

                    // Handle stream error error
                    done(streamDeleteErr);
                });

        });
    });

    it('should be able to get a single stream that has an orphaned user reference', function(done) {
        // Create orphan user creds
        var _creds = {
            username: 'orphan',
            password: 'M3@n.jsI$Aw3$0m3'
        };

        // Create orphan user
        var _orphan = new User({
            firstName: 'Full',
            lastName: 'Name',
            displayName: 'Full Name',
            email: 'orphan@test.com',
            username: _creds.username,
            password: _creds.password,
            provider: 'local'
        });

        _orphan.save(function(err, orphan) {
            // Handle save error
            if (err) {
                return done(err);
            }

            agent.post('/api/auth/signin')
                .send(_creds)
                .expect(200)
                .end(function(signinErr, signinRes) {
                    // Handle signin error
                    if (signinErr) {
                        return done(signinErr);
                    }

                    // Get the userId
                    var orphanId = orphan._id;

                    // Save a new stream
                    agent.post('/api/streaming')
                        .send(stream)
                        .expect(200)
                        .end(function(streamSaveErr, streamSaveRes) {
                            // Handle stream save error
                            if (streamSaveErr) {
                                return done(streamSaveErr);
                            }

                            // Set assertions on new stream
                            (streamSaveRes.body.title).should.equal(stream.title);
                            should.exist(streamSaveRes.body.user);
                            should.equal(streamSaveRes.body.user._id, orphanId);

                            // force the stream to have an orphaned user reference
                            orphan.remove(function() {
                                // now signin with valid user
                                agent.post('/api/auth/signin')
                                    .send(credentials)
                                    .expect(200)
                                    .end(function(err, res) {
                                        // Handle signin error
                                        if (err) {
                                            return done(err);
                                        }

                                        // Get the stream
                                        agent.get('/api/streaming/' + streamSaveRes.body._id)
                                            .expect(200)
                                            .end(function(streamInfoErr, streamInfoRes) {
                                                // Handle stream error
                                                if (streamInfoErr) {
                                                    return done(streamInfoErr);
                                                }

                                                // Set assertions
                                                (streamInfoRes.body._id).should.equal(streamSaveRes.body._id);
                                                (streamInfoRes.body.title).should.equal(stream.title);
                                                should.equal(streamInfoRes.body.user, undefined);

                                                // Call the assertion callback
                                                done();
                                            });
                                    });
                            });
                        });
                });
        });
    });

    afterEach(function(done) {
        User.remove().exec(function() {
            Stream.remove().exec(done);
        });
    });
});