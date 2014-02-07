'use strict';

angular.module('OneApp')
    .controller('groupManagerCtrl', function ($scope, $q, $timeout, $filter, ngTableParams, config, dataService) {
        /** 1. Create deferred object which is resolved one all models are ready */
        /** 2. Decorates the $scope with helper methods like "$scope.refresh()" */
        /** 3. Creates pointers on the $scope to each model.data array (ex: adds $scope.personnel for personnelModel) */
        $scope.ready = dataService.registerModels($scope, []);

        $scope.siteCollectionUsers = [];
        $scope.siteCollectionGroups = [];
        $scope.availableOptions = [];
        $scope.assignedOptions = [];

        $scope.state = {
            activeTab: "Users",
            siteUrl: $().SPServices.SPGetCurrentSite(),
            selectedUser: '',
            selectedGroup: '',
            selectedAvailableOptions: '',
            selectedAssignedOptions: '',
            userFilter: '',
            groupFilter: ''
        };

        $scope.tabContents = {};

        var buildInputs = function (assignedItems) {
            var map = [];
            var available = [];
            var assigned = [];

            var fullList = $scope.state.activeTab === "Users" ?
                $scope.siteCollectionUsers :
                $scope.siteCollectionGroups;

            $scope.state.selectedAvailableOptions = '';
            $scope.state.selectedAssignedOptions = '';

            //Create a quick map to speed up checking in future
            _.each(assignedItems, function (item) {
                map.push(item.ID);
            });

            _.each(fullList, function (item) {
                if (map.indexOf(item.ID) > -1) {
                    //Group already assigned
                    assigned.push(item);
                } else {
                    available.push(item);
                }
            });
            $scope.availableOptions.length = 0;
            $scope.assignedOptions.length = 0;
            Array.prototype.push.apply($scope.availableOptions, available);
            Array.prototype.push.apply($scope.assignedOptions, assigned);
            console.log($scope);
        };

        $scope.updateAvailableGroups = function () {
            toastr.info("Retrieving an updated list of groups for the current user");
            dataService.getCollection({
                webUrl: $scope.state.siteUrl,
                operation: "GetGroupCollectionFromUser",
                userLoginName: $scope.state.selectedUser.LoginName
            }).then(function (response) {
                buildInputs(response);
            });
        };

        $scope.updateAvailableUsers = function () {
            toastr.info("Retrieving an updated list of users for the current group");
            dataService.getCollection({
                webUrl: $scope.state.siteUrl,
                groupName: $scope.state.selectedGroup.Name,
                operation: "GetUserCollectionFromGroup"
            }).then(function (response) {
                buildInputs(response);
            });
        };

        //Initialize with default values
        $scope.tabContents = {
            labels: {
                select: 'Select a User:',
                available: 'Available Groups',
                assigned: 'Assigned Groups'
            },
            model: $scope.state.selectedGroup,
            options: $scope.siteCollectionGroups,
            description: 'This page was created to make the process of managing users/groups within the site ' +
                'collection more manageable.  When a user is selected, the available groups are displayed on the ' +
                'left and the groups that the user is currently a member of will show on the right. Selecting ' +
                'multiple groups is supported.'
        };

        $scope.updateTab = function (tab) {
            if (tab === 'Groups') {
                $scope.state.activeTab = "Groups";
                $scope.tabContents = {
                    labels: {
                        select: 'Select a User:',
                        available: 'Available Groups',
                        assigned: 'Assigned Groups'
                    },
                    model: $scope.state.selectedGroup,
                    options: $scope.siteCollectionGroups,
                    description: 'This page was created to make the process of managing users/groups within the site ' +
                        'collection more manageable.  When a user is selected, the available groups are displayed on the ' +
                        'left and the groups that the user is currently a member of will show on the right. Selecting ' +
                        'multiple groups is supported.'
                };
                $scope.updateAvailableGroups();
            } else {
                $scope.state.activeTab = 'Users';
                $scope.tabContents = {
                    labels: {
                        select: 'Select a Group:',
                        available: 'Available Users',
                        assigned: 'Assigned Users'
                    },
                    model: $scope.state.selectedUser,
                    options: $scope.siteCollectionUsers,
                    description: 'This tab will allow you to quickly assign multiple users to a selected group.'
                };
                $scope.updateAvailableUsers();
            }
        };

        $scope.userDetailsLink = function(user) {
            $scope.state.selectedUser = user;
            $scope.state.activeTab = "Groups";
            $scope.updateAvailableGroups();
        };

        $scope.groupDetailsLink = function(group) {
            $scope.state.selectedGroup = group;
            $scope.state.activeTab = "Users";
            $scope.updateAvailableUsers();
        };

        $scope.updatePermissions = function (operation) {
            var destination = $scope.assignedOptions;
            var source = $scope.availableOptions;
            var selectedObjects = $scope.state.selectedAvailableOptions;

            if (operation !== "AddUserToGroup") {
                destination = $scope.availableOptions;
                source = $scope.assignedOptions;
                selectedObjects = $scope.state.selectedAssignedOptions;
            }

            if (!selectedObjects.length) {
                toastr.warning("Please make a selection");
            } else {
                toastr.info("Communicating with the server");
                var queue = [];
                _.each(selectedObjects, function (item) {
                    var deferred = $q.defer();

                    if (config.offline) {
                        //Simulate an async call
                        $timeout(function () {
                            //Push option to look like they've been assigned
                            destination.push(item);
                            //Remove from the available side
//                            source.splice(selectedObjects.indexOf(item), 1);
                            source.splice(source.indexOf(item), 1);
                        })
                    } else {

                        var groupName;
                        var userLoginName;

                        if ($scope.state.activeTab === 'Groups') {
                            groupName = item.Name;
                            userLoginName = $scope.state.selectedUser.LoginName;
                        } else {
                            groupName = $scope.state.selectedGroup.Name;
                            userLoginName = item.LoginName;
                        }

                        dataService.serviceWrapper({
                            webUrl: $scope.state.siteUrl,
                            filterNode: "User",   //Look for all xml "User" nodes and convert those in to JS objects
                            operation: operation, //AddUserToGroup || RemoveUserFromGroup"
                            groupName: groupName,
                            userLoginName: userLoginName
                        }).then(function(response) {
                            deferred.resolve(response);
                        });
                    }

                    queue.push(deferred.promise);
                });
                $scope.state.selectedAvailableOptions = '';
                $scope.state.selectedAssignedOptions = '';

                //Resolved when all promises complete
                $q.all(queue).then(function (responses) {
                    toastr.success(operation === "AddUserToGroup" ?
                        "User successfully added":
                        "User successfully removed");
                    if (!config.offline) {
                        //Retrieve updated value from the server
                        if($scope.state.activeTab === "Users") {
                            $scope.updateAvailableUsers();
                        } else {
                            $scope.updateAvailableGroups();
                        }
                    }
                }, function (outcome) {
                    toastr.error("There was a problem removing the user");
                });
            }
        };

        $scope.usersTable = new ngTableParams({
            page: 1,            // show first page
            count: 30,           // count per page
            sorting: {
                title: 'asc'
            }
        }, {
            total: $scope.siteCollectionUsers.length, // length of data
            getData: function ($defer, params) {
                console.time("Filtering");
                // use build-in angular filter
                var orderedData = $scope.siteCollectionUsers;
                orderedData = $filter('filter')(orderedData, function(record) {
                    var match = false;

                    if($scope.state.userFilter === '') {
                        return true;
                    }
                    var textFields = ['ID', 'Name', 'Email'];
                    var searchStringLowerCase = $scope.state.userFilter.toLowerCase();
                    _.each(textFields, function(fieldName) {
                        if(record[fieldName].toLowerCase().indexOf(searchStringLowerCase) !== -1) {
                            match = true;
                        }
                    });
                    return match;
                });

                params.total(orderedData.length);
                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });

        $scope.groupsTable = new ngTableParams({
            page: 1,            // show first page
            count: 30,           // count per page
            sorting: {
                title: 'asc'
            }
        }, {
            total: $scope.siteCollectionGroups.length, // length of data
            getData: function ($defer, params) {
                console.time("Filtering");
                // use build-in angular filter
                var orderedData = $scope.siteCollectionGroups;
                orderedData = $filter('filter')(orderedData, function(record) {
                    var match = false;

                    if($scope.state.groupFilter === '') {
                        return true;
                    }
                    var textFields = ['ID', 'Name', 'Email'];
                    var searchStringLowerCase = $scope.state.groupFilter.toLowerCase();
                    _.each(textFields, function(fieldName) {
                        if(record[fieldName].toLowerCase().indexOf(searchStringLowerCase) !== -1) {
                            match = true;
                        }
                    });
                    return match;
                });

                params.total(orderedData.length);
                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });

        var getUserCollection = function() {
            var deferred = $q.defer();
            dataService.getCollection({
                webUrl: $scope.state.siteUrl,
                operation: 'GetUserCollectionFromSite'
            }).then(function (response) {
                _.each(response, function (user) {
                    //Assume that valid users all have email addresses and services/groups don't
                    if (user.Email) {
                        $scope.siteCollectionUsers.push(user);
                    }
                });
                $scope.state.selectedUser = $scope.siteCollectionUsers[0];
                deferred.resolve($scope.siteCollectionUsers);
            });
            return deferred.promise;
        };

        var getGroupCollection = function() {
            var deferred = $q.defer();
            dataService.getCollection({
                webUrl: $scope.state.siteUrl,
                operation: "GetGroupCollectionFromSite"
            }).then(function (response) {
                Array.prototype.push.apply($scope.siteCollectionGroups, response);
                $scope.state.selectedGroup = $scope.siteCollectionGroups[0];
                deferred.resolve($scope.siteCollectionGroups);
            });
            return deferred.promise;
        };


        /** All logic dependent on model data should be inlcuded in the return statement */
        return $q.all(getUserCollection(), getGroupCollection()).then(function() {
            $scope.updateAvailableUsers();
            $scope.updateTab();
            console.log($scope);
        });
    });