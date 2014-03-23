'use strict';

angular.module('OneApp')
    .service('dataService', function ($q, $timeout, queueService, utilityService, toastr) {
        var dataService = {};

        /** Flag to use cached XML files from the app/dev folder */
        var offline = window.location.href.indexOf('localhost') > -1;

        /**
         * @description Post processing of data after returning list items from server
         *              -required-
         * @param model | reference to allow updating of model
         * @param responseXML | Resolved promise from web service call
         *              -optional-
         * @param {object} options
         * @param options.factory | Constructor Function
         * @param options.filter | Optional : XML filter
         * @param options.mapping | Field definitions
         * @param options.mode | Options for what to do with local list data array in store [replace, update, return]
         * @param options.target | Optionally pass in array to update
         */
        var processListItems = function (model, responseXML, options) {
            queueService.decrease();

            var defaults = {
                factory: model.factory,
                filter: 'z:row',
                mapping: model.list.mapping,
                mode: 'update',
                target: model.data
            };

            var settings = _.extend({}, defaults, options);

            /** Map returned XML to JS objects based on mapping from model */
            var filteredNodes = $(responseXML).SPFilterNode(settings.filter);
            var jsObjects = utilityService.xmlToJson(filteredNodes, { mapping: settings.mapping });

            var entities = [];

            /** Use factory, typically on model, to create new object for each returned item */
            _.each(jsObjects, function (item) {
                entities.push(settings.factory(item));
            });

            if (typeof settings.mode === 'replace') {
                /** Replace any existing data */
                settings.target = entities;
                if(offline) {
                    console.log(model.list.title + ' Replaced with ' + settings.target.length + ' new records.');
                }
            } else if (settings.mode === 'update') {
                var updateStats = updateLocalCache(settings.target, entities);
                if(offline) {
                    console.log(model.list.title + ' Changes (Create: ' + updateStats.created +
                        ' | Update: ' + updateStats.updated + ')');
                }
            }

            return entities;
        };

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
//                    angular.copy(entity, localCache[idMap.indexOf(entity.id)]);
                    updateCount++;
                }
            });
            return {created: createCount, updated: updateCount};
        }

        /**
         * Takes an XML response from SharePoint webservice and returns an array of field versions
         * @param {xml} responseXML
         * @param {object} fieldDefinition - defined in model for the list
         * @returns {Array}
         */
        function parseFieldVersionHistoryResponse(responseXML, fieldDefinition) {
            var versions = [];
            var versionCount = $(responseXML).find("Version").length;
            $(responseXML).find("Version").each(function (index) {
                var self = this;

                /** Parse the xml and create a representation of the version as a js object */
                var version = {
                    editor: utilityService.attrToJson($(self).attr("Editor"), 'User'),
                    modified: moment($(self).attr("Modified")).toDate(),
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
         * @description Returns the version history for a field in a list item
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
                    toastr.error("Failed to fetch version history.");
                    deferred.reject(outcome);
                });
            }

            return deferred.promise;
        };

        /**
         * @ngdoc function
         * @name dataService.getCollection
         * @description
         * Used to handle any of the Get[filterNode]Collection calls to SharePoint
         *
         * @param {object} options | object used to extend payload and needs to include all SPServices required attributes
         * @param {string} options.operation
         *  - GetUserCollectionFromSite
         *  - GetGroupCollectionFromSite
         *  - GetGroupCollectionFromUser
         *      @requires options.userLoginName
         *  - GetUserCollectionFromGroup
         *      @requires options.groupName
         *  - GetListCollection
         *  - GetViewCollection
         *      @requires options.listName
         *  - GetAttachmentCollection
         *      @requires options.listName
         *      @requires options.ID
         *
         *  @param {string} options.filterNode (Optional: Value to iterate over in returned XML
         *         if not provided it's extracted from the name of the operation
         *         ex: Get[User]CollectionFromSite, "User" is used as the filterNode
         *
         * @returns {promise} when resolved will contain an array of the requested collection
         *
         * @example
         * Typical usage
         * <pre>
         *  dataService.getCollection({
         *       operation: "GetGroupCollectionFromUser",
         *       userLoginName: $scope.state.selectedUser.LoginName
         *  }).then(function (response) {
         *       postProcessFunction(response);
         *  });
         * </pre>
         */
        var getCollection = function (options) {
            queueService.increase();
            options = options || {};

            /** Determine the XML node to iterate over if filterNode isn't provided */
            var filterNode = options.filterNode || options.operation.split("Get")[1].split("Collection")[0];

            var deferred = $q.defer();

            /** Convert the xml returned from the server into an array of js objects */
            var processXML = function (serverResponse) {
                var convertedItems = [];
                /** Get attachments only returns the links associated with a list item */
                if (options.operation === "GetAttachmentCollection") {
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
                var offlineData = 'dev/' + options.operation + '.xml';

                /** Get offline data */
                $.ajax(offlineData).then(
                    function (offlineData) {
                        queueService.decrease();
                        /** Pass back the group array */
                        deferred.resolve(processXML(offlineData));
                    }, function (outcome) {
                        toastr.error("You need to have a dev/" + options.operation + ".xml in order to get the group collection in offline mode.");
                        deferred.reject(outcome);
                        queueService.decrease();
                    });
            } else {
                var validPayload = true;
                var payload = {};

                _.extend(payload, options);


                var verifyParams = function (params) {
                    _.each(params, function (param) {
                        if (!payload[param]) {
                            toastr.error("options" + param + " is required to complete this operation");
                            validPayload = false;
                            deferred.reject([]);
                        }
                    });
                };

                //Verify all required params are included
                switch (options.operation) {
                    case "GetGroupCollectionFromUser":
                        verifyParams(['userLoginName']);
                        break;
                    case "GetUserCollectionFromGroup":
                        verifyParams(['groupName']);
                        break;
                    case "GetViewCollection":
                        verifyParams(['listName']);
                        break;
                    case "GetAttachmentCollection":
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
                        toastr.error("Failed to fetch list collection.");
                        queueService.decrease();
                        deferred.reject(outcome);
                    });
                }
            }

            return deferred.promise;

        };

        /**
         * Generic wrapper for any SPServices web service call
         * Check http://spservices.codeplex.com/documentation for details on expected parameters for each operation
         *
         * @param {object} options - payload params
         * @returns {promise}
         *      If options.filterNode is provided, returns XML parsed by node name
         *      Otherwise returns the server response
         */
        var serviceWrapper = function (options) {
            queueService.increase();
            options = options || {};

            var deferred = $q.defer();

            /** Convert the xml returned from the server into an array of js objects */
            var processXML = function (serverResponse) {
                if(options.filterNode) {
                    return $(serverResponse).SPFilterNode(options.filterNode).SPXmlToJson({
                        includeAllAttrs: true,
                        removeOws: false
                    });
                } else {
                    return serverResponse;
                }
            };

            if (offline) {
                /** Debugging offline */
                var offlineData = 'dev/' + options.operation + '.xml';

                /** Get offline data */
                $.ajax(offlineData).then(
                    function (offlineData) {
                        queueService.decrease();
                        /** Pass back the group array */
                        deferred.resolve(processXML(offlineData));
                    }, function (outcome) {
                        toastr.error("You need to have a dev/" + options.operation + ".xml in order to get the group collection in offline mode.");
                        deferred.reject(outcome);
                        queueService.decrease();
                    });
            } else {
                /** Add in webURL to speed up call, set to default if not specified */
                var payload = {};

                _.extend(payload, options);

                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    /** Success */
                    queueService.decrease();
                    deferred.resolve(processXML(webServiceCall.responseXML));
                }, function (outcome) {
                    /** Failure */
                    toastr.error("Failed to fetch list collection.");
                    queueService.decrease();
                    deferred.reject(outcome);
                });
            }
            return deferred.promise;
        };

        /**
         * Returns all list settings for each list on the site
         * @param options.listName (required)
         * @param options.webURL returns info for specified site (optional)
         * @returns promise for json dataset
         */
        var getList = function (options) {
            options = options || {};
            queueService.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: "GetList",
                listName: options.listName
            });

            webServiceCall.then(function () {
                /** Success */
                queueService.decrease();

                /** Map returned XML to JSON */
                var json = $(webServiceCall.responseXML).SPFilterNode("Field").SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                /** Pass back the lists array */
                deferred.resolve(json);
            },function (outcome) {
                /** Failure */
                deferred.reject(outcome);
                toastr.error("Failed to fetch list details.");
            }).always(function () {
                queueService.decrease();
            });

            return deferred.promise;
        };

        /**
         * @description Deletes and attachment on a list item
         * @param {object} options
         * @param {string} options.listItemId
         * @param {string} options.url
         * @param {string} options.listName
         * @returns {promise}
         */
        var deleteAttachment = function (options) {
            options = options || {};
            queueService.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: "DeleteAttachment",
                listItemID: options.listItemId,
                url: options.url,
                listName: options.listName
            });

            webServiceCall.then(function () {
                /** Success */
                queueService.decrease();

                /** Map returned XML to JSON */
                var json = $(webServiceCall.responseXML).SPFilterNode("Field").SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                /** Pass back the lists array */
                deferred.resolve(json);
            },function (outcome) {
                /** Failure */
                deferred.reject(outcome);
                toastr.error("Failed to fetch list details.");
            }).always(function () {
                queueService.decrease();
            });

            return deferred.promise;
        };

        /**
         * Returns details of a SharePoint list view
         * @param options.listName (required)
         * @param options.viewName (optional) ***Formatted as a GUID ex: "{37388A98-534C-4A28-BFFA-22429276897B}"
         * @param options.webURL (optional)
         * @returns {promise for object}
         */
        var getView = function (options) {
            queueService.increase();
            var deferred = $q.defer();

            var payload = {
                operation: "GetView",
                listName: options.listName
            };

            /** Set view name if provided in options, otherwise it returns default view */
            if (_.isDefined(options.viewName)) payload.viewName = options.viewName;

            var webServiceCall = $().SPServices(payload);

            webServiceCall.then(function () {
                /** Success */
                var output = {
                    query: "<Query>" + $(webServiceCall.responseText).find("Query").html() + "</Query>",
                    viewFields: "<ViewFields>" + $(webServiceCall.responseText).find("ViewFields").html() + "</ViewFields>",
                    rowLimit: $(webServiceCall.responseText).find("RowLimit").html()
                };

                /** Pass back the lists array */
                deferred.resolve(output);
            },function (outcome) {
                /** Failure */
                toastr.error("Failed to fetch view details.");
                deferred.reject(outcome);
            }).always(function () {
                queueService.decrease();
            });

            return deferred.promise;
        };


        /**
         * Combines the ready promises for a controller into an array and
         * adds a reference to each of the models data sources to the scope
         * @param {object} scope - Reference to the controllers scope
         * @param {array} models - Array of models to register/add to scope
         * @returns Combines the test
         */
