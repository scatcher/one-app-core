angular.module('OneApp')
    .directive('spSelect', function ($timeout) {
        return {
            restrict: "A",
            replace: true,
            template: '' +
                '<span class="ng-cloak">\n' +
                '   <span ng-if="!multi">\n' +
                '       <select class="form-control" ng-model="state.singleSelectID"\n ' +
                '           ng-change="updateSingleModel()" style="width: 100%" ng-disabled="ngDisabled"\n ' +
                '           ng-options="lookup.id as lookup[lookupValue] for lookup in arr">\n ' +
                '       </select>\n' +
                '   </span>\n' +
                '   <span ng-if="multi">\n' +
                '       <select multiple ui-select2 ng-model="state.multiSelectIDs"\n' +
                '           ng-change="updateMultiModel()" style="width: 100%;" ng-disabled="ngDisabled">\n' +
                '               <option></option>\n' +
                '               <option ng-repeat="lookup in arr" value="{{ lookup.id }}"\n' +
                '                   ng-bind="lookup[lookupValue]">&nbsp;</option>\n' +
                '       </select>\n' +
                '   </span>\n' +
                '</span>\n' +
                '',
            scope: {
                bindedField: '=',         //The field on the model to bind to
                multi: '=',         //Single select if not set or set to false
                arr: '=',           //Array of lookup options
                lookupValue: '=',   //Field name to map the lookupValue to (ex: 'title')
                ngDisabled: '='     //Pass through to disable control using ng-disabled on element if set
            },
            link: function (scope, element, attrs) {

                $timeout(function() {
                    scope.state = {
                        multiSelectIDs: [],
                        singleSelectID: ''
                    };

                    if (scope.multi) {
                        //Multi Select Mode
                        //Set the string version of id's to allow multi-select control to work properly
                        _.each(scope.bindedField, function (selectedLookup) {
                            //Push id as a string to match what Select2 is expecting
                            scope.state.multiSelectIDs.push(selectedLookup.lookupId.toString());
                        });
                    } else {
                        //Single Select Mode
                        if (_.isObject(scope.bindedField) && scope.bindedField.lookupId) {
                            //Set the selected id as string
                            scope.state.singleSelectID = scope.bindedField.lookupId;
                        }
                    }
                }, 0);

                var buildLookupObject = function(stringId) {
                    var intID = parseInt(stringId, 10)
                    var match = _.findWhere(scope.arr, {id: intID});
                    return { lookupId: intID, lookupValue: match[scope.lookupValue] };
                };

                scope.updateMultiModel = function () {
                    //Ensure field being binded against is array
                    if (!_.isArray(scope.bindedField)) {
                        scope.bindedField = [];
                    }
                    //Clear out existing contents
                    scope.bindedField.length = 0;
                    //Push formatted lookup object back
                    _.each(scope.state.multiSelectIDs, function (stringId) {
                        scope.bindedField.push(buildLookupObject(stringId));
                    });
                };

                scope.updateSingleModel = function () {
                    //Create an object with expected lookupId/lookupValue properties
                    scope.bindedField = buildLookupObject(scope.state.singleSelectID);
                };
            }
        };
    });
