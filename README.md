# SRI Hash Generator

This is the code behind the <https://www.srihash.org/> website. It generates [subresource integrity](https://www.w3.org/TR/SRI/) hashes.

[![Total alerts](https://img.shields.io/lgtm/alerts/g/mozilla/srihash.org.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/mozilla/srihash.org/alerts/)
[![Build Status](https://github.com/mozilla/srihash.org/workflows/Tests/badge.svg)](https://github.com/mozilla/srihash.org/actions?workflow=Tests)
[![Coverage Status](https://coveralls.io/repos/mozilla/srihash.org/badge.svg?branch=master)](https://coveralls.io/r/mozilla/srihash.org?branch=master)
[![dependencies Status](https://david-dm.org/mozilla/srihash.org/status.svg)](https://david-dm.org/mozilla/srihash.org)
[![devDependencies Status](https://david-dm.org/mozilla/srihash.org/dev-status.svg)](https://david-dm.org/mozilla/srihash.org?type=dev)

## Install

You'll need Node.js 12.x and npm to run the server.

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

## `master` branch previews

You can preview the `master` branch deployments on <https://srihash-staging.herokuapp.com/>. The `production` deployment is on <https://www.srihash.org/>.

## Production Releases

The main development branch is the `master` one. When we want to make a production release, we make a PR targeting the `production` branch.

**Please make sure not to use Squash and Merge or Rebase when merging the production PRs, because then the commits will differ.**
