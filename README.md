# SRI Hash Generator

This is the code behind the <https://www.srihash.org/> website. It generates [subresource integrity](http://www.w3.org/TR/SRI/) hashes.

[![Build Status](https://travis-ci.org/mozilla/srihash.org.svg?branch=master)](https://travis-ci.org/mozilla/srihash.org)
[![Coverage Status](https://coveralls.io/repos/mozilla/srihash.org/badge.svg?branch=master)](https://coveralls.io/r/mozilla/srihash.org?branch=master)
[![dependencies Status](https://david-dm.org/mozilla/srihash.org/status.svg)](https://david-dm.org/mozilla/srihash.org)
[![devDependencies Status](https://david-dm.org/mozilla/srihash.org/dev-status.svg)](https://david-dm.org/mozilla/srihash.org?type=dev)

## Install

You'll need node 0.10.x or higher and npm to run the server.

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

## Testing

Run tests with:

```shell
npm test
```
