/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const sriToolbox = require('sri-toolbox');
const guessResourceType = require('./guess-resource-type');
const getResourceTypeFromContentTypeHeader = require('./get-resource-type-from-content-type-header');
const fetchResource = require('./fetch-resource');

/**
 * Generate SRI data for a resource
 *
 * @param {Object} options - Options Object
 * @param {string|Array} options.algorithms - Desired hash algorithm(s)
 * @param {string} options.url - Resource URL
 * @return {Promise}
 */
const generate = (options) => {
  return new Promise((resolve) => {
    if (typeof options.algorithms === 'string') {
      options.algorithms = [options.algorithms];
    }

    fetchResource(options.url, (resource) => {
      if (!resource) {
        return resolve({
          success: false,
          status: 0
        });
      }

      if (resource.status !== 200) {
        return resolve(resource);
      }

      const sri = sriToolbox.generate({
        algorithms: options.algorithms,
        full: true
      }, resource.data);

      const contentType = getResourceTypeFromContentTypeHeader(resource.ct);

      return resolve({
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
  });
};

module.exports = generate;
