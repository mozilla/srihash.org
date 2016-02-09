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

  describe('Invalid URLs', function () {
    it('Invalid scheme', function () {
      var ftpScheme = helpers.upgradeToHttps('ftp://example.com/script.js');
      assert.strictEqual(ftpScheme, false);
    });

    it('Bare hostname', function () {
      var bareHostname = helpers.upgradeToHttps('foobar');
      assert.equal(bareHostname, 'http://foobar/');
    });
  });
});

describe('eligibility()', function () {
  describe('Eligible', function () {
    it('CORS', function () {
      var allGood = new FauxXHR({ headers: { 'access-control-allow-origin': '*' } });
      var result = helpers.eligibility(allGood);
      assert.deepEqual(result, []);
    });
  });

  describe('Non-eligible', function () {
    it('non-CORS', function () {
      var nonCORS = new FauxXHR({ headers: { 'dnt': '1' } });
      var result = helpers.eligibility(nonCORS);
      assert.deepEqual(result, ['non-cors']);
    });
  });
});

describe('shuffleArray()', function () {
  describe('Array Shuffling', function () {
    it('preserves length', function () {
      var a = [ 'a', 'b', 'c', 'd' ] ;
      var result = helpers.shuffleArray(a);
      assert.equal(result.length, a.length);
    });

    it('returns all elements', function () {
      var a = [ 'a', 'b' ] ;
      var result = helpers.shuffleArray(a);
      assert.strictEqual(result[0] === 'a' || result[1] === 'a', true);
      assert.strictEqual(result[0] === 'b' || result[1] === 'b', true);
    });

    it('clones the array', function () {
      var a = [ 'a' ] ;
      var result = helpers.shuffleArray(a);
      a[0] = 'b';
      assert.strictEqual(result[0], 'a');
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

      it('.forbidden', function () {
        var forbiddenCt1 = helpers.guessResourceType({ ct: 'text/plain' });
        assert.deepEqual(forbiddenCt1, '.forbidden');
        var forbiddenCt2 = helpers.guessResourceType({ ct: 'text/xml' });
        assert.deepEqual(forbiddenCt2, '.forbidden');
        var forbiddenCt3 = helpers.guessResourceType({ ct: 'application/octet-stream' });
        assert.deepEqual(forbiddenCt3, '.forbidden');
        var forbiddenCt4 = helpers.guessResourceType({ ct: 'application/xml' });
        assert.deepEqual(forbiddenCt4, '.forbidden');
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

      it('URL parameters', function () {
        var urlWithQuery = helpers.guessResourceType({ url: 'http://example.com/file.css?v=1.0.2' });
        assert.deepEqual(urlWithQuery, 'css');
        var urlWithHash = helpers.guessResourceType({ url: 'http://example.com/file.css#v=1.0.2' });
        assert.deepEqual(urlWithHash, 'css');
      });

      // The internal label ".forbidden" must never be detected as a file ext
      it('NOT .forbidden', function () {
        var forbiddenUrl1 = helpers.guessResourceType({ url: 'http://example.com/file.forbidden' });
        assert.deepEqual(forbiddenUrl1, null);
        var forbiddenUrl2 = helpers.guessResourceType({ url: 'http://example.com/file..forbidden' });
        assert.deepEqual(forbiddenUrl2, null);
      });
    });
  });

  describe('Fallback', function () {
    it('Invalid content-type', function () {
      var pdfCt1 = helpers.guessResourceType({ ct: 'invalid/type', url:'http://example.com' });
      assert.deepEqual(pdfCt1, null);
    });

    it('Invalid extension', function () {
      var jsUrl2 = helpers.guessResourceType({ url: 'https://example.com/file.ZZZ' });
      assert.deepEqual(jsUrl2, null);
    });

    it('Missing extension', function () {
      var jsUrl3 = helpers.guessResourceType({ url: 'https://example.com/file' });
      assert.deepEqual(jsUrl3, null);
    });

    it('Empty path', function () {
      var jsUrl4 = helpers.guessResourceType({ url: 'https://example.com' });
      assert.deepEqual(jsUrl4, null);
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
      algorithms: ['sha384']
    };
    var expect = {
      success: true,
      status: 200,
      url: 'https://code.jquery.com/jquery-1.11.2.min.js',
      type: 'js',
      integrity: 'sha384-Pn+PczAsODRZ2PiGg0IheRROpP7lXO1NTIjiPo6cca8TliBvaeil42fobhzvZd74',
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
      algorithms: ['sha384']
    };
    var expect = {
      success: true,
      status: 200,
      url: 'https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css',
      type: 'css',
      integrity: 'sha384-w/LBTbFO0P4C3wi1uA2RpBjIEBMRuH15ue80rElDXquOVM6x7Cw3nsOqy7vSBid9',
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

  (function (result) {
    var resource = {
      url: 'https://code.jquery.com/jquery-1.11.2-notfound.min.js',
      algorithms: ['sha384']
    };
    var expect = {
      success: false,
      status: 404
    };

    before(function (done) {
      helpers.generate(resource, function (data) {
        result = data;
        done();
      });
    });

    it ("404", function () {
      assert.deepEqual(result, expect);
    });
  })();
});


// Ideally we should find a way to test this without using the network
describe ("generateElement()", function () {
  (function (result) {
    var url = 'https://www.google-analytics.com/ga.js';
    var expect = 'Error: this resource is not eligible for integrity checks. See http://enable-cors.org/server.html';

    before(function (done) {
      helpers.generateElement(url, 'sha384', function (data) {
        result = data;
        done();
      });
    });

    it ("non-CORS", function () {
      assert.deepEqual(result, expect);
    });
  })();

  (function (result) {
    var url = 'code.jquery.com/jquery-1.11.2.min.js';
    var expect = '<script src="https://code.jquery.com/jquery-1.11.2.min.js" integrity="sha384-Pn+PczAsODRZ2PiGg0IheRROpP7lXO1NTIjiPo6cca8TliBvaeil42fobhzvZd74" crossorigin="anonymous"></script>';

    before(function (done) {
      helpers.generateElement(url, 'sha384', function (data) {
        result = data;
        done();
      });
    });

    it ("js", function () {
      assert.deepEqual(result, expect);
    });
  })();

  (function (result) {
    var url = 'https://code.jquery.com/jquery-1.11.2-notfound.min.js';
    var expect = 'Error: fetching the resource returned a 404 error code.';

    before(function (done) {
      helpers.generateElement(url, 'sha384', function (data) {
        result = data;
        done();
      });
    });

    it ("404", function () {
      assert.deepEqual(result, expect);
    });
  })();

  (function (result) {
    var url = 'ftp://code.jquery.com/jquery-1.11.2.min.js';
    var expect = 'Error: fetching the resource returned an unexpected error.';

    before(function (done) {
      helpers.generateElement(url, 'sha384', function (data) {
        result = data;
        done();
      });
    });

    it ("bad scheme", function () {
      assert.deepEqual(result, expect);
    });
  })();
});
