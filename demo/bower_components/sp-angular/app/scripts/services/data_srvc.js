'use strict';

/**
 * @ngdoc service
 * @name dataService
 * @description
 * Handles all interaction with SharePoint web services
 *
 * For additional information on many of these web service calls, see Marc Anderson's SPServices documentation
 *
 *  - [http://spservices.codeplex.com/documentation]
 */
angular.module('spAngular')
    .service('dataService', function ($q, $timeout, queueService, configService, utilityService, spAngularConfig, toastr) {
        var dataService = {};

        /** Flag to use cached XML files from the app/dev folder */
        var offline = spAngularConfig.offline;
        /** Allows us to make code easier to read */
        var online = !offline;

        //TODO Figure out a better way to get this value, shouldn't need to make a blocking call
        var defaultUrl = configService.defaultUrl || $().SPServices.SPGetCurrentSite();

        /**
         * @ngdoc method
         * @name dataService#processListItems
         * @description
         * Post processing of data after returning list items from server
         * @param {object} model - reference to allow updating of model
         * @param {xml} responseXML - Resolved promise from web service call
         * @param {object} [options]
         * @param {function} [options.factory] - Constructor Function
         * @param {string} [options.filter] - Optional : XML filter
         * @param {Array} [options.mapping] - Field definitions
         * @param {string} [options.mode] - Options for what to do with local list data array in store [replace, update, return]
         * @param {Array} [options.target] - Optionally pass in array to update
         */
        var processListItems = function (model, responseXML, options) {
            queueService.decrease();

            var defaults = {
                factory: model.factory,
                filter: 'z:row',
                mapping: model.list.mapping,
                mode: 'update',
                target: model.getCache()
            };

            var opts = _.extend({}, defaults, options);

            /** Map returned XML to JS objects based on mapping from model */
            var filteredNodes = $(responseXML).SPFilterNode(opts.filter);
            var jsObjects = utilityService.xmlToJson(filteredNodes, { mapping: opts.mapping });

            var entities = [];

            /** Use factory, typically on model, to create new object for each returned item */
            _.each(jsObjects, function (item) {
                /** Allow us to reference the originating query that generated this object */
                item.getQuery = function () {
                    return opts.getQuery();
                };
                /** Create Reference to the containing array */
                item.getContainer = function () {
                    return opts.target;
                };
                entities.push(new model.factory(item));
            });

            if (opts.mode === 'replace') {
                /** Replace any existing data */
                opts.target = entities;
                if (offline) {
                    console.log(model.list.title + ' Replaced with ' + opts.target.length + ' new records.');
                }
            } else if (opts.mode === 'update') {
                var updateStats = updateLocalCache(opts.target, entities);
                if (offline) {
                    console.log(model.list.title + ' Changes (Create: ' + updateStats.created +
                        ' | Update: ' + updateStats.updated + ')');
                }
            }

            return entities;
        };

        /**
         * @description
         * Maps a cache by entity id.  All provided entities are then either added if they don't already exist
         * or replaced if they do.
         * @param {object[]} localCache - The cache for a given query.
         * @param {object[]} entities - All entities that should be merged into the cache.
         * @returns {{created: number, updated: number}}
         */
        function updateLocalCache(localCache, entities) {
            var updateCount = 0,
                createCount = 0;

            /** Map to only run through target list once and speed up subsequent lookups */
            var idMap = _.pluck(localCache, 'id');

            /** Update any existing items stored in the cache */
            _.each(entities, function (entity) {
                if (idMap.indexOf(entity.id) === -1) {
                    /** No match found, add to target and update map */
                    localCache.push(entity);
                    idMap.push(entity.id);
                    createCount++;
                } else {
                    /** Replace local item with updated value */
                    localCache[idMap.indexOf(entity.id)] = entity;
                    updateCount++;
                }
            });
            return {created: createCount, updated: updateCount};
        }

        /**
         * @ngdoc method
         * @name dataService#parseFieldVersionHistoryResponse
         * Takes an XML response from SharePoint webservice and returns an array of field versions
         * @param {xml} responseXML
         * @param {object} fieldDefinition - defined in model for the list
         * @returns {Array}
         */
        function parseFieldVersionHistoryResponse(responseXML, fieldDefinition) {
            var versions = [];
            var versionCount = $(responseXML).find('Version').length;
            $(responseXML).find('Version').each(function (index) {
                var self = this;

                /** Parse the xml and create a representation of the version as a js object */
                var version = {
                    editor: utilityService.attrToJson($(self).attr('Editor'), 'User'),
                    modified: moment($(self).attr('Modified')).toDate(),
                    /** Returns records in desc order so compute the version number from index */
                    version: versionCount - index
                };

                /** Properly format field based on definition from model */
                version[fieldDefinition.mappedName] =
                    utilityService.attrToJson($(self).attr(fieldDefinition.internalName), fieldDefinition.objectType);

                /** Push to beginning of array */
                versions.unshift(version);
            });

            return versions;
        }

        /**
         * @ngdoc method
         * @name dataService#getFieldVersionHistory
         * @description
         * Returns the version history for a field in a list item
         * @param {object} payload
         * @param {object} fieldDefinition - field definition object from the model
         * @returns {promise} - Array of list item changes for the specified field
         */
        var getFieldVersionHistory = function (payload, fieldDefinition) {
            var deferred = $q.defer();
            if (offline) {
                /** Simulate async response if offline */
                $timeout(function () {
                    /** Resolve with an empty array */
                    deferred.resolve([]);
                });
            } else {
                /** SPServices returns a promise */
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    /** Parse XML response */
                    var versions = parseFieldVersionHistoryResponse(webServiceCall.responseText, fieldDefinition);
                    /** Resolve with an array of all field versions */
                    deferred.resolve(versions);
                }, function (outcome) {
                    /** Failure */
                    toastr.error('Failed to fetch version history.');
                    deferred.reject(outcome);
                });
            }

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#getCollection
         * @description
         * Used to handle any of the Get[filterNode]Collection calls to SharePoint
         *
         * @param {Object} options - object used to extend payload and needs to include all SPServices required attributes
         * @param {string} [options.operation] GetUserCollectionFromSite
         * @param {string} [options.operation] GetGroupCollectionFromSite
         * @param {string} [options.operation] GetGroupCollectionFromUser @requires options.userLoginName
         * @param {string} [options.operation] GetUserCollectionFromGroup @requires options.groupName
         * @param {string} [options.operation] GetListCollection
         * @param {string} [options.operation] GetViewCollection @requires options.listName
         * @param {string} [options.operation] GetAttachmentCollection @requires options.listName & options.ID
         * @param {string} [options.filterNode] - Value to iterate over in returned XML
         *         if not provided it's extracted from the name of the operation
         *         ex: Get[User]CollectionFromSite, "User" is used as the filterNode
         *
         * @returns {promise} when resolved will contain an array of the requested collection
         *
         * @example
         * ```js
         *  dataService.getCollection({
         *       operation: "GetGroupCollectionFromUser",
         *       userLoginName: $scope.state.selectedUser.LoginName
         *  }).then(function (response) {
         *       postProcessFunction(response);
         *  });
         * ```
         */
        var getCollection = function (options) {
            queueService.increase();
            var defaults = {
                webURL: defaultUrl
            };
            var opts = _.extend({}, defaults, options);

            /** Determine the XML node to iterate over if filterNode isn't provided */
            var filterNode = opts.filterNode || opts.operation.split('Get')[1].split('Collection')[0];

            var deferred = $q.defer();

            /** Convert the xml returned from the server into an array of js objects */
            var processXML = function (serverResponse) {
                var convertedItems = [];
                /** Get attachments only returns the links associated with a list item */
                if (opts.operation === 'GetAttachmentCollection') {
                    /** Unlike other call, get attachments only returns strings instead of an object with attributes */
                    $(serverResponse).SPFilterNode(filterNode).each(function () {
                        convertedItems.push($(this).text());
                    });
                } else {
                    convertedItems = $(serverResponse).SPFilterNode(filterNode).SPXmlToJson({
                        includeAllAttrs: true,
                        removeOws: false
                    });
                }
                return convertedItems;
            };

            if (offline) {
                var offlineData = 'dev/' + opts.operation + '.xml';

                /** Get offline data */
                $.ajax(offlineData).then(
                    function (offlineData) {
                        queueService.decrease();
                        /** Pass back the group array */
                        deferred.resolve(processXML(offlineData));
                    }, function (outcome) {
                        toastr.error('You need to have a dev/' + opts.operation + '.xml in order to get the group collection in offline mode.');
                        deferred.reject(outcome);
                        queueService.decrease();
                    });
            } else {
                var validPayload = true;
                var payload = {};

                _.extend(payload, opts);


                var verifyParams = function (params) {
                    _.each(params, function (param) {
                        if (!payload[param]) {
                            toastr.error('options' + param + ' is required to complete this operation');
                            validPayload = false;
                            deferred.reject([]);
                        }
                    });
                };

                //Verify all required params are included
                switch (opts.operation) {
                    case 'GetGroupCollectionFromUser':
                        verifyParams(['userLoginName']);
                        break;
                    case 'GetUserCollectionFromGroup':
                        verifyParams(['groupName']);
                        break;
                    case 'GetViewCollection':
                        verifyParams(['listName']);
                        break;
                    case 'GetAttachmentCollection':
                        verifyParams(['listName', 'ID']);
                        break;
                }

                if (validPayload) {
                    var webServiceCall = $().SPServices(payload);

                    webServiceCall.then(function () {
                        //Success
                        queueService.decrease();
                        deferred.resolve(processXML(webServiceCall.responseXML));
                    }, function (outcome) {
                        //Failure
                        toastr.error('Failed to fetch list collection.');
                        queueService.decrease();
                        deferred.reject(outcome);
                    });
                }
            }

            return deferred.promise;

        };

        /**
         * @ngdoc method
         * @name dataService#serviceWrapper
         * @description
         * Generic wrapper for any SPServices web service call
         * Check http://spservices.codeplex.com/documentation for details on expected parameters for each operation
         *
         * @param {object} options - payload params
         * @returns {promise}
         *      If options.filterNode is provided, returns XML parsed by node name
         *      Otherwise returns the server response
         */
        var serviceWrapper = function (options) {
            var defaults = {
                webURL: defaultUrl
            };
            var opts = _.extend({}, defaults, options);
            var deferred = $q.defer();

            queueService.increase();

            /** Convert the xml returned from the server into an array of js objects */
            var processXML = function (serverResponse) {
                if (opts.filterNode) {
                    return $(serverResponse).SPFilterNode(opts.filterNode).SPXmlToJson({
                        includeAllAttrs: true,
                        removeOws: false
                    });
                } else {
                    return serverResponse;
                }
            };

            if (offline) {
                /** Debugging offline */
                var offlineData = 'dev/' + opts.operation + '.xml';

                /** Get offline data */
                $.ajax(offlineData).then(
                    function (offlineData) {
                        queueService.decrease();
                        /** Pass back the group array */
                        deferred.resolve(processXML(offlineData));
                    }, function (outcome) {
                        toastr.error('You need to have a dev/' + opts.operation + '.xml in order to get the group collection in offline mode.');
                        deferred.reject(outcome);
                        queueService.decrease();
                    });
            } else {
                /** Add in webURL to speed up call, set to default if not specified */
                var payload = {};

                _.extend(payload, opts);

                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    /** Success */
                    queueService.decrease();
                    deferred.resolve(processXML(webServiceCall.responseXML));
                }, function (outcome) {
                    /** Failure */
                    toastr.error('Failed to fetch list collection.');
                    queueService.decrease();
                    deferred.reject(outcome);
                });
            }
            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#getList
         * @description
         * Returns all list settings for each list on the site
         * @param options
         * @param {string} options.listName
         * @param {string} [options.webURL] - returns info for specified site (optional)
         * @returns {object} promise
         */
        var getList = function (options) {
            var opts = _.extend({}, options);
            queueService.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: 'GetList',
                listName: opts.listName
            });

            webServiceCall.then(function () {
                /** Success */
                queueService.decrease();

                /** Map returned XML to JSON */
                var json = $(webServiceCall.responseXML).SPFilterNode('Field').SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                /** Pass back the lists array */
                deferred.resolve(json);
            }, function (outcome) {
                /** Failure */
                deferred.reject(outcome);
                toastr.error('Failed to fetch list details.');
            }).always(function () {
                queueService.decrease();
            });

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#deleteAttachment
         * @description
         * Deletes and attachment on a list item
         * @param {object} options
         * @param {string} options.listItemId
         * @param {string} options.url
         * @param {string} options.listName
         * @returns {promise}
         */
        var deleteAttachment = function (options) {
            var opts = _.extend({}, options);
            queueService.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: 'DeleteAttachment',
                listItemID: opts.listItemId,
                url: opts.url,
                listName: opts.listName
            });

            webServiceCall.then(function () {
                /** Success */
                queueService.decrease();

                /** Map returned XML to JSON */
                var json = $(webServiceCall.responseXML).SPFilterNode('Field').SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                /** Pass back the lists array */
                deferred.resolve(json);
            }, function (outcome) {
                /** Failure */
                deferred.reject(outcome);
                toastr.error('Failed to fetch list details.');
            }).always(function () {
                queueService.decrease();
            });

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#getView
         * @description
         * Returns details of a SharePoint list view
         * @param {object} options
         * @param {string} options.listName
         * @param {string} [options.viewName] ***Formatted as a GUID ex: '{37388A98-534C-4A28-BFFA-22429276897B}'
         * @param {string} [options.webURL]
         * @returns {object} promise
         */
        var getView = function (options) {
            var opts = _.extend({}, options);
            var deferred = $q.defer();

            queueService.increase();

            var payload = {
                operation: 'GetView',
                listName: opts.listName
            };

            /** Set view name if provided in options, otherwise it returns default view */
            if (opts.viewName) {
                payload.viewName = opts.viewName;
            }

            var webServiceCall = $().SPServices(payload);

            webServiceCall.then(function () {
                /** Success */
                var output = {
                    query: '<Query>' + $(webServiceCall.responseText).find('Query').html() + '</Query>',
                    viewFields: '<ViewFields>' + $(webServiceCall.responseText).find('ViewFields').html() + '</ViewFields>',
                    rowLimit: $(webServiceCall.responseText).find('RowLimit').html()
                };

                /** Pass back the lists array */
                deferred.resolve(output);
            }, function (outcome) {
                /** Failure */
                toastr.error('Failed to fetch view details.');
                deferred.reject(outcome);
            }).always(function () {
                queueService.decrease();
            });

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#executeQuery
         * @description
         * Takes in the model and a query that
         * @param {object} model
         * @param {object} query
         * @param {string} [query.offlineXML] - Allow an offline file to spe specified when a query is created
         * @param {object} [options]
         * @param {object} [options.deferred] - A reference to a deferred object
         * @param {Array} [options.target] - The target destination for returned entities
         * @param {string} [options.offlineXML] - Alternate location to XML data file
         * @returns {object} promise - Returns reference to model
         */
        var executeQuery = function (model, query, options) {

            var defaults = {
                target: model.getCache()
            };

            var deferred = $q.defer();

            /** Extend defaults **/
            var opts = _.extend({}, defaults, options);

            /** Allow a list item to reference the query which generated it */
            opts.getQuery = function () {
                return query;
            };

            /** Trigger processing animation */
            queueService.increase();

            /** Simulate an web service call if working offline */
            if (offline) {
                /** Optionally set alternate offline XML location but default to value in model */
                var offlineData = opts.offlineXML || query.offlineXML || 'dev/' + model.list.title + '.xml';

                /** Only pull down offline xml if this is the first time the query is run */
                if (query.lastRun) {
                    /** Query has already been run, resolve reference to existing data */
                    query.lastRun = new Date();
                    queueService.decrease();
                    deferred.resolve(query.cache);
                } else {
                    /** First run for query
                     *  Get offline data stored in the app/dev folder
                     */
                    $.ajax(offlineData).then(function (responseXML) {
                        var entities = processListItems(model, responseXML, opts);
                        /** Set date time to allow for time based updates */
                        query.lastRun = new Date();
                        queueService.decrease();
                        deferred.resolve(entities);
                    }, function () {
                        var mockData = model.generateMockData();
                        deferred.resolve(mockData);
                        toastr.error('There was a problem locating the "dev/' + model.list.title + '.xml"');
                    });
                }
            } else {
                var webServiceCall = $().SPServices(query);
                webServiceCall.then(function () {
                    var responseXML = webServiceCall.responseXML;
                    if (query.operation === 'GetListItemChangesSinceToken') {

                        /** Store token for future web service calls to return changes */
                        query.changeToken = retrieveChangeToken(responseXML);


                        /** Update the user permissions for this list */
                        var effectivePermissionMask = retrievePermMask(responseXML);
                        if (effectivePermissionMask) {
                            model.list.effectivePermMask = effectivePermissionMask;
                        }

                        /** Change token query includes deleted items as well so we need to process them separately */
                        processDeletionsSinceToken(responseXML, opts.target);
                    }
                    /** Convert the XML into JS */
                    var changes = processListItems(model, responseXML, opts);

                    /** Set date time to allow for time based updates */
                    query.lastRun = new Date();
                    queueService.decrease();
                    deferred.resolve(changes);
                });
            }

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#removeEntityFromLocalCache
         * @description
         * Removes an entity from the local cache if it exists
         * @param {Array} entityArray
         * @param {Number} entityId
         * @returns {boolean}
         */
        function removeEntityFromLocalCache(entityArray, entityId) {
            var successfullyDeleted = false;

            /** Remove from local data array */
            var item = _.findWhere(entityArray, {id: entityId});
            var index = _.indexOf(entityArray, item);

            if (index) {
                /** Remove the locally cached record */
                entityArray.splice(index, 1);
                successfullyDeleted = true;
            }

            return successfullyDeleted;
        }

        /**
         * @ngdoc method
         * @name dataService#retrieveChangeToken
         * @description
         * Returns the change token from the xml response of a GetListItemChangesSinceToken query
         * Note: this attribute is only found when using 'GetListItemChangesSinceToken'
         * @param {xml} responseXML
         */
        function retrieveChangeToken(responseXML) {
            return $(responseXML).find('Changes').attr('LastChangeToken');
        }

        /**
         * @ngdoc method
         * @name dataService#retrievePermMask
         * @description
         * Returns the text representation of the users permission mask
         * Note: this attribute is only found when using 'GetListItemChangesSinceToken'
         * @param {xml} responseXML
         */
        function retrievePermMask(responseXML) {
            return $(responseXML).find('listitems').attr('EffectivePermMask');
        }

        /**
         * @ngdoc method
         * @name dataService#processDeletionsSinceToken
         * @description
         * GetListItemChangesSinceToken returns items that have been added as well as deleted so we need
         * to remove the deleted items from the local cache
         * @param {xml} responseXML
         * @param {Array} entityArray
         */
        function processDeletionsSinceToken(responseXML, entityArray) {
            var deleteCount = 0;

            /** Remove any locally cached entities that were deleted from the server */
            $(responseXML).SPFilterNode('Id').each(function () {
                /** Check for the type of change */
                var changeType = $(this).attr('ChangeType');

                if (changeType === 'Delete') {
                    var entityId = parseInt($(this).text(), 10);
                    /** Remove from local data array */
                    var foundAndRemoved = removeEntityFromLocalCache(entityArray, entityId);
                    if (foundAndRemoved) {
                        deleteCount++;
                    }
                }
            });
            if (deleteCount > 0 && offline) {
                console.log(deleteCount + ' item(s) removed from local cache to mirror changes on source list.');
            }
        }

        /**
         * @ngdoc method
         * @name dataService#stringifySharePointMultiSelect
         * @description
         * Turns an array of, typically {lookupId: someId, lookupValue: someValue}, objects into a string
         * of delimited id's that can be passed to SharePoint for a multi select lookup or multi user selection
         * field
         * @param {object[]} value - Array of objects
         * @param {string} idProperty - ID attribute
         * @returns {string}
         */
        function stringifySharePointMultiSelect(value, idProperty) {
            var stringifiedValues = '';
            _.each(value, function (lookupObject, iteration) {
                /** Need to format string of id's in following format [ID0];#;#[ID1];#;#[ID1] */
                stringifiedValues += lookupObject[idProperty];
                if (iteration < value.length) {
                    stringifiedValues += ';#;#';
                }
            });
            return stringifiedValues;
        }


        /**
         * @ngdoc method
         * @name dataService#createValuePair
         * @description
         * Uses a field definition from a model to properly format a value for submission to SharePoint
         * @param {object} fieldDefinition
         * @param {*} value
         * @returns {Array} - [fieldName, fieldValue]
         */
        var createValuePair = function (fieldDefinition, value) {
            var valuePair = [];
            var internalName = fieldDefinition.internalName;

            if (!value || value === '') {
                /** Create empty value pair if blank or undefined */
                valuePair = [internalName, ''];
            } else {
                switch (fieldDefinition.objectType) {
                    case 'Lookup':
                    case 'User':
                        if (!value.lookupId) {
                            valuePair = [internalName, ''];
                        } else {
                            valuePair = [internalName, value.lookupId];
                        }
                        break;
                    case 'LookupMulti':
                    case 'UserMulti':
                        var stringifiedArray = stringifySharePointMultiSelect(value, 'lookupId');
                        valuePair = [fieldDefinition.internalName, stringifiedArray];
                        break;
                    case 'Boolean':
                        valuePair = [internalName, value ? 1 : 0];
                        break;
                    case 'DateTime':
                        if (moment(value).isValid()) {
                            //A string date in ISO format, e.g., '2013-05-08T01:20:29Z-05:00'
                            valuePair = [internalName, moment(value).format('YYYY-MM-DDTHH:mm:ss[Z]Z')];
                        } else {
                            valuePair = [internalName, ''];
                        }
                        break;
                    case 'Note':
                    case 'HTML':
                        valuePair = [internalName, _.escape(value)];
                        break;
                    case 'JSON':
                        valuePair = [internalName, angular.toJson(value)];
                        break;
                    default:
                        valuePair = [internalName, value];
                }
                if (offline) {
                    console.log('{' + fieldDefinition.objectType + '} ' + valuePair);
                }
            }
            return valuePair;
        };

        /**
         * @ngdoc method
         * @name dataService#generateValuePairs
         * @description
         * Uses provided field definitions to pull value pairs for desired attributes
         * @param {Array} fieldDefinitions - definitions from the model
         * @param {object} item - list item
         * @returns {Array}
         */
        function generateValuePairs(fieldDefinitions, item) {
            var pairs = [];
            _.each(fieldDefinitions, function (field) {
                /** Check to see if item contains data for this field */
                if (_.has(item, field.mappedName)) {
                    pairs.push(createValuePair(field, item[field.mappedName]));
                }
            });
            return pairs;
        }

        /**
         * Propagates a change to all duplicate entities in all queries within a given model.
         * @param {object} model
         * @param {object} entity - List item.
         * @param {object} [exemptQuery] - The query containing the updated item is automatically udpated so we don't
         * need to process it.
         */
        function updateAllCaches(model, entity, exemptQuery) {
            var queriesUpdated = 0;
            /** Search through each of the queries and update any occurrence of this entity */
            _.each(model.queries, function (query) {
                /** Process all query caches except the one originally used to retrieve entity because
                 * that is automatically updated by "processListItems". */
                if (query != exemptQuery) {
                    updateLocalCache(query.cache, [entity]);
                }
            });
            return queriesUpdated;
        }

        /**
         * @ngdoc method
         * @name dataService#addUpdateItemModel
         * @description
         * Adds or updates a list item based on if the item passed in contains an id attribute
         * @param {object} model
         * @param {object} item
         * @param {object} [options]
         * @param {string} [options.mode] - [update, replace, return]
         * @param {boolean} [options.buildValuePairs] - Automatically generate pairs based on fields defined in model.
         * @param {boolean} [options.updateAllCaches=false] - Search through the cache for each query on the model
         * to ensure entity is updated everywhere.  This is more process intensive so by default we only update the
         * cached entity in the cache where this entity is currently stored.  Only applicable when updated an entity.
         * @param {Array} [options.valuePairs] - Precomputed value pairs to use instead of generating them for each field
         * identified in the model.
         * @returns {object} promise
         */
        var addUpdateItemModel = function (model, item, options) {
            var defaults = {
                mode: 'update',  //Options for what to do with local list data array in store [replace, update, return]
                buildValuePairs: true,
                updateAllCaches: false,
                valuePairs: []
            };
            var deferred = $q.defer();
            var opts = _.extend({}, defaults, options);

            /** Display loading animation */
            queueService.increase();

            if (opts.buildValuePairs === true) {
                var editableFields = _.where(model.list.fields, {readOnly: false});
                opts.valuePairs = generateValuePairs(editableFields, item);
            }
            var payload = {
                operation: 'UpdateListItems',
                webURL: model.list.webURL,
                listName: model.list.guid,
                valuepairs: opts.valuePairs
            };

            if ((_.isObject(item) && _.isNumber(item.id))) {
                /** Updating existing list item */
                payload.batchCmd = 'Update';
                payload.ID = item.id;
            } else {
                /** Creating new list item */
                payload.batchCmd = 'New';
            }

            if (online) {
                /** Make call to lists web service */
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    /** Success */
                    var output = processListItems(model, webServiceCall.responseXML, opts);
                    var updatedEntity = output[0];

                    /** Optionally search through each cache on the model and update any other references to this entity */
                    if (opts.updateAllCaches && _.isNumber(item.id)) {
                        updateAllCaches(model, updatedEntity, item.getQuery(), 'update');
                    }
                    deferred.resolve(updatedEntity);
                }, function (outcome) {
                    /** In the event of an error, display toast */
                    toastr.error('There was an error getting the requested data from ' + model.list.name);
                    deferred.reject(outcome);
                }).always(function () {
                    queueService.decrease();
                });
            } else {
                /** Logic to simulate expected behavior when working offline */
                /** Offline mode */
                window.console.log(payload);

                /** Mock data */
                var offlineDefaults = {
                    modified: new Date(),
                    editor: {
                        lookupId: 23,
                        lookupValue: 'Generic User'
                    }
                };

                if (!item.id) {
                    var newItem;
                    /** Include standard mock fields for new item */
                    offlineDefaults.author = {
                        lookupId: 23,
                        lookupValue: 'Generic User'
                    };
                    offlineDefaults.created = new Date();

                    /** We don't know which query cache to push it to so add it to all */
                    _.each(model.queries, function (query) {
                        /** Find next logical id to assign */
                        var maxId = 1;
                        _.each(query.cache, function (entity) {
                            if (entity.id > maxId) {
                                maxId = entity.id;
                            }
                        });
                        offlineDefaults.id = maxId + 1;
                        /** Add default attributes */
                        _.extend(item, offlineDefaults);
                        /** Use factory to build new object */
                        newItem = new model.factory(item);
                        query.cache.push(newItem);
                    });


                    deferred.resolve(newItem);
                } else {
                    /** Update existing record in local cache*/
                    _.extend(item, offlineDefaults);
                    deferred.resolve(item);
                }
                queueService.decrease();
            }
            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name dataService#deleteItemModel
         * @description
         * Typically called directly from a list item, removes the list item from SharePoint
         * and the local cache
         * @param {object} model - model of the list item
         * @param {object} item - list item
         * @param {object} [options]
         * @param {Array} [options.target=item.getContainer()] - Optional location to search through and remove the local cached copy.
         * @param {boolean} [options.updateAllCaches=false] - Search through the cache for each query on the model
         * to ensure entity is removed everywhere.  This is more process intensive so by default we only delete the
         * cached entity in the cache where this entity is currently stored.
         * @returns {object} promise - Nothing is return in the promise.
         */
        var deleteItemModel = function (model, item, options) {
            queueService.increase();

            var defaults = {
                target: item.getContainer(),
                updateAllCaches: false
            };
            var opts = _.extend({}, defaults, options);

            var payload = {
                operation: 'UpdateListItems',
                webURL: model.list.webURL,
                listName: model.list.guid,
                batchCmd: 'Delete',
                ID: item.id
            };

            var deferred = $q.defer();

            function cleanCache() {
                var deleteCount = 0;
                if (opts.updateAllCaches) {
                    var model = item.getModel();
                    _.each(model.queries, function (query) {
                        var entityRemoved = removeEntityFromLocalCache(query.cache, item.id);
                        if (entityRemoved) {
                            deleteCount++;
                        }
                    });
                } else {
                    var entityRemoved = removeEntityFromLocalCache(opts.target, item.id);
                    if (entityRemoved) {
                        deleteCount++;
                    }
                }
                return deleteCount;
            }

            if (online) {
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    /** Success */
                    cleanCache();
                    queueService.decrease();
                    deferred.resolve(opts.target);
                }, function (outcome) {
                    //In the event of an error, display toast
                    toastr.error('There was an error deleting a list item from ' + model.list.title);
                    queueService.decrease();
                    deferred.reject(outcome);
                });
            } else {
                /** Offline debug mode */
                /** Simulate deletion and remove locally */
                cleanCache();
                queueService.decrease();
                deferred.resolve(opts.target);
            }

            return deferred.promise;
        };

        /** Exposed functionality */
        _.extend(dataService, {
            addUpdateItemModel: addUpdateItemModel,
            createValuePair: createValuePair,
            deleteAttachment: deleteAttachment,
            deleteItemModel: deleteItemModel,
            generateValuePairs: generateValuePairs,
            getCollection: getCollection,
            getFieldVersionHistory: getFieldVersionHistory,
            getList: getList,
            getView: getView,
            executeQuery: executeQuery,
            processListItems: processListItems,
            serviceWrapper: serviceWrapper
        });

        return dataService;

    }
);