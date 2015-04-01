/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

import path from 'path';
import url from 'url';
import sriToolbox from 'sri-toolbox';
const XMLHttpRequest = XMLHttpRequest || require('xhr2');

import resourceTypes from './resourceTypes';
import secureHosts from './secureHosts';


/**
 * Upgrade the given URL to HTTPS, if it's from a host believed to support it.
 *
 * @param {string} urlString
 * @return {string} processed URL
 */
const upgradeToHttps = urlString => {
  // Add a scheme to scheme-less URLs
  const isRelative = !!urlString.match(/^\/\//);
  if (isRelative) {
    urlString = 'https:' + urlString;
  }

  // Prepend http for protocol-less URL's
  let urlObject = url.parse(urlString);
  if (!urlObject.protocol && !isRelative) {
    urlString = 'http:' + '//' + urlString;
    urlObject = url.parse(urlString);
  }

  // Upgrade http protocol to https, if host is on the secureHosts list
  if (urlObject.protocol === 'http:' &&
      secureHosts.indexOf(urlObject.hostname) > -1) {
    urlObject.protocol = 'https:';
  }

  return url.format(urlObject);
};


/**
 * Check XHR request headers for issues that could affect SRI eligibility
 *
 * @param {Object.XMLHttpRequest} fetchResource request
 * @return {Array} list of potential issues
 */
const eligibility = request => {
  const badHeaders = [
    'authorization',
    'www-authenticate',
    'refresh'
  ];

  let issues = badHeaders.filter(request.getResponseHeader);

  const cc = request.getResponseHeader('cache-control');
  if (cc && (cc.indexOf('no-store') > -1 || cc.indexOf('private') > -1)) {
    issues.push('no-cache');
  }

  return issues;
};


/**
 * Handle server response.
 *
 * @param {Object.XMLHttpRequest} request
 * @param {string} resourceUrl
 * @param {Function} cb - callback
 * @return {Function.cb}
 */
const processResource = (request, resourceUrl, cb) => {
  if (request.readyState !== 4) {
    return false;
  }

  if (request.status !== 200) {
    return cb({
      'status': false,
      'response': request.status
    });
  }

  return cb({
    'url': resourceUrl,
    'eligibility': eligibility(request),
    'data': request.responseText,
    'ct': request.getResponseHeader('content-type')
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

  const request = new XMLHttpRequest();
  request.onreadystatechange = () => processResource(request, resourceUrl, cb);
  request.onerror = () => cb(false);

  request.open('GET', resourceUrl);
  request.send();

  return request;
};


/**
 * Figure out what type of resource the user is requesting.
 *
 * @param {string} resource.ct - content-type
 * @param {string} resource.url - URL
 * @return {string} assumed file extension
 */
const guessResourceType = resource => {
  // Match against content-types
  const type = Object.keys(resourceTypes).filter(
      ext => (resourceTypes[ext].indexOf(resource.ct) > -1)
  );
  if (type[0]) {
    return type[0];
  }

  // Match against file extensions
  const ext = path.extname(
      url.parse(resource.url).path
  ).replace('.', '').toLowerCase();
  if (resourceTypes.hasOwnProperty(ext)) {
    return ext;
  }

  // Unrecognized type
  return null;
};


/**
 * Generate SRI data for a resource
 *
 * @param {Array} options.algorithms - List of desired hash algorithms
 * @param {string} options.url - Resource URL
 * @return {Object.XMLHttpRequest} fetchResource request
 */
const generate = (options, cb) => {
  if (typeof options.algorithms === 'string') {
    options.algorithms = [options.algorithms];
  }

  return fetchResource(options.url, resource => {
    if (!resource) {
      return cb({
        'status': false,
        'response': 0
      });
    }

    const sri = sriToolbox.generate({
      'algorithms': options.algorithms,
      'full': true
    }, resource.data);

    return cb({
      'status': true,
      'url': resource.url,
      'type': guessResourceType({
        'url': resource.url,
        'ct': sri.type
      }),
      'integrity': sri.integrity,
      'eligibility': resource.eligibility
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
 * @return {Function.cb}
 */
const generateElement = (resourceUrl, algorithms, cb) => {
  const options = {
    'url': resourceUrl,
    'algorithms': algorithms
  };

  return generate(options, resource => {
    let element;

    switch (resource.type) {
    case 'js':
      element = '<script src="' + resource.url +
        '" integrity="' + resource.integrity + '"></script>';
      break;
    case 'css':
      element = '<link rel="stylesheet" href="' + resource.url +
        '" integrity="' + resource.integrity + '">';
      break;
    case '.forbidden':
      element = 'Error: Forbidden content-type\n\n' +
        'https://html.spec.whatwg.org/multipage/scripting.html#scriptingLanguages\n' +
        'https://developer.mozilla.org/en/docs/Incorrect_MIME_Type_for_CSS_Files\n';
      break;
    default:
      element = '<!-- Warning: Unrecognized content-type. ' +
        'Are you sure this is the right resource? -->\n' +
        '<script src="' + resource.url +
        '" integrity="' + resource.integrity + '"></script>';
      break;
    }

    cb(element);
  });
};


export {
    generateElement,
    generate,
    upgradeToHttps,
    eligibility,
    guessResourceType
};
