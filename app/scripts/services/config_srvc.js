'use strict';

/**
* @ngdoc service
* @name configService
* @description
* Basic config for the application (unique for each environment)
*
*/
angular.module('spAngular')
    //TODO Move away from the config service and instead use the config constant
    .constant('spAngularConfig', {
        defaultUrl: $().SPServices.SPGetCurrentSite(),
        offline:
            window.location.href.indexOf('localhost') > -1 ||
            window.location.href.indexOf('http://0.') > -1 ||
            window.location.href.indexOf('http://10.') > -1 ||
            window.location.href.indexOf('http://192.') > -1

    })
    .service('configService', function (toastrConfig) {

        /** Set the default toast location */
        toastrConfig.positionClass = 'toast-bottom-right';

        /** Flag to use cached XML files from the app/dev folder */
        var offline = window.location.href.indexOf('localhost') > -1;

        return {
            appTitle: 'SP-Angular',
            debugEnabled: true,
            firebaseURL: "The url of your firebase source",
            offline: offline
        }
    });