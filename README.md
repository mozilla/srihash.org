# SRI Hash Generator

This is the code behind the <https://www.srihash.org/> website. It generates [subresource integrity](https://www.w3.org/TR/SRI/) hashes.

[![Build Status](https://travis-ci.org/mozilla/srihash.org.svg?branch=master)](https://travis-ci.org/mozilla/srihash.org)
[![Coverage Status](https://coveralls.io/repos/mozilla/srihash.org/badge.svg?branch=master)](https://coveralls.io/r/mozilla/srihash.org?branch=master)
[![dependencies Status](https://david-dm.org/mozilla/srihash.org/status.svg)](https://david-dm.org/mozilla/srihash.org)
[![devDependencies Status](https://david-dm.org/mozilla/srihash.org/dev-status.svg)](https://david-dm.org/mozilla/srihash.org?type=dev) [![Greenkeeper badge](https://badges.greenkeeper.io/mozilla/srihash.org.svg)](https://greenkeeper.io/)

## Install

You'll need node.js 8.x and npm to run the server.

Clone the git repository and install dependencies:

```shell
git clone git://github.com/mozilla/srihash.org.git
cd srihash.org
npm install
```

To start the server, run:

```shell
npm start
```

It will listen on `http://127.0.0.1:4000` by default.

Or run:

```shell
npm run watch
```

to run the server and watch for changes.

## Testing

Run tests with:

```shell
npm test
```
