/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var crypto = require('crypto');

/** 
 * Upgrade the given URL to HTTPS if it's using the HTTP scheme and
 * it's from a CDN known to serve files over HTTPS.
 */
function upgradeToHttps(url) {
  // TODO
  return url;
}

/**
 * Check the headers to see whether or not the resource will be
 * eligible for SRI checks.
 */
function isEligible(headers) {
  // TODO
  return true;
}
  
/**
 * Download the resource and examine the response headers.
 */
function fetchUrl(url) {
  url = upgradeToHttps(url);
  
  // TODO
  var response = {
    data: 'TODO',
    headers: {
      'content-type': 'application/javascript'
    }
  };
  
  return {
    eligible: isEligible(response.headers),
    data: response.data,
    ct: response.headers['content-type']
  }
}

/**
 * Hash the given string using the given algorithm and encode the
 * resulting hash using the base64url encoding.
 */
function hashString(string, algorithm) {
  var hash = crypto.createHash(algorithm.replace('sha-', 'sha'));
  hash.update(string);
  return hash.digest('base64')
    .replace('+', '-')
    .replace('/', '_')
    .replace(/=*$/g, '');
}

module.exports.generateElement = function (url, algorithm) {
  url = 'https://code.jquery.com/jquery-2.1.3.js';
  var resource = fetchUrl(url);

  if (resource.eligible) {
    var hash = hashString(resource.data, algorithm);
    return '<script src="' + url + '" integrity="ni:///'
      + algorithm + ';' + hash + '?ct=' + resource.ct + '"></script>';
  } else {
    return '';
  }
};
