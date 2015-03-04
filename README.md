SRI Hash Generator
===================

This is the code behind the <https://srihash.org> website. It generates [sub-resource integrity](http://www.w3.org/TR/SRI/) hashes.

[![Build Status](https://travis-ci.org/mozilla/srihash.org.svg?branch=master)](https://travis-ci.org/mozilla/srihash.org)
[![Coverage Status](https://coveralls.io/repos/mozilla/srihash.org/badge.svg?branch=master)](https://coveralls.io/r/mozilla/srihash.org?branch=master)
[![Dependencies Status](https://david-dm.org/mozilla/srihash.org.svg)](https://david-dm.org/mozilla/srihash.org)
[![Dev Dependencies Status](https://david-dm.org/mozilla/srihash.org/dev-status.svg)](https://david-dm.org/mozilla/srihash.org#info=devDependencies)

## Install

You'll need node 0.10.x or higher and npm to run the server.

Clone the git repository and install dependencies:

    git clone git://github.com/mozilla/srihash.org.git
    cd srihash.org
    npm install

To start the server, run:

    npm start

It will listen on http://127.0.0.1:4000 by default.

## Testing

Run tests with:

    npm test
