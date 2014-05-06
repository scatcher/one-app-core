'use strict';
angular.module('spAngularDemo', [
  'ngAnimate',
  'ngResource',
  'ngSanitize',
  'ngAnimate',
  'spAngular',
  'ui.bootstrap',
  'ui.router',
  'ngTable',
  'firebase',
  'angularSpinner',
  'toastr'
]).config([
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise('/');
    //Now set up the states
    $stateProvider.state('home', {
      url: '/',
      templateUrl: 'modules/main/views/main_view.html',
      controller: 'mainCtrl'
    }).state('groupmanager', {
      url: '/group_manager',
      templateUrl: 'modules/group_manager/views/group_manager_view.html',
      controller: 'groupManagerCtrl'
    }).state('offline', {
      url: '/offline',
      templateUrl: 'modules/dev/views/generate_offline_view.html',
      controller: 'generateOfflineCtrl'
    });
  }
]).run(function () {
});
;
'use strict';
/**
* @ngdoc service
* @name configService
* @description
* Basic config for the application (unique for each environment)
*
*/
angular.module('spAngular').constant('spAngularConfig', { offline: window.location.href.indexOf('localhost') > -1 || window.location.href.indexOf('http://0.') > -1 || window.location.href.indexOf('http://10.') > -1 || window.location.href.indexOf('http://192.') > -1 }).service('configService', [
  'toastrConfig',
  'spAngularConfig',
  function (toastrConfig, spAngularConfig) {
    /** Set the default toast location */
    toastrConfig.positionClass = 'toast-bottom-right';
    return {
      appTitle: 'SP-Angular',
      debugEnabled: true,
      firebaseURL: 'The url of your firebase source',
      offline: spAngularConfig.offline
    };
  }
]);
;
'use strict';
/**
 * @ngdoc service
 * @name dataService
 * @description
 * Handles all interaction with SharePoint web services
 *
 * For additional information on many of these web service calls, see Marc Anderson's SPServices documentation
 *  http://spservices.codeplex.com/documentation
 */
