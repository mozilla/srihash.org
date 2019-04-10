/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const upgradeToHttps = require('../lib/upgradeToHttps');

describe('upgradeToHttps()', () => {
  describe('CDNs', () => {
    it('Known', () => {
      const knownHttpsUrl = upgradeToHttps('https://code.jquery.com/script.js');
      const knownHttpUrl = upgradeToHttps('http://code.jquery.com/script.js');

      assert.equal(knownHttpsUrl, 'https://code.jquery.com/script.js');
      assert.equal(knownHttpUrl, 'https://code.jquery.com/script.js');
    });

    it('Unknown', () => {
      const unknownHttpsUrl = upgradeToHttps('https://example.com/script.js');
      const unknownHttpUrl = upgradeToHttps('http://example.com/script.js');

      assert.equal(unknownHttpsUrl, 'https://example.com/script.js');
      assert.equal(unknownHttpUrl, 'http://example.com/script.js');
    });
  });

  describe('URLs', () => {
    it('Schemeless', () => {
      const schemelessUnknownUrl = upgradeToHttps('example.com/script.js');
      const schemelessKnownUrl = upgradeToHttps('code.jquery.com/script.js');

      assert.equal(schemelessUnknownUrl, 'http://example.com/script.js');
      assert.equal(schemelessKnownUrl, 'https://code.jquery.com/script.js');
    });

    it('Relative', () => {
      const relativeUnknownUrl = upgradeToHttps('//example.com/script.js');
      const relativeKnownUrl = upgradeToHttps('//code.jquery.com/script.js');

      assert.equal(relativeUnknownUrl, 'https://example.com/script.js');
      assert.equal(relativeKnownUrl, 'https://code.jquery.com/script.js');
    });
  });

  describe('Invalid URLs', () => {
    it('Invalid scheme', () => {
      const ftpScheme = upgradeToHttps('ftp://example.com/script.js');

      assert.equal(ftpScheme, false);
    });

    it('Bare hostname', () => {
      const bareHostname = upgradeToHttps('foobar.com');

      assert.equal(bareHostname, 'http://foobar.com/');
    });
  });
});
