'use strict';

/**Angular will instantiate this singleton by calling "new" on this function the first time it's referenced
 /* State will persist throughout life of session*/
angular.module('spAngular')
    .service('userFeedbackModel', function ($q, $modal, modelFactory) {

        /** Object Constructor (class)*/
        function UserFeedback(obj) {
            var self = this;
            _.extend(self, obj);
        }

        /********************* Model Definition ***************************************/

        /** Model Constructor */
        /** Adds "addNewItem" and "getAllListItems" to the model and ensures "data", "queries", and "ready" have been added */
        /** Also passes list to List constructor to build viewFields (XML definition of fields to return) */
        var model = new modelFactory.Model({
            data: [], /** By default, all newly constructed list items are pushed to this array */
            queries: {}, /** Stored queries for this data source */
            ready: $q.defer(),
            list: {
                title: 'UserFeedback', /**Maps to the offline XML file in dev folder (no spaces) */
                guid: '{69769FB9-E681-4AA4-97B2-57F5E2B6B302}', /**List GUID can be found in list properties in SharePoint designer */
                customFields: [
                /** Array of objects mapping each SharePoint field to a property on a list item object */
                /** If spAngular live templates have been imported type "oafield" followed by the tab key for
                 /*  each field to quickly map with available options */
                    //Ex: {internalName: "Title", objectType: "Text", mappedName: "title", readOnly: false}
                    {internalName: "Title", objectType: "Text", mappedName: "title", readOnly: false},
                    {internalName: "Description", objectType: "Text", mappedName: "description", readOnly: false},
                    {internalName: "Topic", objectType: "Text", mappedName: "topic", readOnly: false},
                    {internalName: "AssignedTo", objectType: "User", mappedName: "assignedToSID", readOnly: false}
                ]
            }
        });

        /** New List item is then passed to the object constructor for this data source to allow the addition
         /*  of any other custom methods or properties */
        model.factory = function (listItem) {
            return new UserFeedback(listItem);
        };

        /*********************************** Prototype Construction ***************************************/

        /** Inherit from master list item prototype */
        UserFeedback.prototype = new modelFactory.ListItem();
        /** Make the model directly accessible from the list item */
        UserFeedback.prototype.getModel = function () {
            return model;
        };

        /*********************************** Queries ***************************************/

        /**
         * This is the only query on this model we don't need to name it.  All records
         * will be returned in ascending order based on ID so we don't need to specify a
         * custom CAML query
         */
        model.registerQuery();

        /********************* Model Specific Shared Functions ***************************************/

        /**
         * Opens modal dialog to add/edit an link record
         * @param {object} userFeedbackRecord - defaults to a new record if missing
         * @returns {promise} // Success = saved or deleted, Failure = dismissed dialog
         */
        model.openModal = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modules/user_feedback/views/user_feedback_modal_view.html',
                controller: 'userFeedbackModalCtrl'
            });
            return modalInstance.result;
        };

        return model;
    });
