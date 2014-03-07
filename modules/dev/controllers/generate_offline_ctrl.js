'use strict';

angular.module('OneApp')
    .controller('generateOfflineCtrl', function ($scope, $q, dataService, config, toastr) {
        $scope.state = {
            siteUrl: config.defaultUrl,
            query: '',
            itemLimit: 0,
            selectedList: '',
            availableListFields: [],
            selectedListFields: [],
            xmlResponse: ''
        };

        $scope.refresh = function () {
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.listCollection = [];

        $scope.getLists = function() {
            dataService.getCollection({
                operation: "GetListCollection",
                webURL: $scope.state.siteUrl
            }).then(function(dataArray) {
                    $scope.listCollection.push.apply($scope.listCollection, dataArray);
                    toastr.info($scope.listCollection.length + ' lists/libraries identified.');
                });
        };

        $scope.getLists();

        $scope.getXML = function () {

            $scope.listCollection.length = 0;

            var payload = {
                operation: "GetListItems",
                listName: $scope.state.selectedList.Name,
                CAMLRowLimit: $scope.state.itemLimit,
                webURL: $scope.state.siteUrl
            };

            if($scope.state.selectedListFields.length > 0) {
                payload.CAMLViewFields = "<ViewFields>";
                _.each($scope.state.selectedListFields, function(fieldName) {
                    payload.CAMLViewFields += "<FieldRef Name='" + fieldName + "' />";
                });
                payload.CAMLViewFields += "</ViewFields>";
            }

            //Add query to payload if it's supplied
            if ($scope.state.query.length > 0) {
                payload.CAMLQuery = $scope.state.query;
            }

            var promise = $().SPServices(payload);

            promise.done(function (xData, status, response) {
                //Update the visible XML response
                $scope.state.xmlResponse = response.responseText;
                $scope.refresh();
            });
        };

        $scope.lookupListFields = function() {
            console.log("Looking up List Fields");
            $scope.state.availableListFields.length = 0;
            $scope.state.selectedListFields.length = 0;
            if(_.isObject($scope.state.selectedList) && $scope.state.selectedList.Title) {
                dataService.getList({
                    webURL: $scope.state.siteUrl,
                    listName: $scope.state.selectedList.Name
                }).then(function(dataArray) {
                        $scope.state.availableListFields.push.apply(
                            $scope.state.availableListFields, dataArray
                        );
                        toastr.info($scope.state.availableListFields.length + " fields found.")
                    });
            }
        };

        $scope.$watch('state.selectedList', function(newVal, oldVal) {
            if(!newVal) return;
            $scope.lookupListFields();
            console.log(newVal);
        });
    });