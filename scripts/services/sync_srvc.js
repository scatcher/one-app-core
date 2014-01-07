'use strict';

angular.module('OneApp')
    .factory('syncService', function ($q, $timeout, $firebase, config, utility, dataService) {

        function synchronizeData(model, updateQuery) {
            console.time("Sync Service");
            var sync = {};
            sync.updateQuery = updateQuery;
            sync.changeNotifier = new Firebase(config.firebaseURL + '/changes/' + model.list.title);
            sync.lastUpdate = $firebase(sync.changeNotifier);

            //Used to notify all other users that a change has been made
            sync.registerChange = function () {
                console.time("Registering Change");
                console.log("Change detected in " + model.list.title + ' list.');
                sync.lastUpdate.$set(Firebase.ServerValue.TIMESTAMP);
                console.timeEnd("Registering Change");
            };

            //Container to hold all current subscriptions
            sync.subscriptions = [];

            //Allows controller to be notified when change is made
            sync.subscribeToChanges = function (callback) {
                if (sync.subscriptions.indexOf(callback) === -1) {
                    //Only register new subscriptions
                    sync.subscriptions.push(callback);
                }
            };

            //Fired when anyone updates a requirement
            sync.lastUpdate.$on("change", function() {
                model.updateData().then(function() {
                    _.each(sync.subscriptions, function(callback) {
                        console.log("Processing callback");
                        if(_.isFunction(callback)) {
                            callback();
                        }
                    });
                });
            });
            console.timeEnd("Sync Service");

            return sync;
        }

        return {
            synchronizeData: synchronizeData
        };
    });