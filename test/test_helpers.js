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

test(
  'eligibility',
  function (t) {
    // Generate a faux XHR request
    var FauxXHR = function (headers) {
      var that = this;
      that.getResponseHeader = function (header) {
        return headers[header.toLowerCase()];
      }
      return that;
    };
    var badHeader1 = new FauxXHR({'refresh': '1'});
    t.deepEqual(helpers.eligibility(badHeader1), ['refresh', 'no-cache']);
    var badHeader2 = new FauxXHR({'www-authenticate': '1'});
    t.deepEqual(helpers.eligibility(badHeader2), ['www-authenticate', 'no-cache']);
    var badHeader3 = new FauxXHR({'authorization': 'baSe64DaTA'});
    t.deepEqual(helpers.eligibility(badHeader3), ['authorization', 'no-cache']);
    var cacheHeader1 = new FauxXHR({'cache-control': 'public, no-transform'});
    t.deepEqual(helpers.eligibility(cacheHeader1), []);
    var cacheHeader2 = new FauxXHR({'cache-control': 'max-age=1000,private'});
    t.deepEqual(helpers.eligibility(cacheHeader2), ['no-cache']);
    var cacheHeader3 = new FauxXHR({'cache-control': 'no-store'});
    t.deepEqual(helpers.eligibility(cacheHeader3), ['no-cache']);
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
