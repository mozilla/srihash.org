/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const generate = require('./generate');

/**
 * Wrap SRI data for resourceUrl in a script tag
 *
 * @deprecated pending move to isomorphic app
 * @param {string} resourceUrl - Resource URL
 * @param {Array} algorithms - The desired hash algorithms
 * @return {Promise}
 */
const generateElement = (resourceUrl, algorithms) => {
  return new Promise((resolve) => {
    const options = {
      url: resourceUrl,
      algorithms
    };

    generate(options).then((resource) => {
      let element;

      if (!resource.success) {
        if (resource.status > 0) {
          return resolve(`Error: fetching the resource returned a ${parseInt(resource.status, 10)} error code.`);
        }

        return resolve('Error: fetching the resource returned an unexpected error.');
      }

      if (resource.eligibility.length !== 0) {
        return resolve('Error: this resource is not eligible for integrity checks. See https://enable-cors.org/server.html');
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

      return resolve(element);
    });
  });
};

module.exports = generateElement;
