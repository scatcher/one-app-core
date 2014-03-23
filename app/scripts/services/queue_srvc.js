'use strict';

angular.module('OneApp')
    .service('queueService', function () {

        var counter = 0;
        var increase = function ()
        {
            counter++;
            notifyObservers();
            return counter;
        };
        var decrease = function ()
        {
            if (counter > 0)
            {
                counter--;
                notifyObservers();
                return counter;
            }
        };

        var reset = function ()
        {
            counter = 0;
            notifyObservers();
            return counter;
        };

        var observerCallbacks = [];

        /** Register an observer */
        var registerObserverCallback = function(callback){
            observerCallbacks.push(callback);
        };

        /** call this when queue changes */
        var notifyObservers = function(){
            angular.forEach(observerCallbacks, function(callback){
                callback(counter);
            });
        };

        return {
            count: counter,
            decrease: decrease,
            increase: increase,
            registerObserverCallback: registerObserverCallback,
            reset: reset
        };
    });