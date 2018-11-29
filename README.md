# egg-full-qiniu

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-full-qiniu.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-full-qiniu
[travis-image]: https://img.shields.io/travis/eggjs/egg-full-qiniu.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-full-qiniu
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-full-qiniu.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-full-qiniu?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-full-qiniu.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-full-qiniu
[snyk-image]: https://snyk.io/test/npm/egg-full-qiniu/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-full-qiniu
[download-image]: https://img.shields.io/npm/dm/egg-full-qiniu.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-full-qiniu

<!--
Description here.
-->

## Install

```bash
$ npm i egg-full-qiniu --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.fullQiniu = {
  enable: true,
  package: 'egg-full-qiniu',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.fullQiniu = {
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
