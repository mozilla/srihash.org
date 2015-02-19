/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

var assert = require('assert');
var helpers = require('../lib/helpers.js');

/**
 * Simulate a XMLHttpRequest object
 */
var FauxXHR = function (_attributes) {
  var that = this,
    headers = {};

  // Store header keys as lowercase
  Object.keys(_attributes.headers).map(function (header) {
    headers[header.toLowerCase()] = _attributes.headers[header];
  });

  that.getResponseHeader = function (header) {
    return headers[header.toLowerCase()];
  };
};

describe('upgradeToHttps()', function () {
  describe('CDNs', function () {
    it('Known', function () {
      var knownHttpsUrl = helpers.upgradeToHttps('https://code.jquery.com/script.js');
      assert.equal(knownHttpsUrl, 'https://code.jquery.com/script.js');
      var knownHttpUrl = helpers.upgradeToHttps('http://code.jquery.com/script.js');
      assert.equal(knownHttpUrl, 'https://code.jquery.com/script.js');
    });

    it('Unknown', function () {
      var unknownHttpsUrl = helpers.upgradeToHttps('https://example.com/script.js');
      assert.equal(unknownHttpsUrl, 'https://example.com/script.js');
      var unknownHttpUrl = helpers.upgradeToHttps('http://example.com/script.js');
      assert.equal(unknownHttpUrl, 'http://example.com/script.js');
    });
  });

  describe('URLs', function () {
    it('Schemeless', function () {
      var schemelessUnknownUrl = helpers.upgradeToHttps('example.com/script.js');
      assert.equal(schemelessUnknownUrl, 'http://example.com/script.js');
      var schemelessKnownUrl = helpers.upgradeToHttps('code.jquery.com/script.js');
      assert.equal(schemelessKnownUrl, 'https://code.jquery.com/script.js');
    });

    it('Relative', function () {
      var relativeUnknownUrl = helpers.upgradeToHttps('//example.com/script.js');
      assert.equal(relativeUnknownUrl, 'https://example.com/script.js');
      var relativeKnownUrl = helpers.upgradeToHttps('//code.jquery.com/script.js');
      assert.equal(relativeKnownUrl, 'https://code.jquery.com/script.js');
    });
  });
});

describe('eligibility()', function () {
  describe('Eligible', function () {
    it('Irrelevant header', function () {
      var allGood = new FauxXHR({ headers: { 'dnt': '1' } });
      var result = helpers.eligibility(allGood);
      assert.deepEqual(result, []);
    });
  });

  describe('Bad headers', function () {
    it('refresh', function () {
      var badRefresh = new FauxXHR({ headers: { 'refresh': '1' } });
      var result = helpers.eligibility(badRefresh);
      assert.deepEqual(result, ['refresh']);
    });

    it('www-authenticate', function () {
      var badAuthenticate = new FauxXHR({ headers: { 'www-authenticate': '1' } });
      var result = helpers.eligibility(badAuthenticate);
      assert.deepEqual(result, ['www-authenticate']);
    });

    it('authorization', function () {
      var badAuthorization = new FauxXHR({ headers: { 'authorization': 'baSe64DaTA' } });
      var result = helpers.eligibility(badAuthorization);
      assert.deepEqual(result, ['authorization']);
    });
  });

  describe('Caching', function () {
    it('Explicit public cache', function () {
      var publicCache1 = new FauxXHR({ headers: { 'cache-control': 'public' } });
      var result = helpers.eligibility(publicCache1);
      assert.deepEqual(result, []);
    });

    it('Implicit public cache', function () {
      var publicCache2 = new FauxXHR({ headers: { 'cache-control': 'bogus' } });
      var result = helpers.eligibility(publicCache2);
      assert.deepEqual(result, []);
    });

    it('private', function () {
      var badCache1 = new FauxXHR({ headers: { 'cache-control': 'max-age=1000,private' } });
      var result = helpers.eligibility(badCache1);
      assert.deepEqual(result, ['no-cache']);
    });

    it('no-store', function () {
      var badCache2 = new FauxXHR({ headers: { 'cache-control': 'public,no-store' } });
      var result = helpers.eligibility(badCache2);
      assert.deepEqual(result, ['no-cache']);
    });
  });
});

