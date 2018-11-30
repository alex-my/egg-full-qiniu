'use strict';

/**
 * 支持以下功能：
 * 1 文件上传(服务端版本)：
 *  1.1 文件上传
 *  1.2 字节数组上传
 *  1.3 数据流上传
 * 2 资源管理
 *  2.1 获取文件信息
 *  2.2 修改文件存储类型
 *  2.3 移动或者重命名文件
 *  2.4 复制文件
 *  2.5 删除文件
 *  2.6 设置或更新文件的生存时间
 *  2.7 获取指定前缀的文件列表
 *  2.8 抓取网络资源到空间
 *  2.9 批量管理以上操作
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

  async _UPLOAD(key, file, style) {
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

  /**
   * 文件上传
   * @param {*} key: 目标文件名
   * @param {*} file: 本地文件路径
   * @return {Object}:
   */
  uploadFile(key, file) {
    return this._UPLOAD(key, file, 'putFile');
  }

  /**
   * 字节上传
   * @param {*} key:
   * @param {*} bytes:
   * @return {Object}:
   */
  uploadBytes(key, bytes) {
    return this._UPLOAD(key, bytes, 'put');
  }

  /**
   * 数据流上传
   * @param {*} key:
   * @param {*} readableStream:
   * @return {Object}:
   */
  uploadStream(key, readableStream) {
    return this._UPLOAD(key, readableStream, 'putStream');
  }

  async _OP(style, key) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager[style](this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _OP, style: ${style}, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  /**
   * 获取文件信息
   * @param {*} key 空间中的文件名
   * @return {Object}:
   */
  fileInfo(key) {
    return this._OP('stat', key);
  }

  /**
   * 修改文件存储类型
   * @param {*} key 空间中的文件名
   * @param {*} newType: 0 普通存储, 1 低频存储
   * @return {Object}:
   */
  async changeType(key, newType) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager.changeType(this.bucket, key, newType, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] changeType, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  async _MC(style, srcKey, destBucket, destKey, isForce) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      const options = {
        force: isForce,
      };
      bucketManager[style](this.bucket, srcKey, destBucket, destKey, options, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _MC, style: ${style}, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  /**
   * 移动或者重命名文件
   * @param {*} srcKey 源文件名称
   * @param {*} destBucket 目标空间名称
   * @param {*} destKey 目标文件名称
   * @param {*} isForce true: 强制覆盖已有同名文件
   * @return {Object}:
   */
  move(srcKey, destBucket, destKey, isForce = false) {
    return this._MC('move', srcKey, destBucket, destKey, isForce);
  }

  /**
   * 复制文件
   * @param {*} srcKey 源文件名称
   * @param {*} destBucket 目标空间名称
   * @param {*} destKey 目标文件名称
   * @param {*} isForce true: 强制覆盖已有同名文件
   * @return {Object}:
   */
  copy(srcKey, destBucket, destKey, isForce = false) {
    return this._MC('copy', srcKey, destBucket, destKey, isForce);
  }

  /**
   * 删除文件
   * @param {*} key 空间中的文件名
   * @return {Object}:
   */
  delete(key) {
    return this._OP('delete', key);
  }

  /**
   * 设置或更新文件的生存时间
   * @param {string} key : 空间中的文件名称
   * @param {int} days: 有效期天数
   * @return {Object} :
   */
  async deleteAfterDays(key, days) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager.deleteAfterDays(this.bucket, key, days, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] deleteAfterDays, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  /**
   * 获取指定前缀的文件列表
   * {
   *    prefix: 列举的文件前缀，比如 images/
   *    marker: 上一次列举返回的位置标记，作为本次列举的起点信息
   *    limit: 每次返回的最大列举文件数量
   *    delimiter: 指定目录分隔符
   * }
   * @return {object}:
   */
  async listPrefix({
    prefix,
    marker,
    limit,
    delimiter,
  }) {
    const options = {
      prefix,
    };
    if (marker) {
      options.marker = marker;
    }
    if (limit) {
      options.limit = limit;
    }
    if (delimiter) {
      options.delimiter = delimiter;
    }

    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager.listPrefix(this.bucket, options, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] listPrefix, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  /**
   * 抓取网络资源到空间
   * @param {*} url: 资源链接
   * @param {*} key: 存放到空间时的文件名称
   * @return {Object}:
   */
  async fetch(url, key) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager.fetch(url, this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] listPrefix, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  async _BATCH_OP(style, files) {
    if (files.length > 1000) {
      throw Error('more then 1000');
    }
    const options = [];
    files.forEach(item => {
      options.push(qiniu.rs[style](this.bucket, item));
    });

    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager();
      bucketManager.batch(options, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _BATCH_OP, style: ${style}, statusCode: ${respInfo.statusCode}`);
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved(respBody);
        }
      });
    });
  }

  /**
   * 批量获取文件信息
   * 数量不可以超过1000个，如果总数量超过1000，需要分批发送
   * @param {Array} files: 文件名称集合, ['a1.txt', 'a2.txt', ...]
   * @return {Array}:
   */
  batchFileInfo(files) {
    return this._BATCH_OP('statOp', files);
  }

  /**
   * 批量删除文件
   * 数量不可以超过1000个，如果总数量超过1000，需要分批发送
   * @param {Array} files: 文件名称集合, ['a1.txt', 'a2.txt', ...]
   * @return {Array}:
   */
  batchDelete(files) {
    return this._BATCH_OP('deleteOp', files);
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
