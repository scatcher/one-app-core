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
                viewFields: model.list.viewFields
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
            var self = this;
            self.dataService = dataService;
            /**
             * Updates record directly from the object
             * @param {object} options - optionally pass params to the dataService
             * @returns {promise}
             */
            self.saveChanges = function(options) {
                return dataService.addUpdateItemModel(model, this, options);
            };
            /**
             * Deletes record directly from the object and removes record from user cache
             * @param {object} options - optionally pass params to the dataService
             * @returns {promise}
             */
            self.deleteItem = function() {
                return dataService.deleteItemModel(model,  this);
            };
            /**
             * Requests all attachments for the object
             * @param {object} options - optionally pass params to the dataService
             * @returns {promise} - containing attachment collection
             */
            self.getAttachmentCollection = function() {
                return dataService.getAttachmentCollectionModel(model, this);
            };

            /**
             * @returns {Object} Contains properties for each permission level evaluated for current user(true | false)
             */
            self.resolvePermissions = function() {
                return resolvePermissions(self);
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
                viewFields: '',
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
             * - adds to viewField
             * - create ows_ mapping
             * @param fieldDefinition
             */
            var buildField = function(fieldDefinition) {
                var field = new Field(fieldDefinition);
                list.fields.push(field);
                list.viewFields += '<FieldRef Name="' + field.internalName + '"/>';
                list.mapping['ows_' + field.internalName] = { mappedName: field.mappedName, objectType: field.objectType };
            };

            /** Open viewFields */
            list.viewFields += '<ViewFields>';

            /** Add the default fields */
            _.each(defaultFields,  function(field) {
                buildField(field);
            });

            /** Add each of the fields defined in the model */
            _.each(list.customFields, function(field) {
                buildField(field);
            });

            /** Close viewFields */
            list.viewFields += '</ViewFields>';

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
                queryOptions: '' +
                    '<QueryOptions>' +
                        '<IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>' +
                        '<IncludeAttachmentUrls>TRUE</IncludeAttachmentUrls>' +
                        '<IncludeAttachmentVersion>FALSE</IncludeAttachmentVersion>' +
                        '<ExpandUserField>FALSE</ExpandUserField>' +
                    '</QueryOptions>',
                query: '' +
                    '<Query>' +
                        '<OrderBy>' +
                            '<FieldRef Name="ID" Ascending="TRUE"/>' +
                        '</OrderBy>' +
                    '</Query>'
            };
            var query = _.extend({}, defaults, obj);

            //Mapping of SharePoint properties to SPServices properties
            var mapping = [["query", "CAMLQuery"], ["viewFields", "CAMLViewFields"], ["rowLimit", "CAMLRowLimit"], ["queryOptions", "CAMLQueryOptions"],["listItemID", "ID"]];

            _.each(mapping, function(map) {
                if(query[map[0]] && !query[map[1]]) {
                    //Ensure SPServices properties are added in the event the true property name is used
                    query[map[1]] = query[map[0]];
                }
            });

            return query;
        }

        /**
         * @description Converts permMask into something usable to determine permission level for current user
         * @param {object} listItem (needs a permMask property)
         * @returns {object} property for each permission level identifying if current user has rights (true || false)
         * @see http://sympmarc.com/2009/02/03/permmask-in-sharepoint-dvwps/
         */
        function resolvePermissions(listItem) {
            var resolvedPermissions = {};
            var listPermissions = {
                //Allow viewing of list items in lists, documents in document libraries, and Web discussion comments.
                viewListItems: {
                    mask: '0x0000000000000001',
                    significantDigit: 17
                },
                //Allow addition of list items to lists, documents to document libraries, and Web discussion comments.
                addListItems: {
                    mask: '0x0000000000000002',
                    significantDigit: 17
                },
                //Allow editing of list items in lists, documents in document libraries, Web discussion comments, and
                // to customize Web part pages in document libraries.
                editListItems: {
                    mask: '0x0000000000000004',
                    significantDigit: 17
                },
                //Allow deletion of list items from lists, documents from document libraries, and Web discussion comments.
                deleteListItems: {
                    mask: '0x0000000000000008',
                    significantDigit: 17
                },
                //Allow approval of minor versions of a list item or document.
                approveItems: {
                    mask: '0x0000000000000010',
                    significantDigit: 16
                },
                //Allow viewing the source of documents with server-side file handlers.
                openItems: {
                    mask: '0x0000000000000020',
                    significantDigit: 16
                },
                //Allow viewing of past versions of a list item or document.
                viewVersions: {
                    mask: '0x0000000000000040',
                    significantDigit: 16
                },
                //Allow deletion of past versions of a list item or document.
                deleteVersions: {
                    mask: '0x0000000000000080',
                    significantDigit: 16
                },
                //Allow discard or check in of a document that is checked out to another user.
                cancelCheckout: {
                    mask: '0x0000000000000100',
                    significantDigit: 15
                },
                //Allow creation, change, and deletion of personal views of lists.
                managePersonalViews: {
                    mask: '0x0000000000000200',
                    significantDigit: 15
                },
                //Allow creation and deletion of lists, addition or removal of fields to the schema of a list, and
                // addition or removal of personal views of a list.
                manageLists: {
                    mask: '0x0000000000000800',
                    significantDigit: 15
                },
                //Allow viewing of forms, views, and application pages, and enumerate lists.
                viewFormPages: {
                    mask: '0x0000000000001000',
                    significantDigit: 14
                },
                //You own the world!!!
                fullControl: {
                    mask: '0x7FFFFFFFFFFFFFFF',
                    significantDigit: 17
                }
            };

            //Ensure an object is passed in and it has a permMask property
            if(!_.isObject(listItem) || !listItem.permMask) {
                console.log("Error: An object with a permMask property wasn't found.");
                _.each(listPermissions, function(value, key) {
                    resolvedPermissions[key] = false;
                });
                //Return an obejct with all permissions set to false: break
                return resolvedPermissions;
            }

            //Check first to see if user has full rights
            if(listItem.permMask[17] === 'F' || listItem.permMask[17] === 'f') {
                //User has full permissions so return true for all
                _.each(listPermissions, function(value, key) {
                    resolvedPermissions[key] = true;
                });
                //No need to go further, break
                return resolvedPermissions;
            }

            _.each(listPermissions, function(perm, key) {
                //Get the digit at the index set in significant digit
                var significantDigitValue = parseInt(listItem.permMask[perm.significantDigit]);
                //Get the digit in the mask to compare to the value passed in
                var maskValue = parseInt(perm.mask[perm.significantDigit]);
                if(maskValue === 'F' || maskValue === 'f') {
                    //User doesn't have full rights because they wouldn't have made it this far
                    resolvedPermissions[key] = false;
                } else {
                    //set property to output of evaluation
                    resolvedPermissions[key] = significantDigitValue >= parseInt(perm.mask[perm.significantDigit]);
                }
            });
            return resolvedPermissions;

        }

        return {
            resolvePermissions: resolvePermissions,
            ListItem: ListItem,
            Model: Model,
            Query: Query
        };
    }]);