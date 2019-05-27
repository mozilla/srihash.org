/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const http = require('http');
const https = require('https');

/**
 * Choose corresponding module (http or https) for downloading a resource.
 *
 * @param {string} urlString - Input URL
 * @return {Object} http or https module
 */
const moduleForProtocol = (urlString) => {
  const urlObject = new URL(urlString);

  if (!urlObject.protocol) {
    return false;
  }

  if (urlObject.protocol === 'https:') {
    return https;
  }

  if (urlObject.protocol === 'http:') {
    return http;
  }
};

module.exports = moduleForProtocol;
