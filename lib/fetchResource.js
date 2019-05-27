/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const zlib = require('zlib');
const moduleForProtocol = require('./moduleForProtocol');
const processResource = require('./processResource');
const upgradeToHttps = require('./upgradeToHttps');

const getHttpOptions = (url) => {
  const urlObject = new URL(url);

  return {
    hostname: urlObject.hostname,
    path: urlObject.pathname,
    headers: {
      Origin: 'https://www.srihash.org/'
    }
  };
};

const get = (url, options, initialResolve) => new Promise((resolve) => {
  moduleForProtocol(url).get(options, (response) => {
    const responseLocation = response.headers.location;

    if (response.statusCode >= 300 && response.statusCode <= 308 && responseLocation) {
      return get(responseLocation, getHttpOptions(responseLocation), initialResolve ? initialResolve : resolve);
    }

    if (initialResolve) {
      initialResolve({ response, url });
    } else {
      resolve({ response, url });
    }
  });
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

  get(resourceUrl, getHttpOptions(resourceUrl), null)
    .then(({ response, url }) => {
      handleResponse(response, url);
    });
};

module.exports = fetchResource;
