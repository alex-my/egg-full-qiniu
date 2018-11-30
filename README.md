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
  },
  app: true,
  agent: false,

  // 单实例
  // 通过 app.fullQiniu 直接使用实例
  // client: {
  //     zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //     bucket: '',
  //     baseUrl: null, // 用于拼接已上传文件的完整地址
  // }

  // 多实例
  // clients: {
  //     // 可以通过 app.fullQiniu.get('myImage'), app.fullQiniu.get('myText') 获取实例
  //     myImage: {
  //         zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //         bucket: '',
  //     baseUrl: null, // 用于拼接已上传文件的完整地址
  //     },
  //     myText: {
  //         zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //         bucket: '',
  //     baseUrl: null, // 用于拼接已上传文件的完整地址
  //     },
  // },
};
```

请到 [config/config.default.js](config/config.default.js) 查看详细配置项说明。

## 使用

- 通过`app.fullQiniu`调用函数，在配置文件中已经固定`bucket`
- 在多实例中进行`move`，`copy`时，可以通过`getBucket()`获取本实例的`bucket`值
- 单实例中:

  ```js
  app.fullQiniu.uploadFile(key, file);
  ```

- 多实例中

  ```js
  const image = app.fullQiniu.get('myImage');
  const imageBak = app.fullQiniu.get('myImageBak');

  const result = image.copy('p1.png', imageBak.getBucket(), 'p1_bak.png', true);
  ```

## API

- uploadFile(key, file)

  ```js
  上传本地文件到空间中

  @param key: 目标文件名
  @param file: 本地文件路径
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "url": 可访问的完整链接
      "hash"
      "key"
    }
  ```

- uploadBytes(key, bytes)

  ```js
  将内存中的字节数组上传到空间中

  @param key: 目标文件名
  @param bytes: 内存中的字节数组
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "url": 可访问的完整链接
      "hash"
      "key"
    }
  ```

- uploadStream(key, stream)

  ```js
  将客户端传送来的流上传到空间中

  @param key: 目标文件名
  @param stream: 文件流
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "url": 可访问的完整链接
      "hash"
      "key"
    }
  ```

- fileInfo(key)

  ```js
  获取文件信息

  @param key: 在空间中的文件名
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "fsize": 198568,
      "hash": "FhfDDtTkyR02fXq87bdlvJd-2HlH",
      "md5": "no0Hr/mBDGU/sMHNbuf05w==",
      "mimeType": "image/jpeg",
      "putTime": 15435661202597688,
      "type": 0, // 0 普通存储， 1 低频存储
    }
  ```

- changeType(key, newType)

  ```js
  修改文件存储类型

  @param key: 在空间中的文件名
  @param newType: 0 普通存储, 1 低频存储
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
    }
  ```

- move(srcKey, destBucket, destKey, isForce = false)

  ```js
  移动或者重命名文件

  @param srcKey: 在源空间中的文件名
  @param destBucket: 目标空间
  @param destKey: 在目标空间中的文件名
  @param isForce: true, 强制覆盖已有同名文件
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
    }
  ```

- copy(srcKey, destBucket, destKey, isForce = false)

  ```js
  复制文件

  @param srcKey: 在源空间中的文件名
  @param destBucket: 目标空间
  @param destKey: 在目标空间中的文件名
  @param isForce: true, 强制覆盖已有同名文件
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
    }
  ```

- delete(key)

  ```js
  删除文件

  @param key: 在空间中的文件名
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
    }
  ```

- deleteAfterDays(key, days)

  ```js
  设置或更新文件的生存时间

  @param key: 在空间中的文件名
  @param days: 有效期天数
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
    }
  ```

- listPrefix({ prefix, marker, limit, delimiter })

  ```js
  获取指定前缀的文件列表

  @param
    {
      prefix: 列举的文件前缀，比如 images-
      marker: 上一次列举返回的位置标记，作为本次列举的起点信息
      limit: 每次返回的最大列举文件数量
      delimiter: 指定目录分隔符
    }
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "marker": "eyJxxxx==",
      "items": [{
        "key": "image-xxxx1.jpg",
        "hash": "FhfDDtTkyR02fXq87bdlvJd-xxxx",
        "fsize": 198568,
        "mimeType": "image/jpeg",
        "putTime": 15435714374444728,
        "type": 0,
        "status": 0
      }, {
        "key": "image-xxxx2.jpeg",
        "hash": "Frk2EdYeI1i-beHzLSMA_xxx",
        "fsize": 5467,
        "mimeType": "image/jpeg",
        "putTime": 15435714197909564,
        "type": 0,
        "status": 0
      }]
    }
    备注: prefix='image-', limit=2
  ```

- fetch(url, key)

  ```js
  抓取网络资源存放到到空间

  @param url: 资源链接
  @param key: 存放到空间时的文件名称
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "fsize": 22827,
      "hash": "Fu4uwAc4LCdmVMzgLKs5EdKLCJMT",
      "key": "fetch_xxx.jpg",
      "mimeType": "image/jpeg"
    }
  ```

- batchFileInfo(url, key)

  ```js
  批量获取文件信息
  数量不可以超过1000个，如果总数量超过1000，需要分批发送

  @param files: 文件名集合, ['', '', ...]
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "list": [{
        "code": 200,
        "data": {
          "fsize": 22827,
          "hash": "Fu4uwAc4LCdmVMzgLKs5EdKLCJMT",
          "md5": "ahWerXWV0Co3Yqujwi4pEw==",
          "mimeType": "image/jpeg",
          "putTime": 15435720064197850,
          "type": 0
        }
      }, {
        "code": 200,
        "data": {
          "fsize": 198568,
          "hash": "FhfDDtTkyR02fXq87bdlvJd-2HlH",
          "md5": "no0Hr/mBDGU/sMHNbuf05w==",
          "mimeType": "image/jpeg",
          "putTime": 15435714374444728,
          "type": 0
        }
      }]
    }
  ```

- batchDelete(files)

  ```js
  批量删除文件
  数量不可以超过1000个，如果总数量超过1000，需要分批发送

  @param files: 文件名集合, ['', '', ...]
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "list": [{
        "code": 200
      }, {
        "code": 200
      }]
    }
  ```

- refreshUrls(urls)

  ```js
  CDN 文件刷新
  单次请求链接不可以超过100个，如果超过，请分批发送请求

  @param urls: 完整链接的集合, ['', '', ...]
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "code": 200,
      "error": "success",
      "requestId": "5c0110fe43d7231d08abe16c",
      "taskIds": {
        "http://imagecdn.xxxx.cn/image-xxx1.jpeg": "5c0110fe43d7231d08xxxx",
        "http://imagecdn.xxxx.cn/image-xxx2.jpg": "5c0110fe43d7231d08xxxx"
      },
      "invalidUrls": null,
      "invalidDirs": null,
      "urlQuotaDay": 500,
      "urlSurplusDay": 496,
      "dirQuotaDay": 10,
      "dirSurplusDay": 10
    }
  ```

- prefetchUrls(urls)

  ```js
  CDN 文件预取
  单次请求链接不可以超过100个，如果超过，请分批发送请求

  @param urls: 完整链接的集合, ['', '', ...]
  @return
    {
      "ok": true | false,
      "err": 当 ok 为 false 时
      "code": 200,
      "error": "success",
      "requestId": "5c011212ae4f843390abaa57",
      "taskIds": {
        "http://imagecdn.xxxx.cn/image-xxxx1.jpeg": "5c011212ae4f843390xxxx",
        "http://imagecdn.xxxx.cn/image-xxxx2.jpg": "5c011212ae4f843390xxxx"
      },
      "invalidUrls": null,
      "quotaDay": 100,
      "surplusDay": 98
    }
  ```

## License

[MIT](LICENSE)
