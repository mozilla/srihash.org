#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var glob = require('glob');

function findCopyright(fileGlobs, opts) {
  var options = opts || {};

  var files = fileGlobs.filter(function (fileGlob) {
    var fileStr = '';

    glob.sync(fileGlob).forEach(function (file) {
      fileStr = fs.readFileSync(file, 'utf8');
    });

    return !fileStr.match(options.pattern);
  });

  if (files.length) {
    console.log('The following files don\'t match the specified pattern:\n> %s\n', options.pattern);

    files.forEach(function (file) {
      console.log('- ' + file);
    });
  }
}

function main() {
  var fileGlobs = [
    '*.js',
    'lib/**/*.js',
    'public/**/*.css',
    'templates/**/*.html'
  ];

  findCopyright(fileGlobs, {
    pattern: 'This Source Code Form is subject to the terms of the Mozilla Public'
  });

  fileGlobs = [
    'test/*.js'
  ];

  findCopyright(fileGlobs, {
    pattern: 'Any copyright is dedicated to the Public Domain.'
  });
}

main();
