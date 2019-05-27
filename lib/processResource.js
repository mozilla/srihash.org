/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const eligibility = require('./eligibility');

/**
 * Handle server response.
 *
 * @param {string} data
 * @param {Object} response
 * @param {string} resourceUrl - Resource URL
 * @param {Function} cb - callback
 * @return {Function.cb}
 */
const processResource = (data, response, resourceUrl, cb) => {
  if (response.statusCode !== 200) {
    return cb({
      success: false,
      status: response.statusCode
    });
  }

  return cb({
    success: true,
    status: response.statusCode,
    url: resourceUrl,
    eligibility: eligibility(response),
    data,
    ct: response.headers['content-type']
  });
};

module.exports = processResource;
