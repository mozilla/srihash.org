/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var url = require('url');
var http = require('http');
var https = require('https');
var sriToolbox = require('sri-toolbox');

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
 * Check the headers to see whether or not the resource will be
 * eligible for SRI checks.
 */
var isEligible = function (headers) {
  var badHeaders = ['authorization', 'www-authenticate', 'refresh'];
  for (var header in headers) {
    if (headers.hasOwnProperty(header)) {
      var lcHeader = header.toLowerCase();
      if (lcHeader === 'access-control-allow-origin') {
        return true; // let's assume the user's origin will be covered
      } else if (lcHeader === 'cache-control') {
        var value = headers[header].toLowerCase();
        if (value.indexOf('no-store') != -1 || value.indexOf('private') != -1) {
          return false; // not publicly cacheable
        }
      } else if (badHeaders.indexOf(lcHeader) != -1) {
        return false;
      }
    }
  }
  return true;
}
  
/**
 * Download the resource and examine the response headers.
 */
function fetchUrl(resourceURL, cb) {
  resourceURL = upgradeToHttps(resourceURL);

  var components = url.parse(resourceURL);
  if (!components) {
    return cb(false);
  }

  var scheme = https;
  if (components.protocol === 'http:') {
    scheme = http;
  }
  scheme.get(resourceURL, function(response) {
    var data = '';
    response.on('data', function(chunk) {
      data += chunk;
    });
    response.on('end', function() {
      cb({
        url: resourceURL,
        eligible: isEligible(response.headers),
        data: data,
        ct: response.headers['content-type']
      });
    })
  }).on('error', function(e) {
    cb(false);
  });
};

var generateElement = function (resourceURL, algorithm, cb) {
  fetchUrl(resourceURL, function (resource) {
    if (!resource || !resource.eligible) {
      return cb('');
    }

    var integrity = sriToolbox.generate({
      algorithms: [algorithm],
      parameters: {
        'ct': resource.ct
      }
    }, resource.data);

    cb('<script src="' + resource.url 
      + '" integrity="' + integrity + '"></script>');
  });
};

exports.generateElement = generateElement;
exports.upgradeToHttps = upgradeToHttps;
exports.isEligible = isEligible;
