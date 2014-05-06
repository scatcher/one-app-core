angular.module('spAngular')
    .directive('oaAttachments', function ($sce, toastr) {
        return {
            restrict: "A",
            replace: true,
            templateUrl: 'src/scripts/directives/oa_attachments/oa_attachments_tmpl.html',
            scope: {
                listItem: "=",      //List item the attachments belong to
                changeEvent: '='    //Optional - called after an attachment is deleted
            },
            link: function (scope, element, attrs) {

                scope.attachments = [];
                scope.state = {
                    ready: false
                };

                scope.refresh = function () {
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                };

                function resetSrc() {
                    if (_.isFunction(scope.changeEvent)) {
                        scope.changeEvent();
                    }
                    //Reset iframe
                    element.find('iframe').attr('src', element.find('iframe').attr('src'));
                }

                var listItemModel = scope.listItem.getModel();
                var uploadUrl = listItemModel.list.webURL + '/_layouts/Attachfile.aspx?ListId=' +
                    listItemModel.list.guid + '&ItemId=' + scope.listItem.id + '&IsDlg=1';

                scope.trustedUrl = $sce.trustAsResourceUrl(uploadUrl);

                //Pull down all attachments for the current list item
                var fetchAttachments = function () {
                    toastr.info("Checking for attachments")
                    scope.listItem.getAttachmentCollection().then(function (attachments) {
                        scope.attachments.length = 0;
                        //Push any new attachments into the existing array to prevent breakage of references
                        Array.prototype.push.apply(scope.attachments, attachments);
                    });
                };

                //Instantiate request
                fetchAttachments();

                scope.fileName = function (attachment) {
                    var index = attachment.lastIndexOf("/") + 1;
                    return attachment.substr(index);
                };

                scope.deleteAttachment = function (attachment) {
                    var confirmation = window.confirm("Are you sure you want to delete this file?");
                    if (confirmation) {
                        toastr.info("Negotiating with the server");
                        scope.listItem.deleteAttachment(attachment).then(function () {
                            toastr.success("Attachment successfully deleted");
                            fetchAttachments();
                            if (_.isFunction(scope.changeEvent)) {
                                scope.changeEvent();
                            }
                        });
                    }
                };

                //Run when the iframe url changes and fully loaded
                element.find('iframe').bind('load', function (event) {
                    scope.state.ready = true;
                    scope.refresh();
                    var iframe = $(this).contents();

                    if (iframe.find("#CancelButton").length < 1) {
                        //Upload complete, reset iframe
                        toastr.success("File successfully uploaded");
                        resetSrc();
                        fetchAttachments();
                        if (_.isFunction(scope.changeEvent)) {
                            scope.changeEvent();
                        }

                    } else {
                        //Hide the standard cancel button
                        iframe.find("#CancelButton").hide();
                        iframe.find(".ms-dialog").css({height: '95px'});

                        //Style OK button
                        iframe.find("input[name$='Ok']").css({float: 'left'}).click(function (event) {
                            //Click handler
                            toastr.info("Please wait while the file is uploaded");
                        });

                        iframe.find("input[name$='$InputFile']").attr({'size': 40});

                        //Style iframe to prevent scroll bars from appearing
                        iframe.find("#s4-workspace").css({
                            'overflow-y': 'hidden',
                            'overflow-x': 'hidden'
                        });

                        console.log("Frame Loaded");
                    }
                });

            }
        };
    });;angular.module('spAngular')
    .directive('oaComments', function ($sce, $timeout, commentsModel, spAngularConfig, toastr) {
        return {
            restrict: "A",
            replace: true,
            templateUrl: 'src/scripts/directives/oa_comments/oa_comments_tmpl.html',
            scope: {
                listItem: "=",      //List item the attachments belong to
                changeEvent: '='    //Optional - called after an attachment is deleted
            },
            link: function (scope, element, attrs) {

                scope.state = {
                    ready: false,
                    tempComment: '',
                    tempResponse: '',
                    respondingTo: ''
                };

                scope.comments = scope.listItem.comments || null;

                //Helper to force digest
                scope.refresh = function () {
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                };

                scope.clearTempVars = function () {
                    $timeout(function() {
                        scope.state.respondingTo = '';
                        scope.state.tempResponse = '';
                        scope.state.tempComment = '';
                    });
                };

                scope.createNewComment = function () {
                    toastr.info("Negotiating with the server");

                    if (scope.comments) {
                        //Comment already exists so no need to create new one
                        scope.comments.createResponse(scope.state.tempComment).then(function (response) {
                            scope.comments = response;
                            scope.clearTempVars();
                        });
                    } else {
                        //Creating a new list item
                        commentsModel.createComment(scope.listItem, scope.state.tempComment).then(function (response) {
                            scope.comments = response;
                            scope.clearTempVars();
                        });
                    }
                };

                scope.createResponse = function (comment) {
                    toastr.info("Negotiating with the server");
                    comment.createResponse(scope.state.tempResponse).then(function () {
                        scope.clearTempVars();
                    });
                };

                scope.deleteComment = function (comment) {
                    var parent = comment.parentComment();
                    var root = comment.rootComment();

                    var confirmation = window.confirm("Are you sure you want to delete this comment?");
                    if (confirmation) {
                        toastr.info("Negotiating with the server");
                        if (parent === root && parent.thread.length === 1) {
                            //Delete the list item because it's at the root and there are no others
                            return root.deleteItem().then(function () {
                                //Remove reference to the comment
                                delete scope.comments;
                                delete scope.listItem.comments;
                                toastr.success("Comment successfully deleted");
                            }, function () {
                                toastr.error("There was a problem deleting this comment.  Please try again.");
                            });
                        } else {
                            return root.saveChanges().then(function () {
                                //Just remove this comment from the thread
                                var commentIndex = parent.thread.indexOf(comment);
                                parent.thread.splice(commentIndex, 1);
                                toastr.success("Comment successfully deleted");
                            }, function () {
                                toastr.error("There was a problem deleting this comment.  Please try again.");
                            });
                        }
                    }
                };

                //Pull down all comments for the current list item
                var fetchComments = function () {
                    toastr.info("Checking for new comments");
                    scope.listItem.fetchComments().then(function (comments) {
                        $timeout(function () {
                            if (spAngularConfig.offline && !scope.listItem.comments) {
                                //Just return first comment
                                scope.comments = comments[0];
                            } else if (comments.length > 0) {
                                scope.comments = comments[0];
                            }

                            //Store updated comments on list item
                            scope.listItem.comments = scope.comments;

                            scope.state.ready = true;
                        });
                    });
                };

                fetchComments();

                commentsModel.sync.subscribeToChanges(function () {
                    //Ensure all updates to comment thread are displayed as they happen
//                    var localComments = commentsModel.checkForLocalComments(scope.listItem);
//                    if(localComments) {
//                        scope.comments = localComments;
//                        scope.listItem.comments = localComments;
//                    }
                    console.log("Comment change detected");
                });

            }
        };
    });;'use strict';

