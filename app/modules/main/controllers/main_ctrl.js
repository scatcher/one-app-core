'use strict';

angular.module('OneApp')
    .controller('mainCtrl', function ($scope, $filter, $q, $timeout, dataService, ngTableParams, bannerTextModel) {

        /** Request Data */
        var getBannerText = bannerTextModel.updateData();

        /** Data sources available to the view */
        $scope.bannerItems = bannerTextModel.data;


        /** Array of promises that will resolve once all sources have been returned */
        $scope.ready = $q.all([getBannerText]).then(function (bannerItems) {
            /** Do something with returned items */

        });

//        /** ng-table config for the most recently updated Spec Requirements */
//        $scope.recentSpecificationChanges = new ngTableParams({
//            page: 1,            // show first page
//            count: 5,           // count per page
//            sorting: {
//                modified: 'desc'
//            }
//        }, {
//            counts: [],
//            total: 0, // length of data
//            getData: function ($defer, params) {
//                getRecentSpecificationChanges.then(function (entities) {
//                    var orderedData = params.sorting() ?
//                        $filter('orderBy')(entities, params.orderBy()) :
//                        entities;
//
//                    params.total(orderedData.length);
//                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
//                });
//            }
//        });

    });