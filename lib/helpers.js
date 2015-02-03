/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var url = require('url');
var sriToolbox = require('sri-toolbox');
var xhr = (typeof XMLHttpRequest !== 'undefined')? 
  XMLHttpRequest : // Use native XHR, if available
  require('xhr2'); // Fallback to custom XHR implementation

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
    urlObject.protocol = "https";
  }
  return url.format(urlObject);
}

/**
 * Return a list of issues that could affect eligibility for SRI generation
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
  if (!cc || cc.indexOf('no-store') > -1 || cc.indexOf('private') > -1) {
    issues.push("no-cache");
  }
  return issues;
}

/**
 * Download the resource and examine the response headers.
 */
var fetchResource = function (resourceUrl, cb) {
  var resourceUrl = upgradeToHttps(resourceUrl);
  var request = new xhr();
  request.onreadystatechange = processResource.bind(request, resourceUrl, cb);
  request.onerror = function () {
    return cb(false);
  }
  request.open('GET', resourceUrl);
  request.send();
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
      "status": false,
      "response": parseInt(request.status)
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
 * Build an object containing all relevant SRI data for resourceUrl
 */
var generate = function (resourceUrl, algorithms, cb) {
  if (typeof algorithms === "string") {
    algorithms = [algorithms];
  }
  fetchResource(resourceUrl, function (resource) {
    if (!resource) {
      return cb({
        "status": false,
        "response": 0
      });
    }
    var integrity = sriToolbox.generate({
      algorithms: algorithms,
      parameters: {
        'ct': resource.ct
      }
    }, resource.data);
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
 */
var generateElement = function (resourceUrl, algorithm, cb) {
  return generate(resourceUrl, [algorithm], function (resource) {
    console.log(resource);
    cb('<script src="' + resource.url
      + '" integrity="' + resource.integrity + '"></script>');
  });
};

exports.eligibility = eligibility;
exports.generate = generate;
exports.generateElement = generateElement;
exports.upgradeToHttps = upgradeToHttps;