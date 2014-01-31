'use strict';

angular.module('OneApp')
    .service('dataService', function ($q, $timeout, config, queue, utility) {
        var dataService = {};

        /**
         * Post processing of data after returning list items from server
         *              -required-
         * @param model | reference to allow upating of model
         * @param response | Resolved promise from web service call
         *              -optional-
         * @param options.factory | Constructor Function
         * @param options.filter | Optional : XML filter
         * @param options.mapping | Field definitions
         * @param options.mode | Options for what to do with local list data array in store [replace, update, return]
         * @param options.target | Optionally pass in array to update
         */
        var processListItems = function (model, response, options) {
            queue.decrease();

            var defaults = {
                factory: model.factory,
                filter: 'z:row',
                mapping: model.list.mapping,
                mode: 'update',
                target: model.data
            };

            var settings = _.extend({}, defaults, options);

            //Map returned XML to

            var xml = config.offline ?
                $(response).SPFilterNode(settings.filter) :
                $(response.responseXML).SPFilterNode(settings.filter);
            var json = utility.xmlToJson(xml, { mapping: settings.mapping });
            var items = [];

            //Use factory to create new object for each returned item
            _.each(json, function (item) {
                items.push(settings.factory(item));
            });

            if (typeof settings.mode === 'replace') {
                //Replace store data
                settings.target = items;
                console.log(model.list.title + ' Replaced with ' + settings.target.length + ' new records.');
            } else if (settings.mode === 'update') {
                var updateCount = 0,
                    createCount = 0;

                //Map to only run through target list once and speed up subsequent lookups
                var idMap = _.pluck(settings.target, 'id');

                //Default: update any existing items in store
                _.each(items, function (item) {
                    if (idMap.indexOf(item.id) === -1) {
                        //No match found, add to target and update map
                        settings.target.push(item);
                        idMap.push(item.id);
                        createCount++;
                    } else {
                        //Replace local item with updated value
                        angular.copy(item, settings.target[idMap.indexOf(item.id)]);
                        updateCount++;
                    }
                });
                console.log(model.list.title + ' Changes (Create: ' + createCount + ' | Update: ' + updateCount + ')');
            }
            return items;
        };

        var getAttachmentCollectionModel = function (model, item) {
            var deferred = $q.defer();
            if (config.offline) {
                //Simulate async call
                $timeout(function() {
                    //Resolve and return empty array if offline
                    deferred.resolve(['https://sitecollection/site/document.docx',
                        'https://sitecollection/site/some_other.pdf',
                        'https://sitecollection/site/and_text_file.txt']);
                });
                return deferred.promise;
            }

            $().SPServices({
                operation: "GetAttachmentCollection",
                webURL: model.list.webURL,
                listName: model.list.guid,
                ID: item.id
            }).done(function (response) {
                var attachments = [];
                //Push each of the attachment URL's to the above array
                $(response).SPFilterNode("Attachment").each(function () {
                    attachments.push($(this).text());
                });
                //Resolve and return attachments
                deferred.resolve(attachments);
            });
            return deferred.promise;
        };

        /**
         * Returns the version history for a field in a list item
         * @param {object} payload
         * @param {object} fieldDefinition: field definition object from the model
         * @returns {promise} Array of list item changes for the specified field
         */
        var getFieldVersionHistory = function (payload, fieldDefinition) {
            var deferred = $q.defer();
            if (config.offline) {
                //Simulate async response if offline
                $timeout(function () {
                    //Resolve and return empty array
                    deferred.resolve([]);
                }, 0);
            } else {
                //SPServices returns a promise
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    //Success
                    var versions = [];
                    var versionCount = $(webServiceCall.responseText).find("Version").length;
                    $(webServiceCall.responseText).find("Version").each(function (index) {
                        var self = this;

                        var version = {
                            editor: utility.attrToJson($(self).attr("Editor"), 'User'),
                            modified: moment($(self).attr("Modified")).toDate(),
                            //Returns records in desc order so compute the version number from index
                            version: versionCount - index
                        };

                        version[fieldDefinition.mappedName] =
                            utility.attrToJson($(self).attr(fieldDefinition.internalName), fieldDefinition.objectType);

                        //Push to beginning of array
                        versions.unshift(version);
                    });

                    //Resolve and pass back the version history
                    deferred.resolve(versions);
                }, function (outcome) {
                    //Failure
                    toastr.error("Failed to fetch version history.");
                    deferred.reject(outcome);
                });
            }

            return deferred.promise;
        };

        var getUserCollectionFromSite = function (options) {
            queue.increase();
            options = options || {};
            var deferred = $q.defer();

            if (config.offline) {
                var offlineData = 'dev/UserCollection.xml';

                //Get offline data
                $.ajax(offlineData).then(
                    function (offlineData) {
                        var users = $(offlineData).SPFilterNode("User").SPXmlToJson({
                            includeAllAttrs: true,
                            removeOws: false
                        });

                        queue.decrease();

                        //Pass back the user array
                        deferred.resolve(users);
                    }, function () {
                        toastr.error("You need to have a dev/UserCollection.xml in order to get the user group collection in offline mode.");
                        deferred.reject();
                        queue.decrease();

                    });
            } else {
                var payload = {
                    operation: "GetUserCollectionFromSite",
                    webURL: options.webURL || config.defaultUrl
                };

                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    //Success
                    //Map returned XML to JSON
                    var users = $(webServiceCall.responseXML).SPFilterNode("User").SPXmlToJson({
                        includeAllAttrs: true,
                        removeOws: false
                    });

                    queue.decrease();

                    //Pass back the user array
                    deferred.resolve(users);
                }, function (outcome) {
                    //Failure
                    toastr.error("Failed to fetch list collection.");
                    queue.decrease();
                    deferred.reject(outcome);
                });
            }

            return deferred.promise;

        };


        var getGroupCollectionFromSite = function (options) {
            queue.increase();
            options = options || {};
            var deferred = $q.defer();

            if (config.offline) {
                var offlineData = 'dev/GroupCollection.xml';

                //Get offline data
                $.ajax(offlineData).then(
                    function (offlineData) {
                        var groups = $(offlineData).SPFilterNode("Group").SPXmlToJson({
                            includeAllAttrs: true,
                            removeOws: false
                        });

                        queue.decrease();

                        //Pass back the group array
                        deferred.resolve(groups);
                    }, function () {
                        toastr.error("You need to have a dev/GroupCollection.xml in order to get the group collection in offline mode.");
                        deferred.reject();
                        queue.decrease();
                    });
            } else {
                var payload = {
                    operation: "GetGroupCollectionFromSite",
                    webURL: options.webURL || config.defaultUrl
                };

                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    //Success
                    //Map returned XML to JSON
                    var groups = $(webServiceCall.responseXML).SPFilterNode("Group").SPXmlToJson({
                        includeAllAttrs: true,
                        removeOws: false
                    });
                    queue.decrease();

                    //Pass back the group array
                    deferred.resolve(groups);
                }, function (outcome) {
                    //Failure
                    toastr.error("Failed to fetch list collection.");
                    queue.decrease();
                    deferred.reject(outcome);
                });
            }

            return deferred.promise;

        };

        /**
         * @param {string} operation ["GetUserCollectionFromSite" (default) || "GetGroupCollectionFromSite" || "GetGroupCollectionFromUser" || "GetUserCollectionFromGroup"]
         * @param {object} options
         * @returns {promise}
         */
        var getCollection = function (operation, options) {
            queue.increase();
            options = options || {};

            //Determine the XML node to iterate over
            var filterNode = operation.split("Get")[1].split("Collection")[0];

            var deferred = $q.defer();

            if (config.offline) {
                var offlineData = 'dev/' + operation + '.xml';

                //Get offline data
                $.ajax(offlineData).then(
                    function (offlineData) {
                        var items = $(offlineData).SPFilterNode(filterNode).SPXmlToJson({
                            includeAllAttrs: true,
                            removeOws: false
                        });

                        queue.decrease();

                        //Pass back the group array
                        deferred.resolve(items);
                    }, function () {
                        toastr.error("You need to have a dev/" + operation + ".xml in order to get the group collection in offline mode.");
                        deferred.reject();
                        queue.decrease();
                    });
            } else {
                var payload = {
                    operation: operation,
                    webURL: options.webURL || config.defaultUrl
                };

                if(operation === "GetGroupCollectionFromUser") {
                    if(!options.userLoginName) {
                        toastr.error("options.userLoginName is required to complete this operation");
                        deferred.reject([]);
                        return deferred.promise;
                    }
                    payload.userLoginName = options.userLoginName;
                } else if (operation === "GetUserCollectionFromGroup") {
                    if(!options.groupName) {
                        toastr.error("options.groupName is required to complete this operation");
                        deferred.reject([]);
                        return deferred.promise;
                    }
                    payload.groupName = options.groupName;
                }

                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    //Success
                    //Map returned XML to JSON
                    var items = $(webServiceCall.responseXML).SPFilterNode(filerNode).SPXmlToJson({
                        includeAllAttrs: true,
                        removeOws: false
                    });
                    queue.decrease();

                    //Pass back the group array
                    deferred.resolve(items);
                }, function (outcome) {
                    //Failure
                    toastr.error("Failed to fetch list collection.");
                    queue.decrease();
                    deferred.reject(outcome);
                });
            }

            return deferred.promise;

        };


        /**
         * Returns all list settings for each list on the site
         * @param options.webURL returns info for specified site (optional)
         * @returns promise for json dataset
         */
        var getListCollection = function (options) {
            options = options || {};
            queue.increase();
            var deferred = $q.defer();
            var payload = {
                operation: "GetListCollection",
                webURL: options.webURL || config.defaultUrl
            };

            var webServiceCall = $().SPServices(payload);

            webServiceCall.then(function () {
                //Success
                //Map returned XML to JSON
                var json = $(webServiceCall.responseXML).SPFilterNode("List").SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                //Pass back the lists array
                deferred.resolve(json);
            },function (outcome) {
                //Failure
                toastr.error("Failed to fetch list collection.");
                deferred.reject(outcome);
            }).always(function () {
                queue.decrease();
            });
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
            queue.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: "GetList",
                listName: options.listName,
                webURL: options.webURL || config.defaultUrl
            });

            webServiceCall.then(function () {
                //Success
                queue.decrease();

                //Map returned XML to JSON
                var json = $(webServiceCall.responseXML).SPFilterNode("Field").SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                //Pass back the lists array
                deferred.resolve(json);
            },function (outcome) {
                //Failure
                deferred.reject(outcome);
                toastr.error("Failed to fetch list details.");
            }).always(function () {
                queue.decrease();
            });

            return deferred.promise;
        };

        var deleteAttachment = function(options) {
            options = options || {};
            queue.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: "DeleteAttachment",
                listItemID: options.listItemId,
                url: options.url,
                listName: options.listName,
                webURL: options.webURL || config.defaultUrl
            });

            webServiceCall.then(function () {
                //Success
                queue.decrease();

                //Map returned XML to JSON
                var json = $(webServiceCall.responseXML).SPFilterNode("Field").SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                //Pass back the lists array
                deferred.resolve(json);
            },function (outcome) {
                //Failure
                deferred.reject(outcome);
                toastr.error("Failed to fetch list details.");
            }).always(function () {
                queue.decrease();
            });

            return deferred.promise;
        };

        /**
         *
         * @param options.list (required)
         * @param options.webURL (optional)
         * @returns {*}
         */
        var getViewCollection = function (options) {
            options = options || {};
            queue.increase();
            var deferred = $q.defer();

            var webServiceCall = $().SPServices({
                operation: "GetViewCollection",
                listName: options.listName,
                webURL: options.webURL || config.defaultUrl
            });

            webServiceCall.then(function () {
                //Success
                //Map returned XML to JSON
                var json = $(webServiceCall.responseXML).SPFilterNode("View").SPXmlToJson({
                    includeAllAttrs: true,
                    removeOws: false
                });
                //Pass back the lists array
                deferred.resolve(json);
            },function (outcome) {
                //Failure
                toastr.error("Failed to get the view collection.");
                deferred.reject(outcome);
            }).always(function () {
                queue.decrease();
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
            queue.increase();
            var deferred = $q.defer();

            var payload = {
                operation: "GetView",
                listName: options.listName,
                webURL: options.webURL || config.defaultUrl
            };

            //Set view name if provided in options, otherwise it returns default view
            if (_.isDefined(options.viewName)) payload.viewName = options.viewName;

            var webServiceCall = $().SPServices(payload);

            webServiceCall.then(function () {
                //Success
                var output = {
                    query: "<Query>" + $(webServiceCall.responseText).find("Query").html() + "</Query>",
                    viewFields: "<ViewFields>" + $(webServiceCall.responseText).find("ViewFields").html() + "</ViewFields>",
                    rowLimit: $(webServiceCall.responseText).find("RowLimit").html()
                };

                //Pass back the lists array
                deferred.resolve(output);
            },function (outcome) {
                //Failure
                toastr.error("Failed to fetch view details.");
                deferred.reject(outcome);
            }).always(function () {
                queue.decrease();
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
        var registerModels = function (scope, models) {
//                scope.promises = scope.promises || [];
            var promises = [];
            //Add simple refresh functionality
            scope.refresh = function () {
                if (!scope.$$phase) {
                    scope.$apply();
                }
            };
            _.each(models, function (model) {
                promises.push(model.ready.promise);
                scope[utility.toCamelCase(model.list.title)] = model.data;
            });
            return $q.all(promises);
        };

        /** Pulls down any list item changes that have occurred since the last time the query was called **/
        var getUpdatesSinceToken = function (model, query, options) {
            var defaults = {};
            var deferred = $q.defer();
            //Replace defaults with any values supplied in options
            var settings = _.extend({}, defaults, options);

            //Check for changes
            dataService.initializeModel(model, query, {deferred: deferred}).then(function (updates) {
                console.log(updates);
                //If onAfterChange callback is provided and data has changed, call it
                if (_.isFunction(settings.onAfterChange)) {
                    settings.onAfterChange();
                }
                deferred.resolve(updates);
                keepDataUpdated(model, query, options);
            });

            return deferred.promise;
        };


        /**
         * Timer job to check for updates to a list using the GetListItemChangesSinceToken service
         * GetListItemChangesSinceToken is similar to GetListItems and accepts all the same params but also includes a changeToken param
         * Initial request doesn't include a changeToken param and returns the entire list definition, a change token, and the query results
         * Each subsequent call uses this token to return just the delta (token only updates when there has been a change)
         * Deleted items are returned as "Id" elements with a changeType of Delete
         * http://blogs.msdn.com/b/sharepointdeveloperdocs/archive/2008/01/21/synchronizing-with-windows-sharepoint-services-part-1.aspx
         * @param {object} model
         * @param {object} query
         * @param {number} options.timeout - milliseconds between server refresh
         * @callback {function} options.onAfterChange - callback called after response from server
         * @returns {promise}
         */
        var keepDataUpdated = function (model, query, options) {
            var defaults = {
                timeout: 30000 //30 seconds
            };

            //Replace defaults with any values supplied in options
            var settings = _.extend({}, defaults, options);

            //Delay before running
            $timeout(function () {
                //Check for changes
                getUpdatesSinceToken(model, query, options);
            }, settings.timeout);
        };

        /**
         * Takes in the model and a query that
         * @param {object} model
         * @param {object} query
         * @param options.deferred //Optionally pass in another deferred object to resolve(default: model.ready)
         * @param options.offlineXML //Alternate location to XML data file
         * @returns {promise} - Returns reference to model
         */
        var initializeModel = function (model, query, options) {
            //Display animation
            queue.increase();
            options = options || {};

            var deferredObj = options.deferred || model.ready;

            if (config.offline) {
                //Optionally set alternate offline XML location but default to value in model
                var offlineData = options.offlineXML || 'dev/' + model.list.title + '.xml';

                //Get offline data
                $.ajax(offlineData).then(function (offlineData) {
                    var changes = processListItems(model, offlineData, options);
                    //Set date time to allow for time based updates
                    query.lastRun = new Date();
                    queue.decrease();
                    deferredObj.resolve(changes);
                });
            } else if (query) {
                var webServiceCall = $().SPServices(query);
                webServiceCall.then(function () {
                    if (query.operation === "GetListItemChangesSinceToken") {
                        //Find element containing the token (should only be 1 but use .each to be safe)
                        $(webServiceCall.responseXML).SPFilterNode('Changes').each(function () {
                            //Retrieve the token string
                            var token = $(this).attr("LastChangeToken");
                            //Store token for future web service calls to return changes
                            query.changeToken = token;
                        });
                        var deleteCount = 0;
                        //Remove any local list items that were deleted from the server
                        $(webServiceCall.responseXML).SPFilterNode('Id').each(function () {
                            //Check for the type of change
                            var changeType = $(this).attr("ChangeType");
                            if (changeType === "Delete") {
                                var itemId = parseInt($(this).text(), 10);
                                //Remove from local data array
                                var item = _.findWhere(model.data, {id: itemId});
                                var index = _.indexOf(model.data, item);
                                if (index) {
                                    deleteCount++;
                                    //Remove the locally cached record
                                    model.data.splice(index, 1);
                                }
                            }
                        });
                        if (deleteCount > 0) {
                            console.log(deleteCount + ' item(s) removed from local cache to mirror changes on source list.');
                        }
                    }
                    //Convert the XML into JS
                    var changes = processListItems(model, webServiceCall);
                    //Set date time to allow for time based updates
                    query.lastRun = new Date();
                    queue.decrease();
                    deferredObj.resolve(changes);
                });
            }

            return deferredObj.promise;
        };

//            var getListItemChanges = function(model, query, options) {
//                //Display animation
//                queue.increase();
//                options = options || {};
//                //Make sure the correct operation is set
//                query.operation = "GetListItemChanges";
//                var deferredObj = options.deferred || model.ready;
//
//                if(config.offline) {
//                    //Get offline data again to simulate real async call
//                    $.ajax( 'dev/' + model.list.title + '.xml').then(function(offlineData) {
//                        //Set date time to allow for time based updates
//                        query.lastRun = new Date();
//                        queue.decrease();
//                        //Resolve with no changes
//                        deferredObj.resolve([]);
//                    });
//                } else if(query){
//                    var webServiceCall = $().SPServices(query);
//                    webServiceCall.then(function() {
//                        dataService.processListItems(model, webServiceCall);
//                        //Set date time to allow for time based updates
//                        query.lastRun = new Date();
//                        queue.decrease();
//                        deferredObj.resolve(model);
//                    });
//                }
//
//                return deferredObj.promise;
//            };
        /**
         *
         * @param pairOptions.list Object (Need either list or list name)
         * @param pairOptions.listName String
         * @param pairOptions.definition Object from fields in store array
         * @param pairOptions.propertyName
         * @param pairOptions.value (Required)
         *
         */

        var createValuePair = function (field, value) {
            var valuePair = [];

            var stringifyArray = function (idProperty) {
                if (value && value.length) {
                    var arrayValue = '';
                    _.each(value, function (lookupObject, iteration) {
                        //Need to format string of id's in following format [ID0];#;#[ID1];#;#[ID1]
                        arrayValue += lookupObject[idProperty];
                        if (iteration < value.length) {
                            arrayValue += ';#;#';
                        }
                    });
                    valuePair = [field.internalName, arrayValue];
                } else {
                    //Array is empty
                    valuePair = [field.internalName, ''];
                }
            };

            var internalName = field.internalName;

            if (_.isUndefined(value) || value === '') {
                //Create empty value pair if blank or undefined
                valuePair = [internalName, ''];
            } else {
                switch (field.objectType) {
                    case "Lookup":
                    case "User":
                        if (_.isUndefined(value.lookupId)) {
                            valuePair = [internalName, ''];
                        } else {
                            valuePair = [internalName, value.lookupId];
                        }
                        break;
                    case "LookupMulti":
                    case "UserMulti":
                        stringifyArray('lookupId');
                        break;
                    case "Boolean":
                        valuePair = [internalName, value ? 1 : 0];
                        break;
                    case "DateTime":
                        if (moment(value).isValid()) {
                            valuePair = [internalName, moment(value).format()];
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
                console.log('{' + field.objectType + '} ' + valuePair);
            }
            return valuePair;
        };

        var addUpdateItemModel = function (model, item, options) {
            var defaults = {
                mode: 'update',  //Options for what to do with local list data array in store [replace, update, return]
                buildValuePairs: true,
                valuePairs: []
            };
            var deferred = $q.defer();
            options = options || {};
            var settings = _.extend(defaults, options);

            //Display loading animation
            queue.increase();

            if (settings.buildValuePairs === true) {
                var editableFields = _.where(model.list.fields, {readOnly: false});
                _.each(editableFields, function (field) {
                    //Check to see if item contains data for this field
                    if (_.has(item, field.mappedName)) {
                        settings.valuePairs.push(
                            createValuePair(field, item[field.mappedName])
                        );
                    }
                });
            }
            var payload = {
                operation: "UpdateListItems",
                webURL: model.list.webURL,
                listName: model.list.guid,
                valuepairs: settings.valuePairs
            };

            if ((_.isObject(item) && _.isNumber(item.id))) {
                //Updating existing list item
                payload.batchCmd = "Update";
                payload.ID = item.id;
            } else {
                //Creating new list item
                payload.batchCmd = "New";
            }

            window.console.log(payload);

            if (config.offline) {
                //Offline mode
                var offlineDefaults = {
                    modified: new Date(),
                    editor: {
                        lookupId: 23,
                        lookupValue: 'Hatcher, Scott B CIV ESED, JXPML'
                    }
                };
                if (_.isUndefined(item.id)) {
                    //Creating new item so find next logical id to assign
                    var maxId = 0;
                    _.each(model.data, function (item) {
                        if (item.id > maxId) {
                            maxId = item.id;
                        }
                    });
                    //Include additional fields for new item
                    offlineDefaults.author = {
                        lookupId: 23,
                        lookupValue: 'Hatcher, Scott B CIV ESED, JXPML'
                    };
                    offlineDefaults.created = new Date();
                    offlineDefaults.id = maxId++;
                    //Use factory to build new object
                    var newItem = model.factory(_.defaults(item, offlineDefaults));
                    model.data.push(newItem);
                    deferred.resolve(newItem);
                } else {
                    //Update existing record
                    _.extend(item, offlineDefaults);
                    deferred.resolve(item);
                }
                queue.decrease();
            } else {
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function () {
                    //Success
                    var output = processListItems(model, webServiceCall, settings);
                    deferred.resolve(output[0]);

                },function (outcome) {
                    //In the event of an error, display toast
                    toastr.error("There was an error getting the requested data from " + model.list.name);
                    deferred.reject(outcome);
                }).always(function () {
                    queue.decrease();
                });
            }
            return deferred.promise;
        };

        var deleteItemModel = function (model, item) {
            queue.increase();
            var payload = {
                operation: "UpdateListItems",
                webURL: model.list.webURL,
                listName: model.list.guid,
                batchCmd: "Delete",
                ID: item.id
            };
            var deferred = $q.defer();

            function removeItemFromMemory() {
                var index = _.indexOf(model.data, item);
                if (index) {
                    //Remove the locally cached record
                    model.data.splice(index, 1);
                }
            }

            if (config.offline) {
                //Simulate deletion and remove locally
                removeItemFromMemory();
                queue.decrease();
                deferred.resolve(model.list.data);
            } else {
                var webServiceCall = $().SPServices(payload);

                webServiceCall.then(function (response) {
                    //Success
                    removeItemFromMemory();
                    deferred.resolve(response);
                },function (outcome) {
                    //In the event of an error, display toast
                    toastr.error("There was an error deleting a list item from " + model.list.title);
                    deferred.reject(outcome);
                }).always(function () {
                    queue.decrease();
                });
            }
            return deferred.promise;
        };

//        var getUserGroupCollection = function (user) {
//
//            var deferred = $q.defer();
//
//            if (config.offline) {
//                //Get offline data
//                $.ajax('dev/usergroupcollection.xml').then(function (offlineData) {
//                    processListItems(model, offlineData, filter);
//                    //Set date time to allow for time based updates
//                    query.lastRun = new Date();
//                    queue.decrease();
//                    deferredObj.resolve(model);
//                });
//            }
//            queue.increase();
//            var webServiceCall = $().SPServices({
//                webURL: config.defaultUrl,
//                operation: "GetGroupCollectionFromUser",
//                userLoginName: store.user.accountRef
//            });
//
//            webServiceCall.then(function () {
//                user.groupCollection.groups = [];
//                $(user.groupCollection.responseXML).find("Group").each(function (index) {
//                    var self = $(this);
//                    user.groupCollection.groups.push({
//                        id: self.attr('ID'),
//                        name: self.attr('Name')
//                    });
//                });
//
//                /**Can pass in either a group name or id**/
//                /**Returns true/false**/
//                user.groupCollection.isMemberOf = function (groupNameOrId) {
//                    var match = _.find(user.groupCollection.groups, function (group) {
//                        return group.name === groupNameOrId || group.id === groupNameOrId;
//                    });
//
//                    return typeof match !== 'undefined' ? true : false;
//                };
//                deferred.resolve(user.groupCollection);
//            },function (outcome) {
//                //In the event of an error, display toast
//                toastr.error("There was an error retrieving user group collection information.");
//                deferred.reject(outcome);
//            }).always(function () {
//                    queue.decrease();
//                });
//            return deferred.promise;
//        };

        _.extend(dataService, {
            addUpdateItemModel: addUpdateItemModel,
            createValuePair: createValuePair,
            deleteAttachment: deleteAttachment,
            deleteItemModel: deleteItemModel,
            getAttachmentCollectionModel: getAttachmentCollectionModel,
            getCollection: getCollection,
            getFieldVersionHistory: getFieldVersionHistory,
            getGroupCollectionFromSite: getGroupCollectionFromSite,
            getList: getList,
            getListCollection: getListCollection,
            getUpdatesSinceToken: getUpdatesSinceToken,
            getUserCollectionFromSite: getUserCollectionFromSite,
            getView: getView,
            getViewCollection: getViewCollection,
            initializeModel: initializeModel,
            keepDataUpdated: keepDataUpdated,
            processListItems: processListItems,
            registerModels: registerModels
        });

        return dataService;

    }
);