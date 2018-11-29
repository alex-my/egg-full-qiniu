'use strict';

const qiniu = require('./lib/qiniu');

module.exports = agent => {
  if (agent.config.fullQiniu.agent) qiniu(agent);
};
