'use strict';

describe('Controller: GenerateAttributes', function () {

    // load the controller's module
    beforeEach(module('OneApp'));

    var generateAttributesCtrl,
        scope, timeout, rootScope;
    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $timeout) {
        scope = $rootScope.$new();
        timeout = $timeout;
        rootScope = $rootScope;
        generateAttributesCtrl = $controller('generateAttributesCtrl', {
            $scope: scope
        });
    }));



    it('should convert requirement text into an attribute', function () {
        var testText = "The DEOS shall be electrically interoperable with RSAM, AN/TTC-63.";
        var expectedOutput = "Verify the DEOS is electrically interoperable with RSAM, AN/TTC-63.";
        expect(scope.convertRequirementIntoAttribute(testText)).toEqual(expectedOutput);

    });

    it('should remove capitalization of the first word', function () {
        var testText = "The DEOS shall...";
        var expectedOutput = "the DEOS shall...";
        expect(scope.unCapitalizeFirstWord(testText)).toEqual(expectedOutput);
    });

    it('should remove capitalization of the first except when 2nd letter is also capitalized', function () {
        var testText = "DEOS shall...";
        var expectedOutput = "DEOS shall...";
        expect(scope.unCapitalizeFirstWord(testText)).toEqual(expectedOutput);
    });

    it('should replace the singular "shall be" with "is"', function () {
        var testText = "The DEOS shall be electrically interoperable with";
        var expectedOutput = "The DEOS is electrically interoperable with";
        expect(scope.replaceShall(testText)).toEqual(expectedOutput);
    });

    it('should replace "shall have" with "has"', function () {
        var testText = "The DDS-M shall have a PM for use with each service...";
        var expectedOutput = "The DDS-M has a PM for use with each service...";
        expect(scope.replaceShall(testText)).toEqual(expectedOutput);
    });

    it('should replace the plural "shall be" with "are"', function () {
        var testText = "...cards shall be installed in the Session Controller to support the";
        var expectedOutput = "...cards are installed in the Session Controller to support the";
        expect(scope.replaceShall(testText)).toEqual(expectedOutput);
    });

    it('should replace "shall provides" with "provides"', function () {
        var testText = "...cards shall be installed in the Session Controller to support the";
        var expectedOutput = "...cards are installed in the Session Controller to support the";
        expect(scope.replaceShall(testText)).toEqual(expectedOutput);
    });


    });