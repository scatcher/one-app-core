'use strict';

angular.module('OneApp')
    .factory('modelFactory', function ($q, $timeout, configService, dataService, fieldService) {

        var defaultQueryName = 'primary';

        /** In the event that a factory isn't specified, just use a
         * standard constructor to allow it to inherit from ListItem */
        var StandardListItem = function (item) {
            var self = this;
            _.extend(self, item);
        };

        /**
         * Model Constructor
         * Provides the Following
         * - adds an empty "data" array
         * - adds an empty "queries" object
         * - adds a deferred obj "ready"
         * - builds "model.list" with constructor
         * - adds "getAllListItems" function
         * - adds "addNewItem" function
         * @param {object} options
         * @constructor
         */
        function Model(options) {
            var self = this;
            var defaults = {
                data: [],
                factory: StandardListItem,
                /** Date/Time of last communication with server */
                lastServerUpdate: null,
                queries: {}
            };

            _.extend(self, defaults, options);

            /** Use list constructor to decorate */
            self.list = new List(self.list);

            /** Set the constructor's prototype to inherit from ListItem so we can inherit functionality */
            self.factory.prototype = new ListItem();

            /** Make the model directly accessible from the list item */
            self.factory.prototype.getModel = function () {
                return self;
            };

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
            dataService.executeQuery(this, this.queries.getAllListItems, {deferred: deferred})
                .then(function (response) {
                    deferred.resolve(response);
                });
            return deferred.promise();
        };

        /**
         * If online and sync is being used, notify all online users that a change has been made
         * @param {object} model event
         */
        function registerChange(model) {
            if (!configService.offline && model.sync && _.isFunction(model.sync.registerChange)) {
                /** Register change after successful update */
                model.sync.registerChange();
            }
        }

        /**
         * Creates a new list item in SharePoint
         * @param {object} entity - Contains attribute to use in the creation of the new list item
         * @param {object} [options] - Pass additional options to the data service.
         * @example {title: "Some Title", date: new Date()}
         * @returns {promise}
         */
        Model.prototype.addNewItem = function (entity, options) {
            var self = this;
            var deferred = $q.defer();
            dataService.addUpdateItemModel(self, entity, options).then(function (response) {
                deferred.resolve(response);
                /** Optionally broadcast change event */
                registerChange(self);
            });

            return deferred.promise;
        };

        /**
         * Constructor that allows us create a static query with a reference to the parent model
         * @param {object} [queryOptions]
         * @param {string} [queryOptions.name=defaultQueryName]
         * @returns {Query}
         */
        Model.prototype.registerQuery = function (queryOptions) {
            var model = this;

            var defaults = {
                /** If name isn't set, assume this is the only model and designate as primary */
                name: defaultQueryName
            };

            queryOptions = _.extend({}, defaults, queryOptions);

            model.queries[queryOptions.name] = new Query(queryOptions, this);

            /** Return the newly created query */
            return model.queries[queryOptions.name];
        };

        /**
         * Helper function that attempts to locate and return a reference to the requested or catchall query
         * @param {string} [queryName=defaultQueryName] - A unique key to identify this query
         * @returns {object} query
         */
        Model.prototype.getQuery = function (queryName) {
            var model = this, query;
            if (_.isObject(model.queries[queryName])) {
                /** The named query exists */
                query = model.queries[queryName];
            } else if (_.isObject(model.queries[defaultQueryName]) && !queryName) {
                /** A named query wasn't specified and the catchall query exists */
                query = model.queries[defaultQueryName];
            } else {
                /** Requested query not found */
                query = undefined;
            }
            return query;
        };

        /**
         * Helper function that return the local cache for a named query if provided, otherwise
         * it returns the cache for the primary query for the model
         * @param {string} [queryName]
         * @returns {Array}
         */
        Model.prototype.getCache = function (queryName) {
            var model = this, query, cache;
            query = model.getQuery(queryName);
            if (query && query.cache) {
                cache = query.cache;
            }
            return cache;
        };

        /**
         * Reference to the function which executes a query
         * @param {string} [queryName=defaultQueryName] - A unique key to identify this query
         * @returns {function}
         */
        Model.prototype.executeQuery = function (queryName) {
            var model = this;
            var query = model.getQuery(queryName);
            if (query) {
                return query.execute();
            }
        };

        /**
         * Methods which allows us to easily determine if we've successfully made any queries this session
         * @returns {boolean}
         */
        Model.prototype.isInitialised = function () {
            return _.isDate(this.lastServerUpdate);
        };

        /**
         * @description Search functionality that allow for deeply searching an array of objects for the first
         * record matching the supplied value.  Additionally it maps indexes to speed up future calls.  It
         * currently rebuilds the mapping when the length of items in the local cache has changed or when the
         * rebuildIndex flag is set.
         *
         * @param {*|[*]} value - The value or array of values to compare against
         * @param {object} [options]
         * @param {string} [options.propertyPath] - The dot separated propertyPath.
         * @param {object} [options.cacheName] - Required if using a data source other than primary cache.
         * @param {object} [options.localCache] - Array of objects to search (Default model.getCache()).
         * @param {boolean} [options.rebuildIndex] - Set to ignore previous index and rebuild
         */
        Model.prototype.searchLocalCache = function (value, options) {
            var model = this;
            var self = model.searchLocalCache;

            var response;

            var defaults = {
                propertyPath: 'id',
                localCache: model.getCache(),
                cacheName: 'main',
                rebuildIndex: false
            };

            /** Extend defaults with any provided options */
            var opts = _.extend({}, defaults, options);

            /** Create a cache if it doesn't already exist */
            self.indexCache = self.indexCache || {};
            self.indexCache[opts.cacheName] = self.indexCache[opts.cacheName] || {};
            var cache = self.indexCache[opts.cacheName];


            var properties = opts.propertyPath.split('.');
            _.each(properties, function (attribute) {
                cache[attribute] = cache[attribute] || {};
                /** Update cache reference to another level down the cache object */
                cache = cache[attribute];
            });

            cache.map = cache.map || [];
            /** Remap if no existing map, the number of items in the array has changed, or the rebuild flag is set */
            if (!_.isNumber(cache.count) || cache.count !== opts.localCache.length || opts.rebuildIndex) {
                cache.map = _.deepPluck(opts.localCache, opts.propertyPath);
                /** Store the current length of the array for future comparisons */
                cache.count = opts.localCache.length;
            }

            /** Allow an array of values to be passed in */
            if (_.isArray(value)) {
                response = [];
                _.each(value, function (key) {
                    response.push(opts.localCache[cache.map.indexOf(key)]);
                });
            } else {
                response = opts.localCache[cache.map.indexOf(value)];
            }

            return response;
        };

        /**
         * @description Creates an object using the editable fields from the model, all attributes are empty
         * @param {object} overrides - Optionally extend the new item with specific values.
         * @returns {object}
         */
        Model.prototype.createEmptyItem = function (overrides) {
            var self = this;
            var newItem = {};
            _.each(self.list.customFields, function (fieldDefinition) {
                /** Create attributes for each non-readonly field definition */
                if (!fieldDefinition.readOnly) {
                    /** Create an attribute with the expected empty value based on field definition type */
                    newItem[fieldDefinition.mappedName] = fieldService.getDefaultValueForType(fieldDefinition.objectType);
                }
            });
            return _.extend({}, newItem, overrides);
        };

        /**
         * Generates n mock records for testing
         * @param {object} [options]
         * @param {number} [options.quantity=10] - The requested number of mock records
         * @param {string} [options.permissionLevel=FullMask] - Sets the mask on the mock records to simulate desired level
         * @param {boolean} [options.staticValue=false] - by default all mock data is dynamically created but if set, this will
         * cause static data to be used instead
         */
        Model.prototype.generateMockData = function (options) {
            var mockData = [],
                model = this;

            var defaults = {
                quantity: 10,
                staticValue: false,
                permissionLevel: 'FullMask'
            };

            /** Extend defaults with any provided options */
            var opts = _.extend({}, defaults, options);

            _.times(opts.quantity, function () {
                var mock = {};
                /** Create an attribute with mock data for each field */
                _.each(model.list.fields, function (field) {
                    mock[field.mappedName] = field.getMockData(opts);
                });
                /** Use the factory on the model to extend the object */
                mockData.push(new model.factory(mock));
            });
            return mockData;
        };

        /**
         * Constructor for creating a list item which inherits CRUD functionality that can be called directly from obj
         * @constructor
         */
        function ListItem() {
        }

        /**
         * Allows us to reference when out of scope
         * @returns {object}
         */
        ListItem.prototype.getDataService = function () {
            return dataService;
        };

        /**
         * Updates record directly from the object
         * @param {object} options - optionally pass params to the dataService
         * @returns {promise}
         */
        ListItem.prototype.saveChanges = function (options) {
            var self = this;
            var model = self.getModel();
            var deferred = $q.defer();

            dataService.addUpdateItemModel(model, self, options).then(function (response) {
                deferred.resolve(response);
                /** Optionally broadcast change event */
                registerChange(model);
            });

            return deferred.promise;
        };

        /**
         * @description Saves a named subset of fields back to SharePoint
         * Alternative to saving all fields
         * @param {array} fieldArray - array of internal field names that should be saved to SharePoint
         * @returns {promise}
         */
        ListItem.prototype.saveFields = function (fieldArray) {
            var self = this;
            var model = self.getModel();
            var deferred = $q.defer();
            var definitions = [];
            /** Find the field definition for each of the requested fields */
            _.each(fieldArray, function (field) {
                var match = _.findWhere(model.list.customFields, {mappedName: field});
                if (match) {
                    definitions.push(match);
                }
            });

            var valuePairs = dataService.generateValuePairs(definitions, self);

            dataService.addUpdateItemModel(model, self, {buildValuePairs: false, valuePairs: valuePairs})
                .then(function (response) {
                    deferred.resolve(response);
                    /** Optionally broadcast change event */
                    registerChange(model);
                });

            return deferred.promise;
        };

        /**
         * Deletes record directly from the object and removes record from user cache
         * @param {object} options - optionally pass params to the dataService
         * @returns {promise}
         */
        ListItem.prototype.deleteItem = function (options) {
            var self = this;
            var model = self.getModel();
            var deferred = $q.defer();

            dataService.deleteItemModel(model, self, options).then(function (response) {
                deferred.resolve(response);
                /** Optionally broadcast change event */
                registerChange(model);
            });

            return deferred.promise;
        };

        /**
         * Requests all attachments for the object
         * @returns {promise} - resolves with attachment collection
         */
        ListItem.prototype.getAttachmentCollection = function () {
            return dataService.getCollection({
                operation: 'GetAttachmentCollection',
                listName: this.getModel().list.guid,
                webURL: this.getModel().list.webURL,
                ID: this.id,
                filterNode: 'Attachment'
            });
        };

        /**
         * Delete an attachment using the attachment url
         * @param {string} url
         * @returns {promise} - containing updated attachment collection
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
            return resolvePermissions(this.permMask);
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

            /** Constructor that creates a promise for each field */
            var createPromise = function (fieldName) {

                var fieldDefinition = _.findWhere(model.list.fields, {mappedName: fieldName});

                var payload = {
                    operation: 'GetVersionCollection',
                    webURL: configService.defaultUrl,
                    strlistID: model.list.guid,
                    strlistItemID: self.id,
                    strFieldName: fieldDefinition.internalName
                };

                promiseArray.push(dataService.getFieldVersionHistory(payload, fieldDefinition));
            };

            if (!fieldNames) {
                /** If fields aren't provided, pull the version history for all NON-readonly fields */
                var targetFields = _.where(model.list.fields, {readOnly: false});
                fieldNames = [];
                _.each(targetFields, function (field) {
                    fieldNames.push(field.mappedName);
                });
            } else if (_.isString(fieldNames)) {
                /** If a single field name is provided, add it to an array so we can process it more easily */
                fieldNames = [fieldNames];
            }

            /** Generate promises for each field */
            _.each(fieldNames, function (fieldName) {
                createPromise(fieldName);
            });

            /** Pause until all requests are resolved */
            $q.all(promiseArray).then(function (changes) {
                var versionHistory = {};

                /** All fields should have the same number of versions */
                _.each(changes, function (fieldVersions) {

                    _.each(fieldVersions, function (fieldVersion) {
                        if (!versionHistory[fieldVersion.modified.toJSON()]) {
                            versionHistory[fieldVersion.modified.toJSON()] = {};
                        }
                        /** Add field to the version history for this version */
                        _.extend(versionHistory[fieldVersion.modified.toJSON()], fieldVersion);
                    });
                });

                var versionArray = [];
                /** Add a version prop on each version to identify the numeric sequence */
                _.each(versionHistory, function (ver, num) {
                    ver.version = num;
                    versionArray.push(ver);
                });

                deferred.resolve(versionArray);
            });

            return deferred.promise;
        };

        /**
         * List Object Constructor
         * @param obj.guid
         * @param obj.title
         * @param [obj.customFields]
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
                webURL: configService.defaultUrl
            };

            var list = _.extend({}, defaults, obj);

            fieldService.extendFieldDefinitions(list);

            return list;
        }

        /**
         * Decorates query optional attributes
         * @param {object} queryOptions
         * @param {object} model
         * @constructor
         */
        function Query(queryOptions, model) {
            var self = this;
            var defaults = {
                /** Container to hold returned entities */
                cache: [],
                /** Promise resolved after first time query is executed */
                initialized: $q.defer(),
                /** Date/Time last run */
                lastRun: null,
                listName: model.list.guid,
                /** Flag to prevent us from makeing concurrent requests */
                negotiatingWithServer: false,
                /** Every time we run we want to check to update our cached data with
                 * any changes made on the server */
                operation: 'GetListItemChangesSinceToken',
                /** Default query returns list items in ascending ID order */
                query: '' +
                    '<Query>' +
                    '   <OrderBy>' +
                    '       <FieldRef Name="ID" Ascending="TRUE"/>' +
                    '   </OrderBy>' +
                    '</Query>',
                queryOptions: '' +
                    '<QueryOptions>' +
                    '   <IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>' +
                    '   <IncludeAttachmentUrls>TRUE</IncludeAttachmentUrls>' +
                    '   <IncludeAttachmentVersion>FALSE</IncludeAttachmentVersion>' +
                    '   <ExpandUserField>FALSE</ExpandUserField>' +
                    '</QueryOptions>',
                viewFields: model.list.viewFields,
                webURL: configService.defaultUrl
            };
            _.extend(self, defaults, queryOptions);

            /** Key/Value mapping of SharePoint properties to SPServices properties */
            var mapping = [
                ['query', 'CAMLQuery'],
                ['viewFields', 'CAMLViewFields'],
                ['rowLimit', 'CAMLRowLimit'],
                ['queryOptions', 'CAMLQueryOptions'],
                ['listItemID', 'ID']
            ];

            _.each(mapping, function (map) {
                if (self[map[0]] && !self[map[1]]) {
                    /** Ensure SPServices properties are added in the event the true property name is used */
                    self[map[1]] = self[map[0]];
                }
            });

            /** Allow the model to be referenced at a later time */
            self.getModel = function () {
                return model;
            };
        }

        /**
         * Query SharePoint, pull down all initial records on first call
         * Subsequent calls pulls down changes (Assuming operation: "GetListItemChangesSinceToken")
         * @param options - Any options that should be passed to dataService.executeQuery
         * @returns {function} - Array of list item objects
         */
        Query.prototype.execute = function (options) {
            var self = this;
            var model = self.getModel();
            var deferred = $q.defer();

            /** Return existing promise if request is already underway */
            if (self.negotiatingWithServer) {
                return self.promise;
            } else {
                /** Set flag to prevent another call while this query is active */
                self.negotiatingWithServer = true;

                /** Set flag if this if the first time this query has been run */
                var firstRunQuery = _.isNull(self.lastRun);

                var defaults = {
                    /** Designate the central cache for this query if not already set */
                    target: self.cache
                };

                /** Extend defaults with any options */
                var queryOptions = _.extend({}, defaults, options);

                dataService.executeQuery(model, self, queryOptions).then(function (results) {
                    if (firstRunQuery) {
                        /** Promise resolved the first time query is completed */
                        self.initialized.resolve(queryOptions.target);

                        /** Remove lock to allow for future requests */
                        self.negotiatingWithServer = false;
                    }

                    /** Store query completion date/time on model to allow us to identify age of data */
                    model.lastServerUpdate = new Date();

                    deferred.resolve(queryOptions.target);
                });

                /** Save reference on the query **/
                self.promise = deferred.promise;
                return deferred.promise;
            }
        };

        /**
         * Simple wrapper that by default sets the search location to the local query cache
         * @param {*} value
         * @param {object} options - Options to pass to Model.prototype.searchLocalCache
         * @returns {object}
         */
        Query.prototype.searchLocalCache = function (value, options) {
            var self = this;
            var model = self.getModel();
            var defaults = {
                cacheName: self.name,
                localCache: self.cache
            };
            var opts = _.extend({}, defaults, options);
            return model.searchLocalCache(value, opts);
        };

        /**
         * Converts permMask into something usable to determine permission level for current user
         * @param {string} permissionsMask - The WSS Rights Mask is an 8-byte, unsigned integer that specifies
         * the rights that can be assigned to a user or site group. This bit mask can have zero or more flags set.
         * @example '0x0000000000000010'
         * @returns {object} property for each permission level identifying if current user has rights (true || false)
         * @see http://sympmarc.com/2009/02/03/permmask-in-sharepoint-dvwps/
         * @see http://spservices.codeplex.com/discussions/208708
         */
        function resolvePermissions(permissionsMask) {
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

            /**
             * Full Mask only resolves correctly for the Full Mask level
             * so in that case, set everything to true
             */
            if (permissionSet.FullMask) {
                _.each(permissionSet, function (perm, key) {
                    permissionSet[key] = true;
                });
            }

            return permissionSet;
        }

        return {
            ListItem: ListItem,
            Model: Model,
            Query: Query,
            resolvePermissions: resolvePermissions
        };
    });