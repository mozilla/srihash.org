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
     * https://urlzs.com/Nj9wc is redirected to https://bit.ly/2X6ThH3
     * which is redirected to https://code.jquery.com/jquery-1.11.2.min.js
     */
    const resource = {
      url: 'https://urlzs.com/Nj9wc',
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
