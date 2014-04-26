'use strict';
angular.module('spAngular', [
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
angular.module('spAngular').constant('spAngularConfig', {
  defaultUrl: $().SPServices.SPGetCurrentSite(),
  offline: window.location.href.indexOf('localhost') > -1 || window.location.href.indexOf('http://0.') > -1 || window.location.href.indexOf('http://10.') > -1 || window.location.href.indexOf('http://192.') > -1
}).service('configService', [
  'toastrConfig',
  function (toastrConfig) {
    /** Set the default toast location */
    toastrConfig.positionClass = 'toast-bottom-right';
    /** Flag to use cached XML files from the app/dev folder */
    var offline = window.location.href.indexOf('localhost') > -1;
    return {
      appTitle: 'SP-Angular',
      debugEnabled: true,
      firebaseURL: 'The url of your firebase source',
      offline: offline
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
 *
 *  - [http://spservices.codeplex.com/documentation]
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
    /** Flag to use cached XML files from the app/dev folder */
    var offline = spAngularConfig.offline;
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
          console.log(model.list.title + ' Changes (Create: ' + updateStats.created + ' | Update: ' + updateStats.updated + ')');
        }
      }
      return entities;
    };
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
          //                    angular.copy(entity, localCache[idMap.indexOf(entity.id)]);
          updateCount++;
        }
      });
      return {
        created: createCount,
        updated: updateCount
      };
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
      if (offline) {
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
         * @ngdoc method
         * @name dataService#addUpdateItemModel
         * @description
         * Adds or updates a list item based on if the item passed in contains an id attribute
         * @param {object} model
         * @param {object} item
         * @param {object} [options]
         * @param {string} [options.mode] - [update, replace, return]
         * @param {boolean} [options.buildValuePairs] - automatically generate pairs based on fields defined in model
         * @param {Array} [options.valuePairs] - precomputed value pairs to use instead of generating them
         * @returns {object} promise
         */
    var addUpdateItemModel = function (model, item, options) {
      var defaults = {
          mode: 'update',
          buildValuePairs: true,
          valuePairs: []
        };
      var deferred = $q.defer();
      var opts = _.extend({}, defaults, options);
      /** Display loading animation */
      queueService.increase();
      if (opts.buildValuePairs === true) {
        var editableFields = _.where(model.list.fields, { readOnly: false });
        opts.valuePairs = generateValuePairs(editableFields, item);
      }
      var payload = {
          operation: 'UpdateListItems',
          webURL: model.list.webURL,
          listName: model.list.guid,
          valuepairs: opts.valuePairs
        };
      if (_.isObject(item) && _.isNumber(item.id)) {
        /** Updating existing list item */
        payload.batchCmd = 'Update';
        payload.ID = item.id;
      } else {
        /** Creating new list item */
        payload.batchCmd = 'New';
      }
      /** Logic to simulate expected behavior when working offline */
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
      } else {
        /** Make call to lists web service */
        var webServiceCall = $().SPServices(payload);
        webServiceCall.then(function () {
          /** Success */
          var output = processListItems(model, webServiceCall.responseXML, opts);
          deferred.resolve(output[0]);
        }, function (outcome) {
          /** In the event of an error, display toast */
          toastr.error('There was an error getting the requested data from ' + model.list.name);
          deferred.reject(outcome);
        }).always(function () {
          queueService.decrease();
        });
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
         * @param {Array} [options.target] - optional location to search through and remove the local cached copy
         * @returns {object} promise
         */
    var deleteItemModel = function (model, item, options) {
      queueService.increase();
      var defaults = { target: item.getContainer() };
      var opts = _.extend({}, defaults, options);
      var payload = {
          operation: 'UpdateListItems',
          webURL: model.list.webURL,
          listName: model.list.guid,
          batchCmd: 'Delete',
          ID: item.id
        };
      var deferred = $q.defer();
      if (offline) {
        /** Simulate deletion and remove locally */
        removeEntityFromLocalCache(opts.target, item.id);
        queueService.decrease();
        deferred.resolve(opts.target);
      } else {
        var webServiceCall = $().SPServices(payload);
        webServiceCall.then(function () {
          /** Success */
          removeEntityFromLocalCache(opts.target, item.id);
          queueService.decrease();
          deferred.resolve(opts.target);
        }, function (outcome) {
          //In the event of an error, display toast
          toastr.error('There was an error deleting a list item from ' + model.list.title);
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
         * @ngdoc method
         * @name fieldService#resolveValueForEffectivePermMask
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
         * @ngdoc method
         * @name fieldService#mockPermMask
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
         * @ngdoc method
         * @name fieldService#Field
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
         * Returns a an object defining a specific field type
         * @param {string} fieldType
         * @returns {object} fieldTypeDefinition
         */
    function getDefinition(fieldType) {
      return fieldTypes[fieldType];
    }
    /**
         * @ngdoc method
         * @name fieldService#getDefaultValueForType
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
         * @ngdoc method
         * @name fieldService#getMockData
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
         * @ngdoc method
         * @name fieldService#defaultFields
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
         * @ngdoc method
         * @name fieldService#extendFieldDefinitions
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
         * @ngdoc method
         * @name modalService#modalModelProvider
         * @description
         * Extends a model to allow us to easily attach a modal form that accepts and injects a
         * dynamic number of arguments.
         * @param {object} options - Configuration object.
         * @param {string} options.templateUrl - Reference to the modal view.
         * @param {string} options.controller - Name of the modal controller.
         * @param {string[]} [options.expectedArguments] - First argument name should be the item being edited.
         * @returns {openModal}
         *
         * @example
            model.openModal = modalService.modalModelProvider({
                templateUrl: 'modules/comp_request/views/comp_request_modal_view.html',
                controller: 'compRequestModalCtrl',
                expectedArguments: ['request']
            });
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
         * @ngdoc method
         * @name modalService#getPermissions
         * @description
         * Returns an object containing the permission levels for the current user
         * @param {object} entity - list item
         * @returns {{userCanEdit: boolean, userCanDelete: boolean, userCanApprove: boolean, fullControl: boolean}}
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
         * @ngdoc method
         * @name modalService#initializeState
         * @description
         * Creates a state object, populates permissions for curent user, and sets display mode
         * @param entity
         * @param [options]
         * @returns {Object}
         *
         * @example
         $scope.state = modalService.initializeState(request, {
             dateExceedsBoundary: false,
             enableApproval: false
         });
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
         * @ngdoc method
         * @name modalService#deleteEntity
         * @description
         * Prompts for confirmation of deletion, then deletes and closes modal
         * @param {object} entity
         * @param {object} state
         * @param {object} $modalInstance
         *
         * @example
         *  $scope.deleteRequest = function () {
         *      modalService.deleteEntity($scope.request, $scope.state, $modalInstance);
         *  };
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
         * @ngdoc method
         * @name modalService#saveEntity
         * @description
         * Creates a new record if necessary, otherwise updates the existing record
         * @param {object} entity
         * @param {object} model
         * @param {object} state
         * @param {object} $modalInstance
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
 * The `modelFactory` provides a common base prototype for Model, Query, and List Item.
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
         * @module Model
         * @description
         * Model Constructor
         * Provides the Following
         * - adds an empty "data" array
         * - adds an empty "queries" object
         * - adds a deferred obj "ready"
         * - builds "model.list" with constructor
         * - adds "getAllListItems" function
         * - adds "addNewItem" function
         * @param {object} options
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
         * //Taken from a fictitious projectsModel.js
         * var model = new modelFactory.Model({
         *        factory: Project,
         *        list: {
         *            guid: '{PROJECT LIST GUID}',
         *            title: 'Projects',
         *            customFields: [
         *                { internalName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false },
         *                { internalName: 'Customer', objectType: 'Lookup', mappedName: 'customer', readOnly: false },
         *                { internalName: 'ProjectDescription', objectType: 'Text', mappedName: 'projectDescription', readOnly: false },
         *                { internalName: 'Status', objectType: 'Text', mappedName: 'status', readOnly: false },
         *                { internalName: 'TaskManager', objectType: 'User', mappedName: 'taskManager', readOnly: false },
         *                { internalName: 'ProjectGroup', objectType: 'Lookup', mappedName: 'group', readOnly: false },
         *                { internalName: 'CostEstimate', objectType: 'Currency', mappedName: 'costEstimate', readOnly: false },
         *                { internalName: 'Active', objectType: 'Boolean', mappedName: 'active', readOnly: false },
         *                { internalName: 'Attachments', objectType: 'Attachments', mappedName: 'attachments', readOnly: true}
         *            ]
         *        }
         *    });
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
         * @ngdoc method
         * @name Model#getAllListItems
         * @module Model
         * @description
         * Inherited from Model constructor
         * Gets all list items in the current list, processes the xml, and adds the data to the model
         * Uses new deferred object instead of resolving self.ready
         * @returns {promise}
         * @example Taken from a fictitious projectsModel.js
         *     projectModel.getAllListItems().then(function(entities) {
         *         //Do something with all of the returned entities
         *         $scope.projects = entities;
         *     };
         */
    Model.prototype.getAllListItems = function () {
      var deferred = $q.defer();
      dataService.executeQuery(this, this.queries.getAllListItems, { deferred: deferred }).then(function (response) {
        deferred.resolve(response);
      });
      return deferred.promise();
    };
    /**
         * @ngdoc method
         * @name modelFactory#registerChange
         * @description
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
         * @ngdoc method
         * @name Model#addNewItem
         * @description
         * Creates a new list item in SharePoint
         * @param {object} entity - Contains attribute to use in the creation of the new list item
         * @param {object} [options] - Pass additional options to the data service.
         * @returns {promise}
         *
         * @example
         * //Taken from a fictitious projectsModel.js
         *    projectModel.addNewItem({
         *           title: 'A Project',
         *           customer: {lookupValue: 'My Customer', lookupId: 123},
         *           description: 'This is the project description'
         *        }).then(function(newEntityFromServer) {
         *            //The local query cache is automatically updated but any other dependent logic can go here
         *    };
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
         * @ngdoc method
         * @name Model#registerQuery
         * @description
         * Constructor that allows us create a static query with a reference to the parent model
         * @param {object} [queryOptions]
         * @param {string} [queryOptions.name=defaultQueryName]
         * @returns {Query}
         *
         * @example
         * //Could be placed on the projectModel and creates the query but doesn't call it
         *
         *    projectModel.registerQuery({
         *        name: 'primary',
         *        query: '' +
         *            '<Query>' +
         *            '   <OrderBy>' +
         *            '       <FieldRef Name="Title" Ascending="TRUE"/>' +
         *            '   </OrderBy>' +
         *            '</Query>'
         *    });
         * @example
         * //To call the query or check for changes since the last call
         *
         *    projectModel.executeQuery('primary').then(function(entities) {
         *        //We now have a reference to array of entities stored in the local cache
         *        //These inherit from the ListItem prototype as well as the Project prototype on the model
         *        $scope.projects = entities;
         *    });
         * @example
         * //Advanced functionality that would allow us to dynamically create queries for list items with a
         * //lookup field associated with a specific project id.  Let's assume this is on the projectTasksModel.
         *
         *    model.queryByProjectId(projectId) {
         *        // Unique query name
         *        var queryKey = 'pid' + projectId;
         *
         *        // Register project query if it doesn't exist
         *        if (!_.isObject(model.queries[queryKey])) {
         *            model.registerQuery({
         *                name: queryKey,
         *                query: '' +
         *                    '<Query>' +
         *                    '   <OrderBy>' +
         *                    '       <FieldRef Name="ID" Ascending="TRUE"/>' +
         *                    '   </OrderBy>' +
         *                    '   <Where>' +
         *                    '       <And>' +
         *                // Prevents any records from being returned if user doesn't have permissions on project
         *                    '           <IsNotNull>' +
         *                    '               <FieldRef Name="Project"/>' +
         *                    '           </IsNotNull>' +
         *                // Return all records for the project matching param projectId
         *                    '           <Eq>' +
         *                    '               <FieldRef Name="Project" LookupId="TRUE"/>' +
         *                    '               <Value Type="Lookup">' + projectId + '</Value>' +
         *                    '           </Eq>' +
         *                    '       </And>' +
         *                    '   </Where>' +
         *                    '</Query>'
         *            });
         *        }
         *        //Still using execute query but now we have a custom query
         *        return model.executeQuery(queryKey);
         *    };
         *
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
         * @ngdoc method
         * @name Model#getQuery
         * @description
         * Helper function that attempts to locate and return a reference to the requested or catchall query
         * @param {string} [queryName=defaultQueryName] - A unique key to identify this query
         * @returns {object} query - see Query prototype for properties
         *
         * @example
         * <pre>
         * var primaryQuery = projectModel.getQuery();
         * </pre>
         * --or--
         * @example
         * <pre>
         * var primaryQuery = projectModel.getQuery('primary');
         * </pre>
         * --or--
         * @example
         * <pre>
         * var namedQuery = projectModel.getQuery('customQuery');
         * </pre>
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
         * @ngdoc method
         * @name Model#getCache
         * @description
         * Helper function that return the local cache for a named query if provided, otherwise
         * it returns the cache for the primary query for the model.  Useful if you know the query
         * has already been resolved and there's no need to check SharePoint for changes.
         *
         * @param {string} [queryName]
         * @returns {Array}
         *
         * @example
         * var primaryQueryCache = projectModel.getCache();
         *
         *
         * --or--
         * @example
         * var primaryQueryCache = projectModel.getCache('primary');
         *
         *
         * --or--
         * @example
         * var namedQueryCache = projectModel.getCache('customQuery');
         *
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
         * @ngdoc method
         * @name Model#executeQuery
         * @description
         * The primary method for retrieving data from a query registered on a model.  It returns a promise
         * which resolves to the local cache after post processing entities with constructors.
         *
         * @param {string} [queryName=defaultQueryName] - A unique key to identify this query
         * @param {object} [options] - Pass options to the data service.
         * @returns {function}
         *
         * @example To call the query or check for changes since the last call.
         * projectModel.executeQuery('MyCustomQuery').then(function(entities) {
         *     //We now have a reference to array of entities stored in the local cache
         *     //These inherit from the ListItem prototype as well as the Project prototype on the model
         *     $scope.subsetOfProjects = entities;
         * })
         *
         */
    Model.prototype.executeQuery = function (queryName, options) {
      var model = this;
      var query = model.getQuery(queryName);
      if (query) {
        return query.execute(options);
      }
    };
    /**
         * @ngdoc method
         * @name Model#isInitialised
         * @description
         * Methods which allows us to easily determine if we've successfully made any queries this session
         * @returns {boolean}
         */
    Model.prototype.isInitialised = function () {
      return _.isDate(this.lastServerUpdate);
    };
    /**
         * @ngdoc method
         * @name Model#searchLocalCache
         * @description
         * Search functionality that allow for deeply searching an array of objects for the first
         * record matching the supplied value.  Additionally it maps indexes to speed up future calls.  It
         * currently rebuilds the mapping when the length of items in the local cache has changed or when the
         * rebuildIndex flag is set.
         *
         * @param value - The value or array of values to compare against
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
         * @ngdoc method
         * @name Model#createEmptyItem
         * @description
         * Creates an object using the editable fields from the model, all attributes are empty
         * @param {object} [overrides] - Optionally extend the new item with specific values.
         * @returns {object}
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
         * @ngdoc method
         * @name Model#generateMockData
         * @description
         * Generates n mock records for testing
         *
         * @param {object} [options]
         * @param {number} [options.quantity=10] - The requested number of mock records
         * @param {string} [options.permissionLevel=FullMask] - Sets the mask on the mock records to simulate desired level
         * @param {boolean} [options.staticValue=false] - by default all mock data is dynamically created but if set, this will
         * cause static data to be used instead
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
         * @ngdoc method
         * @name Model#validateEntity
         * @description
         * Uses the custom fields defined in an model to ensure each field (required = true) is evaluated
         * based on field type
         *
         * @param {object} entity
         * @param {object} [options]
         * @param {boolean} [options.toast=true] - Should toasts be generated to alert the user of issues
         * @returns {boolean}
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
         * @description
         * Constructor for creating a list item which inherits CRUD functionality that can be called directly from obj
         * @constructor
         */
    function ListItem() {
    }
    /**
         * @ngdoc method
         * @name ListItem#getDataService
         * @description
         * Allows us to reference when out of scope
         * @returns {object}
         */
    ListItem.prototype.getDataService = function () {
      return dataService;
    };
    /**
         * @ngdoc method
         * @name ListItem#saveChanges
         * @description
         * Updates record directly from the object
         * @param {object} [options] - optionally pass params to the dataService
         * @returns {promise}
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
         * @ngdoc method
         * @name ListItem#saveFields
         * @description
         * Saves a named subset of fields back to SharePoint
         * Alternative to saving all fields
         * @param {array} fieldArray - array of internal field names that should be saved to SharePoint
         * @returns {promise}
         */
    ListItem.prototype.saveFields = function (fieldArray) {
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
      var valuePairs = dataService.generateValuePairs(definitions, listItem);
      dataService.addUpdateItemModel(model, listItem, {
        buildValuePairs: false,
        valuePairs: valuePairs
      }).then(function (response) {
        deferred.resolve(response);
        /** Optionally broadcast change event */
        registerChange(model);
      });
      return deferred.promise;
    };
    /**
         * @ngdoc method
         * @name ListItem#deleteItem
         * @description
         * Deletes record directly from the object and removes record from user cache
         * @param {object} [options] - optionally pass params to the dataService
         * @returns {promise}
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
         * @ngdoc method
         * @name ListItem#validateEntity
         * @description
         * Helper function that passes the current item to Model.validateEntity
         *
         * @param {object} [options]
         * @param {boolean} [options.toast=true]
         * @returns {boolean}
         */
    ListItem.prototype.validateEntity = function (options) {
      var listItem = this, model = listItem.getModel();
      return model.validateEntity(listItem, options);
    };
    /**
         * @ngdoc method
         * @name ListItem#getAttachmentCollection
         * @description
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
         * @ngdoc method
         * @name ListItem#deleteAttachment
         * @description
         * Delete an attachment using the attachment url
         * @param {string} url
         * @returns {promise} - containing updated attachment collection
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
         * @ngdoc method
         * @name ListItem#resolvePermissions
         * @description
         *
         * @returns {Object} Contains properties for each permission level evaluated for current user(true | false)
         */
    ListItem.prototype.resolvePermissions = function () {
      return resolvePermissions(this.permMask);
    };
    /**
         * @ngdoc method
         * @name ListItem#getFieldVersionHistory
         * @description
         * Returns the version history for a specific field
         * @param {string[]} fieldNames the js mapped name of the fields (ex: [title])
         * @returns {promise} - containing array of changes
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
         * @ngdoc function
         * @name Query
         * @description
         * Decorates query optional attributes
         * @param {object} queryOptions
         * @param {object} model
         * @constructor
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
         * @ngdoc method
         * @name Query#execute
         * @description
         * Query SharePoint, pull down all initial records on first call
         * Subsequent calls pulls down changes (Assuming operation: "GetListItemChangesSinceToken")
         * @param [options] - Any options that should be passed to dataService.executeQuery
         * @returns {function} - Array of list item objects
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
         * @ngdoc method
         * @name Query#searchLocalCache
         * @description
         * Simple wrapper that by default sets the search location to the local query cache
         * @param {*} value
         * @param {object} [options] - Options to pass to Model.prototype.searchLocalCache
         * @returns {object}
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
         * @ngdoc method
         * @name modelFactory#resolvePermissions
         * @description
         * Converts permMask into something usable to determine permission level for current user
         * @param {string} permissionsMask - The WSS Rights Mask is an 8-byte, unsigned integer that specifies
         * the rights that can be assigned to a user or site group. This bit mask can have zero or more flags set.
         * @example '0x0000000000000010'
         * @returns {object} property for each permission level identifying if current user has rights (true || false)
         * link: http://sympmarc.com/2009/02/03/permmask-in-sharepoint-dvwps/
         * link: http://spservices.codeplex.com/discussions/208708
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
         * @ngdoc method
         * @name queueService#increase
         * @description
         * Increase the counter by 1.
         */
  var increase = function () {
    counter++;
    notifyObservers();
    return counter;
  };
  /**
         * @ngdoc method
         * @name queueService#reset
         * @description
         * Decrease the counter by 1.
         * @returns {number}
         */
  var decrease = function () {
    if (counter > 0) {
      counter--;
      notifyObservers();
      return counter;
    }
  };
  /**
         * @ngdoc method
         * @name queueService#reset
         * @description
         * Reset counter to 0.
         * @returns {number}
         */
  var reset = function () {
    counter = 0;
    notifyObservers();
    return counter;
  };
  var observerCallbacks = [];
  /**
         * @ngdoc method
         * @name queueService#registerObserverCallback
         * @description
         * Register an observer
         * @param callback
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
         * @ngdoc method
         * @name utilityService#xmlToJson
         * @description
         * This function converts an XML node set to JSON
         * Modified version of SPServices "SPXmlToJson" function
         * @param rows ["z:rows"]
         * @param options.mapping [columnName: mappedName: "mappedName", objectType: "objectType"]
         * @param options.includeAllAttrs [If true, return all attributes, regardless whether they are in the mapping]
         * @param options.removeOws [Specifically for GetListItems, if true, the leading ows_ will be stripped off the field name]
         * @returns {Array}
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
  // End $.fn.SPServices.SPXmlToJson
  /**
         * @ngdoc method
         * @name utilityService#attrToJson
         * @description
         * Converts a SharePoint string representation of a field into the correctly formatted JS version
         * @param value
         * @param objectType
         * @returns {*}
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
         * @ngdoc method
         * @name utilityService#yyyymmdd
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
         * @ngdoc method
         * @name utilityService#dateWithinRange
         * @description
         * Converts dates into yyyymmdd formatted ints and evaluates to determine if the dateToCheck
         * falls within the date range provided
         * @param startDate
         * @param endDate
         * @param [dateToCheck] - defaults to the current date
         * @returns {boolean}
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