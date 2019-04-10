/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const url = require('url');
const secureHosts = require('./data/secureHosts');

/**
 * Upgrade the given URL to HTTPS, if it's from a host believed to support it.
 *
 * @param {string} urlString - Input URL
 * @return {string} processed URL
 */
const upgradeToHttps = (urlString) => {
  const isRelative = urlString.startsWith('//');

  // Add a scheme (https:) to scheme-less URLs
  if (isRelative) {
    urlString = `https:${urlString}`;
  }

  // Prepend http for protocol-less URL's
  let urlObject = {};

  try {
    urlObject = new URL(urlString);
  } catch (error) {
    urlObject = new URL(`http:${urlString}`);
  }

  if (!urlObject.protocol && !isRelative) {
    urlObject.protocol = 'http:';
  }

  // Upgrade http protocol to https, if host is on the secureHosts list
  if (urlObject.protocol === 'http:' && secureHosts.includes(urlObject.hostname)) {
    urlObject.protocol = 'https:';
  }

  // If after all of this we don't end up with a supported URL, bail
  if (urlObject.protocol !== 'https:' && urlObject.protocol !== 'http:') {
    return false;
  }

  return url.format(urlObject);
};

module.exports = upgradeToHttps;
