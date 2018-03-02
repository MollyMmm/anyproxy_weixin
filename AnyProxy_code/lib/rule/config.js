'use strict';

const fs = require('fs');

const config = {
  mongodb: {
    db: 'mongodb://master:Qimingpian@123.207.162.169:27017/wechat_spider?authSource=admin'
  },
  insertJsToNextPage: {
    // 是否自动跳转页面
    disable: true,
    // 跳转时间间隔 s
    jumpInterval: 2,
    // 跳转文章发布时间范围
    minTime: new Date(2012, 7, 28),
    maxTime: new Date(2018, 3, 1),
    // 已有数据的文章是否再抓取
    isCrawlExist: false,
    // if true updateNumAt - publishAt
    crawlExistInterval: 1000*60*60*24*3,
    // 抓取公众号biz 范围
    targetBiz: [],
    // 是否保存文章内容
    isSavePostContent: true,
    // 保存内容的形式: html/text
    saveContentType: 'text',
  },
  insertJsToNextProfile: {
    // 是否自动跳转页面
    disable: false,
    // 跳转时间间隔 s
    jumpInterval: 15,
    // 抓取到minTime 就跳转至下一公众号
    minTime: new Date(2012, 12, 31),
    // 自定义最近多久更新的公众号本次就不用抓取
    maxUpdatedAt: new Date(2018, 3, 1),
    // 抓取公众号biz 范围
    targetBiz: ['MzIwNTQzNzQzMw=='],
    // 程序开始时间
    beginTime: new Date()
  },
  // 是否抓取评论
  isCrawlComments: false
};

try {
  // 引入外部biz 文件
  fs.accessSync('./targetBiz.json');
  config.insertJsToNextProfile.targetBiz = require('./targetBiz.json');
  config.insertJsToNextPage.targetBiz = require('./targetBiz.json');
} catch(e) {
  // Do nothing
}

module.exports = config;
