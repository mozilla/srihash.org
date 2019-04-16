/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const generate = require('../lib/generate');

// Ideally we should find a way to test this without using the network
describe('generate()', () => {
  it('js', (done) => {
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

    generate(resource, (data) => {
      assert.deepEqual(data, expect);
      done();
    });
  });

  it('css', (done) => {
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

    generate(resource, (data) => {
      assert.deepEqual(data, expect);
      done();
    });
  });

  it('404', (done) => {
    const resource = {
      url: 'https://code.jquery.com/jquery-1.11.2-notfound.min.js',
      algorithms: ['sha384']
    };
    const expect = {
      success: false,
      status: 404
    };

    generate(resource, (data) => {
      assert.deepEqual(data, expect);
      done();
    });
  });
});
