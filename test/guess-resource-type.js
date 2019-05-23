/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const guessResourceType = require('../lib/guess-resource-type');

describe('guessResourceType()', () => {
  describe('Matching', () => {
    describe('Content-type', () => {
      it('js', () => {
        const jsCt1 = guessResourceType({ ct: 'text/javascript' });
        const jsCt2 = guessResourceType({ ct: 'application/javascript' });
        const jsCt3 = guessResourceType({ ct: 'application/x-javascript' });

        assert.deepEqual(jsCt1, 'js');
        assert.deepEqual(jsCt2, 'js');
        assert.deepEqual(jsCt3, 'js');
      });

      it('css', () => {
        const cssCt1 = guessResourceType({ ct: 'text/css' });

        assert.deepEqual(cssCt1, 'css');
      });

      it('.forbidden', () => {
        const forbiddenCt1 = guessResourceType({ ct: 'text/plain' });
        const forbiddenCt2 = guessResourceType({ ct: 'text/xml' });
        const forbiddenCt3 = guessResourceType({ ct: 'application/octet-stream' });
        const forbiddenCt4 = guessResourceType({ ct: 'application/xml' });

        assert.deepEqual(forbiddenCt1, '.forbidden');
        assert.deepEqual(forbiddenCt2, '.forbidden');
        assert.deepEqual(forbiddenCt3, '.forbidden');
        assert.deepEqual(forbiddenCt4, '.forbidden');
      });
    });

    describe('Extension', () => {
      it('js', () => {
        const jsUrl1 = guessResourceType({ url: 'https://example.com/file.min.js' });

        assert.deepEqual(jsUrl1, 'js');
      });

      it('css', () => {
        const cssUrl1 = guessResourceType({ url: 'http://example.com/file.css' });
        const cssUrl2 = guessResourceType({ url: 'http://example.com/STYLES.CSS' });

        assert.deepEqual(cssUrl1, 'css');
        assert.deepEqual(cssUrl2, 'css');
      });

      it('URL parameters', () => {
        const urlWithQuery = guessResourceType({ url: 'http://example.com/file.css?v=1.0.2' });
        const urlWithHash = guessResourceType({ url: 'http://example.com/file.css#v=1.0.2' });

        assert.deepEqual(urlWithQuery, 'css');
        assert.deepEqual(urlWithHash, 'css');
      });

      // The internal label ".forbidden" must never be detected as a file ext
      it('NOT .forbidden', () => {
        const forbiddenUrl1 = guessResourceType({ url: 'http://example.com/file.forbidden' });
        const forbiddenUrl2 = guessResourceType({ url: 'http://example.com/file..forbidden' });

        assert.deepEqual(forbiddenUrl1, null);
        assert.deepEqual(forbiddenUrl2, null);
      });
    });
  });

  describe('Fallback', () => {
    it('Invalid content-type', () => {
      const pdfCt1 = guessResourceType({
        ct: 'invalid/type',
        url: 'http://example.com'
      });

      assert.deepEqual(pdfCt1, null);
    });

    it('Invalid extension', () => {
      const jsUrl2 = guessResourceType({ url: 'https://example.com/file.ZZZ' });

      assert.deepEqual(jsUrl2, null);
    });

    it('Missing extension', () => {
      const jsUrl3 = guessResourceType({ url: 'https://example.com/file' });

      assert.deepEqual(jsUrl3, null);
    });

    it('Empty path', () => {
      const jsUrl4 = guessResourceType({ url: 'https://example.com' });

      assert.deepEqual(jsUrl4, null);
    });
  });

  describe('Match precedence', () => {
    it('Content-type over extension', () => {
      const cssUrl2 = guessResourceType({
        ct: 'text/css',
        url: 'https://example.com/file.min.js'
      });

      assert.deepEqual(cssUrl2, 'css');
    });
  });
});
