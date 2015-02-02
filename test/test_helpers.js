/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

var test = require('tap').test;
var helpers = require('../lib/helpers.js');

test(
  'hashString',
  function (t) {
    var sha256Hash = helpers.hashString('hello', 'sha-256');
    t.equals(sha256Hash, 'LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ', 'sha-256 hash');
    var sha512Hash = helpers.hashString('hello', 'sha512');
    t.equals(sha512Hash, 'm3HSJL1i83hdltRq0-o9czGb-8KJDKra4t_3JRlnPKcjI8PZm6XBHXx6zG4UuMXaDEZjR1wuXDre9G9zvN7AQw', 'sha-512 hash');
    t.end();
  }
)

test(
  'upgradeToHttps',
  function (t) {
    var knownHttpsURL = helpers.upgradeToHttps('https://code.jquery.com/script.js');
    t.equals(knownHttpsURL, 'https://code.jquery.com/script.js', 'HTTPS from known CDN');
    var knownHttpURL = helpers.upgradeToHttps('http://code.jquery.com/script.js');
    t.equals(knownHttpURL, 'https://code.jquery.com/script.js', 'HTTP from known CDN');
    var unknownHttpsURL = helpers.upgradeToHttps('https://example.com/script.js');
    t.equals(unknownHttpsURL, 'https://example.com/script.js', 'HTTPS from unknown CDN');
    var unknownHttpURL = helpers.upgradeToHttps('http://example.com/script.js');
    t.equals(unknownHttpURL, 'http://example.com/script.js', 'HTTP from unknown CDN');
    t.end();
  }
)

test(
  'isEligible',
  function (t) {
    var badHeader1 = helpers.isEligible({'refresh': '1'});
    t.notOk(badHeader1, 'Refresh header');
    var badHeader2 = helpers.isEligible({'WWW-Authenticate': '1'});
    t.notOk(badHeader2, 'WWW-Authenticate header');
    var badHeader3 = helpers.isEligible({'authorization': null});
    t.notOk(badHeader3, 'Authorization header');
    var corsHeader = helpers.isEligible({'Access-Control-Allow-Origin': '*'});
    t.ok(corsHeader, 'CORS header');
    var cacheHeader1 = helpers.isEligible({'Cache-Control': 'public, no-transform'});
    t.ok(cacheHeader1, 'Publicly cachable');
    var cacheHeader2 = helpers.isEligible({'Cache-Control': 'max-age=1000,private'});
    t.notOk(cacheHeader2, 'Cache-Control: private');
    var cacheHeader3 = helpers.isEligible({'Cache-Control': 'no-store'});
    t.notOk(cacheHeader3, 'Cache-Control: no-store');
    t.end();
  }
)
