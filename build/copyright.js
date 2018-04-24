#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const fs = require('fs');
const glob = require('glob');

function findCopyright(fileGlobs, opts) {
  const options = opts || {};

  const files = fileGlobs.filter((fileGlob) => {
    let fileStr = '';

    glob.sync(fileGlob).forEach((file) => {
      fileStr = fs.readFileSync(file, 'utf8');
    });

    return !fileStr.match(options.pattern);
  });

  if (files.length) {
    console.log('The following files don\'t match the specified pattern:\n> %s\n', options.pattern);

    files.forEach((file) => {
      console.log(`- ${file}`);
    });
  }
}

function main() {
  let fileGlobs = [
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
