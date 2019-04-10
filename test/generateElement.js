/* Any copyright is dedicated to the Public Domain.
 * https://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

const assert = require('assert').strict;
const generateElement = require('../lib/generateElement');

// Ideally we should find a way to test this without using the network
describe('generateElement()', () => {
  it('non-CORS', async() => {
    const url = 'https://maps.googleapis.com/maps/api/js';
    const expect = 'Error: this resource is not eligible for integrity checks. See https://enable-cors.org/server.html';
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });

  it('css', async() => {
    const url = 'code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css';
    const expect = '<link rel="stylesheet" href="https://code.jquery.com/ui/1.11.3/themes/black-tie/jquery-ui.css" integrity="sha384-w/LBTbFO0P4C3wi1uA2RpBjIEBMRuH15ue80rElDXquOVM6x7Cw3nsOqy7vSBid9" crossorigin="anonymous">';
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });

  it('css (http)', async() => {
    const url = 'http://cdn.ckeditor.com/4.9.2/standard/ckeditor.js';
    const expect = '<script src="http://cdn.ckeditor.com/4.9.2/standard/ckeditor.js" integrity="sha384-5z5Xzy2KLn1l/Q0rWj1TYy+VXyLHqWrwDKCCLG++mTDqiJr4uRbP9f37MKAm4ca8" crossorigin="anonymous"></script>';
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });

  it('js', async() => {
    const url = 'code.jquery.com/jquery-1.11.2.min.js';
    const expect = '<script src="https://code.jquery.com/jquery-1.11.2.min.js" integrity="sha384-Pn+PczAsODRZ2PiGg0IheRROpP7lXO1NTIjiPo6cca8TliBvaeil42fobhzvZd74" crossorigin="anonymous"></script>';
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });

  it('404', async() => {
    const url = 'https://code.jquery.com/jquery-1.11.2-notfound.min.js';
    const expect = 'Error: fetching the resource returned a 404 error code.';
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });

  it('unrecognized content-type', async() => {
    const url = 'https://stackpath.bootstrapcdn.com/twitter-bootstrap/2.0.4/img/glyphicons-halflings.png';
    const expect = `<!-- Warning: Unrecognized content-type. Are you sure this is the right resource? -->
<script src="https://stackpath.bootstrapcdn.com/twitter-bootstrap/2.0.4/img/glyphicons-halflings.png" integrity="sha384-c9lMzzhAB7gpgb7lXNeNoigdEkAKXMNRWTRoSODIc/tNrxSItcZOOSP+xtG2De5i" crossorigin="anonymous"></script>`;
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });

  it('bad scheme', async() => {
    const url = 'ftp://code.jquery.com/jquery-1.11.2.min.js';
    const expect = 'Error: fetching the resource returned an unexpected error.';
    const result = await generateElement(url, 'sha384');

    assert.deepEqual(result, expect);
  });
});
