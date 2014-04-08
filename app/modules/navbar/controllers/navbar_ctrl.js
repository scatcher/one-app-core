'use strict';

angular.module('OneApp')
    .controller('NavbarCtrl', function ($scope, $state, $location, $stateParams, queueService, userFeedbackModel, userModel, usSpinnerService) {
        $scope.navLocations = [
            {label: 'Projects', link: '#/projects', icon: 'fa-check-square-o', type: "primary"},
            {label: 'Tasker', link: '#/tasker', icon: 'fa-tasks', type: "secondary"},
            {label: 'Find My Friends', link: '#/find_my_friends', icon: 'fa-male', type: "secondary"},
            {label: 'Group Manager', link: '#/group_manager', icon: 'fa-group', type: "secondary"}
        ];

        $scope.state = {
            queueCount: 0,
            activeNav: false,
            isAdmin: false,
            projectRoute: false
        };

        $scope.activeProject = {};

        $scope.projects = [];

        $scope.$location = $location;

        userModel.checkIfMember('Super Duper Admins').then(function (response) {
            $scope.state.isAdmin = response;
        });


        $scope.navByType = function (type) {
            return _.where($scope.navLocations, {type: type});
        };

        $scope.isActive = function (location) {
            return $location.$$path === location;
        };

        $scope.provideFeedback = userFeedbackModel.openModal;

        //Trigger loading animation on change in route
        $scope.$on('$stateChangeStart', function (scope, next, current) {
            if (next === current) return;
            queueService.increase();
        });

        $scope.$on('$stateChangeSuccess', function (event, current, previous, rejection) {
            if (current === previous) return;
            queueService.decrease();
        });

        //Register event listener on the queue service
        queueService.registerObserverCallback(function (count) {
            $scope.state.queueCount = count;
            if (count > 0) {
                usSpinnerService.spin('nav-spinner');
            } else {
                usSpinnerService.stop('nav-spinner');
            }
        });
    });