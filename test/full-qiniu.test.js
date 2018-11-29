'use strict';

const mock = require('egg-mock');

describe('test/full-qiniu.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/full-qiniu-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, fullQiniu')
      .expect(200);
  });
});
