/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const sriToolbox = require('sri-toolbox');
const guessResourceType = require('./guessResourceType');
const getResourceTypeFromContentTypeHeader = require('./getResourceTypeFromContentTypeHeader');
const fetchResource = require('./fetchResource');

/**
 * Generate SRI data for a resource
 *
 * @param {Object} options - Options Object
 * @param {string|Array} options.algorithms - Desired hash algorithm(s)
 * @param {string} options.url - Resource URL
 * @return {Promise}
 */
const generate = async(options) => {
  if (!Array.isArray(options.algorithms)) {
    options.algorithms = [options.algorithms];
  }

  const resource = await fetchResource(options.url);

  if (!resource) {
    return {
      success: false,
      status: 0
    };
  }

  if (resource.status !== 200) {
    return resource;
  }

  const sri = sriToolbox.generate({
    algorithms: options.algorithms,
    full: true
  }, resource.data);

  const contentType = getResourceTypeFromContentTypeHeader(resource.ct);

  return {
    success: true,
    status: resource.status,
    url: resource.url,
    type: guessResourceType({
      url: resource.url,
      ct: contentType
    }),
    integrity: sri.integrity,
    eligibility: resource.eligibility
  };
};

module.exports = generate;
