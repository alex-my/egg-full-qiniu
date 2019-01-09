'use strict';

const assert = require('assert');
const mock = require('egg-mock');

describe('test/full-qiniu.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/full-qiniu-test',
      plugin: 'full-qiniu',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should test hi', () => {
    assert(app.fullQiniu.hi() === 'hi');
  });
});