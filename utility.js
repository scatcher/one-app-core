'use strict';

angular.module('OneApp')
  .service('utility', function utility() {
    // AngularJS will instantiate a singleton by calling "new" on this function

        //Extend underscore
        _.mixin({
            isDefined: function(value) {
                return !_.isUndefined(value);
            }
        });

        // Modified version of SPServices "SPXmlToJson" function
        /**
         * This function converts an XML node set to JSON
         * @param rows ["z:rows"]
         * @param options.mapping [columnName: mappedName: "mappedName", objectType: "objectType"]
         * @param options.includeAllAttrs [If true, return all attributes, regardless whether they are in the mapping]
         * @param options.removeOws [Specifically for GetListItems, if true, the leading ows_ will be stripped off the field name]
         * @returns {Array}
         */
        var xmlToJson = function(rows, options) {

            var opt = $.extend({}, {
                mapping: {},
                includeAllAttrs: false,
                removeOws: true
            }, options);

            var attrNum;
            var jsonObject = [];

            _.each(rows, function(item) {
                var row = {};
                var rowAttrs = item.attributes;

                // Bring back all mapped columns, even those with no value
                _.each(opt.mapping, function(prop) {
                    row[prop.mappedName] = "";
                });

                // Parse through the element's attributes
                for(attrNum = 0; attrNum < rowAttrs.length; attrNum++) {
                    var thisAttrName = rowAttrs[attrNum].name;
                    var thisMapping = opt.mapping[thisAttrName];
                    var thisObjectName = typeof thisMapping !== "undefined" ? thisMapping.mappedName : opt.removeOws ? thisAttrName.split("ows_")[1] : thisAttrName;
                    var thisObjectType = typeof thisMapping !== "undefined" ? thisMapping.objectType : undefined;
                    if(opt.includeAllAttrs || thisMapping !== undefined) {
                        row[thisObjectName] = attrToJson(rowAttrs[attrNum].value, thisObjectType);
                    }
                }
                // Push this item into the JSON Object
                jsonObject.push(row);

            });

            // Return the JSON object
            return jsonObject;

        }; // End $.fn.SPServices.SPXmlToJson

        function attrToJson(v, objectType) {

            var colValue;

            switch (objectType) {
                case "DateTime":
                case "datetime":	// For calculated columns, stored as datetime;#value
                    // Dates have dashes instead of slashes: ows_Created="2009-08-25 14:24:48"
                    colValue = dateToJsonObject(v);
                    break;
                case "Lookup":
                case "User":
                    colValue = lookupToJsonObject(v);
                    break;
                case "UserMulti":
                case "LookupMulti":
                    colValue = lookupMultiToJsonObject(v);
                    break;
                case "Boolean":
                    colValue = booleanToJsonObject(v);
                    break;
                case "Integer":
                    colValue = intToJsonObject(v);
                    break;
                case "Counter":
                    colValue = intToJsonObject(v);
                    break;
                case "MultiChoice":
                    colValue = choiceMultiToJsonObject(v);
                    break;
                case "Currency":
                case "Number":
                case "float":	// For calculated columns, stored as float;#value
                    colValue = floatToJsonObject(v);
                    break;
                case "Calc":
                    colValue = calcToJsonObject(v);
                    break;
                case "JSON":
                    colValue = parseJSON(v);
                    break;
                default:
                    // All other objectTypes will be simple strings
                    colValue = stringToJsonObject(v);
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
            var out = s === "0" ? false : true;
            return out;
        }
        function dateToJsonObject(s) {
//            return new Date(s.replace(/-/g, "/"));
            return moment(s).toDate();
        }
//        function userToJsonObject(s) {
//            if (s.length === 0) {
//                return null;
//            } else {
//                var thisUser = new SplitIndex(s);
//                return {userId: thisUser.id, lookupValue: thisUser.value};
//
////                var thisUserExpanded = thisUser.value.split(",#");
////                if(thisUserExpanded.length === 1) {
////                    return {userId: thisUser.Id, userName: thisUser.value};
////                } else {
////                    return {
////                        userId: thisUser.Id,
////                        userName: thisUserExpanded[0].replace( /(,,)/g, ","),
////                        loginName: thisUserExpanded[1].replace( /(,,)/g, ","),
////                        email: thisUserExpanded[2].replace( /(,,)/g, ","),
////                        sipAddress: thisUserExpanded[3].replace( /(,,)/g, ","),
////                        title: thisUserExpanded[4].replace( /(,,)/g, ",")
////                    };
////                }
//            }
//        }
//        function userMultiToJsonObject(s) {
//            if(s.length === 0) {
//                return null;
//            } else {
//                var thisUserMultiObject = [];
//                var thisUserMulti = s.split(";#");
//                for(var i=0; i < thisUserMulti.length; i=i+2) {
//                    var thisUser = userToJsonObject(thisUserMulti[i] + ";#" + thisUserMulti[i+1]);
//                    thisUserMultiObject.push(thisUser);
//                }
//                return thisUserMultiObject;
//            }
//        }
        function lookupToJsonObject(s) {
            if(s.length === 0) {
                return null;
            } else {
                var thisLookup = new SplitIndex(s);
                return {lookupId: thisLookup.id, lookupValue: thisLookup.value};
            }
        }
        function lookupMultiToJsonObject(s) {
            if(s.length === 0) {
                return [];
            } else {
                var thisLookupMultiObject = [];
                var thisLookupMulti = s.split(";#");
                for(var i=0; i < thisLookupMulti.length; i=i+2) {
                    var thisLookup = lookupToJsonObject(thisLookupMulti[i] + ";#" + thisLookupMulti[i+1]);
                    thisLookupMultiObject.push(thisLookup);
                }
                return thisLookupMultiObject;
            }
        }
        function choiceMultiToJsonObject(s) {
            if(s.length === 0) {
                return [];
            } else {
                var thisChoiceMultiObject = [];
                var thisChoiceMulti = s.split(";#");
                for(var i=0; i < thisChoiceMulti.length; i++) {
                    if(thisChoiceMulti[i].length !== 0) {
                        thisChoiceMultiObject.push(thisChoiceMulti[i]);
                    }
                }
                return thisChoiceMultiObject;
            }
        }
        function calcToJsonObject(s) {
            if(s.length === 0) {
                return null;
            } else {
                var thisCalc = s.split(";#");
                // The first value will be the calculated column value type, the second will be the value
                return attrToJson(thisCalc[1], thisCalc[0]);
            }
        }
        function htmlToJsonObject(s) {
            return _.unescape(s);
        }
        // Split values like 1;#value into id and value
        function SplitIndex(s) {
            var spl = s.split(";#");
            this.id = parseInt(spl[0], 10);
            this.value = spl[1];
        }

        function toCamelCase(s) {
            return s.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
            }).replace(/\s+/g, '');
        }

        function fromCamelCase(s) {
            // insert a space before all caps
            s.replace(/([A-Z])/g, ' $1')
            // uppercase the first character
            .replace(/^./, function(str){ return str.toUpperCase(); });
        }

        return {
            fromCamelCase:fromCamelCase,
            lookupToJsonObject: lookupToJsonObject,
            SplitIndex: SplitIndex,
            toCamelCase: toCamelCase,
            xmlToJson: xmlToJson
        }
  });
