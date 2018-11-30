'use strict';

/**
 * 支持以下功能：
 * 1 文件上传：
 *  1.1 文件上传
 *  1.2 字节数组上传
 *  1.3 数据流上传
 * 2 资源管理
 *  2.1 获取文件信息
 *  2.2 修改文件存储类型 (未完成)
 *  2.3 移动或者重命名文件 (未完成)
 *  2.4 复制文件 (未完成)
 *  2.5 删除文件 (未完成)
 *  2.6 设置或更新文件的生存时间 (未完成)
 *  2.7 获取指定前缀的文件列表 (未完成)
 *  2.8 抓取网络资源到空间 (未完成)
 *  2.9 更新文件内容 (未完成)
 *  2.10 批量管理 (未完成)
 * 3 持久化
 *  3.1 发起持久化请求 (未完成)
 *  3.2 查询处理状态 (未完成)
 * 4 CDN
 *  4.1 文件刷新 (未完成)
 *  4.2 目录刷新 (未完成)
 *  4.3 文件预取 (未完成)
 *  4.4 获取指定域名流量 (未完成)
 *  4.5 获取指定域名带宽 (未完成)
 *  4.6 获取日志下载链接 (未完成)
 *  4.7 构建时间戳防盗链访问链接 (未完成)
 */

const assert = require('assert');
const qiniu = require('qiniu');

class FullQiniu {
  constructor(config) {
    this.zone = config.zone;
    this.bucket = config.bucket;
    this.useCdnDomain = config.useCdnDomain;
    this.isLog = config.isLog;
    this.baseUrl = config.baseUrl || '';

    this._mac = null;
    this._putPolicy = null;
    this._config = null;
    this._bucketManager = null;

    qiniu.conf.ACCESS_KEY = config.ak;
    qiniu.conf.SECRET_KEY = config.sk;

    if (this.isLog) {
      this.app.coreLogger.info('[egg-full-qiniu] create one instance');
    }
  }

  hi() {
    return 'hi';
  }

  _now() {
    return parseInt(new Date().getTime() / 1000, 10);
  }

  _getPutPolicy() {
    const needCreate = (this._putPolicy === null || this._putPolicy.expires < this._now());

    if (needCreate) {
      const options = {
        scope: this.bucket,
        // expires: 7200, 默认1小时
      };
      this._putPolicy = new qiniu.rs.PutPolicy(options);
    }

    return this._putPolicy;
  }

  _getMac() {
    if (this._mac === null) {
      this._mac = new qiniu.auth.digest.Mac(qiniu.conf.ACCESS_KEY, qiniu.conf.SECRET_KEY);
    }
    return this._mac;
  }

  _getUploadToken() {
    const putPolicy = this._getPutPolicy();
    return putPolicy.uploadToken(this._getMac());
  }

  _getConfig() {
    if (this._config === null) {
      this._config = new qiniu.conf.Config();
      this._config.zone = this.zone;
      this._config.useCdnDomain = this.useCdnDomain;
    }
    return this._config;
  }

  _getBucketManager() {
    if (this._bucketManager === null) {
      const mac = this._getMac();
      const config = this._getConfig();
      this._bucketManager = new qiniu.rs.BucketManager(mac, config);
    }
    return this._bucketManager;
  }

  async _upload(key, file, style) {
    const config = this._getConfig();

    const token = this._getUploadToken();
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolved, reject) => {
      formUploader[style](token, key, file, putExtra, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] _upload, respBody: ${JSON.stringify(respBody)}`);
          this.app.coreLogger.info(`[egg-full-qiniu] _upload, respInfo: ${JSON.stringify(respInfo)}`);
        }
        if (err) {
          this.app.coreLogger.error(`[egg-full-qiniu] _upload, e: ${JSON.stringify(err)}`);
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _upload, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    }).then(res => {
      // 拼接可访问的地址
      return {
        url: this.baseUrl + encodeURI(res.key),
        key: res.key,
      };
    });
  }

  // 文件上传
  uploadFile(key, file) {
    return this._upload(key, file, 'putFile');
  }

  // 字节数组
  uploadBytes(key, bytes) {
    return this._upload(key, bytes, 'put');
  }

  // 数据流上传
  uploadStream(key, readableStream) {
    return this._upload(key, readableStream, 'putStream');
  }

  // 获取文件信息
  async fileInfo(key) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager.stat(this.bucket, key, function(err, respBody, respInfo) {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] fileInfo, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

}

function createOneClient(config, app) {
  assert(config.ak && config.sk && config.zone && config.bucket,
    `[egg-full-qiniu] 'config.ak: ${config.ak}', 'config.sk: ${config.sk}', 
        'config.zone: ${config.zone}', 'config.bucket: ${config.bucket}' are required`);
  app.coreLogger.info(`[egg-full-qiniu] config: ${JSON.stringify(config)}`);
  return new FullQiniu(config);
}

module.exports = app => {
  app.addSingleton('fullQiniu', createOneClient);
};
