'use strict'

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
 *  2.9 批量获取文件信息
 *  2.10 批量删除文件
 * 3 CDN
 *  3.1 文件刷新
 *  3.2 目录刷新
 *  3.3 文件预取
 *  3.4 获取指定域名流量
 *  3.5 获取指定域名带宽
 *  3.6 获取日志下载链接
 */

const assert = require('assert')
const qiniu = require('qiniu')

class FullQiniu {
  constructor(config, app) {
    this.app = app
    this.zone = config.zone
    this.bucket = config.bucket
    this.useCdnDomain = config.useCdnDomain
    this.isLog = config.isLog
    this.baseUrl = config.baseUrl || ''

    this._mac = null
    this._putPolicy = null
    this._config = null
    this._bucketManager = null
    this._cdnManager = null

    qiniu.conf.ACCESS_KEY = config.ak
    qiniu.conf.SECRET_KEY = config.sk

    if (this.isLog) {
      this.app.coreLogger.info('[egg-full-qiniu] create one instance')
    }
  }

  hi() {
    return 'hi'
  }

  _now() {
    return parseInt(new Date().getTime() / 1000, 10)
  }

  _getPutPolicy() {
    const needCreate = this._putPolicy === null || this._putPolicy.expires < this._now()

    if (needCreate) {
      const options = {
        scope: this.bucket
        // expires: 7200, 默认1小时
      }
      this._putPolicy = new qiniu.rs.PutPolicy(options)
    }

    return this._putPolicy
  }

  _getMac() {
    if (this._mac === null) {
      this._mac = new qiniu.auth.digest.Mac(qiniu.conf.ACCESS_KEY, qiniu.conf.SECRET_KEY)
    }
    return this._mac
  }

  _getUploadToken() {
    const putPolicy = this._getPutPolicy()
    return putPolicy.uploadToken(this._getMac())
  }

  _getConfig() {
    if (this._config === null) {
      this._config = new qiniu.conf.Config()
      this._config.zone = qiniu.zone[this.zone]
      this._config.useCdnDomain = this.useCdnDomain
    }
    return this._config
  }

  _getBucketManager() {
    if (this._bucketManager === null) {
      const mac = this._getMac()
      const config = this._getConfig()
      this._bucketManager = new qiniu.rs.BucketManager(mac, config)
    }
    return this._bucketManager
  }

  _getCDNManager() {
    if (this._cdnManager === null) {
      const mac = this._getMac()
      this._cdnManager = new qiniu.cdn.CdnManager(mac)
    }
    return this._cdnManager
  }

  getBucket() {
    return this.bucket
  }

