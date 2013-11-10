'use strict';

angular.module('OneApp')
  .controller('generateOfflineCtrl', ['$scope', 'dataService','config',
        function ($scope, dataService, config) {
            $scope.state = {
                siteUrl: config.defaultUrl,
                listName: '',
                query: '',
                itemLimit: 0,
                xmlResponse: ''
            };

            $scope.refresh = function() {
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            };

            $scope.getXML = function() {

                var payload = {
                    operation: "GetListItems",
                    listName: $scope.state.listName,
                    CAMLRowLimit: $scope.state.itemLimit,
                    webURL: $scope.state.siteUrl
                };

                //Add query to payload if it's supplied
                if($scope.state.query.length > 0) {
                    payload.CAMLQuery = $scope.state.query;
                }

                var promise = $().SPServices(payload);

                promise.done(function(xData, status, response) {
                    //Update the visible XML response
                    $scope.state.xmlResponse = response.responseText;
                    $scope.refresh();
                });
            }
        }]);