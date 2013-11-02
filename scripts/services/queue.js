'use strict';

angular.module('OneApp')
    .service('queue', function queue() {
        // AngularJS will instantiate a singleton by calling "new" on this function
        //Create a queue
        var counter = 0;
        var increase = function ()
        {
            counter++;
            console.log("Async Queue: " + counter);
            notifyObservers();
            return counter;
        };
        var decrease = function ()
        {
            if (counter > 0)
            {
                counter--;
                console.log("Async Queue: " + counter);
                notifyObservers();
                return counter;
            }
        };

        var reset = function ()
        {
            counter = 0;
            console.log("Async Queue reset to: " + counter);
            notifyObservers();
            return counter;
        };

        var observerCallbacks = [];

        //register an observer
        var registerObserverCallback = function(callback){
            observerCallbacks.push(callback);
        };

        //call this when queue changes
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