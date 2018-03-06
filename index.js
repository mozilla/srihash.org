/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const path = require('path');
const Hapi = require('@hapi/hapi');
const vision = require('@hapi/vision');
const inert = require('@hapi/inert');
const requireHttps = require('hapi-require-https');
const handlebarsHelperSRI = require('handlebars-helper-sri');
let handlebars = require('handlebars');

const generate = require('./lib/generate');
const generateElement = require('./lib/generateElement');

handlebars = handlebarsHelperSRI.register(handlebars);

// eslint-disable-next-line quotes
const CSP_HEADER = "default-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'self'; frame-ancestors 'self'; img-src 'self'; manifest-src 'self'; style-src 'self'";
const REFERRER_HEADER = 'no-referrer, strict-origin-when-cross-origin';
const PLUGINS = [vision, inert];

(async() => {
  try {
    const server = Hapi.server({
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

    if (process.env.NODE_ENV === 'production') {
      PLUGINS.push(requireHttps);
    }

    await server.register(PLUGINS);

    server.views({
      engines: {
        html: handlebars
      },
      path: path.join(__dirname, 'templates')
    });

    /**
     * Serve index page
     */
    server.route({
      method: 'GET',
      path: '/',
      handler(request, h) {
        return h.view('index', {
          title: 'SRI Hash Generator'
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
          etagMethod: false
        }
      },
      options: {
        cache: {
          // 1 hour for production, 0 for the other cases
          expiresIn: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 0
        }
      }
    });

    /**
     * Return SRI lookup in JSON format
     */
    server.route({
      method: 'POST',
      path: '/generate',
      handler: async(request, h) => {
        const options = {
          url: request.payload.url,
          algorithms: request.payload.algorithms
        };
        const result = await generate(options);

        return h.response(JSON.stringify(result))
          .type('application/json');
      }
    });

    /**
     * Return SRI lookup in HTML format.
     * Deprecated, pending move to isomorphic app.
     */
    server.route({
      method: 'POST',
      path: '/hash',
      handler: async(request, h) => {
        const result = await generateElement(
          request.payload.url,
          request.payload.algorithms
        );

        return h.view('hash', { hash: result })
          .header('Content-Security-Policy', CSP_HEADER)
          .header('Referrer-Policy', REFERRER_HEADER);
      }
    });

    server.route({
      method: 'GET',
      path: '/favicon.ico',
      handler: (request, h) => {
        return h.redirect('/favicons/favicon.ico').permanent();
      }
    });

    server.route({
      method: 'GET',
      path: '/apple-touch-icon.png',
      handler: (request, h) => {
        return h.redirect('/favicons/apple-touch-icon.png').permanent();
      }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  } catch (error) {
    console.log(error);
  }
})();
