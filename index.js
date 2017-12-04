/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const Path = require('path');
const Hapi = require('hapi');
const vision = require('vision');
const inert = require('inert');
const sitemap = require('hapi-sitemap');

const handlebarsHelperSRI = require('handlebars-helper-sri');
let handlebars = require('handlebars');

handlebars = handlebarsHelperSRI.register(handlebars);

const helpers = require('./lib/helpers.js');

const server = new Hapi.Server();

const CSP_HEADER = "default-src 'none'; base-uri 'none'; img-src 'self'; style-src 'self'; font-src 'self'; frame-src 'self'; frame-ancestors 'self'"; // jshint ignore:line
const REFERRER_HEADER = 'no-referrer, strict-origin-when-cross-origin';

server.connection({
  port: process.env.PORT || 4000,
  routes: {
    security: {
      hsts: {
        includeSubDomains: true,
        maxAge: 31536000,
        preload: true
      },
      xframe: 'sameorigin'
    }
  }
});

server.register(vision, () => {
  server.views({
    engines: {
      html: handlebars
    },
    path: Path.join(__dirname, 'templates')
  });
});

server.register(inert, () => {
  /**
   * Serve index.js
   */
  server.route({
    method: 'GET',
    path: '/',
    handler(request, reply) {
      const browsers = helpers.shuffleArray([
        { 'name': 'Firefox', 'url': 'https://www.mozilla.org/firefox/' },
        { 'name': 'Safari', 'url': 'https://www.apple.com/safari/' },
        { 'name': 'Chrome', 'url': 'https://www.google.com/chrome/browser/desktop/' }
      ]);
      reply
        .view('index', {
          'title': 'SRI Hash Generator',
          'browsers': browsers
        })
        .header('Content-Security-Policy', CSP_HEADER)
        .header('Referrer-Policy', REFERRER_HEADER);
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
      },
      plugins: {
        sitemap: {
          exclude: true
        }
      }
    }
  });

  /**
   * Return SRI lookup in JSON format
   */
  server.route({
    method: 'POST',
    path: '/generate',
    handler(request, reply) {
      const options = {
        url: request.payload.url,
        algorithms: request.payload.algorithms
      };
      helpers.generate(options, (result) => {
        reply(
          JSON.stringify(result)
        ).type('application/json');
      });
    },
    config: {
      plugins: {
        sitemap: {
          exclude: true
        }
      }
    }
  });


  /**
   * Return SRI lookup in HTML format.
   * Deprecated, pending move to isomorphic app.
   */
  server.route({
    method: 'POST',
    path: '/hash',
    handler(request, reply) {
      helpers.generateElement(
        request.payload.url,
        request.payload.algorithms,
        (result) => {
          reply
            .view('hash', { 'hash': result })
            .header('Content-Security-Policy', CSP_HEADER)
            .header('Referrer-Policy', REFERRER_HEADER);
        }
      );
    },
    config: {
      plugins: {
        sitemap: {
          exclude: true
        }
      }
    }
  });
});


server.register({
  register: sitemap,
  options: {
    baseUri: 'https://www.srihash.org'
  }
}, (err) => {
  if (err) {
    console.error('Failed to load plugin: ', err);
  }
});

server.start(() => {
  console.log('Server running at:', server.info.uri);
});
