/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.services')
    .factory('DateUtils', function () {
        return {
            parseDate: function (nSec) {
                var parseFunc = d3.time.format("%H:%M:%S.%L").parse;

                var secToTime = function (s) {
                    function addZ(n) {
                        return (n < 10 ? '0' : '') + n;
                    }

                    var ms = s % 1;
                    s = Math.floor(s);
                    var secs = s % 60;
                    s = (s - secs) / 60;
                    var mins = s % 60;
                    var hrs = (s - mins) / 60;

                    // hack to force ms with 3 decimal parts
                    ms = parseFloat(ms.toString()).toFixed(3).slice(2);

                    return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
                };

                return parseFunc(secToTime(nSec));
            },
            timestampFormat: function (date) {
                return (d3.time.format("%H:%M:%S.%L"))(date);
            }

        };
    });
