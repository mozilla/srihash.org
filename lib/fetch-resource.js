/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const fetch = require('node-fetch');
const processResource = require('./process-resource');
const upgradeToHttps = require('./upgrade-to-https');

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

  fetch(resourceUrl, {
    headers: {
      Origin: 'https://www.srihash.org/'
    }
  })
    .then((response) => {
      response.buffer()
        .then((data) => {
          processResource(data, response, response.url, cb);
        });
    });
};

module.exports = fetchResource;
