/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var url = require('url');
var sriToolbox = require('sri-toolbox');
var XMLHttpRequest = XMLHttpRequest || require('xhr2'); // Node.js XHR support

/** 
 * Upgrade the given URL to HTTPS if it's from a host known to support it.
 */
var upgradeToHttps = function (urlString) {
  var secureHosts = [
    'code.jquery.com',
    'ajax.googleapis.com',
    'maxcdn.bootstrapcdn.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'ajax.aspnetcdn.com'
  ];
  var urlObject = url.parse(urlString);
  if (urlObject && (secureHosts.indexOf(urlObject.hostname) > -1)) {
    urlObject.protocol = 'https';
  }
  return url.format(urlObject);
}

/**
 * Check XHR request headers for issues that could affect SRI eligibility
 *
 * @param {Object.XMLHttpRequest} request - fetchResource request
 * @return {Array} list of potential issues
 */
var eligibility = function (request) {
  var badHeaders = [
    'authorization',
    'www-authenticate',
    'refresh'
  ];
  var issues = badHeaders.filter(function (header) {
    return request.getResponseHeader(header);
  });
  var cc = request.getResponseHeader('cache-control');
  if (cc && (cc.indexOf('no-store') > -1 || cc.indexOf('private') > -1)) {
    issues.push('no-cache');
  }
  return issues;
}
  
/**
 * Download the resource
 */
var fetchResource = function (resourceUrl, cb) {
  var resourceUrl = upgradeToHttps(resourceUrl);
  var request = new XMLHttpRequest();
  request.onreadystatechange = processResource.bind(request, resourceUrl, cb);
  request.onerror = function () {
    return cb(false);
  }
  request.open('GET', resourceUrl);
  request.send();
  return request;
};

/**
 * Handle server response.
 */
var processResource = function (resourceUrl, cb) {
  var request = this;
  if (request.readyState !== 4){
    return false;
  }
  if (request.status !== 200) {
    return cb({
      'status': false,
      'response': parseInt(request.status)
    });
  }
  return cb({
    url: resourceUrl,
    eligibility: eligibility(request),
    data: request.responseText,
    ct: request.getResponseHeader('content-type')
  });
};


/**
 * Generate SRI data for a resource
 *
 * @param {Object} options - Resource attributes
 * @param {Array} options.algorithms - List of desired hash algorithms
 * @param {string} options.url - Resource URL
 * @param {Function} cb - Callback
 * @return {Object.XMLHttpRequest} fetchResource request
 */
var generate = function (options, cb) {
  // Make sure `options.algorithms` is an array
  if (typeof options.algorithms === "string") {
    options.algorithms = [options.algorithms];
  }
  return fetchResource(options.url, function (resource) {
    // Handle failure callback
    if (!resource) {
      return cb({
        "status": false,
        "response": 0
      });
    }
    // Generate integrity data
    var integrity = sriToolbox.generate({
      algorithms: options.algorithms,
      parameters: {
        'ct': resource.ct
      }
    }, resource.data);
    // Handle success callback
    return cb({
      "status": true,
      "url": resource.url,
      "content-type": resource.ct,
      "integrity": integrity,
      "eligibility": resource.eligibility
    });
  });
};

/**
 * Wrap SRI data for resourceUrl in a script tag
 *
 * @deprecated pending move to isomorphic app
 */
var generateElement = function (resourceUrl, algorithms, cb) {
  var options = {
    url: resourceUrl,
    algorithms: algorithms
  };
  return generate(options, function (resource) {
    cb('<script src="' + resource.url
      + '" integrity="' + resource.integrity + '"></script>');
  });
};

exports.generate = generate;
exports.upgradeToHttps = upgradeToHttps;
exports.eligibility = eligibility;
exports.eligibility = eligibility;

exports.generateElement = generateElement;
