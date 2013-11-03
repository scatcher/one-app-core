'use strict';

angular.module('OneApp')
    .animation('.slide-animation', function() {
    return {
        enter : function(element, done) {
            jQuery(element).css({
                position:'absolute',
                'z-index':100,
                top:600,
                opacity:0
            });
            jQuery(element).animate({
                top:0,
                opacity:1
            }, done);
        },

        leave : function(element, done) {
            jQuery(element).css({
                position:'absolute',
                'z-index':101,
                top:0,
                opacity:1
            });
            jQuery(element).animate({
                top:-600,
                opacity:0
            }, done);
        }
    };
});