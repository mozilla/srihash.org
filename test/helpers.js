/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

/* eslint-env mocha */

'use strict';

const assert = require('assert');
const helpers = require('../lib/helpers.js');

describe('upgradeToHttps()', () => {
  describe('CDNs', () => {
    it('Known', () => {
      const knownHttpsUrl = helpers.upgradeToHttps('https://code.jquery.com/script.js');
      assert.strictEqual(knownHttpsUrl, 'https://code.jquery.com/script.js');
      const knownHttpUrl = helpers.upgradeToHttps('http://code.jquery.com/script.js');
      assert.strictEqual(knownHttpUrl, 'https://code.jquery.com/script.js');
    });

    it('Unknown', () => {
      const unknownHttpsUrl = helpers.upgradeToHttps('https://example.com/script.js');
      assert.strictEqual(unknownHttpsUrl, 'https://example.com/script.js');
      const unknownHttpUrl = helpers.upgradeToHttps('http://example.com/script.js');
      assert.strictEqual(unknownHttpUrl, 'http://example.com/script.js');
    });
  });

  describe('URLs', () => {
    it('Schemeless', () => {
      const schemelessUnknownUrl = helpers.upgradeToHttps('example.com/script.js');
      assert.strictEqual(schemelessUnknownUrl, 'http://example.com/script.js');
      const schemelessKnownUrl = helpers.upgradeToHttps('code.jquery.com/script.js');
      assert.strictEqual(schemelessKnownUrl, 'https://code.jquery.com/script.js');
    });

    it('Relative', () => {
      const relativeUnknownUrl = helpers.upgradeToHttps('//example.com/script.js');
      assert.strictEqual(relativeUnknownUrl, 'https://example.com/script.js');
      const relativeKnownUrl = helpers.upgradeToHttps('//code.jquery.com/script.js');
      assert.strictEqual(relativeKnownUrl, 'https://code.jquery.com/script.js');
    });
  });

  describe('Invalid URLs', () => {
    it('Invalid scheme', () => {
      const ftpScheme = helpers.upgradeToHttps('ftp://example.com/script.js');
      assert.strictEqual(ftpScheme, false);
    });

    it('Bare hostname', () => {
      const bareHostname = helpers.upgradeToHttps('foobar');
      assert.strictEqual(bareHostname, 'http://foobar/');
    });
  });
});

