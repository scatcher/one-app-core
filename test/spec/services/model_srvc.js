'use strict';

describe('Service: modelFactory', function () {

    // load the controller's module
    beforeEach(module('OneApp'));

    var mockModel, modelFactory;

    beforeEach(inject(function (_mockModel_, _modelFactory_) {
        mockModel = _mockModel_;
        modelFactory = _modelFactory_;
    }));


    describe('getDefaultValueByFieldType', function () {

        it('should return boolean as null', function () {
            var defaultValue = modelFactory.getDefaultValueByFieldType('Boolean');
            expect(defaultValue).toBe(null);
        });

        it('should return a undefined parameter as an empty string', function () {
            var defaultValue = modelFactory.getDefaultValueByFieldType();
            expect(defaultValue).toBe('');
        });

        it('should return a text as an empty string', function () {
            var defaultValue = modelFactory.getDefaultValueByFieldType('Text');
            expect(defaultValue).toBe('');
        });

        it('should return a multi lookup as an empty array', function () {
            var defaultValue = modelFactory.getDefaultValueByFieldType('LookupMulti');
            expect(defaultValue).toEqual([]);
        });
    });


    describe('createEmptyItem', function () {

        it('should return an object', function () {
            var emptyItem = mockModel.createEmptyItem();
            expect(emptyItem).toBeTruthy();
        });

        it('should have an attribute for each of the mocked fields except for "ReadOnly"', function () {
            var emptyItem = mockModel.createEmptyItem();
            var fieldsOnModel = mockModel.list.customFields.length;
            var attributesOnEmptyItem = _.keys(emptyItem).length;
            expect(fieldsOnModel - 1).toBe(attributesOnEmptyItem);
        });
    });
});