describe('guessResourceType()', function () {
  describe('Matching', function () {
    describe('Content-type', function () {
      it('js', function () {
        var jsCt1 = helpers.guessResourceType({ ct: 'text/javascript' });
        assert.deepEqual(jsCt1, 'js');
        var jsCt2 = helpers.guessResourceType({ ct: 'application/javascript' });
        assert.deepEqual(jsCt2, 'js');
        var jsCt3 = helpers.guessResourceType({ ct: 'application/x-javascript' });
        assert.deepEqual(jsCt3, 'js');
      });

      it('css', function () {
        var cssCt1 = helpers.guessResourceType({ ct: 'text/css' });
        assert.deepEqual(cssCt1, 'css');
      });
    });

    describe('Extension', function () {
      it('js', function () {
        var jsUrl1 = helpers.guessResourceType({ url: 'https://example.com/file.min.js' });
        assert.deepEqual(jsUrl1, 'js');
      });

      it('css', function () {
        var cssUrl1 = helpers.guessResourceType({ url: 'http://example.com/file.css' });
        assert.deepEqual(cssUrl1, 'css');
        var cssUrl2 = helpers.guessResourceType({ url: 'http://example.com/STYLES.CSS' });
        assert.deepEqual(cssUrl2, 'css');
      });
    });
  });

  describe('Fallback to js', function () {
    it('Invalid content-type', function () {
      var pdfCt1 = helpers.guessResourceType({ ct: 'application/pdf', url:'http://example.com' });
      assert.deepEqual(pdfCt1, 'js');
    });

    it('Invalid extension', function () {
      var jsUrl2 = helpers.guessResourceType({ url: 'https://example.com/file.ZZZ' });
      assert.deepEqual(jsUrl2, 'js');
    });

    it('Missing extension', function () {
      var jsUrl3 = helpers.guessResourceType({ url: 'https://example.com/file' });
      assert.deepEqual(jsUrl3, 'js');
    });

    it('Empty path', function () {
      var jsUrl4 = helpers.guessResourceType({ url: 'https://example.com' });
      assert.deepEqual(jsUrl4, 'js');
    });
  });

  describe('Match precedence', function () {
    it ('Content-type over extension', function () {
      var cssUrl2 = helpers.guessResourceType({ ct: 'text/css', url: 'https://example.com/file.min.js' });
      assert.deepEqual(cssUrl2, 'css');
    });
  });
});


// Ideally we should find a way to test this without using the network
describe ("generate()", function () {
  (function (result) {
    var resource = {
      url: 'https://code.jquery.com/jquery-1.11.2.min.js',
      algorithms: ['sha256']
    };
    var expect = {
      status: true,
      url: 'https://code.jquery.com/jquery-1.11.2.min.js',
      type: 'js',
      integrity: 'type:application/x-javascript sha256-Ls0pXSlb7AYs7evhd+VLnWsZ/AqEHcXBeMZUycz/CcA=',
      eligibility: []
    };

    before(function (done) {
      helpers.generate(resource, function (data) {
        result = data;
        done();
      });
    });

    it ("js", function () {
      assert.deepEqual(result, expect);
    });
  })();

  (function (result) {
    var resource = {
      url: 'https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css',
      algorithms: ['sha256']
    };
    var expect = {
      status: true,
      url: 'https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css',
      type: 'css',
      integrity: 'type:text/css sha256-DW9MX1sLpQ9seN/7+gouAyFj8+xc+lQD6Q9DKWqQDy0=',
      eligibility: []
    };

    before(function (done) {
      helpers.generate(resource, function (data) {
        result = data;
        done();
      });
    });

    it ("css", function () {
      assert.deepEqual(result, expect);
    });
  })();
});
