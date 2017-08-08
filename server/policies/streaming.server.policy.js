'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Streaming Permissions
 */
exports.invokeRolesPolicies = function() {
    acl.allow([{
        roles: ['user', 'user2', 'admin1', 'admin2', 'admin'],
        allows: [, {
            resources: '/api/notes/oldfiles',
            permissions: ['get']
        }, {
            resources: '/api/streaming/sql',
            permissions: ['get']
        }, {
            resources: '/api/fields/newfields',
            permissions: ['post']
        }, {
            resources: '/api/streaming/:streamId',
            permissions: ['get', 'put', 'delete']
        }, {
            resources: '/api/streaming/smart-search',
            permissions: ['post']
        }, {
            resources: '/api/streaming',
            permissions: ['get', 'post', 'delete']
        }, {
            resources: '/api/streaming/search',
            permissions: ['post']
        }, {
            resources: '/api/streaming/note',
            permissions: ['post', 'delete']
        }, {
            resources: '/api/streaming/note/:noteId',
            permissions: ['delete', 'get']
        }, {
            resources: '/api/streaming/notesById/:datePicker',
            permissions: ['get']
        }, {
            resources: '/api/streaming/noteByUser',
            permissions: ['get']
        }, {
            resources: '/api/notes/followup/:start',
            permissions: ['get']
        }, {
            resources: '/api/fields/all-fields',
            permissions: ['get']
        }, {
            resources: '/api/fields',
            permissions: ['post']
        }, {
            resources: '/api/notes/notefile',
            permissions: ['post']
        }, {
            resources: '/api/notes/allFiels/:noteId',
            permissions: ['get']
        }, {
            resources: '/api/notes/followup',
            permissions: ['get']
        }, {
            resources: '/api/notes/followuppagin/:start',
            permissions: ['get']
        }, {
            resources: '/api/notes',
            permissions: ['post']
        }, {
            resources: '/api/notes/followupbydate/:date',
            permissions: ['get']
        }, {
            resources: '/api/notes/changestatus/:noteId',
            permissions: ['get']
        }, {
            resources: '/api/notes/change_emailsent/:noteId',
            permissions: ['get']
        }, {
            resources: '/api/notes/followup/:followUpId',
            permissions: ['delete', 'get']
        }, {
            resources: '/api/fields/:fieldId',
            permissions: ['delete']
        }, {
            resources: '/api/notes/changedate/:noteId/:date',
            permissions: ['get']
        }, {
            resources: '/api/streaming/searchhistory',
            permissions: ['get']
        }, {
            resources: '/api/streaming/checkclain/:val',
            permissions: ['get']
        }]
    }, {
        roles: ['guest'],
        allows: [{
            resources: '/api/streaming',
            permissions: ['get']
        }, {
            resources: '/api/streaming/:streamId',
            permissions: ['get']
        }]
    }, {
        roles: ['admin1', 'admin2', 'admin'],
        allows: [{
            resources: '/api/streaming/addlegacy/:id',
            permissions: ['get']
        }]
    }]);
};

/**
 * Check If Streaming Policy Allows
 */
exports.isAllowed = function(req, res, next) {
    var roles = (req.user) ? req.user.roles : ['guest'];
    console.log(req.user);
    // If an stream is being processed and the current user created it then allow any manipulation
    if (req.stream && req.user && req.stream.user && req.stream.user.id === req.user.id) {
        return next();
    }

    // Check for user roles
    acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function(err, isAllowed) {
        if (err) {
            // An authorization error occurred.
            return res.status(500).send('Unexpected authorization error');
        } else {
            if (isAllowed) {
                // Access granted! Invoke next middleware
                return next();
            } else {
                return res.status(403).json({
                    message: 'User is not authorized'
                });
            }
        }
    });
};