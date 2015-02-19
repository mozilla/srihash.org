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
    var schemelessURL = helpers.upgradeToHttps('example.com/script.js');
    t.equals(schemelessURL, 'http://example.com/script.js', 'Schemeless URL');
    var relativeSchemeURL = helpers.upgradeToHttps('//example.com/script.js');
    t.equals(relativeSchemeURL, 'https://example.com/script.js', 'Relative scheme URL');
    var schemelessKnownURL = helpers.upgradeToHttps('code.jquery.com/script.js');
    t.equals(schemelessKnownURL, 'https://code.jquery.com/script.js', 'Schemeless known URL');
    t.end();
  }
);

test(
  'eligibility',
  function (t) {
    // Simulate a XMLHttpRequest object
    var FauxXHR = function (headers) {
      var that = this;
      that.getResponseHeader = function (header) {
        return headers[header];
      }
      return that;
    };
    var allGood = new FauxXHR({'DNT': '1'});
    t.deepEqual(helpers.eligibility(allGood), [], 'no bad headers found');
    var badHeader1 = new FauxXHR({'refresh': '1'});
    t.deepEqual(helpers.eligibility(badHeader1), ['refresh'], 'refresh is an issue');
    var badHeader2 = new FauxXHR({'www-authenticate': '1'});
    t.deepEqual(helpers.eligibility(badHeader2), ['www-authenticate'], 'www-auth is an issue');
    var badHeader3 = new FauxXHR({'authorization': 'baSe64DaTA'});
    t.deepEqual(helpers.eligibility(badHeader3), ['authorization'], 'auth is an issue');
    var cacheHeader1 = new FauxXHR({'cache-control': 'max-age=1000,private'});
    t.deepEqual(helpers.eligibility(cacheHeader1), ['no-cache'], 'private caching is an issue');
    var cacheHeader2 = new FauxXHR({'cache-control': 'public,no-store'});
    t.deepEqual(helpers.eligibility(cacheHeader2), ['no-cache'], 'no-store is an issue');
    t.end();
  }
);

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
