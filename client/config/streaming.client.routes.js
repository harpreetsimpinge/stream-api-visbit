'use strict';

// Setting up route
angular.module('streaming').config(['$stateProvider',
    function($stateProvider) {
        // Streaming state routing
        $stateProvider
            .state('streaming', {
                abstract: true,
                url: '/streaming',
                template: '<ui-view/>'
            })
            .state('streaming.list', {
                templateUrl: 'modules/streaming/client/views/list-streaming.client.view.html',
                url: '/list',
                data: {
                    roles: ['user', 'user2', 'admin2', 'admin']
                }
            })
            .state('streaming.create', {
                url: '/create',
                templateUrl: 'modules/streaming/client/views/create-stream.client.view.html',
                data: {
                    roles: ['admin1', 'admin2', 'admin']
                }
            })
            .state('streaming.fields', {
                url: '/fields',
                templateUrl: 'modules/streaming/client/views/edit-fields.client.view.html',
                data: {
                    roles: ['admin1', 'admin2', 'admin']
                }
            })
            .state('streaming.bulk', {
                url: '/bulk',
                templateUrl: 'modules/streaming/client/views/bulk.client.view.html',
                data: {
                    roles: ['admin1', 'admin2', 'admin']
                }
            });
    }
]);