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

## 依赖

> qiniu@7.2.1

## 安装

```bash
$ npm i egg-full-qiniu --save
```

## 使用

```js
// config/plugin.js
exports.fullQiniu = {
  enable: true,
  package: 'egg-full-qiniu',
};
```

## 配置

```js
// {app_root}/config/config.default.js
exports.fullQiniu = {
  default: {
    ak: '', // Access Key
    sk: '', // Secret Key
    useCdnDomain: true,
    isLog: true,
    baseUrl: null, // 用于拼接已上传文件的完整地址
  },
  app: true,
  agent: false,

  // 单实例
  // 通过 app.fullQiniu 直接使用实例
  // client: {
  //     zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //     bucket: '',
  // }

  // 多实例
  // clients: {
  //     // 可以通过 app.fullQiniu.get('myImage'), app.fullQiniu.get('myText') 获取实例
  //     myImage: {
  //         zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //         bucket: '',
  //     },
  //     myText: {
  //         zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //         bucket: '',
  //     },
  // },
};
```

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 示例

- 等待实战测试

## License

[MIT](LICENSE)