  async _UPLOAD(key, file, style) {
    const config = this._getConfig()

    const token = this._getUploadToken()
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    return new Promise((resolved, reject) => {
      formUploader[style](token, key, file, putExtra, (err, respBody, respInfo) => {
        // respBody
        // {
        //   "hash": "FhfDDtTkyR02fXq87bdlvJd-XXXX",
        //   "key": "02128b30-f479-11e8-a178-cdf1d17ada6dXXXXX.jpg"
        // }

        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] _upload, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] _upload, respInfo: ${JSON.stringify(respInfo)}`)
        }

        if (err) {
          this.app.coreLogger.error(`[egg-full-qiniu] _upload, e: ${err}`)
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _upload, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          resolved({
            ok: true,
            url: this.baseUrl + encodeURI(respBody.key),
            ...respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * 生成上传 token, 前端可以使用
   * @param {string} key: 目标文件名
   * @return {Object}:
   */
  generateUploadTokenData(key) {
    let option;
    if (typeof key === 'string') {
      option = {
          scope: `${this.getBucket()}:${key}`
      }
    } else { 
        option = key
    }
    const putPolicy = new qiniu.rs.PutPolicy(option);
    const config = this._getConfig()
    const url = config.zone.cdnUpHosts[0]
    return {
      token: putPolicy.uploadToken(this._getMac()),
      key,
      uploadUrl: `https://${url}`
    }
  }

  /**
   * 文件上传
   * @param {string} key: 目标文件名
   * @param {string} file: 本地文件路径
   * @return {Object}:
   */
  uploadFile(key, file) {
    return this._UPLOAD(key, file, 'putFile')
  }

  /**
   * 字节上传
   * @param {string} key:
   * @param {string} bytes:
   * @return {Object}:
   */
  uploadBytes(key, bytes) {
    return this._UPLOAD(key, bytes, 'put')
  }

  /**
   * 数据流上传
   * @param {string} key:
   * @param {*} stream:
   * @return {Object}:
   */
  uploadStream(key, stream) {
    return this._UPLOAD(key, stream, 'putStream')
  }

  async _OP(style, key) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      bucketManager[style](this.bucket, key, (err, respBody, respInfo) => {
        // respBody
        // {
        //   "fsize": 198568,
        //   "hash": "FhfDDtTkyR02fXq87bdlvJd-2HlH",
        //   "md5": "no0Hr/mBDGU/sMHNbuf05w==",
        //   "mimeType": "image/jpeg",
        //   "putTime": 15435661202597688,
        //   "type": 0, // 0 普通存储， 1 低频存储
        // }

        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] _OP, style: ${style}, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] _OP, style: ${style}, respInfo: ${JSON.stringify(respInfo)}`)
        }

        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _OP, style: ${style}, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * 获取文件信息
   * @param {string} key 空间中的文件名
   * @return {Object}:
   */
  fileInfo(key) {
    return this._OP('stat', key)
  }

  /**
   * 修改文件存储类型
   * @param {string} key 空间中的文件名
   * @param {number} newType: 0 普通存储, 1 低频存储
   * @return {Object}:
   */
  async changeType(key, newType) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      bucketManager.changeType(this.bucket, key, newType, (err, respBody, respInfo) => {
        // respBody: null

        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] changeType, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] changeType, respInfo: ${JSON.stringify(respInfo)}`)
        }

        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] changeType, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  async _MC(style, srcKey, destBucket, destKey, isForce) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      const options = {
        force: isForce
      }
      bucketManager[style](this.bucket, srcKey, destBucket, destKey, options, (err, respBody, respInfo) => {
        // respBody: null

        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] _MC, style: ${style}, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] _MC, style: ${style}, respInfo: ${JSON.stringify(respInfo)}`)
        }

        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _MC, style: ${style}, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * 移动或者重命名文件
   * @param {string} srcKey 源文件名称
   * @param {string} destBucket 目标空间名称
   * @param {string} destKey 目标文件名称
   * @param {string} isForce true: 强制覆盖已有同名文件
   * @return {Object}:
   */
  move(srcKey, destBucket, destKey, isForce = false) {
    return this._MC('move', srcKey, destBucket, destKey, isForce)
  }

  /**
   * 复制文件
   * @param {string} srcKey 源文件名称
   * @param {string} destBucket 目标空间名称
   * @param {string} destKey 目标文件名称
   * @param {string} isForce true: 强制覆盖已有同名文件
   * @return {Object}:
   */
  copy(srcKey, destBucket, destKey, isForce = false) {
    return this._MC('copy', srcKey, destBucket, destKey, isForce)
  }

  /**
   * 删除文件
   * @param {string} key 空间中的文件名
   * @return {Object}:
   */
  delete(key) {
    return this._OP('delete', key)
  }

  /**
   * 设置或更新文件的生存时间
   * @param {string} key : 空间中的文件名称
   * @param {number} days: 有效期天数
   * @return {Object} :
   */
  async deleteAfterDays(key, days) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      bucketManager.deleteAfterDays(this.bucket, key, days, (err, respBody, respInfo) => {
        // respBody: null
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] deleteAfterDays, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] deleteAfterDays, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] deleteAfterDays, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * 获取指定前缀的文件列表
   * {
   *    @property {string} prefix: 列举的文件前缀，比如 images/
   *    @property {string} marker: 上一次列举返回的位置标记，作为本次列举的起点信息
   *    @property {number} limit: 每次返回的最大列举文件数量
   *    @property {string} delimiter: 指定目录分隔符
   * }
   * @return {object}:
   */
  async listPrefix({
    prefix,
    marker,
    limit,
    delimiter
  }) {
    const options = {
      prefix
    }
    if (marker) {
      options.marker = marker
    }
    if (limit) {
      options.limit = limit
    }
    if (delimiter) {
      options.delimiter = delimiter
    }

    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      bucketManager.listPrefix(this.bucket, options, (err, respBody, respInfo) => {
        // prefix = 'image-', limit = 2
        // respInfo
        // {
        //   "marker": "eyJjIjowLCJrIjoiaW1hZ2UtZjQ4NC0xMWU4LWI3OTMtYWY4ODQ3MTA2ZGJk5YCSxxxxxxxifQ==",
        //   "items": [{
        //     "key": "image-xxxx1.jpg",
        //     "hash": "FhfDDtTkyR02fXq87bdlvJd-xxxx",
        //     "fsize": 198568,
        //     "mimeType": "image/jpeg",
        //     "putTime": 15435714374444728,
        //     "type": 0,
        //     "status": 0
        //   }, {
        //     "key": "image-xxxx2.jpeg",
        //     "hash": "Frk2EdYeI1i-xxx",
        //     "fsize": 5467,
        //     "mimeType": "image/jpeg",
        //     "putTime": 15435714197909564,
        //     "type": 0,
        //     "status": 0
        //   }]
        // }

        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] listPrefix, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] listPrefix, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] listPrefix, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * 抓取网络资源到空间
   * @param {string} url: 资源链接
   * @param {string} key: 存放到空间时的文件名称
   * @return {Object}:
   */
  async fetch(url, key) {
    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      bucketManager.fetch(url, this.bucket, key, (err, respBody, respInfo) => {
        // respBody
        // {
        // "fsize": 22827,
        // "hash": "Fu4uwAc4LCdmVMzgLKs5EdKLCJMT",
        // "key": "fetch_xxx.jpg",
        // "mimeType": "image/jpeg"
        // }

        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] fetch, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] fetch, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] fetch, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  async _BATCH_OP(style, files) {
    if (files.length > 1000) {
      throw {
        ok: false,
        err: 'more than 1000'
      }
    }
    const options = []
    files.forEach(item => {
      options.push(qiniu.rs[style](this.bucket, item))
    })

    return new Promise((resolved, reject) => {
      const bucketManager = this._getBucketManager()
      bucketManager.batch(options, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] _BATCH_OP, style: ${style}, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] _BATCH_OP, style: ${style}, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] _BATCH_OP, style: ${style}, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            list: respBody
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * 批量获取文件信息
   * 数量不可以超过1000个，如果总数量超过1000，需要分批发送
   * @param {Array<string>} files: 文件名称集合, ['a1.txt', 'a2.txt', ...]
   * @return {Object}:
   */
  batchFileInfo(files) {
    // respBody
    // [{
    //   "code": 200,
    //   "data": {
    //     "fsize": 22827,
    //     "hash": "Fu4uwAc4LCdmVMzgLKs5EdKLCJMT",
    //     "md5": "ahWerXWV0Co3Yqujwi4pEw==",
    //     "mimeType": "image/jpeg",
    //     "putTime": 15435720064197850,
    //     "type": 0
    //   }
    // }, {
    //   "code": 200,
    //   "data": {
    //     "fsize": 198568,
    //     "hash": "FhfDDtTkyR02fXq87bdlvJd-2HlH",
    //     "md5": "no0Hr/mBDGU/sMHNbuf05w==",
    //     "mimeType": "image/jpeg",
    //     "putTime": 15435714374444728,
    //     "type": 0
    //   }
    // }]
    return this._BATCH_OP('statOp', files)
  }

  /**
   * 批量删除文件
   * 数量不可以超过1000个，如果总数量超过1000，需要分批发送
   * @param {Array<string>} files: 文件名称集合, ['a1.txt', 'a2.txt', ...]
   * @return {Array}:
   */
  batchDelete(files) {
    // respBody
    // [{
    //   "code": 200
    // }, {
    //   "code": 200
    // }]
    return this._BATCH_OP('deleteOp', files)
  }

  /**
   * CDN 文件刷新
   * 单次请求链接不可以超过100个，如果超过，请分批发送请求
   * @param {Array<string>} urls: 待刷新的 url集合
   * @return {Object}:
   */
  refreshUrls(urls) {
    return new Promise((resolved, reject) => {
      const cdnManager = this._getCDNManager()
      cdnManager.refreshUrls(urls, (err, respBody, respInfo) => {
        // JSON.parse(respBody)
        // {
        //   "code": 200,
        //   "error": "success",
        //   "requestId": "5c0110fe43d7231d08abe16c",
        //   "taskIds": {
        //     "http://imagecdn.xxxx.cn/image-xxxx1.jpeg": "5c0110fe43d7231d08xxxx",
        //     "http://imagecdn.xxxx.cn/image-xxxx2.jpg": "5c0110fe43d7231d08axxxx"
        //   },
        //   "invalidUrls": null,
        //   "invalidDirs": null,
        //   "urlQuotaDay": 500,
        //   "urlSurplusDay": 496,
        //   "dirQuotaDay": 10,
        //   "dirSurplusDay": 10
        // }
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] refreshUrls, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] refreshUrls, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] refreshUrls, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...JSON.parse(respBody)
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * CDN 目录刷新
   * 刷新目录需要联系七牛技术支持开通权限
   * 单次请求链接不可以超过10个，如果超过，请分批发送请求
   * @param {Array<string>} dirs: 待刷新的 目录集合
   * @return {Object} 
   */
  refreshDirs(dirs) {
    return new Promise((resolved, reject) => {
      const cdnManager = this._getCDNManager()
      cdnManager.refreshDirs(dirs, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] refreshDirs, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] refreshDirs, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] refreshDirs, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...JSON.parse(respBody)
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * CDN 文件预取
   * 单次请求链接不可以超过100个，如果超过，请分批发送请求
   * @param {Array<string>} urls: 待刷新的 url集合
   * @return {Object}:
   */
  prefetchUrls(urls) {
    return new Promise((resolved, reject) => {
      const cdnManager = this._getCDNManager()
      cdnManager.prefetchUrls(urls, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] prefetchUrls, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] prefetchUrls, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] prefetchUrls, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...JSON.parse(respBody)
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * CDN 获取指定域名流量
   * @param {string} startDate: 起始日期 2018-01-01
   * @param {string} endDate: 结束日期 2018-01-02
   * @param {Array<string>} domains: 待查询的域名集合
   * @return {Object}:
   */
  getFluxData(startDate, endDate, domains) {
    return new Promise((resolved, reject) => {
      const cdnManager = this._getCDNManager()
      cdnManager.getFluxData(startDate, endDate, 'day', domains, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] getFluxData, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] getFluxData, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] getFluxData, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...JSON.parse(respBody)
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * CDN 获取指定域名带宽
   * @param {string} startDate: 起始日期 2018-01-01
   * @param {string} endDate: 结束日期 2018-01-02
   * @param {Array<string>} domains: 待查询的域名集合
   * @return {Object}:
   */
  getBandwidthData(startDate, endDate, domains) {
    return new Promise((resolved, reject) => {
      const cdnManager = this._getCDNManager()
      cdnManager.getBandwidthData(startDate, endDate, 'day', domains, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] getBandwidthData, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] getBandwidthData, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] getBandwidthData, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...JSON.parse(respBody)
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }

  /**
   * CDN 获取日志下载链接
   * @param {string} logDay: 查询日期 2018-01-01
   * @param {Array<string>} domains: 待查询的域名集合
   * @return {Object}:
   */
  getCdnLogList(logDay, domains) {
    return new Promise((resolved, reject) => {
      const cdnManager = this._getCDNManager()
      cdnManager.getCdnLogList(domains, logDay, (err, respBody, respInfo) => {
        if (this.isLog) {
          this.app.coreLogger.info(`[egg-full-qiniu] getCdnLogList, respBody: ${JSON.stringify(respBody)}`)
          this.app.coreLogger.info(`[egg-full-qiniu] getCdnLogList, respInfo: ${JSON.stringify(respInfo)}`)
        }
        if (err) {
          reject(err)
        } else {
          if (respInfo.statusCode !== 200 && this.isLog) {
            this.app.coreLogger.info(`[egg-full-qiniu] getCdnLogList, statusCode: ${respInfo.statusCode}`)
            reject(respBody.error)
          }
          // statusCode 不为 200，请查看 respBody.error
          resolved({
            ok: true,
            ...JSON.parse(respBody)
          })
        }
      })
    }).catch(err => {
      return {
        ok: false,
        err
      }
    })
  }
}

function createOneClient(config, app) {
  assert(
    config.ak && config.sk && config.zone && config.bucket,
    `[egg-full-qiniu] 'config.ak: ${config.ak}', 'config.sk: ${config.sk}', 
        'config.zone: ${config.zone}', 'config.bucket: ${config.bucket}' are required`
  )
  return new FullQiniu(config, app)
}

module.exports = app => {
  app.addSingleton('fullQiniu', createOneClient)
}
