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
 * @return {Object.XMLHttpRequest}
 */
const processResource = (data, response, resourceUrl) => {
  if (response.status !== 200) {
    return {
      success: false,
      status: response.status
    };
  }

  return {
    success: true,
    status: response.status,
    url: resourceUrl,
    eligibility: eligibility(response),
    data,
    ct: response.headers.get('content-type')
  };
};

module.exports = processResource;
