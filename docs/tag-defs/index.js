var typeClassFilter = require('dgeni-packages/ngdoc/rendering/filters/type-class');
var encoder = new require('node-html-encoder').Encoder();

module.exports = [
    {
        name: 'delegate',
        transformFn: function (doc, tag) {
            return '{@link ' + tag.description + '}';
        }
    },
    {
        name: 'parent',
        transformFn: function (doc, tag) {
            doc.parentLinks = tag.description.split(',').map(function (id) {
                return '{@link ' + id.trim() + '}';
            }).join(' or ');
            return tag.description.split(',').map(function (parent) {
                return parent.trim();
            });
        }
    },
    {
        name: 'codepen'
    },
    {
        name: 'memberof'
    },
    {
        name: 'alias'
    },
    {
        name: 'type',
        description: 'Replace with markup that displays a nice type',
        handlerFactory: function () {
            return function (doc, tagName, tagDescription) {
                return '<a href="" class="' + typeClassFilter.process(tagDescription) + '">' + encoder.htmlEncode(tagDescription) + '</a>';
            };
        }
    }
];
