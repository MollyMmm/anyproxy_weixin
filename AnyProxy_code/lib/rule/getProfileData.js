'use strict';

// const Profile = require('../models/Profile');
// const Post = require('../models/Post');
const url = require('url');
const querystring = require('querystring');
const debug = require('debug')('wechat_spider:data');
const moment = require('moment');
// const unescape = require('unescape-html');


function getProfileData(link, response, content) {

  let serverResData = content.toString();
  content = content.toString();

  let contentType = response.header['Content-Type'];

console.log("======= contentType =======");
console.log(contentType);
console.log(link);

  let postList;
  let promise = Promise.resolve();

  if (contentType == undefined){
    return Promise.resolve();
  }

  // content-type is json or html
  if (contentType.indexOf('json') > -1) {
    // Molly 解析获取到的公众号文章
    content = JSON.parse(content);
    const generalMsgList = JSON.parse(content.general_msg_list);
    postList = generalMsgList.list;

  } else if (contentType.indexOf('html') > -1) {

    if (/profile_ext.+action=home.+__biz/.test(link)) {
    // Molly 处理获取到的公众号基本信息
    // msgBiz title headimg
    promise = promise.then(() => {

      // TODO: 添加公众号, 或者更新公众号信息

      let identifier = querystring.parse(url.parse(link).query);
      let msgBiz = identifier.__biz;
      let title = /var nickname = "(.+?)"/.exec(serverResData)[1];
      let headimg = /var headimg = "(.+?)"/.exec(serverResData)[1];
      let gzh_body = {
        'gzh': title,
        'icon': headimg,
        'biz': msgBiz
      }
      updateGzh(gzh_body);
    });
  }

    // Molly 解析获取到的公众号文章
    content = /var msgList = '(.+)';\n/.exec(content)[1];
    content = JSON.parse(escape2Html(content).replace(/\\\//g,'/'));
    postList = content.list;

  } else {
    return Promise.resolve();
  }

  let parsePosts = [];
  for (let i=0, len=postList.length; i<len; i++) {
    let post = postList[i];
    let appMsg = post.app_msg_ext_info;
    if (appMsg) {
      let publishAt = new Date(post.comm_msg_info.datetime*1000);
      parsePosts.push({
        appMsg: appMsg,
        publishAt: publishAt
      });
      let multiAppMsg = appMsg.multi_app_msg_item_list;
      if (multiAppMsg && multiAppMsg.length) {
        multiAppMsg.forEach(appMsg => {
          parsePosts.push({
            appMsg: appMsg,
            publishAt: publishAt
          });
        });
      }
    }
  }

  return promise.then(() => {
    return Promise.all(parsePosts.map(postObj => {

      let promise = Promise.resolve();
      let appMsg = postObj.appMsg;
      let publishAt = postObj.publishAt;
      return promise.then(() => {

        console.log('======getProfileData  16  !!!!!')
        let title = appMsg.title;
        let link = appMsg.content_url;
        if (title && link) {
          let [ cover, digest, sourceUrl ] = [ appMsg.cover, appMsg.digest, appMsg.source_url ];
          let identifier = querystring.parse(url.parse(link.replace(/amp;/g, '')).query);
          let [ msgBiz, msgMid, msgIdx ] = [ identifier.__biz, identifier.mid, identifier.idx ];

// Molly 处理获取到的公众号文章
// title: title,
// link: link,
// publishAt: publishAt,
// cover: cover,
// digest: digest,
// sourceUrl: sourceUrl

          publishAt = publishAt ? moment(publishAt).format('YYYY-MM-DD HH:mm:ss') : '';
          digest = querystring.unescape(digest);
          let reqBody = {
            'title': title,
            'detail_url': link,
            'post_time': publishAt,
            'news_img':cover,
            'description':digest,
            'gzh_name': msgBiz
          };

console.log("======= saveMsg =======");
    console.log(reqBody);


          saveOnePost(reqBody);
          debug({
            title: title,
            publishAt: publishAt
          });
        };

      }).catch(e => {
        console.log(e);
      });
    }));
  });
}

function saveOnePost(reqBody){
  let path = 'factory_help/save_wx_news';
  let host = '';
  HttpPost(host, reqBody, path);
}

function updateGzh(reqBody){

  let path = 'factory_help/update_one_meiti';
  let host = '';
  HttpPost(host, reqBody, path);
  console.log('更新公众号信息');
  console.log(reqBody);
}

function HttpPost(host, reqBody,url_path){
  let http = require('http');
  let querystring = require('querystring');
  let contents = querystring.stringify(reqBody);
  let options = {
    // host:host,
      host:'127.0.0.1',
      port:'6311',
      path:url_path,
      method:'POST',
      headers:{
          'Content-Type':'application/x-www-form-urlencoded',
          'Content-Length':contents.length
      }
  }
  let req = http.request(options, function(res){
      res.setEncoding('utf8');
      res.on('data',function(data){
          console.log("data:",data);   //一段html代码
      });
  });
  req.write(contents);
  req.end;
}

function getAllProfileData(){
  let reqBody = {'url':'url'};
  let path = 'factory_help/get_spider_gzh';
  let host = '';
  let profile_data;
  // profile_data = HttpPost(host, reqBody, path);
  let http = require('http');
  let querystring = require('querystring');
  let contents = querystring.stringify(reqBody);
  let options = {
    // host:host,
      host:'127.0.0.1',
      port:'6311',
      path:path,
      method:'POST',
      headers:{
          'Content-Type':'application/x-www-form-urlencoded',
          'Content-Length':contents.length
      }
  }
  console.log("req");

  return new Promise((resolve, reject) => {
    let req = http.request(options, function(res){
      console.log("reqing");
        res.setEncoding('utf8');
        res.on('data',function(data){

            let profile_data = data;
            profile_data = JSON.parse(profile_data);
            profile_data = profile_data['data'];
            if(Array.prototype.isPrototypeOf(profile_data) && profile_data.length === 0) {
              resolve([])
            }
            else{
              console.log(profile_data);
              let profile_arr = new Array();
              for (var i = profile_data.length - 1; i >= 0; i--) {
                let biz = profile_data[i]['biz'];
                if (biz != undefined && biz.length > 0){
                  profile_arr.push(biz);
                }

              }

              resolve(profile_arr)
            }
        });
    });
    req.write(contents);
    req.end;
  })
}

// 转义符换成普通字符
function escape2Html(str){
  const arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
  return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
}


exports.getProfileData = getProfileData;
exports.getAllProfileData = getAllProfileData;