//        var registerModels = function (scope, models) {
////                scope.promises = scope.promises || [];
//            var promises = [];
//            //Add simple refresh functionality
//            scope.refresh = function () {
//                if (!scope.$$phase) {
//                    scope.$apply();
//                }
//            };
//            _.each(models, function (model) {
//                promises.push(model.ready.promise);
//                scope[utilityService.toCamelCase(model.list.title)] = model.data;
//            });
//            return $q.all(promises);
//        };


        /**
         * Takes in the model and a query that
         * @param {object} model
         * @param {object} query
         * @param options.deferred //Optionally pass in another deferred object to resolve(default: model.ready)
         * @param options.offlineXML //Alternate location to XML data file
         * @returns {promise} - Returns reference to model
         */
        var executeQuery = function (model, query, options) {

            var defaults = {
                target: model.data
            };

            /** Trigger processing animation */
            queueService.increase();
            options = options || {};
            options.target = options.target || model.data;

            var deferredObj = options.deferred || model.ready;

            if (offline) {
                /** Optionally set alternate offline XML location but default to value in model */
                var offlineData = options.offlineXML || 'dev/' + model.list.title + '.xml';

                /** Get offline data stored in the app/dev folder*/
                $.ajax(offlineData).then(function (responseXML) {
                    var changes = processListItems(model, responseXML, options);
                    /** Set date time to allow for time based updates */
                    query.lastRun = new Date();
                    queueService.decrease();
                    deferredObj.resolve(changes);
                }, function() {
                    toastr.error('There was a problem locating the "dev/' + model.list.title + '.xml"');
                });
            } else {
                var webServiceCall = $().SPServices(query);
                webServiceCall.then(function () {
                    var responseXML = webServiceCall.responseXML;
                    if (query.operation === "GetListItemChangesSinceToken") {
                        
                        /** Store token for future web service calls to return changes */
                        query.changeToken = retrieveChangeToken(responseXML);
                        /** Change token query includes deleted items as well so we need to process them seperately */
                        processDeletionsSinceToken(responseXML, options.target);
                    }
                    /** Convert the XML into JS */
                    var changes = processListItems(model, responseXML, options);

                    /** Set date time to allow for time based updates */
                    query.lastRun = new Date();
                    queueService.decrease();
                    deferredObj.resolve(changes);
                });
            }

            return deferredObj.promise;
        };

        /**
         * Removes an entity from the local cache if it exists
         * @param entityArray
         * @param entityId
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
         * Returns the change token from the xml response of a GetListItemChangesSinceToken query
         * @param responseXML
         */
        function retrieveChangeToken(responseXML) {
            /** Find element containing the token (should only be 1 but use .each to be safe) */
            $(responseXML).SPFilterNode('Changes').each(function () {
                /** Retrieve the token string **/
                return $(this).attr("LastChangeToken");
            });
        }

        /**
         * GetListItemChangesSinceToken returns items that have been added as well as deleted so we need
         * to remove the deleted items from the local cache
         * @param responseXML
         * @param {array} entityArray
         */
        function processDeletionsSinceToken(responseXML, entityArray) {
            var deleteCount = 0;

            /** Remove any locally cached entities that were deleted from the server */
            $(responseXML).SPFilterNode('Id').each(function () {
                /** Check for the type of change */
                var changeType = $(this).attr("ChangeType");
                
                if (changeType === "Delete") {
                    var entityId = parseInt($(this).text(), 10);
                    /** Remove from local data array */
                    var foundAndRemoved = removeEntityFromLocalCache(entityArray, entityId);
                    if(foundAndRemoved) {
                        deleteCount ++;
                    }
                }
            });
            if (deleteCount > 0 && offline) {
                console.log(deleteCount + ' item(s) removed from local cache to mirror changes on source list.');
            }
        }

        /**
         * Turns an array of, typically {lookupId: someId, lookupValue: someValue}, objects into a string
         * of delimited id's that can be passed to sharepoint for a multi select lookup or multi user selection
         * field
         * @param value
         * @param idProperty
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
         * @description Uses a field definition from a model to properly format a value for submission to SharePoint 
         * @param {object} fieldDefinition
         * @param value
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
                    case "Lookup":
                    case "User":
                        if (!value.lookupId) {
                            valuePair = [internalName, ''];
                        } else {
                            valuePair = [internalName, value.lookupId];
                        }
                        break;
                    case "LookupMulti":
                    case "UserMulti":
                        var stringifiedArray = stringifySharePointMultiSelect(value, 'lookupId');
                        valuePair = [fieldDefinition.internalName, stringifiedArray];
                        break;
                    case "Boolean":
                        valuePair = [internalName, value ? 1 : 0];
                        break;
                    case "DateTime":
                        if (moment(value).isValid()) {
                            //A string date in ISO format, e.g., "2013-05-08T01:20:29Z-05:00"
                            valuePair = [internalName, moment(value).format("YYYY-MM-DDTHH:mm:ss[Z]Z")];
                        } else {
                            valuePair = [internalName, ''];
                        }
                        break;
                    case "Note":
                    case "HTML":
                        valuePair = [internalName, _.escape(value)];
                        break;
                    case "JSON":
                        valuePair = [internalName, angular.toJson(value)];
                        break;
                    default:
                        valuePair = [internalName, value];
                }
                if(offline) {
                    console.log('{' + fieldDefinition.objectType + '} ' + valuePair);
                }
            }
            return valuePair;
        };

        /**
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
                    pairs.push( createValuePair(field, item[field.mappedName]) );
                }
            });
            return pairs;
        }

        /**
         * Adds or updates a list item based on if the item passed in contains an id attribute
         * @param {object} model
         * @param {object} item
         * @param {object} options
         * @param {string} options.mode - [update, replace, return]
         * @param {boolean} options.buildValuePairs - automatically generate pairs based on fields defined in model
         * @param {array} options.valuePairs - precomputed value pairs to use instead of generating them
         * @returns {promise}
         */
        var addUpdateItemModel = function (model, item, options) {
            var defaults = {
                mode: 'update',  //Options for what to do with local list data array in store [replace, update, return]
                buildValuePairs: true,
                valuePairs: []
            };
            var deferred = $q.defer();
            options = options || {};
            var settings = _.extend(defaults, options);

            /** Display loading animation */
            queueService.increase();

            if (settings.buildValuePairs === true) {
                var editableFields = _.where(model.list.fields, {readOnly: false});
                settings.valuePairs = generateValuePairs(editableFields, item);
            }
            var payload = {
                operation: "UpdateListItems",
                webURL: model.list.webURL,
                listName: model.list.guid,
                valuepairs: settings.valuePairs
            };

            if ((_.isObject(item) && _.isNumber(item.id))) {
                /** Updating existing list item */
                payload.batchCmd = "Update";
                payload.ID = item.id;
            } else {
                /** Creating new list item */
                payload.batchCmd = "New";
            }

            if (offline) {
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
                    /** Creating new item so find next logical id to assign */
                    var maxId = 1;
                    _.each(model.data, function (item) {
                        if (item.id > maxId) {
                            maxId = item.id;
                        }
                    });

                    /** Include standard mock fields for new item */
                    offlineDefaults.author = {
                        lookupId: 23,
                        lookupValue: 'Generic User'
                    };
                    offlineDefaults.created = new Date();
                    offlineDefaults.id = maxId++;

                    /** Use factory to build new object */
                    var newItem = model.factory(_.defaults(item, offlineDefaults));
                    model.data.push(newItem);
                    deferred.resolve(newItem);
                } else {
                    /** Update existing record in local cache*/
                    _.extend(item, offlineDefaults);
                    deferred.resolve(item);
                }
                queueService.decrease();
            } else {
                /** Make web service call */
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    /** Success */
                    var output = processListItems(model, webServiceCall.responseXML, settings);
                    deferred.resolve(output[0]);
                },function (outcome) {
                    /** In the event of an error, display toast */
                    toastr.error("There was an error getting the requested data from " + model.list.name);
                    deferred.reject(outcome);
                }).always(function () {
                    queueService.decrease();
                });
            }
            return deferred.promise;
        };

        /**
         * @description - Typically called directly from a list item, removes the list item from SharePoint
         * and the local cache
         * @param {object} model - model of the list item
         * @param {object} item - list item
         * @param {object} options
         * @param {array} options.target - optional location to search through and remove the local cached copy
         * @returns {promise}
         */
        var deleteItemModel = function (model, item, options) {
            queueService.increase();

            var defaults = {
                target: model.data
            };
            var settings = _.extend({}, defaults, options);

            var payload = {
                operation: "UpdateListItems",
                webURL: model.list.webURL,
                listName: model.list.guid,
                batchCmd: "Delete",
                ID: item.id
            };

            var deferred = $q.defer();

            if (offline) {
                /** Simulate deletion and remove locally */
                removeEntityFromLocalCache(settings.target, item.id);
                queueService.decrease();
                deferred.resolve(settings.target);
            } else {
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function (response) {
                    /** Success */
                    removeEntityFromLocalCache(settings.target, item.id);
                    queueService.decrease();
                    deferred.resolve(settings.target);
                },function (outcome) {
                    //In the event of an error, display toast
                    toastr.error("There was an error deleting a list item from " + model.list.title);
                    queueService.decrease();
                    deferred.reject(outcome);
                });
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
//            registerModels: registerModels,
            serviceWrapper: serviceWrapper
        });

        return dataService;

    }
);