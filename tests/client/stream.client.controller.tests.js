'use strict';

(function() {
    // Streaming Controller Spec
    describe('Streaming Controller Tests', function() {
        // Initialize global variables
        var StreamingController,
            scope,
            $httpBackend,
            $stateParams,
            $location,
            Authentication,
            Streaming,
            mockStream;

        // The $resource service augments the response object with methods for updating and deleting the resource.
        // If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
        // the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
        // When the toEqualData matcher compares two objects, it takes only object properties into
        // account and ignores methods.
        beforeEach(function() {
            jasmine.addMatchers({
                toEqualData: function(util, customEqualityTesters) {
                    return {
                        compare: function(actual, expected) {
                            return {
                                pass: angular.equals(actual, expected)
                            };
                        }
                    };
                }
            });
        });

        // Then we can start by loading the main application module
        beforeEach(module(ApplicationConfiguration.applicationModuleName));

        // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
        // This allows us to inject a service but then attach it to a variable
        // with the same name as the service.
        beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_, _Authentication_, _Streaming_) {
            // Set a new global scope
            scope = $rootScope.$new();

            // Point global variables to injected services
            $stateParams = _$stateParams_;
            $httpBackend = _$httpBackend_;
            $location = _$location_;
            Authentication = _Authentication_;
            Streaming = _Streaming_;

            // create mock stream
            mockStream = new Streaming({
                _id: '525a8422f6d0f87f0e407a33',
                title: 'An Stream about MEAN',
                content: 'MEAN rocks!'
            });

            // Mock logged in user
            Authentication.user = {
                roles: ['user']
            };

            // Initialize the Streaming controller.
            StreamingController = $controller('StreamingController', {
                $scope: scope
            });
        }));

        it('$scope.find() should create an array with at least one stream object fetched from XHR', inject(function(Streaming) {
            // Create a sample Streaming array that includes the new stream
            var sampleStreaming = [mockStream];

            // Set GET response
            $httpBackend.expectGET('api/streaming').respond(sampleStreaming);

            // Run controller functionality
            scope.find();
            $httpBackend.flush();

            // Test scope value
            expect(scope.streaming).toEqualData(sampleStreaming);
        }));

        it('$scope.findOne() should create an array with one stream object fetched from XHR using a streamId URL parameter', inject(function(Streaming) {
            // Set the URL parameter
            $stateParams.streamId = mockStream._id;

            // Set GET response
            $httpBackend.expectGET(/api\/streaming\/([0-9a-fA-F]{24})$/).respond(mockStream);

            // Run controller functionality
            scope.findOne();
            $httpBackend.flush();

            // Test scope value
            expect(scope.stream).toEqualData(mockStream);
        }));

        describe('$scope.create()', function() {
            var sampleStreamPostData;

            beforeEach(function() {
                // Create a sample stream object
                sampleStreamPostData = new Streaming({
                    title: 'An Stream about MEAN',
                    content: 'MEAN rocks!'
                });

                // Fixture mock form input values
                scope.title = 'An Stream about MEAN';
                scope.content = 'MEAN rocks!';

                spyOn($location, 'path');
            });

            it('should send a POST request with the form input values and then locate to new object URL', inject(function(Streaming) {
                // Set POST response
                $httpBackend.expectPOST('api/streaming', sampleStreamPostData).respond(mockStream);

                // Run controller functionality
                scope.create(true);
                $httpBackend.flush();

                // Test form inputs are reset
                expect(scope.title).toEqual('');
                expect(scope.content).toEqual('');

                // Test URL redirection after the stream was created
                expect($location.path.calls.mostRecent().args[0]).toBe('streaming/' + mockStream._id);
            }));

            it('should set scope.error if save error', function() {
                var errorMessage = 'this is an error message';
                $httpBackend.expectPOST('api/streaming', sampleStreamPostData).respond(400, {
                    message: errorMessage
                });

                scope.create(true);
                $httpBackend.flush();

                expect(scope.error).toBe(errorMessage);
            });
        });

        describe('$scope.update()', function() {
            beforeEach(function() {
                // Mock stream in scope
                scope.stream = mockStream;
            });

            it('should update a valid stream', inject(function(Streaming) {
                // Set PUT response
                $httpBackend.expectPUT(/api\/streaming\/([0-9a-fA-F]{24})$/).respond();

                // Run controller functionality
                scope.update(true);
                $httpBackend.flush();

                // Test URL location to new object
                expect($location.path()).toBe('/streaming/' + mockStream._id);
            }));

            it('should set scope.error to error response message', inject(function(Streaming) {
                var errorMessage = 'error';
                $httpBackend.expectPUT(/api\/streaming\/([0-9a-fA-F]{24})$/).respond(400, {
                    message: errorMessage
                });

                scope.update(true);
                $httpBackend.flush();

                expect(scope.error).toBe(errorMessage);
            }));
        });

        describe('$scope.remove(stream)', function() {
            beforeEach(function() {
                // Create new streaming array and include the stream
                scope.streaming = [mockStream, {}];

                // Set expected DELETE response
                $httpBackend.expectDELETE(/api\/streaming\/([0-9a-fA-F]{24})$/).respond(204);

                // Run controller functionality
                scope.remove(mockStream);
            });

            it('should send a DELETE request with a valid streamId and remove the stream from the scope', inject(function(Streaming) {
                expect(scope.streaming.length).toBe(1);
            }));
        });

        describe('scope.remove()', function() {
            beforeEach(function() {
                spyOn($location, 'path');
                scope.stream = mockStream;

                $httpBackend.expectDELETE(/api\/streaming\/([0-9a-fA-F]{24})$/).respond(204);

                scope.remove();
                $httpBackend.flush();
            });

            it('should redirect to streaming', function() {
                expect($location.path).toHaveBeenCalledWith('streaming');
            });
        });
    });
}());