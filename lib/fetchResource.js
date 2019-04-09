/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const { URL } = require('url');
const zlib = require('zlib');
const moduleForProtocol = require('./moduleForProtocol');
const processResource = require('./processResource');
const upgradeToHttps = require('./upgradeToHttps');

/**
 * Download the resource
 *
 * @param {string} resourceUrl
 * @param {Function} cb - callback
 * @return {Object.XMLHttpRequest} request object
 */
const fetchResource = (resourceUrl, cb) => {
  resourceUrl = upgradeToHttps(resourceUrl);

  if (!resourceUrl) {
    return cb(false);
  }

  const urlObject = new URL(resourceUrl);
  const options = {
    hostname: urlObject.hostname,
    path: urlObject.pathname,
    headers: {
      Origin: 'https://www.srihash.org/'
    }
  };

  moduleForProtocol(resourceUrl).get(options, (response) => {
    let output;
    let data = [];

    if (response.headers['content-encoding'] === 'gzip') {
      const gzip = zlib.createGunzip();

      response.pipe(gzip);
      output = gzip;
    } else {
      output = response;
    }

    output.on('data', (chunk) => {
      data.push(chunk);
    });

    output.on('end', () => {
      data = Buffer.concat(data);
      processResource(data, response, resourceUrl, cb);
    });
  });
};

module.exports = fetchResource;
