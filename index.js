/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var Path = require('path');
var Hapi = require('hapi');

var handlebars = require('handlebars');
handlebars = require('handlebars-helper-sri').register(handlebars);

var helpers = require('./lib/helpers.js');

var CSP_HEADER = "default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self' ; frame-src 'self'"; // jshint ignore:line

var server = new Hapi.Server();
server.connection({
  port: process.env.PORT || 4000,
  routes: { security: { xframe: 'sameorigin' } }
});

server.register(require('vision'), function (err) {
  server.views({
    engines: {
      html: handlebars
    },
    path: Path.join(__dirname, 'templates')
  });
});

server.register(require('inert'), function (err) {
  /**
   * Serve index.js
   */
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      var browsers = helpers.shuffleArray([
        { 'name': 'Firefox', 'url': 'https://www.mozilla.org/firefox/' },
        { 'name': 'Chrome', 'url': 'https://www.google.com/chrome/browser/desktop/' }
      ]);
      reply
        .view('index', { 'title': 'SRI Hash Generator', 'browsers': browsers })
        .header('Content-Security-Policy', CSP_HEADER);
    }
  });

  /**
   * Serve public files
   */
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public',
        lookupCompressed: true
      }
    }
  });

  /**
   * Return SRI lookup in JSON format
   */
  server.route({
    method: 'POST',
    path: '/generate',
    handler: function (request, reply) {
      var options = {
        url: request.payload.url,
        algorithms: request.payload.algorithms
      };
      helpers.generate(options, function (result) {
        reply(
          JSON // jshint ignore:line
            .stringify(result)
        ).type('application/json');
      });
    }
  });


  /**
   * Return SRI lookup in HTML format.
   * Deprecated, pending move to isomorphic app.
   */
  server.route({
    method: 'POST',
    path: '/hash',
    handler: function (request, reply) {
      helpers.generateElement(
        request.payload.url,
        request.payload.algorithms,
        function (result) {
          reply
            .view('hash', { 'hash': result })
            .header('Content-Security-Policy', CSP_HEADER);
        }
      );
    }
  });
});

server.start(function () {
  console.log('Server running at:', server.info.uri);
});
