/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const path = require('path');
const resourceTypes = require('./data/resourceTypes');

/**
 * Figure out what type of resource the user is requesting.
 *
 * @param {Object} resource - resource object
 * @param {string} resource.ct - content-type
 * @param {string} resource.url - URL
 * @return {string} assumed file extension
 */
const guessResourceType = (resource) => {
  if (resource.ct !== false) {
    // Match against content-types
    const type = Object.keys(resourceTypes).filter((ext) => {
      return resourceTypes[ext].includes(resource.ct);
    });

    if (type[0]) {
      return type[0];
    }
  }

  // Match against file extensions
  const ext = path.extname(new URL(resource.url).pathname)
    .replace('.', '')
    .toLowerCase();

  if (Object.prototype.hasOwnProperty.call(resourceTypes, ext)) {
    return ext;
  }

  // Unrecognized type
  return null;
};

module.exports = guessResourceType;
