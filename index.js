/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';
 
var Path = require('path');
var Hapi = require('hapi');

var helpers = require('./lib/helpers.js');

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.views({
  engines: {
    html: require('handlebars')
  },
  path: Path.join(__dirname, 'templates')
});

/**
 * Serve index.js
 */
server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply.view('index', { 'title': 'URI Hash Generator' });
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
      reply(JSON.stringify(result)).type('application/json');
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
        reply(result).type('text/plain');
      }
    );
  }
});

server.start(function () {
  console.log('Server running at:', server.info.uri);
});
