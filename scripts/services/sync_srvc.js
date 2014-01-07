'use strict';

angular.module('OneApp')
    .factory('syncService', function ($q, $timeout, $firebase, config, utility, dataService) {

        function synchronizeData(model, updateQuery) {
            var sync = {};

            sync.changeNotifier = new Firebase(config.firebaseURL + '/changes/' + model.list.title);
            sync.lastUpdate = $firebase(sync.changeNotifier);

            //Used to notify all other users that a change has been made
            sync.registerChange = function() {
                console.log("Change detected in " + model.list.title + ' list.');
                sync.lastUpdate.$set(Firebase.ServerValue.TIMESTAMP);
            };

            //Container to hold all current subscriptions
            sync.subscriptions = [];

            //Allows controller to be notified when change is made
            sync.subscribeToChanges = function(callback) {
                if(sync.subscriptions.indexOf(callback) === -1 ) {
                    //Only register new subscriptions
                    sync.subscriptions.push(callback);
                }
            };

            //Fired when anyone changes a list item
            sync.lastUpdate.$on("change", function() {
                if(_.isFunction(updateQuery)) {
                    updateQuery.then(function() {
                        _.each(sync.subscriptions, function(callback) {
                            console.log("Processing callback");
                            if(_.isFunction(callback)) {
                                callback();
                            }
                        });
                    });
                }
            });
            return sync;
        }

        return {
            synchronizeData: synchronizeData
        };
    });