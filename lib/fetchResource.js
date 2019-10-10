/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const fetch = require('node-fetch');
const processResource = require('./processResource');
const upgradeToHttps = require('./upgradeToHttps');

/**
 * Download the resource
 *
 * @param {string} resourceUrl - The URL to fetch
 * @return {Object.XMLHttpRequest} request object
 */
const fetchResource = async(resourceUrl) => {
  resourceUrl = upgradeToHttps(resourceUrl);

  if (!resourceUrl) {
    return false;
  }

  const response = await fetch(resourceUrl, {
    headers: {
      Origin: 'https://www.srihash.org/'
    }
  });

  const data = await response.buffer();

  return processResource(data, response, response.url);
};

module.exports = fetchResource;
