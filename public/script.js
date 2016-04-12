/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* jshint browser:true, node:false */

(function () {
  'use strict';

  var supportsIntegrity = 'integrity' in document.createElement('script');

  var badge = document.getElementById('sri-badge');

  if (badge) {

    var insertBadge = (function () {
      var sucessHtml = '<div data-sri-status="pass">' +
                         '<img src="/badge/pass.svg" alt="Pass Badge">' +
                         '<p>Your browser supports SRI</p>' +
                       '</div>';
      var failHtml = '<div data-sri-status="fail">' +
                       '<img src="/badge/fail.svg" alt="Fail Badge">' +
                       '<p>Your browser does not support SRI</p>' +
                     '</div>';

      if (supportsIntegrity) {
        badge.className += ' success';
        badge.innerHTML = sucessHtml;
      } else {
        badge.className += ' fail';
        badge.innerHTML = failHtml;
      }
    });

    window.addEventListener('load', insertBadge, false);
  }

})();
