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
 * @param {Array} options.algorithms - List of desired hash algorithms
 * @param {string} options.url - Resource URL
 */
const generate = (options, cb) => {
  if (typeof options.algorithms === 'string') {
    options.algorithms = [options.algorithms];
  }

  fetchResource(options.url, (resource) => {
    if (!resource) {
      return cb({
        success: false,
        status: 0
      });
    }

    if (resource.status !== 200) {
      return cb(resource);
    }

    const sri = sriToolbox.generate({
      algorithms: options.algorithms,
      full: true
    }, resource.data);

    const contentType = getResourceTypeFromContentTypeHeader(resource.ct);

    return cb({
      success: true,
      status: resource.status,
      url: resource.url,
      type: guessResourceType({
        url: resource.url,
        ct: contentType
      }),
      integrity: sri.integrity,
      eligibility: resource.eligibility
    });
  });
};

module.exports = generate;
