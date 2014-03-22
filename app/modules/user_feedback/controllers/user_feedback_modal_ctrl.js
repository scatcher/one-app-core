'use strict';

angular.module('OneApp')
    .controller('userFeedbackModalCtrl', function ($scope, $modalInstance, $q, $timeout, $location, dataService, toastr, userFeedbackModel) {

        var defaults = {
            title: '',
            description: '',
            topic: $location.$$url
        };

        $scope.tempUserFeedback = defaults;

        /**Close modal without updating any data**/
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.ok = function () {
            //Create new task request record
            userFeedbackModel.addNewItem($scope.tempUserFeedback).then(function () {
                toastr.success("Your feedback has been sent.");
                $modalInstance.close();
            }, function () {
                toastr.error("There was a problem saving your feedback.  Please try again.");
            });
        };
    });