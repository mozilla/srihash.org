/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const Path = require('path');
const Hapi = require('@hapi/hapi');
const vision = require('@hapi/vision');
const inert = require('@hapi/inert');

const handlebarsHelperSRI = require('handlebars-helper-sri');
let handlebars = require('handlebars');

handlebars = handlebarsHelperSRI.register(handlebars);

const generate = require('./lib/generate');
const generateElement = require('./lib/generateElement');

// eslint-disable-next-line quotes
const CSP_HEADER = "default-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'self'; frame-ancestors 'self'; img-src 'self'; style-src 'self'";
const REFERRER_HEADER = 'no-referrer, strict-origin-when-cross-origin';

(async() => {
  try {
    const server = Hapi.server({
      host: 'localhost',
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

    await server.register([vision, inert]);

    server.views({
      engines: {
        html: handlebars
      },
      path: Path.join(__dirname, 'templates')
    });

    /**
     * Serve index.js
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
          etagMethod: false,
          lookupCompressed: true
        }
      },
      options: {
        cache: {
          expiresIn: 60 * 60 * 1000 // 1 hour
        }
      }
    });

    /**
     * Return SRI lookup in JSON format
     */
    server.route({
      method: 'POST',
      path: '/generate',
      handler(request, h) {
        const options = {
          url: request.payload.url,
          algorithms: request.payload.algorithms
        };

        generate(options, (result) => {
          return h.response(
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
      handler(request, h) {
        generateElement(
          request.payload.url,
          request.payload.algorithms,
          (result) => {
            return h.view('hash', { hash: result })
              .header('Content-Security-Policy', CSP_HEADER)
              .header('Referrer-Policy', REFERRER_HEADER);
          }
        );
      }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  } catch (error) {
    console.log(error);
  }
})();
