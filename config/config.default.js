'use strict';

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
  //         baseUrl: null, // 用于拼接已上传文件的完整地址
  //     },
  //     myText: {
  //         zone: '', // Zone_z0 华东, Zone_z1 华北, Zone_z2 华南, Zone_na0 北美
  //         bucket: '',
  //         baseUrl: null, // 用于拼接已上传文件的完整地址
  //     },
  // },
};