#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const fs = require('fs');
const glob = require('glob');

function findCopyright(fileGlobs, opts) {
  const options = opts || {};
  let error = 0;
  const failedFiles = [];

  const checkFileGlob = (fileGlob) => {
    glob.sync(fileGlob).forEach((file) => {
      const fileString = fs.readFileSync(file, 'utf8');

      if (!fileString.match(options.pattern)) {
        error++;
        failedFiles.push(file);
      }
    });

    return {
      error,
      failedFiles
    };
  };

  let result = {};

  for (const fileGlob of fileGlobs) {
    result = checkFileGlob(fileGlob);
  }

  if (result.error > 0) {
    console.log(`
The following file${result.error === 1 ? '' : 's'} ${result.error === 1 ? 'doesn\'t' : 'don\'t'} match the specified pattern:
"${options.pattern}"
`);

    result.failedFiles.forEach((file) => {
      console.log(`- ${file}`);
    });
  }

  return result.error;
}

function main() {
  let result = 0;
  let fileGlobs = [
    '*.js',
    'build/**/*.js',
    'lib/**/*.js',
    'public/**/*.css',
    'public/**/*.js',
    'templates/**/*.html'
  ];

  result = findCopyright(fileGlobs, {
    pattern: 'This Source Code Form is subject to the terms of the Mozilla Public'
  });

  fileGlobs = [
    'test/*.js'
  ];

  result += findCopyright(fileGlobs, {
    pattern: 'Any copyright is dedicated to the Public Domain.'
  });

  process.exit(result);
}

main();
