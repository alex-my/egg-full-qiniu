'use strict';

exports.keys = '123456';


exports.fullQiniu = {
  default: {
    ak: '123', // Access Key
    sk: '456', // Secret Key
  },
  app: true,
  agent: false,

  // 单实例
  // 通过 app.fullQiniu 直接使用实例
  client: {
    zone: 'Zone_z0', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
    bucket: 'image',
  },

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
