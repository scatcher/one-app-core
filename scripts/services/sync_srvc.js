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
                console.log("Change detected in " + model.list.title + ' list.');
                var timeStamp = Firebase.ServerValue.TIMESTAMP;
                sync.lastUpdate.$set(timeStamp);
            };

            //Container to hold all current subscriptions
            sync.subscriptions = [];

            //Running counter of the number of changes
            sync.changeCount = 0;

            sync.processChanges = function() {
                //Prevent from running the first time
                if(sync.changeCount > 0) {
                    model.updateData().then(function() {
                        _.each(sync.subscriptions, function(callback) {
                            console.log("Processing callback");
                            if(_.isFunction(callback)) {
                                callback();
                            }
                        });
                    });
                }

                sync.changeCount += 1;
            };

            /** Don't make a call more than once every 10 seconds */
            sync.throttleRequests = _.throttle(function() {return sync.processChanges() }, 10000);

            //Fired when anyone updates a requirement
            sync.lastUpdate.$on("change", function(newVal, oldVal) {
                sync.throttleRequests();
            });



            //Allows controller to be notified when change is made
            sync.subscribeToChanges = function (callback) {
                if (sync.subscriptions.indexOf(callback) === -1) {
                    //Only register new subscriptions
                    sync.subscriptions.push(callback);
                }
            };

            console.timeEnd("Sync Service");

            return sync;
        }

        return {
            synchronizeData: synchronizeData
        };
    });