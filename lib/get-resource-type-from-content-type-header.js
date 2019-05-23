/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * Figure out what type the content is from a content type header
 *
 * @param {string} headerValue - value of a content-type header
 * @return {string|false} assumed file extension
 */
const getResourceTypeFromContentTypeHeader = (headerValue) => {
  const ctMatch = headerValue.match(/([^/]+\/[^;]+);/);

  if (ctMatch === null) {
    return false;
  }

  return ctMatch[1];
};

module.exports = getResourceTypeFromContentTypeHeader;