angular.module('spAngular')
    .directive('oaSelect', function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'src/scripts/directives/oa_select/oa_select_tmpl.html',
            scope: {
                bindedField: '=',   //The field on the model to bind to
                multi: '=',         //Single select if not set or set to false
                arr: '=',           //Array of lookup options
                lookupValue: '=',   //Field name to map the lookupValue to (default: 'title')
                ngDisabled: '='     //Pass through to disable control using ng-disabled on element if set
            },
            link: function (scope) {

                scope.state = {
                    multiSelectIDs: [],
                    singleSelectID: ''
                };

                /** Default to title field if not provided */
                scope.state.lookupField = scope.lookupValue || 'title';
                
                var buildLookupObject = function(stringId) {
                    var intID = parseInt(stringId, 10);
                    var match = _.findWhere(scope.arr, {id: intID});
                    return { lookupId: intID, lookupValue: match[scope.state.lookupField] };
                };

                //Todo: Get this hooked up to allow custom function to be passed in instead of property name
                scope.generateDisplayText = function(item) {
                    if(_.isFunction(scope.state.lookupField)) {
                        //Passed in a reference to a function to generate the select display text
                        return scope.state.lookupField(item);
                    } else if(_.isString(scope.state.lookupField)){
                        //Passed in a property name on the item to use
                        return item[scope.state.lookupField];
                    } else {
                        //Default to the title property of the object
                        return item.title;
                    }
                };

                scope.updateMultiModel = function () {
                    /** Ensure field being binded against is array */
                    if (!_.isArray(scope.bindedField)) {
                        scope.bindedField = [];
                    }
                    /** Clear out existing contents */
                    scope.bindedField.length = 0;
                    /** Push formatted lookup object back */
                    _.each(scope.state.multiSelectIDs, function (stringId) {
                        scope.bindedField.push(buildLookupObject(stringId));
                    });
                };

                scope.updateSingleModel = function () {
                    /** Create an object with expected lookupId/lookupValue properties */
                    scope.bindedField = buildLookupObject(scope.state.singleSelectID);
                };

                /** Process initially and whenever the underlying value is changed */
                scope.$watch('bindedField', function() {
                    if (scope.multi) {
                        /** Multi Select Mode
                         *  Set the string version of id's to allow multi-select control to work properly */
                        _.each(scope.bindedField, function (selectedLookup) {
                            /** Push id as a string to match what Select2 is expecting */
                            scope.state.multiSelectIDs.push(selectedLookup.lookupId.toString());
                        });
                    } else {
                        /** Single Select Mode */
                        if (_.isObject(scope.bindedField) && scope.bindedField.lookupId) {
                            /** Set the selected id as string */
                            scope.state.singleSelectID = scope.bindedField.lookupId;
                        }
                    }
                });

            }
        };
    });;angular.module('spAngular').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('src/scripts/directives/oa_attachments/oa_attachments_tmpl.html',
    "<div style=\"min-height: 200px;\">\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <div ng-hide=\"state.ready\" class=\"alert alert-info\">Loading attachment details</div>\n" +
    "            <div style=\"height: 110px;\" ng-show=\"state.ready\">\n" +
    "                <h4>\n" +
    "                    <small>Add Attachment</small>\n" +
    "                </h4>\n" +
    "                <iframe frameborder=\"0\" seamless=\"seamless\" width=\"100%\" src=\"{{ trustedUrl }}\"\n" +
    "                        scrolling=\"no\" style=\"height: 95px\"></iframe>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-show=\"attachments.length > 0\">\n" +
    "        <small>Attachments</small>\n" +
    "    </h4>\n" +
    "\n" +
    "    <ul class=\"list-unstyled\">\n" +
    "        <li ng-repeat=\"attachment in attachments\">\n" +
    "            <a href=\"{{ attachment }}\" target=\"_blank\">{{ fileName(attachment) }}</a>\n" +
    "            <button class=\"btn btn-link\" ng-click=\"deleteAttachment(attachment)\" title=\"Delete this attachment\">\n" +
    "                <i class=\"fa fa-times red\"></i>\n" +
    "            </button>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('src/scripts/directives/oa_comments/oa_comments_tmpl.html',
    "<div>\n" +
    "    <div class=\"pull-right\">\n" +
    "        <button class=\"btn btn-primary btn-xs\" ng-click=\"createNewComment()\"\n" +
    "                title=\"Create a new comment\"\n" +
    "                ng-show=\"state.tempComment.length > 0\">Save\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-default btn-xs\" ng-click=\"clearTempVars()\"\n" +
    "                title=\"Cancel comment\"\n" +
    "                ng-show=\"state.tempComment.length > 0\">Cancel\n" +
    "        </button>\n" +
    "        <!--<button class=\"btn btn-link btn-xs\" title=\"Toggle the new comment form\"-->\n" +
    "        <!--ng-click=\"state.newCommentVisible = !state.newCommentVisible\">-->\n" +
    "        <!--<i class=\"fa fa-comment\"></i> Create-->\n" +
    "        <!--</button>-->\n" +
    "    </div>\n" +
    "    <div style=\"min-height: 150px;\">\n" +
    "        <div class=\"newComment\">\n" +
    "            <div class=\"form-group\">\n" +
    "                <h4><small>New Comment</small></h4>\n" +
    "                <textarea class=\"form-control\" rows=\"2\" ng-model=\"state.tempComment\" placeholder=\"Create a new comment...\"></textarea>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"alert text-center\" style=\"margin-top: 30px;\" ng-show=\"!state.ready\">\n" +
    "            <h4><small>loading...</small></h4>\n" +
    "        </div>\n" +
    "        <div class=\"grey\" style=\"margin-top: 30px;\" ng-show=\"!comments && !state.newCommentVisible && state.ready\">\n" +
    "            No comments have been made. Create one using the input box above.\n" +
    "        </div>\n" +
    "        <div ng-if=\"comments && comments.thread.length > 0\" class=\"comments-container\">\n" +
    "            <span ng-include=\"'src/scripts/directives/oa_comments/recursive_comment.html'\"\n" +
    "                  ng-init=\"comment = comments;\"></span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>"
  );


  $templateCache.put('src/scripts/directives/oa_comments/recursive_comment.html',
    "<ul class=\"comments\">\n" +
    "    <li class=\"comment\" ng-repeat=\"response in comment.thread\" style=\"border-top-width: 1px;border-top-color: grey\">\n" +
    "        <div class=\"comment-content\">\n" +
    "            <div class=\"content\">\n" +
    "                <h5>\n" +
    "                    <small>\n" +
    "                        <span class=\"author\">{{ response.author.lookupValue }}</span>\n" +
    "                        <span>{{ response.modified  | date:'short' }}</span>\n" +
    "                        <button class=\"btn btn-link btn-xs\" ng-click=\"state.respondingTo = response\"><i\n" +
    "                                class=\"fa fa-mail-reply\"></i> Reply\n" +
    "                        </button>\n" +
    "                        <button class=\"btn btn-link btn-xs\"\n" +
    "                                ng-click=\"deleteComment(response)\"><i\n" +
    "                                class=\"fa fa-trash-o\"></i> Delete\n" +
    "                        </button>\n" +
    "                    </small>\n" +
    "                </h5>\n" +
    "                <p class=\"comment-text\">{{ response.comment }}</p>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-if=\"state.respondingTo === response\">\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col-xs-12\">\n" +
    "                    <form>\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <h5>\n" +
    "                                <small>\n" +
    "                                    Response\n" +
    "                                    <label class=\"pull-right\">\n" +
    "                                        <button class=\"btn btn-link btn-xs\"\n" +
    "                                                ng-click=\"createResponse(response)\"><i\n" +
    "                                                class=\"fa fa-save\"></i> Save\n" +
    "                                        </button>\n" +
    "                                        <button class=\"btn btn-link btn-xs\"\n" +
    "                                                ng-click=\"clearTempVars()\"><i class=\"fa fa-undo\"></i> Cancel\n" +
    "                                        </button>\n" +
    "                                    </label>\n" +
    "                                </small>\n" +
    "                            </h5>\n" +
    "                            <textarea class=\"form-control\" rows=\"2\"\n" +
    "                                      ng-model=\"state.tempResponse\"></textarea>\n" +
    "                        </div>\n" +
    "                    </form>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-if=\"response.thread.length !== -1\">\n" +
    "            <span ng-include=\"'src/scripts/directives/oa_comments/recursive_comment.html'\"\n" +
    "                  ng-init=\"comment = response;\"></span>\n" +
    "        </div>\n" +
    "    </li>\n" +
    "</ul>"
  );


  $templateCache.put('src/scripts/directives/oa_select/oa_select_tmpl.html',
    "<span class=\"ng-cloak\">\n" +
    "   <span ng-if=\"!multi\">\n" +
    "       <select class=\"form-control\" ng-model=\"state.singleSelectID\"\n" +
    "               ng-change=\"updateSingleModel()\" style=\"width: 100%\" ng-disabled=\"ngDisabled\"\n" +
    "               ng-options=\"lookup.id as lookup[state.lookupField] for lookup in arr\">\n" +
    "       </select>\n" +
    "   </span>\n" +
    "   <span ng-if=\"multi\">\n" +
    "       <select multiple ui-select2 ng-model=\"state.multiSelectIDs\"\n" +
    "               ng-change=\"updateMultiModel()\" style=\"width: 100%;\" ng-disabled=\"ngDisabled\">\n" +
    "           <option></option>\n" +
    "           <option ng-repeat=\"lookup in arr\" value=\"{{ lookup.id }}\"\n" +
    "                   ng-bind=\"lookup[state.lookupField]\">&nbsp;</option>\n" +
    "       </select>\n" +
    "   </span>\n" +
    "</span>\n"
  );

}]);
