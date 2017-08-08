'use strict';
//Streaming service used for communicating with the streams REST endpoints
angular.module('streaming').factory('Streaming', ['$resource',
    function($resource) {
        return $resource('api/streaming/:streamId', {
            streamId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);


angular.module('streaming').filter('category', function() {
    return function(input, cat) {
        var out = [];
        for (var i = 0; i < input.length; i++) {
            console.log(input);
            if (input[i].id.category === cat) {
                out.push(input[i]);
            }
        }
        return out;
    }
});

angular.module('streaming').filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);