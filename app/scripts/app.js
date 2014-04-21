'use strict';

angular.module('spAngular', [
//        //Angular Components
//        'ngAnimate',
//        'ngResource',
//        'ngSanitize',
//        'ngAnimate',

        //Angular UI
        'ui.bootstrap',
//        'ui.calendar',
//        'ui.date',
//        'ui.select2',
//        'ui.highlight',
//        'ui.sortable',
        'ui.router',

        //Other Vendor
        'ngTable',
//        'ngCkeditor',
        'firebase',
//        'googlechart',
        'angularSpinner',
        'toastr'
    ])
    .config(function ($stateProvider, $urlRouterProvider) {

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/");

        // Now set up the states
        $stateProvider
            .state('home', {
                url: "/",
                templateUrl: "modules/main/views/main_view.html",
                controller: "mainCtrl"
            })

            //Group Manager
            .state('groupmanager', {
                url: "/group_manager",
                templateUrl: 'bower_components/sp-angular/modules/group_manager/views/group_manager_view.html',
                controller: 'groupManagerCtrl'
            })

            //Offline
            .state('offline', {
                url: "/offline",
                templateUrl: 'bower_components/sp-angular/modules/dev/views/generate_offline_view.html',
                controller: 'generateOfflineCtrl'
            })

    })
    .run(function() {
        console.log("Injector done loading all modules.");
    });

