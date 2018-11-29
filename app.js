'use strict';

const qiniu = require('./lib/qiniu');

module.exports = app => {
  if (app.config.fullQiniu.app) qiniu(app);
};
