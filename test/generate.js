/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const generate = require('../lib/generate');

// Ideally we should find a way to test this without using the network
describe('generate()', () => {
  it('js', async() => {
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
    const result = await generate(resource);

    assert.deepEqual(result, expect);
  });

  it('redirect', async() => {
    // https://bit.ly/2JZNTBH is redirected to https://code.jquery.com/jquery-1.11.2.min.js
    const resource = {
      url: 'https://bit.ly/2JZNTBH',
      algorithms: ['sha384']
    };

    const resourceWithoutRedirect = {
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
    const result = await generate(resource);
    const resultWithoutRedirect = await generate(resourceWithoutRedirect);

    assert.deepEqual(result, expect);
    assert.deepEqual(result.integrity, resultWithoutRedirect.integrity);
  });

  it('multi redirect', async() => {
    /**
     * https://bit.ly/2X6ThH3 is redirected to https://gitcdn.xyz/repo/mozilla/srihash.org/master/index.js
     * which is redirect to https://gitcdn.xyz/cdn/mozilla/srihash.org/e6a30b7403defe47af01a86e03a83c11b8a73786/index.js
     */
    const resource = {
      url: 'https://bit.ly/2X6ThH3',
      algorithms: ['sha384']
    };

    const resourceWithoutRedirect = {
      url: 'https://gitcdn.xyz/cdn/mozilla/srihash.org/e6a30b7403defe47af01a86e03a83c11b8a73786/index.js',
      algorithms: ['sha384']
    };

    const expect = {
      success: true,
      status: 200,
      url: 'https://gitcdn.xyz/cdn/mozilla/srihash.org/e6a30b7403defe47af01a86e03a83c11b8a73786/index.js',
      type: 'js',
      integrity: 'sha384-6ZfLLCEAJcSxt9bD8PaRKJhpgbSPZj9GUFuGSikIgVaBpaQWpkXkwyu63GHVA3sp',
      eligibility: []
    };
    const result = await generate(resource);
    const resultWithoutRedirect = await generate(resourceWithoutRedirect);

    assert.deepEqual(result, expect);
    assert.deepEqual(result.integrity, resultWithoutRedirect.integrity);
  });

  it('css', async() => {
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
    const result = await generate(resource);

    assert.deepEqual(result, expect);
  });

  it('404', async() => {
    const resource = {
      url: 'https://code.jquery.com/jquery-1.11.2-notfound.min.js',
      algorithms: ['sha384']
    };
    const expect = {
      success: false,
      status: 404
    };
    const result = await generate(resource);

    assert.deepEqual(result, expect);
  });
});
