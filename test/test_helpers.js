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

test(
  'guessResourceType',
  function (t) {
    var jsCt1 = helpers.guessResourceType({ ct: 'text/javascript' });
    t.deepEqual(jsCt1, 'js');
    var jsCt2 = helpers.guessResourceType({ ct: 'application/javascript' });
    t.deepEqual(jsCt2, 'js');
    var jsCt3 = helpers.guessResourceType({ ct: 'application/x-javascript' });
    t.deepEqual(jsCt3, 'js');
    var jsUrl1 = helpers.guessResourceType({ url: 'https://example.com/file.min.js' });
    t.deepEqual(jsUrl1, 'js');
    var jsUrl2 = helpers.guessResourceType({ url: 'https://example.com/file.qh4325kgjhgkjhg' });
    t.deepEqual(jsUrl2, 'js'); // fallback to js
    var jsUrl3 = helpers.guessResourceType({ url: 'https://example.com/file' });
    t.deepEqual(jsUrl3, 'js'); // fallback to js
    var jsUrl4 = helpers.guessResourceType({ url: 'https://example.com/' });
    t.deepEqual(jsUrl4, 'js'); // fallback to js
    var cssCt1 = helpers.guessResourceType({ ct: 'text/css' });
    t.deepEqual(cssCt1, 'css');
    var cssUrl1 = helpers.guessResourceType({ url: 'http://example.com/file.css' });
    t.deepEqual(cssUrl1, 'css');
    var cssUrl2 = helpers.guessResourceType({ url: 'https://example.com/STYLES.CSS' });
    t.deepEqual(cssUrl2, 'css');
    var cssUrl3 = helpers.guessResourceType({ ct: 'text/css', url: 'https://example.com/file.min.js' });
    t.deepEqual(cssUrl3, 'css'); // ct takes precedence over url
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

            helpers.generateElement('https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css', 'sha-256',
              function (element) {
                t.equals(element, '<link rel="stylesheet" href="https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css" integrity="ni:///sha-256;DW9MX1sLpQ9seN_7-gouAyFj8-xc-lQD6Q9DKWqQDy0?ct=text/css">', 'jQuery UI 1.11.3 black-tie theme using sha256');
                t.end();
              }
            );

          }
        );

      }
    );
  }
);
