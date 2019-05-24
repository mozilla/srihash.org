/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const zlib = require('zlib');
const moduleForProtocol = require('./moduleForProtocol');
const processResource = require('./processResource');
const upgradeToHttps = require('./upgradeToHttps');

const get = (url, options) => new Promise((resolve) => {
  moduleForProtocol(url).get(options, (response) => resolve(response));
});

/**
 * Download the resource
 *
 * @param {string} resourceUrl - The URL to fetch
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

  const handleResponse = (response, url) => {
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
      processResource(data, response, url, cb);
    });
  };

  get(resourceUrl, options)
    .then((response) => {
      if (response.statusCode >= 300 && response.statusCode <= 308 && response.headers.location) {
        const urlRedirectionObject = new URL(response.headers.location);

        get(response.headers.location, {
          hostname: urlRedirectionObject.hostname,
          path: urlRedirectionObject.pathname,
          headers: {
            Origin: 'https://www.srihash.org/'
          }
        })
          .then((redirectionResponse) => handleResponse(redirectionResponse, response.headers.location));

        return;
      }

      handleResponse(response, resourceUrl);
    });
};

module.exports = fetchResource;
