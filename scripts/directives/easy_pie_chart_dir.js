/**
 * Created by edwin.franks on 12/16/13.
 */
angular.module('OneApp')
    .directive('easyPieChart', function ($timeout) {
        return {
            restrict: "A",
            replace: false,
            scope: {
                percent: '=',   //The field on the model to bind to
                options: '='   //List of options to pass optionally
                                //                animate:false,
                                //                barColor:'#2C3E50',
                                //                scaleColor:false,
                                //                lineWidth:20,
                                //                lineCap:'round'

            },
            link: function (scope, element, attrs) {
                var defaults = {
                    animate:false,
                    barColor:'#2C3E50',
                    scaleColor:false,
                    lineWidth:20,
                    lineCap:'round'
                };
                var options = {};
                _.defaults(options, defaults);
                $timeout(function() {
                    element.easyPieChart(options).update(scope.percent);
                }, 0);

            }
        };
    });
