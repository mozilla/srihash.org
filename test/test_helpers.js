/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

var test = require('tap').test;
var helpers = require('../lib/helpers.js');

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
);

/*
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
);
*/

// Ideally we should find a way to test this without using the network
test(
  'generateElement',
  function (t) {
    helpers.generateElement('https://code.jquery.com/jquery-1.11.2.min.js', 'sha-256',
      function (element) {
        t.equals(element, '<script src="https://code.jquery.com/jquery-1.11.2.min.js" integrity="ni:///sha-256;Ls0pXSlb7AYs7evhd-VLnWsZ_AqEHcXBeMZUycz_CcA?ct=application/x-javascript"></script>', 'jQuery 1.11.2 using sha256');

        helpers.generateElement('https://code.jquery.com/jquery-1.11.2.min.js', 'sha-512',
          function (element) {
            t.equals(element, '<script src="https://code.jquery.com/jquery-1.11.2.min.js" integrity="ni:///sha-512;eBrO3JneTOjVPZtDoVjGReqxsj39_WtXs8RCsRrMSjRODVsAZ9S3i7Fzq73tdfuRxBDytaWPcdQ4qmJm0EjZig?ct=application/x-javascript"></script>', 'jQuery 1.11.2 using sha512');
            t.end();
          }
        );
      }
    );
  }
);
