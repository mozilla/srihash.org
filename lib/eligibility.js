/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

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

module.exports = eligibility;