describe('eligibility()', () => {
  describe('Eligible', () => {
    it('CORS', () => {
      const allGood = { headers: { 'access-control-allow-origin': '*' } };
      const result = helpers.eligibility(allGood);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('Non-eligible', () => {
    it('non-CORS', () => {
      const nonCORS = { headers: { dnt: '1' } };
      const result = helpers.eligibility(nonCORS);
      assert.deepStrictEqual(result, ['non-cors']);
    });
  });
});

describe('shuffleArray()', () => {
  describe('Array Shuffling', () => {
    it('preserves length', () => {
      const a = ['a', 'b', 'c', 'd'];
      const result = helpers.shuffleArray(a);
      assert.strictEqual(result.length, a.length);
    });

    it('returns all elements', () => {
      const a = ['a', 'b'];
      const result = helpers.shuffleArray(a);
      assert.strictEqual(result[0] === 'a' || result[1] === 'a', true);
      assert.strictEqual(result[0] === 'b' || result[1] === 'b', true);
    });

    it('clones the array', () => {
      const a = ['a'];
      const result = helpers.shuffleArray(a);
      a[0] = 'b';
      assert.strictEqual(result[0], 'a');
    });
  });
});

describe('guessResourceType()', () => {
  describe('Matching', () => {
    describe('Content-type', () => {
      it('js', () => {
        const jsCt1 = helpers.guessResourceType({ ct: 'text/javascript' });
        assert.strictEqual(jsCt1, 'js');
        const jsCt2 = helpers.guessResourceType({ ct: 'application/javascript' });
        assert.strictEqual(jsCt2, 'js');
        const jsCt3 = helpers.guessResourceType({ ct: 'application/x-javascript' });
        assert.strictEqual(jsCt3, 'js');
      });

      it('css', () => {
        const cssCt1 = helpers.guessResourceType({ ct: 'text/css' });
        assert.strictEqual(cssCt1, 'css');
      });

      it('.forbidden', () => {
        const forbiddenCt1 = helpers.guessResourceType({ ct: 'text/plain' });
        assert.strictEqual(forbiddenCt1, '.forbidden');
        const forbiddenCt2 = helpers.guessResourceType({ ct: 'text/xml' });
        assert.strictEqual(forbiddenCt2, '.forbidden');
        const forbiddenCt3 = helpers.guessResourceType({ ct: 'application/octet-stream' });
        assert.strictEqual(forbiddenCt3, '.forbidden');
        const forbiddenCt4 = helpers.guessResourceType({ ct: 'application/xml' });
        assert.strictEqual(forbiddenCt4, '.forbidden');
      });
    });

    describe('Extension', () => {
      it('js', () => {
        const jsUrl1 = helpers.guessResourceType({ url: 'https://example.com/file.min.js' });
        assert.strictEqual(jsUrl1, 'js');
      });

      it('css', () => {
        const cssUrl1 = helpers.guessResourceType({ url: 'http://example.com/file.css' });
        assert.strictEqual(cssUrl1, 'css');
        const cssUrl2 = helpers.guessResourceType({ url: 'http://example.com/STYLES.CSS' });
        assert.strictEqual(cssUrl2, 'css');
      });

      it('URL parameters', () => {
        const urlWithQuery = helpers.guessResourceType({ url: 'http://example.com/file.css?v=1.0.2' });
        assert.strictEqual(urlWithQuery, 'css');
        const urlWithHash = helpers.guessResourceType({ url: 'http://example.com/file.css#v=1.0.2' });
        assert.strictEqual(urlWithHash, 'css');
      });

      // The internal label ".forbidden" must never be detected as a file ext
      it('NOT .forbidden', () => {
        const forbiddenUrl1 = helpers.guessResourceType({ url: 'http://example.com/file.forbidden' });
        assert.strictEqual(forbiddenUrl1, null);
        const forbiddenUrl2 = helpers.guessResourceType({ url: 'http://example.com/file..forbidden' });
        assert.strictEqual(forbiddenUrl2, null);
      });
    });
  });

  describe('Fallback', () => {
    it('Invalid content-type', () => {
      const pdfCt1 = helpers.guessResourceType({
        ct: 'invalid/type',
        url: 'http://example.com'
      });
      assert.strictEqual(pdfCt1, null);
    });

    it('Invalid extension', () => {
      const jsUrl2 = helpers.guessResourceType({ url: 'https://example.com/file.ZZZ' });
      assert.strictEqual(jsUrl2, null);
    });

    it('Missing extension', () => {
      const jsUrl3 = helpers.guessResourceType({ url: 'https://example.com/file' });
      assert.strictEqual(jsUrl3, null);
    });

    it('Empty path', () => {
      const jsUrl4 = helpers.guessResourceType({ url: 'https://example.com' });
      assert.strictEqual(jsUrl4, null);
    });
  });

  describe('Match precedence', () => {
    it('Content-type over extension', () => {
      const cssUrl2 = helpers.guessResourceType({
        ct: 'text/css',
        url: 'https://example.com/file.min.js'
      });
      assert.strictEqual(cssUrl2, 'css');
    });
  });
});

// Ideally we should find a way to test this without using the network
describe('generate()', () => {
  ((result) => {
    const resource = {
      url: 'https://code.jquery.com/jquery-1.11.2.min.js',
      algorithms: ['sha384']
    };
    const expect = {
      success: true,
      status: 200,
      url: 'https://code.jquery.com/jquery-1.11.2.min.js',
      type: 'js',
      integrity: 'sha384-Pn+PczAsODRZ2PiGg0IheRROpP7lXO1NTIjiPo6cca8TliBvaeil42fobhzvZd74',
      eligibility: []
    };

    before((done) => {
      helpers.generate(resource, (data) => {
        result = data;
        done();
      });
    });

    it('js', () => {
      assert.deepStrictEqual(result, expect);
    });
  })();

  ((result) => {
    const resource = {
      url: 'https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css',
      algorithms: ['sha384']
    };
    const expect = {
      success: true,
      status: 200,
      url: 'https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css',
      type: 'css',
      integrity: 'sha384-w/LBTbFO0P4C3wi1uA2RpBjIEBMRuH15ue80rElDXquOVM6x7Cw3nsOqy7vSBid9',
      eligibility: []
    };

    before((done) => {
      helpers.generate(resource, (data) => {
        result = data;
        done();
      });
    });

    it('css', () => {
      assert.deepStrictEqual(result, expect);
    });
  })();

  ((result) => {
    const resource = {
      url: 'https://code.jquery.com/jquery-1.11.2-notfound.min.js',
      algorithms: ['sha384']
    };
    const expect = {
      success: false,
      status: 404
    };

    before((done) => {
      helpers.generate(resource, (data) => {
        result = data;
        done();
      });
    });

    it('404', () => {
      assert.deepStrictEqual(result, expect);
    });
  })();
});

// Ideally we should find a way to test this without using the network
describe('generateElement()', () => {
  ((result) => {
    const url = 'https://www.google-analytics.com/ga.js';
    const expect = 'Error: this resource is not eligible for integrity checks. See https://enable-cors.org/server.html';

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('non-CORS', () => {
      assert.strictEqual(result, expect);
    });
  })();

  ((result) => {
    const url = 'code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css';
    const expect = '<link rel="stylesheet" href="https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css" integrity="sha384-w/LBTbFO0P4C3wi1uA2RpBjIEBMRuH15ue80rElDXquOVM6x7Cw3nsOqy7vSBid9" crossorigin="anonymous">';

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('css', () => {
      assert.strictEqual(result, expect);
    });
  })();

  ((result) => {
    const url = 'http://cdn.ckeditor.com/4.9.2/standard/ckeditor.js';
    const expect = '<script src="http://cdn.ckeditor.com/4.9.2/standard/ckeditor.js" integrity="sha384-5z5Xzy2KLn1l/Q0rWj1TYy+VXyLHqWrwDKCCLG++mTDqiJr4uRbP9f37MKAm4ca8" crossorigin="anonymous"></script>';

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('css (http)', () => {
      assert.strictEqual(result, expect);
    });
  })();

  ((result) => {
    const url = 'code.jquery.com/jquery-1.11.2.min.js';
    const expect = '<script src="https://code.jquery.com/jquery-1.11.2.min.js" integrity="sha384-Pn+PczAsODRZ2PiGg0IheRROpP7lXO1NTIjiPo6cca8TliBvaeil42fobhzvZd74" crossorigin="anonymous"></script>';

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('js', () => {
      assert.strictEqual(result, expect);
    });
  })();

  ((result) => {
    const url = 'https://code.jquery.com/jquery-1.11.2-notfound.min.js';
    const expect = 'Error: fetching the resource returned a 404 error code.';

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('404', () => {
      assert.strictEqual(result, expect);
    });
  })();

  ((result) => {
    const url = 'https://stackpath.bootstrapcdn.com/twitter-bootstrap/2.0.4/img/glyphicons-halflings.png';
    const expect = `<!-- Warning: Unrecognized content-type. Are you sure this is the right resource? -->
<script src="https://stackpath.bootstrapcdn.com/twitter-bootstrap/2.0.4/img/glyphicons-halflings.png" integrity="sha384-c9lMzzhAB7gpgb7lXNeNoigdEkAKXMNRWTRoSODIc/tNrxSItcZOOSP+xtG2De5i" crossorigin="anonymous"></script>`;

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('unrecognized content-type', () => {
      assert.strictEqual(result, expect);
    });
  })();

  ((result) => {
    const url = 'ftp://code.jquery.com/jquery-1.11.2.min.js';
    const expect = 'Error: fetching the resource returned an unexpected error.';

    before((done) => {
      helpers.generateElement(url, 'sha384', (data) => {
        result = data;
        done();
      });
    });

    it('bad scheme', () => {
      assert.strictEqual(result, expect);
    });
  })();
});
