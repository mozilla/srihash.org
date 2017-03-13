/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Path = require('path');
var Hapi = require('hapi');
var vision = require('vision');
var inert = require('inert');

var handlebars = require('handlebars');
handlebars = require('handlebars-helper-sri').register(handlebars);

var helpers = require('./lib/helpers.js');

var server = new Hapi.Server();

var CSP_HEADER = "default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self' ; frame-src 'self'"; // jshint ignore:line

server.connection({
  port: process.env.PORT || 4000,
  routes: {
    security: {
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      noOpen: true,
      xframe: 'sameorigin',
      xss: true
    }
  }
});

server.register(vision, function () {
  server.views({
    engines: {
      html: handlebars
    },
    path: Path.join(__dirname, 'templates')
  });
});

server.register(inert, function () {
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
        etagMethod: false,
        lookupCompressed: true
      }
    },
    config: {
      cache: {
        expiresIn: 60 * 60 * 1000   // 1 hour
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
          JSON.stringify(result)
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
