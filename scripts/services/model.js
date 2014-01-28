'use strict';

angular.module('OneApp')
    .factory('modelFactory', function ($q, $timeout, config, utility, dataService) {
        /**
         * Decorates field with optional defaults
         * @param definition
         * @returns {Field}
         * @constructor
         */
        function Field(obj) {
            var self = this;
            var defaults = {
                readOnly: false,
                objectType: 'Text'
            };
            _.extend(self, defaults, obj);
            self.displayName = self.displayName || utility.fromCamelCase(self.mappedName);
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
            var self = this;
            var defaults = {
                data: [],
                queries: {},
                ready: $q.defer()
            };

            _.extend(self, defaults, options);

            self.dataService = dataService;
            self.list = new List(self.list);
            //Add a query to pull all list items
            self.queries.allListItems = new Query({
                operation: "GetListItems",
                listName: self.list.guid,
                viewFields: self.list.viewFields
            });

            return self;
        }

        /**
         * Inherited from Model constructor
         * Gets all list items in the current list, processes the xml, and adds the data to the model
         * Uses new deferred object instead of resolving self.ready
         * @returns {promise}
         */
        Model.prototype.getAllListItems = function () {
            var deferred = $q.defer();
            dataService.initializeModel(this, this.queries.getAllListItems, {deferred: deferred})
                .then(function (response) {
                    deferred.resolve(response);
                });
            return deferred.promise();
        };

        /**
         * If online and sync is being used, notify all online users that a change has been made
         * @param {promise} Update event
         */
        function registerChange(self) {
            if(!config.offline && self.sync && _.isFunction(self.sync.registerChange)) {
                //Register change after successful update
                self.sync.registerChange();
            }
        }

        /**
         * Inherited from Model constructor
         * @param obj
         * @example {title: "Some Title", date: new Date()}
         * @returns {*}
         */
        Model.prototype.addNewItem = function (obj) {
            var self = this;
            var deferred = $q.defer();
            dataService.addUpdateItemModel(self, obj).then(function(response) {
                deferred.resolve(response);
                //Optionally broadcast change event
                registerChange(self);
            });

            return deferred.promise;
        };

        /**
         * Constructor for creating a list item which inherits CRUD functionality that can be called directly from obj
         * @param {object} obj - List item
         * @param {object} model - Reference to the model
         * @param {object} dataService - Reference to DataService
         * @returns {ListItem}
         * @constructor
         */
        function ListItem(obj, model) {
            var self = this;
            self.dataService = dataService;

            self.getDataService = function () {
                return dataService;
            };

            self.getModel = function () {
                return model;
            };

            _.extend(self, obj);
        }


        /**
         * Updates record directly from the object
         * @param {object} options - optionally pass params to the dataService
         * @returns {promise}
         */
        ListItem.prototype.saveChanges = function (options) {
            var self = this;
            var model = self.getModel();
            var deferred = $q.defer();

            dataService.addUpdateItemModel(model, self, options).then(function(response) {
                deferred.resolve(response);
                //Optionally broadcast change event
                registerChange(self);
            });

            return deferred.promise;
        };

        /**
         * Deletes record directly from the object and removes record from user cache
         * @param {object} options - optionally pass params to the dataService
         * @returns {promise}
         */
        ListItem.prototype.deleteItem = function () {
            var self = this;
            var model = self.getModel();
            var deferred = $q.defer();

            dataService.deleteItemModel(model, self).then(function(response) {
                deferred.resolve(response);
                //Optionally broadcast change event
                registerChange(self);
            });

            return deferred.promise;
        };

        /**
         * Requests all attachments for the object
         * @param {object} options - optionally pass params to the dataService
         * @returns {promise} - containing attachment collection
         */
        ListItem.prototype.getAttachmentCollection = function () {
            return dataService.getAttachmentCollectionModel(this.getModel(), this);
        };

        /**
         * Delete an attachment using the attachment url
         * @param {object} options - optionally pass params to the dataService
         * @returns {promise} - containing attachment collection
         */
        ListItem.prototype.deleteAttachment = function (url) {
            var self = this;
            return dataService.deleteAttachment({
                listItemId: self.id,
                url: url,
                listName: self.getModel().list.guid
            });
        };

        /**
         * @returns {Object} Contains properties for each permission level evaluated for current user(true | false)
         */
        ListItem.prototype.resolvePermissions = function () {
            return resolvePermissions(this);
        };


        /**
         * Returns the version history for a specific field
         * @fieldNames {array} the js mapped name of the fields (ex: [title])
         * @returns {promise} - containing array of changes
         */
        ListItem.prototype.getFieldVersionHistory = function (fieldNames) {
            var deferred = $q.defer();
            var promiseArray = [];
            var self = this;
            var model = this.getModel();

            //Creates a promise for each field
            var createPromise = function (fieldName) {

                var fieldDefinition = _.findWhere(model.list.fields, {mappedName: fieldName});

                var payload = {
                    operation: "GetVersionCollection",
                    webURL: config.defaultUrl,
                    strlistID: model.list.title,
                    strlistItemID: self.id,
                    strFieldName: fieldDefinition.internalName
                };

                promiseArray.push(dataService.getFieldVersionHistory(payload, fieldDefinition));
            };

            if (!_.isArray(fieldNames)) {
                fieldNames = [fieldNames];
            }

            //Generate promises for each field
            _.each(fieldNames, function (fieldName) {
                createPromise(fieldName);
            });


            //Pause until everything is resolved
            $q.all(promiseArray).then(function (changes) {
                var versionHistory = {};

                //All fields should have the same number of versions
                _.each(changes, function (fieldVersions) {

                    _.each(fieldVersions, function (fieldVersion) {
                        if (!versionHistory[fieldVersion.modified.toJSON()]) {
                            versionHistory[fieldVersion.modified.toJSON()] = {};
                        }
                        //Add field to the version history for this version
                        _.extend(versionHistory[fieldVersion.modified.toJSON()], fieldVersion);
                    });
                });

                var versionArray = [];
                //Add a version prop on each version to identify the numeric sequence
                _.each(versionHistory, function (ver, num) {
                    ver.version = num;
                    versionArray.push(ver);
                });

                console.log(versionArray);
                deferred.resolve(versionArray);
            });

            return deferred.promise;
        };

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

            var list = _.extend({}, defaults, obj);

            /**
             * Read only fields that should be included in all lists
             * @type {Array}
             */
            var defaultFields = [
                { internalName: "ID", objectType: "Counter", mappedName: "id", readOnly: true},
                { internalName: "Modified", objectType: "DateTime", mappedName: "modified", readOnly: true},
                { internalName: "Created", objectType: "DateTime", mappedName: "created", readOnly: true},
                { internalName: "Author", objectType: "User", sid: true, mappedName: "author", readOnly: true},
                { internalName: "Editor", objectType: "User", sid: true, mappedName: "editor", readOnly: true},
                { internalName: "PermMask", objectType: "Text", mappedName: "permMask", readOnly: true}
            ];

            /**
             * Constructs the field
             * - adds to viewField
             * - create ows_ mapping
             * @param fieldDefinition
             */
            var buildField = function (fieldDefinition) {
                var field = new Field(fieldDefinition);
                list.fields.push(field);
                list.viewFields += '<FieldRef Name="' + field.internalName + '"/>';
                list.mapping['ows_' + field.internalName] = { mappedName: field.mappedName, objectType: field.objectType };
            };

            /** Open viewFields */
            list.viewFields += '<ViewFields>';

            /** Add the default fields */
            _.each(defaultFields, function (field) {
                buildField(field);
            });

            /** Add each of the fields defined in the model */
            _.each(list.customFields, function (field) {
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
        function Query(obj) {
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
            var mapping = [
                ["query", "CAMLQuery"],
                ["viewFields", "CAMLViewFields"],
                ["rowLimit", "CAMLRowLimit"],
                ["queryOptions", "CAMLQueryOptions"],
                ["listItemID", "ID"]
            ];

            _.each(mapping, function (map) {
                if (query[map[0]] && !query[map[1]]) {
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
         * @see http://spservices.codeplex.com/discussions/208708
         */
        function resolvePermissions(listItem) {
            var permissionsMask = listItem.permMask;
            var permissionSet = {};
            permissionSet.ViewListItems = (1 & permissionsMask) > 0;
            permissionSet.AddListItems = (2 & permissionsMask) > 0;
            permissionSet.EditListItems = (4 & permissionsMask) > 0;
            permissionSet.DeleteListItems = (8 & permissionsMask) > 0;
            permissionSet.ApproveItems = (16 & permissionsMask) > 0;
            permissionSet.OpenItems = (32 & permissionsMask) > 0;
            permissionSet.ViewVersions = (64 & permissionsMask) > 0;
            permissionSet.DeleteVersions = (128 & permissionsMask) > 0;
            permissionSet.CancelCheckout = (256 & permissionsMask) > 0;
            permissionSet.PersonalViews = (512 & permissionsMask) > 0;

            permissionSet.ManageLists = (2048 & permissionsMask) > 0;
            permissionSet.ViewFormPages = (4096 & permissionsMask) > 0;

            permissionSet.Open = (permissionsMask & 65536) > 0;
            permissionSet.ViewPages = (permissionsMask & 131072) > 0;
            permissionSet.AddAndCustomizePages = (permissionsMask & 262144) > 0;
            permissionSet.ApplyThemeAndBorder = (permissionsMask & 524288) > 0;
            permissionSet.ApplyStyleSheets = (1048576 & permissionsMask) > 0;
            permissionSet.ViewUsageData = (permissionsMask & 2097152) > 0;
            permissionSet.CreateSSCSite = (permissionsMask & 4194314) > 0;
            permissionSet.ManageSubwebs = (permissionsMask & 8388608) > 0;
            permissionSet.CreateGroups = (permissionsMask & 16777216) > 0;
            permissionSet.ManagePermissions = (permissionsMask & 33554432) > 0;
            permissionSet.BrowseDirectories = (permissionsMask & 67108864) > 0;
            permissionSet.BrowseUserInfo = (permissionsMask & 134217728) > 0;
            permissionSet.AddDelPrivateWebParts = (permissionsMask & 268435456) > 0;
            permissionSet.UpdatePersonalWebParts = (permissionsMask & 536870912) > 0;
            permissionSet.ManageWeb = (permissionsMask & 1073741824) > 0;
            permissionSet.UseRemoteAPIs = (permissionsMask & 137438953472) > 0;
            permissionSet.ManageAlerts = (permissionsMask & 274877906944) > 0;
            permissionSet.CreateAlerts = (permissionsMask & 549755813888) > 0;
            permissionSet.EditMyUserInfo = (permissionsMask & 1099511627776) > 0;
            permissionSet.EnumeratePermissions = (permissionsMask & 4611686018427387904) > 0;
            permissionSet.FullMask = (permissionsMask == 9223372036854775807);

            //Full Mask only resolves correctly for the Full Mask level
            // because so in that case set everything to true
            if (permissionSet.FullMask) {
                _.each(permissionSet, function (perm, key) {
                    permissionSet[key] = true;
                });
            }

            return permissionSet;

        }

        return {
            resolvePermissions: resolvePermissions,
            ListItem: ListItem,
            Model: Model,
            Query: Query
        };
    });