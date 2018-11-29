'use strict';

/**
 * 支持以下功能：
 * 1 文件上传：
 *  1.1 文件上传 (未完成)
 *  1.2 字节数组上传 (未完成)
 *  1.3 数据流上传 (未完成)
 * 2 资源管理
 *  2.1 获取文件信息 (未完成)
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

class FullQiniu {
  constructor(config) {
    this.config = config;
  }

  hi() {
    return 'hi, egg-full-qiniu';
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
