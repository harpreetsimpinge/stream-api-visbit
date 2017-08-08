'use strict';

describe('Articles E2E Tests:', function() {
    describe('Test streaming page', function() {
        it('Should report missing credentials', function() {
            browser.get('http://localhost:3001/streaming');
            expect(element.all(by.repeater('article in streaming')).count()).toEqual(0);
        });
    });
});