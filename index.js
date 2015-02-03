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

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply.view('index', { 'title': 'URI Hash Generator' });
  }
});

server.route({
  method: 'GET',
  path: '/public/{p*}',
  handler: {
    directory: {
      path: 'public',
      listing: true
    }
  }
});

server.route({
  method: ['GET', 'POST'],
  path: '/hash',
  handler: function (request, reply) {
    helpers.generateElement(request.payload.url, 'sha-256', function (result) {
      reply(result).type('text/plain');
    });
  }
});

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
  
server.start(function () {
  console.log('Server running at:', server.info.uri);
});
