'use strict';

angular.module('OneApp')
    .controller('mainCtrl', function ($scope, $filter, $q, $timeout, dataService, ngTableParams, bannerTextModel, modelFactory) {

        /** Request Data */
        var getBannerText = bannerTextModel.executeQuery();

        /** Array of promises that will resolve once all sources have been returned */
        $scope.ready = $q.all([getBannerText]).then(function (response) {
            /** Do something with returned items */
            window.console.log(response[0]);

        });

        var dynamicData = bannerTextModel.generateMockData({quantity: _.random(200)});
        var staticData = bannerTextModel.generateMockData({quantity: 5, staticValue: true});


        var testModel = new modelFactory.Model();
        testModel.data = [
            {
                level1: {
                    value: 'value 1_1',
                    level2: {
                        value: 'value 2_1',
                        level3: {
                            value: 'value 3_1'
                        }
                    }
                },
                id: 1
            },
            {
                level1: {
                    value: 'value 1_2',
                    level2: {
                        value: 'value 2_2',
                        level3: {
                            value: 'value 3_2'
                        }
                    }
                },
                id: 2
            },
            {
                level1: {
                    value: 'value 1_3',
                    level2: {
                        value: 'value 2_3',
                        level3: {
                            value: 'value 3_3'
                        }
                    }
                },
                id: 3
            },
            {
                level1: {
                    level2: {
                        level3: { }
                    }
                },
                id: 4
            },
            {}
        ];

        var mathingObject = testModel.searchLocalCache('value 2_2', {
            propertyPath: 'level1.level2.value'
        });
        var mathingObject2 = testModel.searchLocalCache('value 2_3', {
            propertyPath: 'level1.level2.value'
        });
        window.console.log(mathingObject);
        window.console.log(mathingObject2);


        /** ng-table config for static data */
        $scope.staticTable = new ngTableParams({
            page: 1,            // show first page
            count: 5,           // count per page
            sorting: {
                modified: 'desc'
            }
        }, {
            counts: [],
            total: 0, // length of data
            getData: function ($defer, params) {
                var orderedData = params.sorting() ?
                    $filter('orderBy')(staticData, params.orderBy()) :
                    staticData;

                params.total(orderedData.length);
                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });

        /** ng-table config dynamic data */
        $scope.dynamicTable = new ngTableParams({
            page: 1,            // show first page
            count: 5,           // count per page
            sorting: {
                modified: 'desc'
            }
        }, {
            counts: [],
            total: 0, // length of data
            getData: function ($defer, params) {
                var orderedData = params.sorting() ?
                    $filter('orderBy')(dynamicData, params.orderBy()) :
                    dynamicData;

                params.total(orderedData.length);
                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });

    });