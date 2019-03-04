/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const path = require('path');
const url = require('url');
const http = require('http');
const https = require('https');
const zlib = require('zlib');
const sriToolbox = require('sri-toolbox');

const resourceTypes = require('./resourceTypes.json');
const secureHosts = require('./secureHosts.json');

/**
 * Upgrade the given URL to HTTPS, if it's from a host believed to support it.
 *
 * @param {string} urlString
 * @return {string} processed URL
 */
const upgradeToHttps = (urlString) => {
  // Prepend http for protocol-less URL's
  const urlObject = url.parse(urlString);

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

/**
 * Choose corresponding module (http or https) for downloading a resource.
 *
 * @param {string} urlString
 * @return {Object} http or https module
 */
const moduleForProtocol = (urlString) => {
  const urlObject = url.parse(urlString);

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

/**
 * Check XHR response headers for issues that could affect SRI eligibility
 *
 * @param {Object.XMLHttpRequest} response request
 * @return {Array} list of potential issues
 */
const eligibility = (response) => {
  const issues = [];
  const acao = response.headers['access-control-allow-origin'];

  if (!acao) {
    issues.push('non-cors');
  }

  return issues;
};

/**
 * Handle server response.
 *
 * @param {string} data
 * @param {Object} response
 * @param {string} resourceUrl
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

/**
 * Download the resource
 *
 * @param {string} resourceUrl
 * @param {Function} cb - callback
 * @return {Object.XMLHttpRequest} request object
 */
const fetchResource = (resourceUrl, cb) => {
  resourceUrl = upgradeToHttps(resourceUrl);

  if (!resourceUrl) {
    return cb(false);
  }

  const urlObject = url.parse(resourceUrl);
  const options = {
    hostname: urlObject.hostname,
    path: urlObject.path,
    headers: { Origin: 'https://www.srihash.org/' }
  };

  moduleForProtocol(resourceUrl).get(options, (response) => {
    let output;
    let data = [];

    if (response.headers['content-encoding'] === 'gzip') {
      const gzip = zlib.createGunzip();

      response.pipe(gzip);
      output = gzip;
    } else {
      output = response;
    }

    output.on('data', (chunk) => {
      data.push(chunk);
    });

    output.on('end', () => {
      data = Buffer.concat(data);
      processResource(data, response, resourceUrl, cb);
    });
  });
};

/**
 * Figure out what type of resource the user is requesting.
 *
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
  const ext = path.extname(url.parse(resource.url).pathname)
    .replace('.', '')
    .toLowerCase();

  if (Object.prototype.hasOwnProperty.call(resourceTypes, ext)) {
    return ext;
  }

  // Unrecognized type
  return null;
};

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


/**
 * Wrap SRI data for resourceUrl in a script tag
 *
 * @deprecated pending move to isomorphic app
 * @param {string} resourceUrl
 * @param {Array} algorithms
 * @param {Function} cb - callback
 */
const generateElement = (resourceUrl, algorithms, cb) => {
  const options = {
    url: resourceUrl,
    algorithms
  };

  generate(options, (resource) => {
    let element;

    if (!resource.success) {
      if (resource.status > 0) {
        return cb(`Error: fetching the resource returned a ${parseInt(resource.status, 10)} error code.`);
      }

      return cb('Error: fetching the resource returned an unexpected error.');
    }

    if (resource.eligibility.length !== 0) {
      return cb('Error: this resource is not eligible for integrity checks. See https://enable-cors.org/server.html');
    }

    switch (resource.type) {
      case 'js':
        element = `<script src="${resource.url}" integrity="${resource.integrity}" crossorigin="anonymous"></script>`;
        break;
      case 'css':
        element = `<link rel="stylesheet" href="${resource.url}" integrity="${resource.integrity}" crossorigin="anonymous">`;
        break;
      case '.forbidden':
        element = `Error: Forbidden content-type

           https://html.spec.whatwg.org/multipage/scripting.html#scriptingLanguages
           https://developer.mozilla.org/en/docs/Incorrect_MIME_Type_for_CSS_Files`;
        break;
      default:
        element = `<!-- Warning: Unrecognized content-type. Are you sure this is the right resource? -->
<script src="${resource.url}" integrity="${resource.integrity}" crossorigin="anonymous"></script>`;
        break;
    }

    return cb(element);
  });
};

/**
 * Shuffle the elements of the array.
 *
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
const shuffleArray = (oldArray) => {
  const array = oldArray.slice(0);
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

exports.generateElement = generateElement;
exports.generate = generate;
exports.upgradeToHttps = upgradeToHttps;
exports.eligibility = eligibility;
exports.guessResourceType = guessResourceType;
exports.getResourceTypeFromContentTypeHeader = getResourceTypeFromContentTypeHeader;
exports.shuffleArray = shuffleArray;
