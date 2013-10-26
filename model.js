'use strict';

angular.module('OneApp')
    .factory('modelFactory', ['$q', '$timeout', 'config','utility','dataService',
        function($q, $timeout, config, utility, dataService) {
        /**
         * Decorates field with optional defaults
         * @param definition
         * @returns {Field}
         * @constructor
         */
        function Field(obj) {
            var defaults = {
                readOnly: false,
                objectType: 'Text'
            };
            var field = _.extend({}, defaults,  obj);
            field.displayName = field.displayName || utility.fromCamelCase(field.mappedName);
            return field;
        }

        /**
         * Model Constructor
         * Provides the Following
         * - adds an empty "data" array
         * - adds an empty "queries" object
         * - adds a deferred obj "ready"
         * - builds "model.list" with constructor
         * - adds "getAllListItems" function
         * - adds "addNewItem" function
         * @param {object} model *Required
         * @constructor
         */
        function Model(options) {
            var defaults = {
                data: [],
                queries: {},
                ready: $q.defer()
            };

            var model = _.extend({}, defaults,  options);
            model.dataService = dataService;
            model.list = new List(model.list);
            //Add a query to pull all list items
            model.queries.allListItems = new Query({
                operation: "GetListItems",
                listName: model.list.guid,
                CAMLViewFields: model.list.camlViewFields
            });

            /**
             * Inherited from Model constructor
             * Gets all list items in the current list, processes the xml, and adds the data to the model
             * Uses new deferred object instead of resolving model.ready
             * @returns {promise}
             */
            model.getAllListItems = function() {
                var deferred = $q.defer();
                dataService.initializeModel(model, model.queries.getAllListItems, {deferred: deferred})
                    .then(function(response){
                        deferred.resolve(response);
                    });
                return deferred.promise();
            };
            /**
             * Inherited from Model constructor
             * @param obj
             * @example {title: "Some Title", date: new Date()}
             * @returns {*}
             */
            model.addNewItem = function(obj) {
                return dataService.addUpdateItemModel(model,  obj);
            };



            return model;
        }

        /**
         * Constructor for creating a list item which inherits CRUD functionality that can be called directly from obj
         * @param {object} obj - List item
         * @param {object} model - Reference to the model
         * @param {object} dataService - Reference to DataService
         * @returns {ListItem}
         * @constructor
         */
        function ListItem(obj, model, dataService) {
            this.dataService = dataService;
            /**
             * Updates record directly from the object
             * @param {object} options - optionally pass params to the dataService
             * @returns {promise}
             */
            this.saveChanges = function(options) {
                return dataService.addUpdateItemModel(model, this, options);
            };
            /**
             * Deletes record directly from the object and removes record from user cache
             * @param {object} options - optionally pass params to the dataService
             * @returns {promise}
             */
            this.deleteItem = function() {
                return dataService.deleteItemModel(model,  this);
            };
            /**
             * Requests all attachments for the object
             * @param {object} options - optionally pass params to the dataService
             * @returns {promise} - containing attachment collection
             */
            this.getAttachmentCollection = function() {
                return dataService.getAttachmentCollectionModel(model, this);
            };

            return _.extend(this,  obj);
        }

        /**
         * List Object Constructor
         * @param obj.customFields  *Optional
         * @param obj.guid          *Required
         * @param obj.title         *Required
         * @constructor
         */
        function List(obj) {
            var defaults = {
                camlViewFields: '',
                customFields: [],
                isReady: false,
                fields: [],
                guid: '',
                mapping: {},
                title: '',
                webURL: config.defaultUrl
            };

            var list = _.extend({}, defaults,  obj);

            /**
             * Read only fields that should be included in all lists
             * @type {Array}
             */
            var defaultFields = [
                { internalName: "ID", objectType: "Counter", mappedName: "id", readOnly:true},
                { internalName: "Modified", objectType: "DateTime", mappedName: "modified", readOnly:true},
                { internalName: "Created", objectType: "DateTime", mappedName: "created", readOnly:true},
                { internalName: "Author", objectType: "User", sid: true, mappedName: "author", readOnly:true},
                { internalName: "Editor", objectType: "User", sid: true, mappedName: "editor", readOnly:true},
                { internalName: "PermMask", objectType: "Text", mappedName: "permMask", readOnly:true}
            ];

            /**
             * Constructs the field
             * - adds to camlViewField
             * - create ows_ mapping
             * @param fieldDefinition
             */
            var buildField = function(fieldDefinition) {
                var field = new Field(fieldDefinition);
                list.fields.push(field);
                list.camlViewFields += '<FieldRef Name="' + field.internalName + '"/>';
                list.mapping['ows_' + field.internalName] = { mappedName: field.mappedName, objectType: field.objectType };
            };

            /** Open camlViewFields */
            list.camlViewFields += '<ViewFields>';

            /** Add the default fields */
            _.each(defaultFields,  function(field) {
                buildField(field);
            });

            /** Add each of the fields defined in the model */
            _.each(list.customFields, function(field) {
                buildField(field);
            });

            /** Close camlViewFields */
            list.camlViewFields += '</ViewFields>';

            return list;
        }

        /**
         * Decorates query optional attributes
         * @param obj
         * @returns {Query}
         * @constructor
         */
        function Query(obj)
        {
            var defaults = {
                lastRun: null,              // the date/time last run
                webURL: config.defaultUrl,
                CAMLQueryOptions: '' +
                    '<QueryOptions>' +
                        '<IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>' +
                        '<IncludeAttachmentUrls>TRUE</IncludeAttachmentUrls>' +
                        '<IncludeAttachmentVersion>FALSE</IncludeAttachmentVersion>' +
                        '<ExpandUserField>FALSE</ExpandUserField>' +
                    '</QueryOptions>',
                CAMLQuery: '' +
                    '<Query>' +
                        '<OrderBy>' +
                            '<FieldRef Name="ID" Ascending="TRUE"/>' +
                        '</OrderBy>' +
                    '</Query>'
            };

            var query = _.extend({}, defaults, obj);

            return query;

        }

        return {
            ListItem: ListItem,
            Model: Model,
            Query: Query
        };
    }]);