angular.module('spAngular').service('dataService', [
  '$q',
  '$timeout',
  'queueService',
  'configService',
  'utilityService',
  'spAngularConfig',
  'toastr',
  function ($q, $timeout, queueService, configService, utilityService, spAngularConfig, toastr) {
    var dataService = {};
    /** Flag to use cached XML files from the src/dev folder */
    var offline = spAngularConfig.offline;
    /** Allows us to make code easier to read */
    var online = !offline;
    //TODO Figure out a better way to get this value, shouldn't need to make a blocking call
    var defaultUrl = configService.defaultUrl || online ? $().SPServices.SPGetCurrentSite() : '';
    /**
         * @ngdoc function
         * @name dataService.processListItems
         * @description
         * Post processing of data after returning list items from server
         * @param {object} model Reference to allow updating of model.
         * @param {xml} responseXML Resolved promise from SPServices web service call.
         * @param {object} [options] Optional configuration object.
         * @param {function} [options.factory=model.factory] Constructor function typically stored on the model.
         * @param {string} [options.filter='z:row'] XML filter string used to find the elements to iterate over.
         * @param {Array} [options.mapping=model.list.mapping] Field definitions, typeically stored on the model.
         * @param {string} [options.mode='update'] Options for what to do with local list data array in
         * store ['replace', 'update', 'return']
         * @param {Array} [options.target=model.getCache()] Optionally pass in array to update after processing.
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
          console.log(model.list.title + ' Changes (Create: ' + updateStats.created + ' | Update: ' + updateStats.updated + ')');
        }
      }
      return entities;
    };
    /**
         * @ngdoc function
         * @name dataService.updateLocalCache
         * @description
         * Maps a cache by entity id.  All provided entities are then either added if they don't already exist
         * or replaced if they do.
         * @param {object[]} localCache The cache for a given query.
         * @param {object[]} entities All entities that should be merged into the cache.
         * @returns {object} {created: number, updated: number}
         */
    function updateLocalCache(localCache, entities) {
      var updateCount = 0, createCount = 0;
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
      return {
        created: createCount,
        updated: updateCount
      };
    }
    /**
         * @ngdoc function
         * @name dataService.parseFieldVersionHistoryResponse
         * @description
         * Takes an XML response from SharePoint webservice and returns an array of field versions.
         *
         * @param {xml} responseXML Returned XML from web service call.
         * @param {object} fieldDefinition Field definition from the model.
         *
         * @returns {Array} Array objects containing the various version of a field for each change.
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
            version: versionCount - index
          };
        /** Properly format field based on definition from model */
        version[fieldDefinition.mappedName] = utilityService.attrToJson($(self).attr(fieldDefinition.internalName), fieldDefinition.objectType);
        /** Push to beginning of array */
        versions.unshift(version);
      });
      return versions;
    }
    /**
         * @ngdoc function
         * @name dataService.getFieldVersionHistory
         * @description
         * Returns the version history for a field in a list item.
         * @param {object} payload Configuration object passed to SPServices.
         <pre>
         var payload = {
                operation: 'GetVersionCollection',
                webURL: configService.defaultUrl,
                strlistID: model.list.guid,
                strlistItemID: listItem.id,
                strFieldName: fieldDefinition.internalName
            };
         </pre>
         * @param {object} fieldDefinition Field definition object from the model.
         * @returns {object[]} Promise which resolves with an array of list item changes for the specified field.
         */
    var getFieldVersionHistory = function (payload, fieldDefinition) {
      var deferred = $q.defer();
      if (online) {
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
      } else {
        /** Simulate async response if offline */
        $timeout(function () {
          /** Resolve with an empty array */
          deferred.resolve([]);
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
         * @returns {object[]} Promise which when resolved will contain an array of objects representing the
         * requested collection.
         *
         * @example
         <pre>
           dataService.getCollection({
                operation: "GetGroupCollectionFromUser",
                userLoginName: $scope.state.selectedUser.LoginName
                }).then(function (response) {
                    postProcessFunction(response);
               });
         </pre>
         */
    var getCollection = function (options) {
      queueService.increase();
      var defaults = { webURL: defaultUrl };
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
        $.ajax(offlineData).then(function (offlineData) {
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
          verifyParams([
            'listName',
            'ID'
          ]);
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
         * @ngdoc function
         * @name dataService.serviceWrapper
         * @description
         * Generic wrapper for any SPServices web service call.  The big benefit to this function is it allows us
         * to continue to use the $q promise model throughout the application instead of using the promise
         * implementation used in SPServices so we have a more consistent experience.
         * Check http://spservices.codeplex.com/documentation for details on expected parameters for each operation.
         *
         * @param {object} options Payload params that is directly passed to SPServices.
         * @param {string} [options.webURL=defaultUrl] XML filter string used to find the elements to iterate over.
         * @param {string} [options.filterNode] XML filter string used to find the elements to iterate over.
         * This is typically 'z:row' for list items.
         * @returns {object} Returns a promise which when resolved either returns clean objects parsed by the value
         * in options.filterNode or the raw XML response if a options.filterNode
         *
         *      If options.filterNode is provided, returns XML parsed by node name
         *      Otherwise returns the server response
         */
    //TODO: Make this the primary function which interacts with SPServices and makes web service call.  No need having this logic duplicated.
    var serviceWrapper = function (options) {
      var defaults = { webURL: defaultUrl };
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
      if (online) {
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
      } else {
        /** Debugging offline */
        var offlineData = 'dev/' + opts.operation + '.xml';
        /** Get offline data */
        $.ajax(offlineData).then(function (offlineData) {
          queueService.decrease();
          /** Pass back the group array */
          deferred.resolve(processXML(offlineData));
        }, function (outcome) {
          toastr.error('You need to have a dev/' + opts.operation + '.xml in order to get the group collection in offline mode.');
          deferred.reject(outcome);
          queueService.decrease();
        });
      }
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name dataService.getList
         * @description
         * Returns all list settings for each list on the site
         * @param {object} options Configuration parameters.
         * @param {string} options.listName GUID of the list.
         * @param {string} [options.webURL] Can override the default web url if desired.
         * @returns {object[]} Promise which resolves with an array of field definitions for the list.
         */
    var getList = function (options) {
      var opts = _.extend({}, options);
      queueService.increase();
      var deferred = $q.defer();
      //TODO: Use serviceWrapper
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
         * @ngdoc function
         * @name dataService.deleteAttachment
         * @description
         * Deletes and attachment on a list item.  Most commonly used by ListItem.deleteAttachment which is shown
         * in the example.
         *
         * @param {object} options Configuration parameters.
         * @param {string} options.listItemId ID of the list item with the attachment.
         * @param {string} options.url Requires the URL for the attachment we want to delete.
         * @param {string} options.listName Best option is the GUID of the list.
         <pre>'{37388A98-534C-4A28-BFFA-22429276897B}'</pre>
         *
         * @returns {object} Promise which resolves with the updated attachment collection.
         *
         * @example
         <pre>
         ListItem.prototype.deleteAttachment = function (url) {
            var listItem = this;
            return dataService.deleteAttachment({
                listItemId: listItem.id,
                url: url,
                listName: listItem.getModel().list.guid
            });
         };
         </pre>
         */
    var deleteAttachment = function (options) {
      var defaults = { operation: 'DeleteAttachment' };
      var opts = _.extend({}, defaults, options);
      queueService.increase();
      var deferred = $q.defer();
      //TODO: Use serviceWrapper
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
         * @ngdoc function
         * @name dataService.getView
         * @description
         * Returns details of a SharePoint list view
         * @param {object} options Configuration parameters.
         * @param {string} options.listName GUID of the list.
         * @param {string} [options.viewName] Formatted as a GUID, if not provided
         <pre>'{37388A98-534C-4A28-BFFA-22429276897B}'</pre>
         * @param {string} [options.webURL] Can override the default web url if desired.
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
      //TODO: Use serviceWrapper
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
         * @ngdoc function
         * @name dataService.executeQuery
         * @description
         * Primary method of retrieving list items from SharePoint.  Look at Query and Model for specifics.
         * @param {object} model Reference to the model where the Query resides.
         * @param {object} query Reference to the Query making the call.
         * @param {object} [options] Optional configuration parameters.
         * @param {Array} [options.target=model.getCache()] The target destination for returned entities
         * @param {string} [options.offlineXML='dev/' + model.list.title + '.xml'] Optionally include the location of
         * a custom offline XML file specifically for this query.
         * @returns {object[]} - Array of list item objects.
         */
    var executeQuery = function (model, query, options) {
      var defaults = { target: model.getCache() };
      var deferred = $q.defer();
      /** Extend defaults **/
      var opts = _.extend({}, defaults, options);
      /** Allow a list item to reference the query which generated it */
      opts.getQuery = function () {
        return query;
      };
      /** Trigger processing animation */
      queueService.increase();
      if (online) {
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
      } else {
        /** Simulate an web service call if working offline */
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
                     *  Get offline data stored in the src/dev folder
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
      }
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name dataService.removeEntityFromLocalCache
         * @description
         * Searches for an entity based on list item ID and removes it from the cached array if it exists.
         * @param {Array} entityArray Cached array of list items for a query.
         * @param {Number} entityId The ID to evaluate against to determine if there is a match.
         * @returns {boolean} Returns true if a list item was successfully found and removed.
         */
    function removeEntityFromLocalCache(entityArray, entityId) {
      var successfullyDeleted = false;
      /** Remove from local data array */
      var item = _.findWhere(entityArray, { id: entityId });
      var index = _.indexOf(entityArray, item);
      if (index) {
        /** Remove the locally cached record */
        entityArray.splice(index, 1);
        successfullyDeleted = true;
      }
      return successfullyDeleted;
    }
    /**
         * @ngdoc function
         * @name dataService.retrieveChangeToken
         * @description
         * Returns the change token from the xml response of a GetListItemChangesSinceToken query
         * Note: this attribute is only found when using 'GetListItemChangesSinceToken'
         * @param {xml} responseXML XML response from the server.
         */
    function retrieveChangeToken(responseXML) {
      return $(responseXML).find('Changes').attr('LastChangeToken');
    }
    /**
         * @ngdoc function
         * @name dataService.retrievePermMask
         * @description
         * Returns the text representation of the users permission mask
         * Note: this attribute is only found when using 'GetListItemChangesSinceToken'
         * @param {xml} responseXML XML response from the server.
         */
    function retrievePermMask(responseXML) {
      return $(responseXML).find('listitems').attr('EffectivePermMask');
    }
    /**
         * @ngdoc function
         * @name dataService.processDeletionsSinceToken
         * @description
         * GetListItemChangesSinceToken returns items that have been added as well as deleted so we need
         * to remove the deleted items from the local cache.
         * @param {xml} responseXML XML response from the server.
         * @param {Array} entityArray Cached array of list items for a query.
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
         * @ngdoc function
         * @name dataService.stringifySharePointMultiSelect
         * @description
         * Turns an array of, typically {lookupId: someId, lookupValue: someValue}, objects into a string
         * of delimited id's that can be passed to SharePoint for a multi select lookup or multi user selection
         * field.  SharePoint doesn't need the lookup values so we only need to pass the ID's back.
         *
         * @param {object[]} multiSelectValue Array of {lookupId: #, lookupValue: 'Some Value'} objects.
         * @param {string} [idProperty='lookupId'] Property name where we'll find the ID value on each of the objects.
         * @returns {string} Need to format string of id's in following format [ID0];#;#[ID1];#;#[ID1]
         */
    function stringifySharePointMultiSelect(multiSelectValue, idProperty) {
      var stringifiedValues = '';
      var idProp = idProperty || 'lookupId';
      _.each(multiSelectValue, function (lookupObject, iteration) {
        /** Need to format string of id's in following format [ID0];#;#[ID1];#;#[ID1] */
        stringifiedValues += lookupObject[idProp];
        if (iteration < multiSelectValue.length) {
          stringifiedValues += ';#;#';
        }
      });
      return stringifiedValues;
    }
    /**
         * @ngdoc function
         * @name dataService.createValuePair
         * @description
         * Uses a field definition from a model to properly format a value for submission to SharePoint.  Typically
         * used prior to saving a list item, we iterate over each of the non-readonly properties defined in the model
         * for a list item and convert those value into value pairs that we can then hand off to SPServices.
         * @param {object} fieldDefinition The field definition, typically defined in the model.
         <pre>{ internalName: "Title", objectType: "Text", mappedName: "lastName", readOnly:false }</pre>
         * @param {*} value Current field value.
         * @returns {Array} [fieldName, fieldValue]
         */
    var createValuePair = function (fieldDefinition, value) {
      var valuePair = [];
      var internalName = fieldDefinition.internalName;
      if (!value || value === '') {
        /** Create empty value pair if blank or undefined */
        valuePair = [
          internalName,
          ''
        ];
      } else {
        switch (fieldDefinition.objectType) {
        case 'Lookup':
        case 'User':
          if (!value.lookupId) {
            valuePair = [
              internalName,
              ''
            ];
          } else {
            valuePair = [
              internalName,
              value.lookupId
            ];
          }
          break;
        case 'LookupMulti':
        case 'UserMulti':
          var stringifiedArray = stringifySharePointMultiSelect(value, 'lookupId');
          valuePair = [
            fieldDefinition.internalName,
            stringifiedArray
          ];
          break;
        case 'Boolean':
          valuePair = [
            internalName,
            value ? 1 : 0
          ];
          break;
        case 'DateTime':
          if (moment(value).isValid()) {
            //A string date in ISO format, e.g., '2013-05-08T01:20:29Z-05:00'
            valuePair = [
              internalName,
              moment(value).format('YYYY-MM-DDTHH:mm:ss[Z]Z')
            ];
          } else {
            valuePair = [
              internalName,
              ''
            ];
          }
          break;
        case 'Note':
        case 'HTML':
          valuePair = [
            internalName,
            _.escape(value)
          ];
          break;
        case 'JSON':
          valuePair = [
            internalName,
            angular.toJson(value)
          ];
          break;
        default:
          valuePair = [
            internalName,
            value
          ];
        }
        if (offline) {
          console.log('{' + fieldDefinition.objectType + '} ' + valuePair);
        }
      }
      return valuePair;
    };
    /**
         * @ngdoc function
         * @name dataService.generateValuePairs
         * @description
         * Typically used to iterate over the non-readonly field definitions stored in a model and convert a
         * given list item entity into value pairs that we can pass to SPServices for saving.
         * @param {Array} fieldDefinitions Definitions from the model.
         * @param {object} item list item that we'll attempt to iterate over to find the properties that we need to
         * save it to SharePoint.
         * @returns {Array[]} Value pairs of all non-readonly fields. [[fieldName, fieldValue]]
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
         * @ngdoc function
         * @name dataService.updateAllCaches
         * @description
         * Propagates a change to all duplicate entities in all cached queries within a given model.
         * @param {object} model Reference to the entities model.
         * @param {object} entity JavaScript object representing the SharePoint list item.
         * @param {object} [exemptQuery] - The query containing the updated item is automatically updated so we don't
         * need to process it.
         *
         * @returns {number} The number of queries where the entity was found and updated.
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
         * @ngdoc function
         * @name dataService.addUpdateItemModel
         * @description
         * Adds or updates a list item based on if the item passed in contains an id attribute.
         * @param {object} model Reference to the entities model.
         * @param {object} entity JavaScript object representing the SharePoint list item.
         * @param {object} [options] Optional configuration params.
         * @param {string} [options.mode='update'] [update, replace, return]
         * @param {boolean} [options.buildValuePairs=true] Automatically generate pairs based on fields defined in model.
         * @param {boolean} [options.updateAllCaches=false] Search through the cache for each query on the model and
         * update all instances of this entity to ensure entity is updated everywhere.  This is more process intensive
         * so by default we only update the cached entity in the cache where this entity is currently stored.  Note: Only
         * applicable when updating an entity.
         * @param {Array[]} [options.valuePairs] Precomputed value pairs to use instead of generating them for each
         * field identified in the model.
         * @returns {object} Promise which resolves with the newly updated item.
         */
    var addUpdateItemModel = function (model, entity, options) {
      var defaults = {
          mode: 'update',
          buildValuePairs: true,
          updateAllCaches: false,
          valuePairs: []
        };
      var deferred = $q.defer();
      var opts = _.extend({}, defaults, options);
      /** Display loading animation */
      queueService.increase();
      if (opts.buildValuePairs === true) {
        var editableFields = _.where(model.list.fields, { readOnly: false });
        opts.valuePairs = generateValuePairs(editableFields, entity);
      }
      var payload = {
          operation: 'UpdateListItems',
          webURL: model.list.webURL,
          listName: model.list.guid,
          valuepairs: opts.valuePairs
        };
      if (_.isObject(entity) && _.isNumber(entity.id)) {
        /** Updating existing list item */
        payload.batchCmd = 'Update';
        payload.ID = entity.id;
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
          if (opts.updateAllCaches && _.isNumber(entity.id)) {
            updateAllCaches(model, updatedEntity, entity.getQuery(), 'update');
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
        if (!entity.id) {
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
            _.extend(entity, offlineDefaults);
            /** Use factory to build new object */
            newItem = new model.factory(entity);
            query.cache.push(newItem);
          });
          deferred.resolve(newItem);
        } else {
          /** Update existing record in local cache*/
          _.extend(entity, offlineDefaults);
          deferred.resolve(entity);
        }
        queueService.decrease();
      }
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name dataService.deleteItemModel
         * @description
         * Typically called directly from a list item, removes the list item from SharePoint
         * and the local cache.
         * @param {object} model Reference to the entities model.
         * @param {object} entity JavaScript object representing the SharePoint list item.
         * @param {object} [options] Optional configuration params.
         * @param {Array} [options.target=item.getContainer()] Optional location to search through and remove the
         * local cached copy.
         * @param {boolean} [options.updateAllCaches=false] Search through the cache for each query on the model
         * to ensure entity is removed everywhere.  This is more process intensive so by default we only delete the
         * cached entity in the cache where this entity is currently stored.
         * @returns {object} Promise which resolves when the operation is complete.  Nothing of importance is returned.
         */
    var deleteItemModel = function (model, entity, options) {
      queueService.increase();
      var defaults = {
          target: entity.getContainer(),
          updateAllCaches: false
        };
      var opts = _.extend({}, defaults, options);
      var payload = {
          operation: 'UpdateListItems',
          webURL: model.list.webURL,
          listName: model.list.guid,
          batchCmd: 'Delete',
          ID: entity.id
        };
      var deferred = $q.defer();
      function cleanCache() {
        var deleteCount = 0;
        if (opts.updateAllCaches) {
          var model = entity.getModel();
          _.each(model.queries, function (query) {
            var entityRemoved = removeEntityFromLocalCache(query.cache, entity.id);
            if (entityRemoved) {
              deleteCount++;
            }
          });
        } else {
          var entityRemoved = removeEntityFromLocalCache(opts.target, entity.id);
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
]);
;
'use strict';
/**
 * @ngdoc service
 * @name fieldService
 * @description
 * Handles the mapping of the various types of fields used within a SharePoint list
 */
angular.module('spAngular').service('fieldService', [
  'utilityService',
  function (utilityService) {
    var getUniqueCounter = function () {
      var self = getUniqueCounter;
      self.count = self.count || 0;
      self.count++;
      return self.count;
    };
    function randomBoolean() {
      return chance.bool();
    }
    function randomString(len) {
      return chance.word() + ' ' + chance.word();
    }
    function randomParagraph() {
      return chance.paragraph();
    }
    function randomCurrency() {
      return parseInt(_.random(10000000, true) * 100) / 100;
    }
    function randomDate() {
      return chance.date();
    }
    function randomInteger() {
      return chance.integer();
    }
    /**
         * @ngdoc function
         * @name fieldService.resolveValueForEffectivePermMask
         * @description
         * Takes the name of a permission mask and returns a permission value which can then be used
         * to generate a permission object using modelService.resolvePermissions(outputfromthis)
         * @param {string} perMask
         * @returns {string} value
         */
    function resolveValueForEffectivePermMask(perMask) {
      var permissionValue;
      switch (perMask) {
      case 'AddListItems':
        permissionValue = '0x0000000000000002';
        break;
      case 'EditListItems':
        permissionValue = '0x0000000000000004';
        break;
      case 'DeleteListItems':
        permissionValue = '0x0000000000000008';
        break;
      case 'ApproveItems':
        permissionValue = '0x0000000000000010';
        break;
      case 'FullMask':
        permissionValue = '0x7FFFFFFFFFFFFFFF';
        break;
      case 'ViewListItems':
      default:
        permissionValue = '0x0000000000000001';
        break;
      }
      return permissionValue;
    }
    /**
         * @ngdoc function
         * @name fieldService.mockPermMask
         * @description
         * Defaults to a full mask but allows simulation of each of main permission levels
         * @param {object} [options]
         * @param {string} [options.permissionLevel=FullMask]
         * @returns {string}
         */
    function mockPermMask(options) {
      var mask = 'FullMask';
      if (options && options.permissionLevel) {
        mask = options.permissionLevel;
      }
      return resolveValueForEffectivePermMask(mask);
    }
    function randomLookup() {
      return {
        lookupId: getUniqueCounter(),
        lookupValue: chance.word()
      };
    }
    function randomUser() {
      return {
        lookupId: getUniqueCounter(),
        lookupValue: chance.name()
      };
    }
    function randomLookupMulti() {
      var mockData = [];
      _.each(_.random(10), function () {
        mockData.push(randomLookup());
      });
      return mockData;
    }
    function randomUserMulti() {
      var mockData = [];
      _.each(_.random(10), function () {
        mockData.push(randomUser());
      });
      return mockData;
    }
    /**
         * @ngdoc function
         * @name fieldService.Field
         * @description
         * Decorates field with optional defaults
         * @param obj
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
      self.displayName = self.displayName || utilityService.fromCamelCase(self.mappedName);
    }
    Field.prototype.getDefinition = function () {
      return getDefinition(this.objectType);
    };
    Field.prototype.getDefaultValueForType = function () {
      return getDefaultValueForType(this.objectType);
    };
    Field.prototype.getMockData = function (options) {
      return getMockData(this.objectType, options);
    };
    /** Field types used on the models to create a field definition */
    var fieldTypes = {
        Text: {
          defaultValue: '',
          staticMock: 'Test String',
          dynamicMock: randomString
        },
        TextLong: {
          defaultValue: '',
          staticMock: 'This is a sentence.',
          dynamicMock: randomParagraph
        },
        Boolean: {
          defaultValue: null,
          staticMock: true,
          dynamicMock: randomBoolean
        },
        Counter: {
          defaultValue: null,
          staticMock: getUniqueCounter(),
          dynamicMock: getUniqueCounter
        },
        Currency: {
          defaultValue: null,
          staticMock: 120.5,
          dynamicMock: randomCurrency
        },
        DateTime: {
          defaultValue: null,
          staticMock: new Date(2014, 5, 4, 11, 33, 25),
          dynamicMock: randomDate
        },
        Integer: {
          defaultValue: null,
          staticMock: 14,
          dynamicMock: randomInteger
        },
        JSON: {
          defaultValue: '',
          staticMock: [
            {
              id: 1,
              title: 'test'
            },
            { id: 2 }
          ],
          dynamicMock: randomString
        },
        Lookup: {
          defaultValue: '',
          staticMock: {
            lookupId: 49,
            lookupValue: 'Static Lookup'
          },
          dynamicMock: randomLookup
        },
        LookupMulti: {
          defaultValue: [],
          staticMock: [
            {
              lookupId: 50,
              lookupValue: 'Static Multi 1'
            },
            {
              lookupId: 51,
              lookupValue: 'Static Multi 2'
            }
          ],
          dynamicMock: randomLookupMulti
        },
        Mask: {
          defaultValue: mockPermMask(),
          staticMock: mockPermMask(),
          dynamicMock: mockPermMask
        },
        User: {
          defaultValue: '',
          staticMock: {
            lookupId: 52,
            lookupValue: 'Static User'
          },
          dynamicMock: randomUser
        },
        UserMulti: {
          defaultValue: [],
          staticMock: [
            {
              lookupId: 53,
              lookupValue: 'Static User 1'
            },
            {
              lookupId: 54,
              lookupValue: 'Static User 2'
            }
          ],
          dynamicMock: randomUserMulti
        }
      };
    /**
         * Returns an object defining a specific field type
         * @param {string} fieldType
         * @returns {object} fieldTypeDefinition
         */
    function getDefinition(fieldType) {
      return fieldTypes[fieldType];
    }
    /**
         * @ngdoc function
         * @name fieldService.getDefaultValueForType
         * @description
         * Returns the empty value expected for a field type
         * @param fieldType
         * @returns {*}
         */
    function getDefaultValueForType(fieldType) {
      var fieldDefinition = getDefinition(fieldType), defaultValue;
      if (fieldDefinition) {
        defaultValue = fieldDefinition.defaultValue;
      }
      return defaultValue;
    }
    /**
         * @ngdoc function
         * @name fieldService.getMockData
         * @description
         * Can return mock data appropriate for the field type, by default it dynamically generates data but
         * the staticValue param will instead return a hard coded type specific value
         *
         * @param {string} fieldType
         * @param {object} [options]
         * @param {boolean} [options.staticValue=false]
         * @returns {*} mockData
         */
    function getMockData(fieldType, options) {
      var mock;
      var fieldDefinition = getDefinition(fieldType);
      if (fieldDefinition) {
        mock = options && options.staticValue ? fieldDefinition.staticMock : fieldDefinition.dynamicMock(options);
      }
      return mock;
    }
    /**
         * @ngdoc function
         * @name fieldService.defaultFields
         * @description
         * Read only fields that should be included in all lists
         */
    var defaultFields = [
        {
          internalName: 'ID',
          objectType: 'Counter',
          mappedName: 'id',
          readOnly: true
        },
        {
          internalName: 'Modified',
          objectType: 'DateTime',
          mappedName: 'modified',
          readOnly: true
        },
        {
          internalName: 'Created',
          objectType: 'DateTime',
          mappedName: 'created',
          readOnly: true
        },
        {
          internalName: 'Author',
          objectType: 'User',
          mappedName: 'author',
          readOnly: true
        },
        {
          internalName: 'Editor',
          objectType: 'User',
          mappedName: 'editor',
          readOnly: true
        },
        {
          internalName: 'PermMask',
          objectType: 'Mask',
          mappedName: 'permMask',
          readOnly: true
        }
      ];
    /**
         * @ngdoc function
         * @name fieldService.extendFieldDefinitions
         * @description
         * 1. Populates the fields array which uses the Field constructor to combine the default
         * SharePoint fields with those defined in the list definition on the model
         * 2. Creates the list.viewFields XML string that defines the fields to be requested on a query
         *
         * @param {object} list
         * @param {array} list.customFields
         * @param {array} list.fields
         * @param {string} list.viewFiSelds
         */
    function extendFieldDefinitions(list) {
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
        list.mapping['ows_' + field.internalName] = {
          mappedName: field.mappedName,
          objectType: field.objectType
        };
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
    }
    return {
      defaultFields: defaultFields,
      extendFieldDefinitions: extendFieldDefinitions,
      getDefaultValueForType: getDefaultValueForType,
      getMockData: getMockData,
      getDefinition: getDefinition,
      mockPermMask: mockPermMask,
      resolveValueForEffectivePermMask: resolveValueForEffectivePermMask
    };
  }
]);
;
'use strict';
/**
 * @ngdoc service
 * @name modalService
 * @description
 * Extends a modal form to include many standard functions
 */
angular.module('spAngular').service('modalService', [
  '$modal',
  'toastr',
  function ($modal, toastr) {
    /**
         * @ngdoc function
         * @name modalService.modalModelProvider
         * @description
         * Extends a model to allow us to easily attach a modal form that accepts and injects a
         * dynamic number of arguments.
         * @param {object} options Configuration object.
         * @param {string} options.templateUrl Reference to the modal view.
         * @param {string} options.controller Name of the modal controller.
         * @param {string[]} [options.expectedArguments] First argument name should be the item being edited.
         * @returns {promise} openModal
         *
         * @example
         <pre>
            model.openModal = modalService.modalModelProvider({
                templateUrl: 'modules/comp_request/views/comp_request_modal_view.html',
                controller: 'compRequestModalCtrl',
                expectedArguments: ['request']
            });
         </pre>
         */
    function modalModelProvider(options) {
      return function openModal() {
        var self = openModal;
        var defaults = {
            templateUrl: options.templateUrl,
            controller: options.controller,
            resolve: {}
          };
        var modalConfig = _.extend({}, defaults, options);
        /** Store a reference to any arguments that were passed in */
        var args = arguments;
        /**
                 * Create members to be resolved and passed to the controller as locals;
                 *  Equivalent of the resolve property for AngularJS routes
                 */
        _.each(options.expectedArguments, function (argumentName, index) {
          modalConfig.resolve[argumentName] = function () {
            return args[index];
          };
        });
        var modalInstance = $modal.open(modalConfig);
        /** Assume that if there is a first argument, it is the item we're editing */
        if (args[0]) {
          /** Create a copy in case we need to revert back */
          self.snapshot = angular.copy(args[0]);
          modalInstance.result.then(function () {
          }, function () {
            /** Undo any changes if cancelled */
            _.extend(args[0], self.snapshot);
          });
        }
        return modalInstance.result;
      };
    }
    /**
         * @ngdoc function
         * @name modalService.getPermissions
         * @description
         * Returns an object containing the permission levels for the current user
         * @param {object} entity JavaScript object representing the SharePoint list item.
         * @returns {object} {userCanEdit: boolean, userCanDelete: boolean, userCanApprove: boolean, fullControl: boolean}
         */
    function getPermissions(entity) {
      var userPermissions = {
          userCanEdit: true,
          userCanDelete: false,
          userCanApprove: false,
          fullControl: false
        };
      if (_.isObject(entity) && _.isFunction(entity.resolvePermissions)) {
        var userPermMask = entity.resolvePermissions();
        userPermissions.userCanEdit = userPermMask.EditListItems;
        userPermissions.userCanDelete = userPermMask.DeleteListItems;
        userPermissions.userCanApprove = userPermMask.ApproveItems;
        userPermissions.fullControl = userPermMask.FullMask;
      }
      return userPermissions;
    }
    /**
         * @ngdoc function
         * @name modalService.initializeState
         * @description
         * Creates a state object, populates permissions for current user, and sets display mode
         *
         * @param {object} entity JavaScript object representing the SharePoint list item.
         * @param {object} [options] Optional state params.
         * @returns {object} Returns the extended state.
         *
         * @example
         <pre>
         $scope.state = modalService.initializeState(request, {
             dateExceedsBoundary: false,
             enableApproval: false
         });
         </pre>
         */
    function initializeState(entity, options) {
      var state = {
          userCanEdit: false,
          userCanDelete: false,
          negotiatingWithServer: false,
          locked: false,
          lockedBy: '',
          displayMode: 'View'
        };
      var permissions = getPermissions(entity);
      /** Check if it's a new form */
      if (!entity || !entity.id) {
        state.displayMode = 'New';
      } else if (permissions.userCanEdit) {
        state.displayMode = 'Edit';
      }
      return _.extend(state, permissions, options);
    }
    /**
         * @ngdoc function
         * @name modalService.deleteEntity
         * @description
         * Prompts for confirmation of deletion, then deletes and closes modal
         * @param {object} entity JavaScript object representing the SharePoint list item.
         * @param {object} state Controllers state object.
         * @param {object} $modalInstance Reference to the modal instance for the modal dialog.
         *
         * @example
         *
         <pre>
           $scope.deleteRequest = function () {
               modalService.deleteEntity($scope.request, $scope.state, $modalInstance);
           };
         </pre>
         */
    function deleteEntity(entity, state, $modalInstance) {
      var confirmation = window.confirm('Are you sure you want to delete this record?');
      if (confirmation) {
        /** Disable form buttons */
        state.negotiatingWithServer = true;
        entity.deleteItem().then(function () {
          toastr.success('Record deleted successfully');
          $modalInstance.close();
        }, function () {
          toastr.error('Failed to delete record.  Please try again.');
        });
      }
    }
    /**
         * @ngdoc function
         * @name modalService.saveEntity
         * @description
         * Creates a new record if necessary, otherwise updates the existing record
         * @param {object} entity List item.
         * @param {object} model Reference to the model for the list item.
         * @param {object} state Depricated....
         * @param {object} $modalInstance Reference to the modal instance for the modal dialog.
         *
         * @example
         *  $scope.saveRequest = function () {
         *      modalService.saveEntity($scope.request, compRequestsModel, $scope.state, $modalInstance);
         *  };
         */
    function saveEntity(entity, model, state, $modalInstance) {
      if (entity.id) {
        entity.saveChanges().then(function () {
          toastr.success('Record updated');
          $modalInstance.close();
        }, function () {
          toastr.error('There was a problem updating this record.  Please try again.');
        });
      } else {
        /** Create new record */
        model.addNewItem(entity).then(function () {
          toastr.success('New record created');
          $modalInstance.close();
        }, function () {
          toastr.error('There was a problem creating a new record.  Please try again.');
        });
      }
    }
    return {
      deleteEntity: deleteEntity,
      initializeState: initializeState,
      modalModelProvider: modalModelProvider,
      getPermissions: getPermissions,
      saveEntity: saveEntity
    };
  }
]);
;
'use strict';
/**
 * @ngdoc service
 * @name modelFactory
 * @module Model
 * @description
 * The 'modelFactory' provides a common base prototype for Model, Query, and List Item.
 *
 * @function
 */
angular.module('spAngular').factory('modelFactory', [
  '$q',
  '$timeout',
  'configService',
  'dataService',
  'fieldService',
  'toastr',
  function ($q, $timeout, configService, dataService, fieldService, toastr) {
    var defaultQueryName = 'primary';
    /** In the event that a factory isn't specified, just use a
         * standard constructor to allow it to inherit from ListItem */
    var StandardListItem = function (item) {
      var self = this;
      _.extend(self, item);
    };
    /**
         * @ngdoc function
         * @name Model
         * @description
         * Model Constructor
         * Provides the Following
         * - adds an empty "data" array
         * - adds an empty "queries" object
         * - adds a deferred obj "ready"
         * - builds "model.list" with constructor
         * - adds "getAllListItems" function
         * - adds "addNewItem" function
         * @param {object} options Object containing optional params.
         * @param {object} [options.factory=StandardListItem] - Constructor function for individual list items.
         * @param {object} options.list - Definition of the list in SharePoint; This object will
         * be passed to the list constructor to extend further
         * @param {string} options.list.title - List name, no spaces.  Offline XML file will need to be
         * named the same (ex: CustomList so xml file would be /dev/CustomList.xml)
         * @param {string} options.list.guid - Unique SharePoint ID (ex: '{3DBEB25A-BEF0-4213-A634-00DAF46E3897}')
         * @param {object[]} options.list.customFields - Maps SharePoint fields with names we'll use within the
         * application.  Identifies field types and formats accordingly.  Also denotes if a field is read only.
         * @constructor
         *
         * @example
         <pre>
          //Taken from a fictitious projectsModel.js
          var model = new modelFactory.Model({
                 factory: Project,
                 list: {
                     guid: '{PROJECT LIST GUID}',
                     title: 'Projects',
                     customFields: [
                         { internalName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false },
                         { internalName: 'Customer', objectType: 'Lookup', mappedName: 'customer', readOnly: false },
                         { internalName: 'ProjectDescription', objectType: 'Text', mappedName: 'projectDescription', readOnly: false },
                         { internalName: 'Status', objectType: 'Text', mappedName: 'status', readOnly: false },
                         { internalName: 'TaskManager', objectType: 'User', mappedName: 'taskManager', readOnly: false },
                         { internalName: 'ProjectGroup', objectType: 'Lookup', mappedName: 'group', readOnly: false },
                         { internalName: 'CostEstimate', objectType: 'Currency', mappedName: 'costEstimate', readOnly: false },
                         { internalName: 'Active', objectType: 'Boolean', mappedName: 'active', readOnly: false },
                         { internalName: 'Attachments', objectType: 'Attachments', mappedName: 'attachments', readOnly: true}
                     ]
                 }
             });
         </pre>
         */
    function Model(options) {
      var model = this;
      var defaults = {
          data: [],
          factory: StandardListItem,
          lastServerUpdate: null,
          queries: {}
        };
      _.extend(model, defaults, options);
      /** Use list constructor to decorate */
      model.list = new List(model.list);
      /** Set the constructor's prototype to inherit from ListItem so we can inherit functionality */
      model.factory.prototype = new ListItem();
      /** Make the model directly accessible from the list item */
      model.factory.prototype.getModel = function () {
        return model;
      };
      return model;
    }
    /**
         * @ngdoc function
         * @name Model.getAllListItems
         * @module modelFactoryModel
         * @description
         * Inherited from Model constructor
         * Gets all list items in the current list, processes the xml, and caches the data in model.
         * @returns {object} Promise returning all list items when resolved.
         * @example
         <pre>
          //Taken from a fictitious projectsModel.js
              projectModel.getAllListItems().then(function(entities) {
                  //Do something with all of the returned entities
                  $scope.projects = entities;
              };
         </pre>
         */
    Model.prototype.getAllListItems = function () {
      var deferred = $q.defer();
      dataService.executeQuery(this, this.queries.getAllListItems, { deferred: deferred }).then(function (response) {
        deferred.resolve(response);
      });
      return deferred.promise();
    };
    /**
         * @ngdoc function
         * @name Model.addNewItem
         * @module Model
         * @description
         * Using the definition of a list stored in a model, create a new list item in SharePoint.
         * @param {object} entity An object that will be converted into key/value pairs based on the field definitions
         * defined in the model.
         * @param {object} [options] - Pass additional options to the data service.
         * @returns {object} A promise which when resolved will returned the newly created list item from there server.
         * This allows us to update the view with a valid new object that contains a unique list item id.
         *
         * @example
         <pre>
          //Taken from a fictitious projectsModel.js
             projectModel.addNewItem({
                    title: 'A Project',
                    customer: {lookupValue: 'My Customer', lookupId: 123},
                    description: 'This is the project description'
                 }).then(function(newEntityFromServer) {
                     //The local query cache is automatically updated but any other dependent logic can go here
             };
         </pre>
         */
    Model.prototype.addNewItem = function (entity, options) {
      var model = this;
      var deferred = $q.defer();
      dataService.addUpdateItemModel(model, entity, options).then(function (response) {
        deferred.resolve(response);
        /** Optionally broadcast change event */
        registerChange(model);
      });
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name Model.registerQuery
         * @module Model
         * @description
         * Constructor that allows us create a static query with a reference to the parent model
         * @param {object} [queryOptions] Optional options to pass through to the dataService.
         * @param {string} [queryOptions.name=defaultQueryName] Optional name of the new query (recommended but will
         * default to 'Primary' if not specified)
         * @returns {object} Query Returns a new query object.
         *
         * @example
         <pre>
         //Could be placed on the projectModel and creates the query but doesn't call it
         projectModel.registerQuery({
             name: 'primary',
             query: '' +
                 '<Query>' +
                 '   <OrderBy>' +
                 '       <FieldRef Name="Title" Ascending="TRUE"/>' +
                 '   </OrderBy>' +
                 '</Query>'
         });
         </pre>

         * @example
         <pre>
         //To call the query or check for changes since the last call
         projectModel.executeQuery('primary').then(function(entities) {
             //We now have a reference to array of entities stored in the local cache
             //These inherit from the ListItem prototype as well as the Project prototype on the model
             $scope.projects = entities;
         });
         </pre>

         * @example
         <pre>
         //Advanced functionality that would allow us to dynamically create queries for list items with a
         //lookup field associated with a specific project id.  Let's assume this is on the projectTasksModel.
         model.queryByProjectId(projectId) {
             // Unique query name
             var queryKey = 'pid' + projectId;

             // Register project query if it doesn't exist
             if (!_.isObject(model.queries[queryKey])) {
                 model.registerQuery({
                     name: queryKey,
                     query: '' +
                         '<Query>' +
                         '   <OrderBy>' +
                         '       <FieldRef Name="ID" Ascending="TRUE"/>' +
                         '   </OrderBy>' +
                         '   <Where>' +
                         '       <And>' +
                     // Prevents any records from being returned if user doesn't have permissions on project
                         '           <IsNotNull>' +
                         '               <FieldRef Name="Project"/>' +
                         '           </IsNotNull>' +
                     // Return all records for the project matching param projectId
                         '           <Eq>' +
                         '               <FieldRef Name="Project" LookupId="TRUE"/>' +
                         '               <Value Type="Lookup">' + projectId + '</Value>' +
                         '           </Eq>' +
                         '       </And>' +
                         '   </Where>' +
                         '</Query>'
                 });
             }
             //Still using execute query but now we have a custom query
             return model.executeQuery(queryKey);
         };
         </pre>
         */
    Model.prototype.registerQuery = function (queryOptions) {
      var model = this;
      var defaults = { name: defaultQueryName };
      queryOptions = _.extend({}, defaults, queryOptions);
      model.queries[queryOptions.name] = new Query(queryOptions, model);
      /** Return the newly created query */
      return model.queries[queryOptions.name];
    };
    /**
         * @ngdoc function
         * @name Model.getQuery
         * @module Model
         * @description
         * Helper function that attempts to locate and return a reference to the requested or catchall query.
         * @param {string} [queryName=defaultQueryName] A unique key to identify this query.
         * @returns {object} See Query prototype for additional details on what a Query looks like.
         *
         * @example
          <pre>
          var primaryQuery = projectModel.getQuery();
          </pre>

         * @example
          <pre>
          var primaryQuery = projectModel.getQuery('primary');
          </pre>

         * @example
          <pre>
          var namedQuery = projectModel.getQuery('customQuery');
          </pre>
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
         * @ngdoc function
         * @name Model.getCache
         * @module Model
         * @description
         * Helper function that return the local cache for a named query if provided, otherwise
         * it returns the cache for the primary query for the model.  Useful if you know the query
         * has already been resolved and there's no need to check SharePoint for changes.
         *
         * @param {string} [queryName=defaultQueryName] A unique key to identify this query.
         * @returns {Array} Returns the contents of the current cache for a named query.
         *
         * @example
         <pre>
            var primaryQueryCache = projectModel.getCache();
         </pre>

         * @example
         <pre>
            var primaryQueryCache = projectModel.getCache('primary');
         </pre>

         * @example
         <pre>
            var namedQueryCache = projectModel.getCache('customQuery');
         </pre>
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
         * @ngdoc function
         * @name Model.executeQuery
         * @module Model
         * @description
         * The primary method for retrieving data from a query registered on a model.  It returns a promise
         * which resolves to the local cache after post processing entities with constructors.
         *
         * @param {string} [queryName=defaultQueryName] A unique key to identify this query
         * @param {object} [options] Pass options to the data service.
         * @returns {object} Promise that when resolves returns an array of list items which inherit from ListItem and
         * optionally go through a defined constructor on the model.
         *
         * @example To call the query or check for changes since the last call.
         <pre>
          projectModel.executeQuery('MyCustomQuery').then(function(entities) {
              //We now have a reference to array of entities stored in the local cache
              //These inherit from the ListItem prototype as well as the Project prototype on the model
              $scope.subsetOfProjects = entities;
          });
         </pre>
         */
    Model.prototype.executeQuery = function (queryName, options) {
      var model = this;
      var query = model.getQuery(queryName);
      if (query) {
        return query.execute(options);
      }
    };
    /**
         * @ngdoc function
         * @name Model.isInitialised
         * @module Model
         * @description
         * Methods which allows us to easily determine if we've successfully made any queries this session.
         * @returns {boolean} Returns evaluation.
         */
    Model.prototype.isInitialised = function () {
      return _.isDate(this.lastServerUpdate);
    };
    /**
         * @ngdoc function
         * @name Model.searchLocalCache
         * @module Model
         * @description
         * Search functionality that allow for deeply searching an array of objects for the first
         * record matching the supplied value.  Additionally it maps indexes to speed up future calls.  It
         * currently rebuilds the mapping when the length of items in the local cache has changed or when the
         * rebuildIndex flag is set.
         *
         * @param {*} value The value or array of values to compare against.
         * @param {object} [options] Object containing optional parameters.
         * @param {string} [options.propertyPath] The dot separated propertyPath.
         <pre>
         'project.lookupId'
         </pre>
         * @param {object} [options.cacheName] Required if using a data source other than primary cache.
         * @param {object} [options.localCache=model.getCache()] Array of objects to search (Default model.getCache()).
         * @param {boolean} [options.rebuildIndex=false] Ignore previous index and rebuild.
         *
         * @returns {(object|object[])} Either the object(s) that you're searching for or undefined if not found.
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
         * @ngdoc function
         * @name Model.createEmptyItem
         * @module Model
         * @description
         * Creates an object using the editable fields from the model, all attributes are empty based on the field
         * type unless an overrides object is passed in.  The overrides object extends the defaults.  A benefit to this
         * approach is the returned object inherits from the ListItem prototype so we have the ability to call
         * entity.saveChanges instead of calling the model.addNewItem(entity).
         *
         * @param {object} [overrides] - Optionally extend the new empty item with specific values.
         * @returns {object} Newly created list item.
         */
    Model.prototype.createEmptyItem = function (overrides) {
      var model = this;
      var newItem = {};
      _.each(model.list.customFields, function (fieldDefinition) {
        /** Create attributes for each non-readonly field definition */
        if (!fieldDefinition.readOnly) {
          /** Create an attribute with the expected empty value based on field definition type */
          newItem[fieldDefinition.mappedName] = fieldService.getDefaultValueForType(fieldDefinition.objectType);
        }
      });
      /** Extend any values that should override the default empty values */
      var rawObject = _.extend({}, newItem, overrides);
      return new model.factory(rawObject);
    };
    /**
         * @ngdoc function
         * @name Model.generateMockData
         * @module Model
         * @description
         * Generates 'n' mock records for testing using the field types defined in the model to provide something to visualize.
         *
         * @param {object} [options] Object containing optional parameters.
         * @param {number} [options.quantity=10] The requested number of mock records to return.
         * @param {string} [options.permissionLevel=FullMask] Sets the mask on the mock records to simulate desired
         * permission level.
         * @param {boolean} [options.staticValue=false] By default all mock data is dynamically created but if set,
         * this will cause static data to be used instead.
         */
    Model.prototype.generateMockData = function (options) {
      var mockData = [], model = this;
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
         * @ngdoc function
         * @name Model.validateEntity
         * @module Model
         * @description
         * Uses the custom fields defined in an model to ensure each field (required = true) is evaluated
         * based on field type
         *
         * @param {object} entity SharePoint list item.
         * @param {object} [options] Object containing optional parameters.
         * @param {boolean} [options.toast=true] Should toasts be generated to alert the user of issues.
         * @returns {boolean} Evaluation of validity.
         */
    Model.prototype.validateEntity = function (entity, options) {
      var valid = true, model = this;
      var defaults = { toast: true };
      /** Extend defaults with any provided options */
      var opts = _.extend({}, defaults, options);
      var checkObject = function (fieldValue) {
        return _.isObject(fieldValue) && _.isNumber(fieldValue.lookupId);
      };
      _.each(model.list.customFields, function (fieldDefinition) {
        var fieldValue = entity[fieldDefinition.mappedName];
        var fieldDescriptor = '"' + fieldDefinition.objectType + '" value.';
        /** Only evaluate required fields */
        if (fieldDefinition.required && valid) {
          switch (fieldDefinition.objectType) {
          case 'DateTime':
            valid = _.isDate(fieldValue);
            break;
          case 'Lookup':
          case 'User':
            valid = checkObject(fieldValue);
            break;
          case 'LookupMulti':
          case 'UserMulti':
            /** Ensure it's a valid array containing objects */
            valid = _.isArray(fieldValue) && fieldValue.length > 0;
            if (valid) {
              /** Additionally check that each lookup/person contains a lookupId */
              _.each(fieldValue, function (fieldObject) {
                if (valid) {
                  valid = checkObject(fieldObject);
                } else {
                  /** Short circuit */
                  return false;
                }
              });
            }
            break;
          default:
            /** Evaluate everything else as a string */
            valid = !_.isEmpty(fieldValue);
          }
          if (!valid && opts.toast) {
            var fieldName = fieldDefinition.label || fieldDefinition.internalName;
            toastr.error(fieldName + ' does not appear to be a valid ' + fieldDescriptor);
          }
        }
        if (!valid) {
          return false;
        }
      });
      return valid;
    };
    /**
         * @ngdoc function
         * @name ListItem
         * @module ListItem
         * @description
         * Base prototype which all list items inherit CRUD functionality that can be called directly from obj.
         * @constructor
         */
    function ListItem() {
    }
    /**
         * @ngdoc function
         * @name ListItem.getDataService
         * @module ListItem
         * @description
         * Allows us to reference when out of scope
         * @returns {object} Reference to the dataService in the event that it's out of scope.
         */
    ListItem.prototype.getDataService = function () {
      return dataService;
    };
    /**
         * @ngdoc function
         * @name ListItem.saveChanges
         * @module ListItem
         * @description
         * Updates record directly from the object
         * @param {object} [options] Optionally pass params to the data service.
         * @param {boolean} [options.updateAllCaches=false] Search through the cache for each query to ensure entity is
         * updated everywhere.  This is more process intensive so by default we only update the cached entity in the
         * cache where this entity is currently stored.
         * @returns {object} Promise which resolved with the updated list item from the server.
         */
    ListItem.prototype.saveChanges = function (options) {
      var listItem = this;
      var model = listItem.getModel();
      var deferred = $q.defer();
      dataService.addUpdateItemModel(model, listItem, options).then(function (response) {
        deferred.resolve(response);
        /** Optionally broadcast change event */
        registerChange(model);
      });
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name ListItem.saveFields
         * @module ListItem
         * @description
         * Saves a named subset of fields back to SharePoint
         * Alternative to saving all fields
         * @param {array} fieldArray Array of internal field names that should be saved to SharePoint.
         <pre>
         //Create an array to store all promises.
         var queue = [],
            progressCounter = 0;

         //We're only updating a single field on each entity so it's much faster to use ListItem.saveFields() so we
         //don't need to push the entire object back to the server.
         _.each(selectedItems, function (entity) {
            entity.title = title + ': Now Updated!';
            var request = entity.saveFields('title').then(function() {
                progressCounter++;
            }
            queue.push(request);
          });

         $q.all(queue).then(function() {
             //All items have now been processed so we can do something...but the view is automatically updated so we
             //don't need to bother if there's no other required business logic.
         }

         </pre>
         * @param {object} [options] Optionally pass params to the data service.
         * @param {boolean} [options.updateAllCaches=false] Search through the cache for each query to ensure entity is
         * updated everywhere.  This is more process intensive so by default we only update the cached entity in the
         * cache where this entity is currently stored.
         * @returns {object} Promise which resolves with the updated list item from the server.
         */
    ListItem.prototype.saveFields = function (fieldArray, options) {
      var listItem = this;
      var model = listItem.getModel();
      var deferred = $q.defer();
      var definitions = [];
      /** Find the field definition for each of the requested fields */
      _.each(fieldArray, function (field) {
        var match = _.findWhere(model.list.customFields, { mappedName: field });
        if (match) {
          definitions.push(match);
        }
      });
      /** Generate value pairs for specified fields */
      var valuePairs = dataService.generateValuePairs(definitions, listItem);
      var defaults = {
          buildValuePairs: false,
          valuePairs: valuePairs
        };
      /** Extend defaults with any provided options */
      var opts = _.extend({}, defaults, options);
      dataService.addUpdateItemModel(model, listItem, opts).then(function (response) {
        deferred.resolve(response);
        /** Optionally broadcast change event */
        registerChange(model);
      });
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name ListItem.deleteItem
         * @module ListItem
         * @description
         * Deletes record directly from the object and removes record from user cache.
         * @param {object} [options] Optionally pass params to the dataService.
         * @param {boolean} [options.updateAllCaches=false] Iterate over each of the query cache's and ensure the entity is
         * removed everywhere.  This is more process intensive so by default we only remove the cached entity in the
         * cache where this entity is currently stored.
         * @returns {object} Promise which really only lets us know the request is complete.
         */
    ListItem.prototype.deleteItem = function (options) {
      var listItem = this;
      var model = listItem.getModel();
      var deferred = $q.defer();
      dataService.deleteItemModel(model, listItem, options).then(function (response) {
        deferred.resolve(response);
        /** Optionally broadcast change event */
        registerChange(model);
      });
      return deferred.promise;
    };
    /**
         * @ngdoc function
         * @name ListItem.validateEntity
         * @module ListItem
         * @description
         * Helper function that passes the current item to Model.validateEntity
         * @param {object} [options] Optionally pass params to the dataService.
         * @param {boolean} [options.toast=true] Set to false to prevent toastr messages from being displayed.
         * @returns {boolean} Evaluation of validity.
         */
    ListItem.prototype.validateEntity = function (options) {
      var listItem = this, model = listItem.getModel();
      return model.validateEntity(listItem, options);
    };
    /**
         * @ngdoc function
         * @name ListItem.getAttachmentCollection
         * @module ListItem
         * @description
         * Requests all attachments for a given list item.
         * @returns {object} Promise which resolves with all attachments for a list item.
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
         * @ngdoc function
         * @name ListItem.deleteAttachment
         * @module ListItem
         * @description
         * Delete an attachment from a list item.
         * @param {string} url Requires the URL for the attachment we want to delete.
         * @returns {object} Promise which resolves with the updated attachment collection.
         */
    ListItem.prototype.deleteAttachment = function (url) {
      var listItem = this;
      return dataService.deleteAttachment({
        listItemId: listItem.id,
        url: url,
        listName: listItem.getModel().list.guid
      });
    };
    /**
         * @ngdoc function
         * @name ListItem.resolvePermissions
         * @module ListItem
         * @description
         * See modelFactory.resolvePermissions for details on what we expect to have returned.
         * @returns {Object} Contains properties for each permission level evaluated for current user.
         * @example
         <pre>
            var permissionObject = myGenericListItem.resolvePermissions();
         </pre>
         */
    ListItem.prototype.resolvePermissions = function () {
      return resolvePermissions(this.permMask);
    };
    /**
         * @ngdoc function
         * @name ListItem.getFieldVersionHistory
         * @module ListItem
         * @description
         * Takes an array of field names, finds the version history for field, and returns a snapshot of the object at each
         * version.  If no fields are provided, we look at the field definitions in the model and pull all non-readonly
         * fields.  The only way to do this that I've been able to get working is to get the version history for each
         * field independently and then build the history by combining the server responses for each requests into a
         * snapshot of the object.
         * @param {string[]} [fieldNames] An array of field names that we're interested in.
         <pre>
         myGenericListItem.getFieldVersionHistory(['title', 'project'])
            .then(function(versionHistory) {
                //We now have an array of versions of the list item
            };
         </pre>
         * @returns {object} promise - containing array of changes
         */
    ListItem.prototype.getFieldVersionHistory = function (fieldNames) {
      var deferred = $q.defer();
      var promiseArray = [];
      var listItem = this;
      var model = listItem.getModel();
      /** Constructor that creates a promise for each field */
      var createPromise = function (fieldName) {
        var fieldDefinition = _.findWhere(model.list.fields, { mappedName: fieldName });
        var payload = {
            operation: 'GetVersionCollection',
            webURL: configService.defaultUrl,
            strlistID: model.list.guid,
            strlistItemID: listItem.id,
            strFieldName: fieldDefinition.internalName
          };
        promiseArray.push(dataService.getFieldVersionHistory(payload, fieldDefinition));
      };
      if (!fieldNames) {
        /** If fields aren't provided, pull the version history for all NON-readonly fields */
        var targetFields = _.where(model.list.fields, { readOnly: false });
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
         * @ngdoc function
         * @name List
         * @description
         * List Object Constructor.  This is handled automatically when creating a new model so there shouldn't be
         * any reason to manually call.
         * @param {object} obj Initialization parameters.
         * @param {string} obj.guid Unique SharePoint GUID for the list we'll be basing the model on
         * ex:'{4D74831A-42B2-4558-A67F-B0B5ADBC0EAC}'
         * @param {string} obj.title Maps to the offline XML file in dev folder (no spaces)
         * ex: 'ProjectsList' so the offline XML file would be located at dev/ProjectsList.xml
         * @param {object[]} [obj.customFields] Mapping of SharePoint field names to the internal names we'll be using
         * in our application.  Also contains field type, readonly attribute, and any other non-standard settings.
         <pre>
             [
                 { internalName: "Title", objectType: "Text", mappedName: "lastName", readOnly:false },
                 { internalName: "FirstName", objectType: "Text", mappedName: "firstName", readOnly:false },
                 { internalName: "Organization", objectType: "Lookup", mappedName: "organization", readOnly:false },
                 { internalName: "Account", objectType: "User", mappedName: "account", readOnly:false },
                 { internalName: "Details", objectType: "Text", mappedName: "details", readOnly:false }
             ]
         </pre>
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
         * @ngdoc function
         * @name Query
         * @description
         * Primary constructor that all queries inherit from.
         * @param {object} queryOptions Initialization parameters.
         * @param {string} [queryOptions.operation=GetListItemChangesSinceToken] Optionally use 'GetListItems' to
         * receive a more efficient response, just don't have the ability to check for changes since the last time
         * the query was called.
         * @param {boolean} [queryOptions.cacheXML=true] Set to false if you want a fresh request.
         * @param {string} [queryOptions.query=Ordered ascending by ID] CAML query passed to SharePoint to control
         * the data SharePoint returns.
         * @param {string} [queryOptions.queryOptions] SharePoint options.
         <pre>
         //Default
         queryOptions: '' +
         '<QueryOptions>' +
         '   <IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>' +
         '   <IncludeAttachmentUrls>TRUE</IncludeAttachmentUrls>' +
         '   <IncludeAttachmentVersion>FALSE</IncludeAttachmentVersion>' +
         '   <ExpandUserField>FALSE</ExpandUserField>' +
         '</QueryOptions>',
         </pre>
         * @param {object} model Reference to the parent model for the query.  Allows us to reference when out of
         * scope.
         * @constructor
         *
         * @example
         <pre>
        // Query to retrieve the most recent 25 modifications
        model.registerQuery({
            name: 'recentChanges',
            CAMLRowLimit: 25,
            query: '' +
                '<Query>' +
                '   <OrderBy>' +
                '       <FieldRef Name="Modified" Ascending="FALSE"/>' +
                '   </OrderBy>' +
                    // Prevents any records from being returned if user
                    // doesn't have permissions on project
                '   <Where>' +
                '       <IsNotNull>' +
                '           <FieldRef Name="Project"/>' +
                '       </IsNotNull>' +
                '   </Where>' +
                '</Query>'
        });
        </pre>
         */
    function Query(queryOptions, model) {
      var query = this;
      var defaults = {
          cache: [],
          initialized: $q.defer(),
          lastRun: null,
          listName: model.list.guid,
          negotiatingWithServer: false,
          operation: 'GetListItemChangesSinceToken',
          cacheXML: false,
          query: '' + '<Query>' + '   <OrderBy>' + '       <FieldRef Name="ID" Ascending="TRUE"/>' + '   </OrderBy>' + '</Query>',
          queryOptions: '' + '<QueryOptions>' + '   <IncludeMandatoryColumns>FALSE</IncludeMandatoryColumns>' + '   <IncludeAttachmentUrls>TRUE</IncludeAttachmentUrls>' + '   <IncludeAttachmentVersion>FALSE</IncludeAttachmentVersion>' + '   <ExpandUserField>FALSE</ExpandUserField>' + '</QueryOptions>',
          viewFields: model.list.viewFields,
          webURL: configService.defaultUrl
        };
      _.extend(query, defaults, queryOptions);
      /** Key/Value mapping of SharePoint properties to SPServices properties */
      var mapping = [
          [
            'query',
            'CAMLQuery'
          ],
          [
            'viewFields',
            'CAMLViewFields'
          ],
          [
            'rowLimit',
            'CAMLRowLimit'
          ],
          [
            'queryOptions',
            'CAMLQueryOptions'
          ],
          [
            'listItemID',
            'ID'
          ]
        ];
      _.each(mapping, function (map) {
        if (query[map[0]] && !query[map[1]]) {
          /** Ensure SPServices properties are added in the event the true property name is used */
          query[map[1]] = query[map[0]];
        }
      });
      /** Allow the model to be referenced at a later time */
      query.getModel = function () {
        return model;
      };
    }
    /**
         * @ngdoc function
         * @name Query.execute
         * @module Query
         * @description
         * Query SharePoint, pull down all initial records on first call along with list definition if using
         * "GetListItemChangesSinceToken".  Note: this is  substantially larger than "GetListItems" on first call.
         * Subsequent calls pulls down changes (Assuming operation: "GetListItemChangesSinceToken").
         * @param {object} [options] Any options that should be passed to dataService.executeQuery.
         * @returns {object[]} Array of list item objects.
         */
    Query.prototype.execute = function (options) {
      var query = this;
      var model = query.getModel();
      var deferred = $q.defer();
      /** Return existing promise if request is already underway */
      if (query.negotiatingWithServer) {
        return query.promise;
      } else {
        /** Set flag to prevent another call while this query is active */
        query.negotiatingWithServer = true;
        /** Set flag if this if the first time this query has been run */
        var firstRunQuery = _.isNull(query.lastRun);
        var defaults = { target: query.cache };
        /** Extend defaults with any options */
        var queryOptions = _.extend({}, defaults, options);
        dataService.executeQuery(model, query, queryOptions).then(function (results) {
          if (firstRunQuery) {
            /** Promise resolved the first time query is completed */
            query.initialized.resolve(queryOptions.target);
            /** Remove lock to allow for future requests */
            query.negotiatingWithServer = false;
          }
          /** Store query completion date/time on model to allow us to identify age of data */
          model.lastServerUpdate = new Date();
          deferred.resolve(queryOptions.target);
        });
        /** Save reference on the query **/
        query.promise = deferred.promise;
        return deferred.promise;
      }
    };
    /**
         * @ngdoc function
         * @name Query.searchLocalCache
         * @module Query
         * @description
         * Simple wrapper that by default sets the search location to the local query cache.
         * @param {*} value Value to evaluate against.
         * @param {object} [options] Options to pass to Model.prototype.searchLocalCache.
         * @returns {object|object[]} Either the object(s) that you're searching for or undefined if not found.
         */
    Query.prototype.searchLocalCache = function (value, options) {
      var query = this;
      var model = query.getModel();
      var defaults = {
          cacheName: query.name,
          localCache: query.cache
        };
      var opts = _.extend({}, defaults, options);
      return model.searchLocalCache(value, opts);
    };
    /**
         * @ngdoc function
         * @name modelFactory.registerChange
         * @description
         * If online and sync is being used, notify all online users that a change has been made.
         * //Todo Break this functionality into FireBase module that can be used if desired.
         * @param {object} model event
         */
    function registerChange(model) {
      if (!configService.offline && model.sync && _.isFunction(model.sync.registerChange)) {
        /** Register change after successful update */
        model.sync.registerChange();
      }
    }
    /**
         * @ngdoc function
         * @name modelFactory.resolvePermissions
         * @description
         * Converts permMask into something usable to determine permission level for current user.  Typically used
         * directly from a list item.  See ListItem.resolvePermissions.
         <pre>
         someListItem.resolvePermissions('0x0000000000000010');
         </pre>
         * @param {string} permissionsMask The WSS Rights Mask is an 8-byte, unsigned integer that specifies
         * the rights that can be assigned to a user or site group. This bit mask can have zero or more flags set.
         * @example
         <pre>
         modelFactory.resolvePermissions('0x0000000000000010');
         </pre>
         * @returns {object} property for each permission level identifying if current user has rights (true || false)
         * @link: http://sympmarc.com/2009/02/03/permmask-in-sharepoint-dvwps/
         * @link: http://spservices.codeplex.com/discussions/208708
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
      permissionSet.EnumeratePermissions = (permissionsMask & 4611686018427388000) > 0;
      permissionSet.FullMask = permissionsMask == 9223372036854776000;
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
  }
]);
;
'use strict';
/**
 * @ngdoc service
 * @name queueService
 * @description
 * Simple service to monitor the number of active requests we have open with SharePoint
 * Typical use is to display a loading animation of some sort
 */
angular.module('spAngular').service('queueService', function () {
  var counter = 0;
  /**
         * @ngdoc function
         * @name queueService.increase
         * @description
         * Increase the counter by 1.
         */
  var increase = function () {
    counter++;
    notifyObservers();
    return counter;
  };
  /**
         * @ngdoc function
         * @name queueService.reset
         * @description
         * Decrease the counter by 1.
         * @returns {number} Current count after decrementing.
         */
  var decrease = function () {
    if (counter > 0) {
      counter--;
      notifyObservers();
      return counter;
    }
  };
  /**
         * @ngdoc function
         * @name queueService.reset
         * @description
         * Reset counter to 0.
         * @returns {number} Current count after incrementing.
         */
  var reset = function () {
    counter = 0;
    notifyObservers();
    return counter;
  };
  var observerCallbacks = [];
  /**
         * @ngdoc function
         * @name queueService.registerObserverCallback
         * @description
         * Register an observer
         * @param {function} callback Function to call when a change is made.
         */
  var registerObserverCallback = function (callback) {
    observerCallbacks.push(callback);
  };
  /** call this when queue changes */
  var notifyObservers = function () {
    angular.forEach(observerCallbacks, function (callback) {
      callback(counter);
    });
  };
  return {
    count: counter,
    decrease: decrease,
    increase: increase,
    registerObserverCallback: registerObserverCallback,
    reset: reset
  };
});
;
'use strict';
/**
 * @ngdoc service
 * @name syncService
 * @description
 * Supports 3-way data binding if you decide to incorporate firebase (any change by any user
 * to a list item is mirrored across users). The data isn't saved to firebase but the change
 * event is so all subscribers are notified to request an update from SharePoint.
 */
angular.module('spAngular').factory('syncService', [
  '$q',
  '$timeout',
  '$firebase',
  'configService',
  function ($q, $timeout, $firebase, configService) {
    /**
         * @ngdoc method
         * @name syncService#synchronizeData
         * @description
         * Constructor to handle notifying models when data is updated
         *
         * @param model
         * @param updateQuery
         * @returns {object} sync
         */
    function synchronizeData(model, updateQuery) {
      var sync = {};
      sync.updateQuery = updateQuery;
      sync.changeNotifier = new Firebase(configService.firebaseURL + '/changes/' + model.list.title);
      sync.lastUpdate = $firebase(sync.changeNotifier);
      /** Notify all other users listening to this model that a change has been made */
      sync.registerChange = function () {
        console.log('Change detected in ' + model.list.title + ' list.');
        var timeStamp = Firebase.ServerValue.TIMESTAMP;
        /** Reset counter so change made by current user won't also cause a refresh */
        sync.changeCount = 0;
        sync.lastUpdate.$set(timeStamp);
      };
      /** Container to hold all current subscriptions for the model */
      sync.subscriptions = [];
      /** Running counter of the number of changes */
      sync.changeCount = 0;
      sync.processChanges = function () {
        /** Prevent from running the first time and when most recent change was made by current user */
        if (sync.changeCount > 0) {
          _.each(sync.subscriptions, function (callback) {
            console.log('Processing callback');
            if (_.isFunction(callback)) {
              callback();
            }
          });
        }
        sync.changeCount += 1;
      };
      /** Don't make a call more than once every second */
      sync.throttleRequests = _.throttle(function () {
        return sync.processChanges();
      }, 1000, { leading: false });
      /** Fired when anyone updates a list item */
      sync.lastUpdate.$on('change', function (newVal, oldVal) {
        sync.throttleRequests();
      });
      /** Allows subscribers (controllers) to be notified when change is made */
      sync.subscribeToChanges = function (callback) {
        if (sync.subscriptions.indexOf(callback) === -1) {
          /** Only register new subscriptions, ignore if subscription already exists */
          sync.subscriptions.push(callback);
        }
      };
      return sync;
    }
    return { synchronizeData: synchronizeData };
  }
]);
;
'use strict';
/**
 * @ngdoc service
 * @name utilityService
 * @description
 * Provides shared utility functionality across the application.
 */
angular.module('spAngular').service('utilityService', function () {
  // AngularJS will instantiate a singleton by calling "new" on this function
  /** Extend underscore with a simple helper function */
  _.mixin({
    isDefined: function (value) {
      return !_.isUndefined(value);
    }
  });
  /**
         * @ngdoc function
         * @name utilityService.xmlToJson
         * @description
         * Converts an XML node set to Javascript object array. This is a modified version of the SPServices
         * "SPXmlToJson" function.
         * @param {array} rows ["z:rows"] XML rows that need to be parsed.
         * @param {object[]} options.mapping [columnName: "mappedName", objectType: "objectType"]
         * @param {boolean} [options.includeAllAttrs=false] If true, return all attributes, regardless whether
         * they are in the mapping.
         * @param {boolean} [options.removeOws=true] Specifically for GetListItems, if true, the leading ows_ will
         * be stripped off the field name.
         * @returns {Array} An array of JavaScript objects.
         */
  var xmlToJson = function (rows, options) {
    var opt = $.extend({}, {
        mapping: {},
        includeAllAttrs: false,
        removeOws: true
      }, options);
    var attrNum;
    var jsonObject = [];
    _.each(rows, function (item) {
      var row = {};
      var rowAttrs = item.attributes;
      // Bring back all mapped columns, even those with no value
      _.each(opt.mapping, function (prop) {
        row[prop.mappedName] = '';
      });
      // Parse through the element's attributes
      for (attrNum = 0; attrNum < rowAttrs.length; attrNum++) {
        var thisAttrName = rowAttrs[attrNum].name;
        var thisMapping = opt.mapping[thisAttrName];
        var thisObjectName = typeof thisMapping !== 'undefined' ? thisMapping.mappedName : opt.removeOws ? thisAttrName.split('ows_')[1] : thisAttrName;
        var thisObjectType = typeof thisMapping !== 'undefined' ? thisMapping.objectType : undefined;
        if (opt.includeAllAttrs || thisMapping !== undefined) {
          row[thisObjectName] = attrToJson(rowAttrs[attrNum].value, thisObjectType);
        }
      }
      // Push this item into the JSON Object
      jsonObject.push(row);
    });
    // Return the JSON object
    return jsonObject;
  };
  /**
         * @ngdoc function
         * @name utilityService.attrToJson
         * @description
         * Converts a SharePoint string representation of a field into the correctly formatted JavaScript version
         * based on object type.
         * @param {string} value SharePoint string.
         * @param {string} [objectType='Text'] The type based on field definition.
         * Options:[
         *  DateTime,
         *  Lookup,
         *  User,
         *  LookupMulti,
         *  UserMulti,
         *  Boolean,
         *  Integer,
         *  Counter,
         *  MultiChoice,
         *  Currency,
         *  Number,
         *  Calc,
         *  JSON,
         *  Text [Default]
         * ]
         * @returns {*} The formatted JavaScript value based on field type.
         */
  function attrToJson(value, objectType) {
    var colValue;
    switch (objectType) {
    case 'DateTime':
    case 'datetime':
      // For calculated columns, stored as datetime;#value
      // Dates have dashes instead of slashes: ows_Created='2009-08-25 14:24:48'
      colValue = dateToJsonObject(value);
      break;
    case 'Lookup':
      colValue = lookupToJsonObject(value);
      break;
    case 'User':
      colValue = userToJsonObject(value);
      break;
    case 'LookupMulti':
      colValue = lookupMultiToJsonObject(value);
      break;
    case 'UserMulti':
      colValue = userMultiToJsonObject(value);
      break;
    case 'Boolean':
      colValue = booleanToJsonObject(value);
      break;
    case 'Integer':
      colValue = intToJsonObject(value);
      break;
    case 'Counter':
      colValue = intToJsonObject(value);
      break;
    case 'MultiChoice':
      colValue = choiceMultiToJsonObject(value);
      break;
    case 'Currency':
    case 'Number':
    case 'float':
      // For calculated columns, stored as float;#value
      colValue = floatToJsonObject(value);
      break;
    case 'Calc':
      colValue = calcToJsonObject(value);
      break;
    case 'JSON':
      colValue = parseJSON(value);
      break;
    default:
      // All other objectTypes will be simple strings
      colValue = stringToJsonObject(value);
      break;
    }
    return colValue;
  }
  function parseJSON(s) {
    return JSON.parse(s);
  }
  function stringToJsonObject(s) {
    return s;
  }
  function intToJsonObject(s) {
    return parseInt(s, 10);
  }
  function floatToJsonObject(s) {
    return parseFloat(s);
  }
  function booleanToJsonObject(s) {
    return s === '0' || s === 'False' ? false : true;
  }
  function dateToJsonObject(s) {
    return new Date(s.replace(/-/g, '/'));
  }
  function userToJsonObject(s) {
    if (s.length === 0) {
      return null;
    }
    //Send to constructor
    return new User(s);
  }
  function userMultiToJsonObject(s) {
    if (s.length === 0) {
      return null;
    } else {
      var thisUserMultiObject = [];
      var thisUserMulti = s.split(';#');
      for (var i = 0; i < thisUserMulti.length; i = i + 2) {
        var thisUser = userToJsonObject(thisUserMulti[i] + ';#' + thisUserMulti[i + 1]);
        thisUserMultiObject.push(thisUser);
      }
      return thisUserMultiObject;
    }
  }
  function lookupToJsonObject(s) {
    if (s.length === 0) {
      return null;
    } else {
      //Send to constructor
      return new Lookup(s);
    }
  }
  function lookupMultiToJsonObject(s) {
    if (s.length === 0) {
      return [];
    } else {
      var thisLookupMultiObject = [];
      var thisLookupMulti = s.split(';#');
      for (var i = 0; i < thisLookupMulti.length; i = i + 2) {
        var thisLookup = lookupToJsonObject(thisLookupMulti[i] + ';#' + thisLookupMulti[i + 1]);
        thisLookupMultiObject.push(thisLookup);
      }
      return thisLookupMultiObject;
    }
  }
  function choiceMultiToJsonObject(s) {
    if (s.length === 0) {
      return [];
    } else {
      var thisChoiceMultiObject = [];
      var thisChoiceMulti = s.split(';#');
      for (var i = 0; i < thisChoiceMulti.length; i++) {
        if (thisChoiceMulti[i].length !== 0) {
          thisChoiceMultiObject.push(thisChoiceMulti[i]);
        }
      }
      return thisChoiceMultiObject;
    }
  }
  function calcToJsonObject(s) {
    if (s.length === 0) {
      return null;
    } else {
      var thisCalc = s.split(';#');
      // The first value will be the calculated column value type, the second will be the value
      return attrToJson(thisCalc[1], thisCalc[0]);
    }
  }
  function htmlToJsonObject(s) {
    return _.unescape(s);
  }
  // Split values like 1;#value into id and value
  function SplitIndex(s) {
    var spl = s.split(';#');
    this.id = parseInt(spl[0], 10);
    this.value = spl[1];
  }
  function toCamelCase(s) {
    return s.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  }
  function fromCamelCase(s) {
    // insert a space before all caps
    s.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
      return str.toUpperCase();
    });
  }
  /**Constructors for user and lookup fields*/
  /**Allows for easier distinction when debugging if object type is shown as either Lookup or User**/
  function Lookup(s) {
    var thisLookup = new SplitIndex(s);
    this.lookupId = thisLookup.id;
    this.lookupValue = thisLookup.value;
  }
  function User(s) {
    var self = this;
    var thisUser = new SplitIndex(s);
    var thisUserExpanded = thisUser.value.split(',#');
    if (thisUserExpanded.length === 1) {
      //Standard user columns only return a id,#value pair
      self.lookupId = thisUser.id;
      self.lookupValue = thisUser.value;
    } else {
      //Allow for case where user adds additional properties when setting up field
      self.lookupId = thisUser.id;
      self.lookupValue = thisUserExpanded[0].replace(/(,,)/g, ',');
      self.loginName = thisUserExpanded[1].replace(/(,,)/g, ',');
      self.email = thisUserExpanded[2].replace(/(,,)/g, ',');
      self.sipAddress = thisUserExpanded[3].replace(/(,,)/g, ',');
      self.title = thisUserExpanded[4].replace(/(,,)/g, ',');
    }
  }
  /**
         * @ngdoc function
         * @name utilityService.yyyymmdd
         * @description
         * Convert date into a int formatted as yyyymmdd
         * We don't need the time portion of comparison so an int makes this easier to evaluate
         */
  function yyyymmdd(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();
    /** Add leading 0's to month and day if necessary */
    return parseInt(yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]));
  }
  /**
         * @ngdoc function
         * @name utilityService.dateWithinRange
         * @description
         * Converts dates into yyyymmdd formatted ints and evaluates to determine if the dateToCheck
         * falls within the date range provided
         * @param {Date} startDate Starting date.
         * @param {Date} endDate Ending date.
         * @param {Date} [dateToCheck=new Date()] Defaults to the current date.
         * @returns {boolean} Does the date fall within the range?
         */
  function dateWithinRange(startDate, endDate, dateToCheck) {
    /** Ensure both a start and end date are provided **/
    if (!startDate || !endDate) {
      return false;
    }
    /** Use the current date as the default if one isn't provided */
    dateToCheck = dateToCheck || new Date();
    /** Create an int representation of each of the dates */
    var startInt = yyyymmdd(startDate);
    var endInt = yyyymmdd(endDate);
    var dateToCheckInt = yyyymmdd(dateToCheck);
    return startInt <= dateToCheckInt && dateToCheckInt <= endInt;
  }
  return {
    attrToJson: attrToJson,
    dateWithinRange: dateWithinRange,
    fromCamelCase: fromCamelCase,
    lookupToJsonObject: lookupToJsonObject,
    SplitIndex: SplitIndex,
    toCamelCase: toCamelCase,
    xmlToJson: xmlToJson
  };
});