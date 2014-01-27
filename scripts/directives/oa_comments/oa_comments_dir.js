angular.module('OneApp')
    .directive('oaComments', function ($sce, $timeout, commentsModel, config) {
        return {
            restrict: "A",
            replace: true,
            templateUrl: 'bower_components/one-app-core/scripts/directives/oa_comments/oa_comments_tmpl.html',
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

                scope.comments = scope.listItem.comments;

                //Helper to force digest
                scope.refresh = function () {
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                };

                scope.clearTempVars = function() {
                    scope.state.respondingTo = '';
                    scope.state.tempResponse = '';
                    scope.state.tempComment = '';
                };

                scope.createNewComment = function () {
                    if(scope.comments) {
                        //Comment already exists so no need to create new one
                        scope.comments.createResponse(scope.state.tempComment).then(function() {
                            scope.clearTempVars();
                        });
                    } else {
                        //Creating a new list item
                        commentsModel.createComment(scope.listItem, scope.state.tempComment).then(function(response) {
                            scope.comments = response;
                            scope.clearTempVars();
                        });
                    }
                };

                scope.createResponse = function(comment) {
                    comment.createResponse(scope.state.tempResponse).then(function() {
                        scope.clearTempVars();
                    });
                };

                scope.deleteComment = function(comment) {
                    var confirmation = window.confirm("Are you sure you want to delete this comment?");
                    if (confirmation) {
                        comment.deleteComment().then(function() {

                        });
                    }
                };

                //Pull down all comments for the current list item
                var fetchComments = function () {
                    scope.listItem.fetchComments().then(function (comments) {
                        $timeout(function() {
                            if(config.offline && !scope.listItem.comments) {
                                //Just return first comment
                                scope.comments = comments[0];
                            } else if (comments.length > 0){
                                scope.comments = comments[0];
                            }

                            //Store updated comments on list item
                            scope.listItem.comments = scope.comments;

                            scope.state.ready = true;
                        });
                    });
                };

                fetchComments();

                commentsModel.sync.subscribeToChanges(function() {
                    console.log("Comment change detected");
                });

            }
        };
    });