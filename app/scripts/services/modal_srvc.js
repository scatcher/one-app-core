'use strict';

angular.module('OneApp')
    .service('modalService', function ($modal, toastr) {

        /**
         * Extends a model to allow us to easily attach a modal edit form
         * @param {string} templateUrl - Reference to the modal view.
         * @param {string} controller - Name of the modal controller.
         * @param {object} [options]
         * @param {string[]} [options.expectedArgs] - First argument name shoud be the item being edited.
         * @returns {openModal}
         */
        function modalModelProvider(templateUrl, controller, options) {
            return function openModal() {
                var self = openModal;
                /** Reference all arguments that were provided */
                var args = arguments;

                var modalConfig = {
                    templateUrl: templateUrl,
                    controller: controller,
                    resolve: {}
                }

                _.each(options.expectedArgs, function (argName, index) {
                    /** Only attempt to resolve arguments that were passed in */
                    if(args[index]) {
                        modalConfig.resolve[argName] = function() {
                            return args[index];
                        }
                    }
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
            }
        }

        /**
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
            }

            if(_.isObject(entity) && _.isFunction(entity.resolvePermissions)) {
                var userPermMask = $scope.requirement.resolvePermissions();
                userPermissions.userCanEdit = userPermMask.EditListItems;
                userPermissions.userCanDelete = userPermMask.DeleteListItems;
                userPermissions.userCanApprove = userPermMask.ApproveItems;
            }

            return userPermissions;
        }

        /**
         * Creates a state object, populates permissions for curent user, and sets display mode
         * @param entity
         * @param options
         * @returns {Object}
         */
        function initializeState(entity, options) {
            var state = {
                userCanEdit: false,
                userCanDelete: false,
                negotiatingWithServer: false,
                locked: false,
                lockedBy: '',
                displayMode: 'View' // New || Edit || View || Fork
            }

            var permissions = getPermissions();

            /** Check if it's a new form */
            if(!entity || !entity.id) {
                state.displayMode = 'New';
            } else if(state.userCanEdit) {
                state.displayMode = 'Edit';
            }

            return _.extend(state, permissions, options);
        }

        /**
         * Prompts for confirmation of deletion, then deletes and closes modal
         * @param {object} entity
         * @param {object} state
         * @param {object} $modalInstance
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
         * Creates a new record if necessary, otherwise updates the existing record
         * @param {object} entity
         * @param {object} model
         * @param {object} state
         * @param {object} $modalInstance
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
            initializeState: initializeState,
            modalModelProvider: modalModelProvider,
            getPermissions: getPermissions,
            saveEntity: saveEntity
        }

    });
