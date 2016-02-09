/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var path = require('path');
var url = require('url');
var sriToolbox = require('sri-toolbox');
var XMLHttpRequest = XMLHttpRequest || require('xhr2');

var resourceTypes = require('./resourceTypes.json');
var secureHosts = require('./secureHosts.json');


/**
 * Upgrade the given URL to HTTPS, if it's from a host believed to support it.
 *
 * @param {string} urlString
 * @return {string} processed URL
 */
var upgradeToHttps = function (urlString) {
  // Add a scheme to scheme-less URLs
  var isRelative = !!urlString.match(/^\/\//);
  if (isRelative) {
    urlString = 'https:' + urlString;
  }

  // Prepend http for protocol-less URL's
  var urlObject = url.parse(urlString);
  if (!urlObject.protocol && !isRelative) {
    urlString = 'http:' + '//' + urlString;
    urlObject = url.parse(urlString);
  }

  // Upgrade http protocol to https, if host is on the secureHosts list
  if (urlObject.protocol === 'http:' &&
      secureHosts.indexOf(urlObject.hostname) > -1) {
    urlObject.protocol = 'https:';
  }

  // If after all of this we don't end up with a supported URL, bail
  if (urlObject.protocol !== 'https:' && urlObject.protocol !== 'http:') {
    return false;
  }

  return url.format(urlObject);
};


/**
 * Check XHR response headers for issues that could affect SRI eligibility
 *
 * @param {Object.XMLHttpRequest} fetchResource request
 * @return {Array} list of potential issues
 */
var eligibility = function (request) {
  var issues = [];

  var acao = request.getResponseHeader('access-control-allow-origin');
  if (!acao) {
    issues.push('non-cors');
  }

  return issues;
};


/**
 * Handle server response.
 *
 * @param {string} resourceUrl
 * @param {Function} cb - callback
 * @return {Function.cb}
 */
var processResource = function (resourceUrl, cb) {
  var request = this;

  if (request.readyState !== 4) {
    return false;
  }

  if (request.status !== 200) {
    return cb({
      'success': false,
      'status': request.status
    });
  }

  return cb({
    'success': true,
    'status': request.status,
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
var fetchResource = function (resourceUrl, cb) {
  resourceUrl = upgradeToHttps(resourceUrl);
  if (!resourceUrl) {
    return cb(false);
  }

  var request = new XMLHttpRequest();
  request.onreadystatechange = processResource.bind(request, resourceUrl, cb);

  request.open('GET', resourceUrl);
  request.send();
};


/**
 * Figure out what type of resource the user is requesting.
 *
 * @param {string} resource.ct - content-type
 * @param {string} resource.url - URL
 * @return {string} assumed file extension
 */
var guessResourceType = function (resource) {
  // Match against content-types
  var type = Object.keys(resourceTypes).filter(function (ext) {
    return (resourceTypes[ext].indexOf(resource.ct) > -1);
  });
  if (type[0]) {
    return type[0];
  }

  // Match against file extensions
  var ext;
  ext = path.extname(url.parse(resource.url).pathname).replace('.', '').toLowerCase();
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
 */
var generate = function (options, cb) {
  if (typeof options.algorithms === 'string') {
    options.algorithms = [options.algorithms];
  }

  fetchResource(options.url, function (resource) {
    if (!resource) {
      return cb({
        'success': false,
        'status': 0
      });
    }
    if (resource.status !== 200) {
      return cb(resource);
    }

    var sri = sriToolbox.generate({
      'algorithms': options.algorithms,
      'full': true
    }, resource.data);

    return cb({
      'success': true,
      'status': resource.status,
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
 */
var generateElement = function (resourceUrl, algorithms, cb) {
  var options = {
    'url': resourceUrl,
    'algorithms': algorithms
  };

  generate(options, function (resource) {
    var element;
    if (!resource.success) {
      if (resource.status > 0) {
        return cb('Error: fetching the resource returned a ' + parseInt(resource.status, 10) + ' error code.');
      } else {
        return cb('Error: fetching the resource returned an unexpected error.');
      }
    }
    if (resource.eligibility.length !== 0) {
      return cb('Error: this resource is not eligible for integrity checks. See http://enable-cors.org/server.html');
    }

    switch (resource.type) {
    case 'js':
      element = '<script src="' + resource.url +
        '" integrity="' + resource.integrity + '" crossorigin="anonymous"></script>';
      break;
    case 'css':
      element = '<link rel="stylesheet" href="' + resource.url +
        '" integrity="' + resource.integrity + '" crossorigin="anonymous">';
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
        '" integrity="' + resource.integrity + '" crossorigin="anonymous"></script>';
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
var shuffleArray = function (oldArray) {
  var array = oldArray.slice(0);
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

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
exports.shuffleArray = shuffleArray;
