'use strict';

angular.module('OneApp', [
        //Angular Components
        'ngAnimate',
        'ngResource',
        'ngSanitize',
        'ngAnimate',

        //Angular UI
        'ui.bootstrap',
        'ui.calendar',
        'ui.date',
        'ui.select2',
        'ui.highlight',
        'ui.sortable',
        'ui.router',

        //Other Vendor
        'ngTable',
        'ngCkeditor',
        'firebase',
        'googlechart',
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

            //Project Details
            .state('projects', {
                resolve:{
                    sharedProjectScope:  function(){
                        return {};
                    }
                },
                abstract: true,
                url: "/projects/:projectId",
                // Note: abstract still needs a ui-view for its children to populate.
                // You can simply add it inline here.
                templateUrl: "modules/projects/views/projects_container_view.html",
                controller: "projectContainerCtrl"
            })

            //Project Details
            .state('projects.summary', {
                url: "",
                templateUrl: "modules/projects/views/project_summary_view.html",
                controller: "projectSummaryCtrl"
            })

            //Specification Requirements
            .state('projects.specificationrequirements', {
                url: "/specificationrequirements",
                templateUrl: 'views/requirement_list_view.html',
                controller: "specificationRequirementsCtrl"
            })

            //Capability Requirements
            .state('projects.capabilityrequirements', {
                url: "/capabilityrequirements",
                templateUrl: 'views/requirement_list_view.html',
                controller: 'capabilityRequirementsCtrl'
            })

            //Events
            .state('projects.events', {
                url: "/events",
                templateUrl: 'modules/events/views/events_view.html',
                controller: 'eventsCtrl'
            })

            //Requirements Trace
            .state('projects.trace', {
                url: "/tracerequirements/:capabilityId",
                templateUrl: 'modules/trace_requirements/views/trace_requirements_view.html',
                controller: 'traceRequirementsCtrl'
            })

            //Requirements Documents
            .state('projects.documents', {
                url: "/documents",
                templateUrl: 'modules/projects/views/project_documents_view.html',
                controller: 'projectDocumentsCtrl'
            })

            //Generate Attributes
            .state('projects.generateattributes', {
                url: "/generateattributes",
                templateUrl: 'modules/generate_attributes/views/generate_attributes_view.html',
                controller: "generateAttributesCtrl"
            })

            //Project Config
            .state('projects.config', {
                url: "/config",
                templateUrl: 'modules/projects/views/project_config_view.html',
                controller: 'projectConfigCtrl'
            })


//            //Capability Requirements
//            .state('projects.capabilityrequirementdetails', {
//                url: "/capabilityrequirements/:requirementId",
//                templateUrl: 'modules/cap_requirements/views/cap_requirement_details_view.html',
//                controller: 'capabilityRequirementDetailsCtrl'
//            })

            //Tasker
            .state('tasker', {
                url: "/tasker",
                templateUrl: 'modules/tasker/views/tasker_view.html',
                controller: 'taskerCtrl'
            })

            //Admin Controls
            .state('findmyfriends', {
                url: "/find_my_friends",
                templateUrl: 'modules/find_my_friends/views/find_my_friends_view.html',
                controller: 'findMyFriendsCtrl'
            })


            //Group Manager
            .state('groupmanager', {
                url: "/group_manager",
                templateUrl: 'bower_components/one-app-core/modules/group_manager/views/group_manager_view.html',
                controller: 'groupManagerCtrl'
            })

            //Offline
            .state('offline', {
                url: "/offline",
                templateUrl: 'bower_components/one-app-core/modules/dev/views/generate_offline_view.html',
                controller: 'generateOfflineCtrl'
            })

    })
//    .config(function ($routeProvider) {
//        $routeProvider
//            //Empty route
//            .when('/', {
//                templateUrl: 'modules/main/views/main_view.html',
//                controller: 'mainCtrl'
//            })
//
//            //Main
//            .when('/main', {
//                templateUrl: 'modules/main/views/main_view.html',
//                controller: 'mainCtrl'
//            })
//
//
//            //Project Details
//            .when('/projects/:projectId', {
//                templateUrl: 'modules/projects/views/project_view.html',
//                controller: 'projectCtrl'
//            })
//
//
//            //Requirements
//            .when('/projects/:projectId/specificationrequirements', {
//                templateUrl: 'modules/spec_requirements/views/spec_requirements_view.html',
//                controller: 'specificationRequirementsCtrl',
//                reloadOnSearch: false
//            })
//            .when('/projects/:projectId/capabilityrequirements', {
//                templateUrl: 'modules/cap_requirements/views/cap_requirements_view.html',
//                controller: 'capabilityRequirementsCtrl',
//                reloadOnSearch: false
//            })
//            .when('/projects/:projectId/capabilityrequirements/:requirementId', {
//                templateUrl: 'modules/cap_requirements/views/cap_requirement_details_view.html',
//                controller: 'capabilityRequirementDetailsCtrl',
//                reloadOnSearch: false
//            })
//
//
//            //Admin Controls
//            .when('/find_my_friends', {
//                templateUrl: 'modules/find_my_friends/views/find_my_friends_view.html',
//                controller: 'findMyFriendsCtrl'
//            })
//
//
//            /** Development Support Routes **/
//            .when('/group_manager', {
//                templateUrl: 'bower_components/one-app-core/modules/group_manager/views/group_manager_view.html',
//                controller: 'groupManagerCtrl'
//            })
//            // Group Manager
//            .when('/group_manager', {
//                templateUrl: 'bower_components/one-app-core/modules/group_manager/views/group_manager_view.html',
//                controller: 'groupManagerCtrl'
//            })
//            .when('/offline', {
//                templateUrl: 'bower_components/one-app-core/modules/dev/views/generate_offline_view.html',
//                controller: 'generateOfflineCtrl'
//            })
//            .when('/tasker', {
//                templateUrl: 'modules/tasker/views/tasker_view.html',
//                controller: 'taskerCtrl'
//            })
////            .when('/upload', {
////                templateUrl: 'modules/upload/upload.html',
////                controller: 'oaUploadCtrl'
////            })
//
//            /** Route to use if no matching route found **/
//            .otherwise({
//                redirectTo: '/'
//            });
//    })
    .run(function(userModel) {
        console.log("Injector done loading all modules.");
    });

