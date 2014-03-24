'use strict';

/**Angular will instantiate this singleton by calling "new" on this function the first time it's referenced
 /* State will persist throughout life of session*/
angular.module('OneApp')
    .service('bannerTextModel', function ($rootScope, $q, modelFactory, configService, dataService) {

        /** Object Constructor (class)*/
        function BannerText(obj) {
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
                title: 'BannerText', /**Maps to the offline XML file in dev folder (no spaces) */
                guid: '{7F6C6FC6-530B-44C3-A9F6-632D89754037}', /**List GUID can be found in list properties in SharePoint designer */
                customFields: [
                /** Array of objects mapping each SharePoint field to a property on a list item object */
                /** If OneApp live templates have been imported type "oafield" followed by the tab key for
                 /*  each field to quickly map with available options */
                    //Ex: {internalName: "Title", objectType: "Text", mappedName: "title", readOnly: false}
                    { internalName: "Title", objectType: "Text", mappedName: "title", readOnly:false },
                    { internalName: "SortOrder", objectType: "Text", mappedName: "sortOrder", readOnly:false },
                    { internalName: "Text", objectType: "Text", mappedName: "text", readOnly:false },
                    { internalName: "LookupTest", objectType: "Lookup", mappedName: "lookupTest", readOnly:false }
                ]
            }
        });

        /** New List item is then passed to the object constructor for this data source to allow the addition
         /*  of any other custom methods or properties */
        model.factory = function (listItem) {
            return new BannerText(listItem);
        };

        /*********************************** Prototype Construction ***************************************/

        /** Inherit from master list item prototype */
        BannerText.prototype = new modelFactory.ListItem();
        /** Make the model directly accessible from the list item */
        BannerText.prototype.getModel = function () {
            return model;
        };

        /*********************************** Queries ***************************************/

        /** Fetch data (pulls local xml if offline named model.list.title + '.xml')
         *  Initially pulls all requested data.  Each subsequent call just pulls records that have been changed,
         *  updates the model, and returns a reference to the updated data array
         * @returns {Array} Requested list items
         */
        model.registerQuery({
            query: '' +
            '<Query>' +
            '   <OrderBy>' +
            '       <FieldRef Name="SortOrder" Ascending="TRUE"/>' +
            '   </OrderBy>' +
            '</Query>'
        });


        /********************* Model Specific Shared Functions ***************************************/

        return model;
    });