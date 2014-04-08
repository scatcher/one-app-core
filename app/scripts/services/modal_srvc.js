'use strict';

/**
 * @ngdoc api
 * @name modalService
 * @description
 * Extends a modal form to include many standard functions
 */
angular.module('OneApp')
    .service('modalService', function ($modal, toastr) {

        /**
         * @ngdoc function
         * @name modalService.modalModelProvider
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
         * @ngdoc function
         * @name modalService.getPermissions
         * @description
         * Returns an object containing the permission levels for the current user
         * @param {object} entity - list item
         * @returns {{userCanEdit: boolean, userCanDelete: boolean, userCanApprove: boolean, fullControl: boolean}}
         */
        function getPermissions(entity) {
            var userPermissions = {
                /** Assume that if no item is passed in, the user can create one */
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
         * Creates a state object, populates permissions for curent user, and sets display mode
         * @param entity
         * @param options
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
                displayMode: 'View' // New || Edit || View || Fork
            };

            var permissions = getPermissions(entity);

            /** Check if it's a new form */
            if (!entity || !entity.id) {
                state.displayMode = 'New';
            } else if (state.userCanEdit) {
                state.displayMode = 'Edit';
            }

            return _.extend(state, permissions, options);
        }

        /**
         * @ngdoc function
         * @name modalService.deleteEntity
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
         * @ngdoc function
         * @name modalService.saveEntity
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

    });
