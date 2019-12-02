/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  'use strict';

  var supportsIntegrity = 'integrity' in document.createElement('script');
  var sriTestEl = document.querySelector('.sri-test');
  var pass = sriTestEl.querySelector('[data-sri-status="pass"]');
  var fail = sriTestEl.querySelector('[data-sri-status="fail"]');

  if (!sriTestEl || !pass || !fail) {
    return;
  }

  sriTestEl.style.display = 'inline-block';
  pass.style.display = supportsIntegrity ? 'block' : '';
  fail.style.display = !supportsIntegrity ? 'block' : '';
}());
