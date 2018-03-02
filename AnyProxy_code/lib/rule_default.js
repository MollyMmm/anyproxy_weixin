// 'use strict';

// const getMainData = require('./rule/getMainData');
// const myProfile = require('./rule/getProfileData');
const getProfileData = require('./rule/getProfileData').getProfileData;
console.log(getProfileData)
const getAllProfileData = require('./rule/getProfileData').getAllProfileData;
// const insertJsToNextPage = require('./rule/insertJsToNextPage');
const insertJsToNextProfile = require('./rule/insertJsToNextProfile');
// const getComment = require('./rule/getComment');
const config = require('./rule/config');

const url = require('url');
// const cheerio = require('cheerio');
const querystring = require('querystring');

// 全局对象，判断某一公众号指定天数内的文章
var isScrollDown = {}
var profiles = [];

getAllProfiles(() => {
  console.log('数据库中现在需要抓取的历史公众号数量：' + profiles.length);
});

// 程序一开始从数据库中取出所有待抓取的公众号保存在数组中
function getAllProfiles(cb){
  getAllProfileData().then(res => {
    profiles = res;
    cb();
  });
}


module.exports = {

  summary: 'the default rule for AnyProxy',

  /**
   *
   *
   * @param {object} requestDetail
   * @param {string} requestDetail.protocol
   * @param {object} requestDetail.requestOptions
   * @param {object} requestDetail.requestData
   * @param {object} requestDetail.response
   * @param {number} requestDetail.response.statusCode
   * @param {object} requestDetail.response.header
   * @param {buffer} requestDetail.response.body
   * @returns
   */
  *beforeSendRequest(requestDetail) {
    return null;
  },


  /**
   *
   *
   * @param {object} requestDetail
   * @param {object} responseDetail
   */
  *beforeSendResponse(requestDetail, responseDetail) {
    let link = requestDetail.url;
    let serverResData = responseDetail.response.body;
    let res = responseDetail.response;
// console.log("======= body =======");
// console.log(serverResData.toString('utf8'));
    // console.log("======= response =======");
    // console.log(res);
    serverResData = serverResData.toString('utf8');

    // 获取点赞量和阅读量
    if (link.indexOf('getappmsgext') > -1) {
      // getMainData(link, serverResData).then(() => {
      //   callback(serverResData);
      // });
      return null;
    } else if (/profile_ext.+__biz/.test(link)) {

      // 通过历史消息页抓取文章url等
      console.log('======this is weixin message!!!!!')
      getProfileData(link, res, serverResData);

      console.log('======get Res!!!!!')
        const newResponse = responseDetail.response;

  if (/profile_ext.+action=home.+__biz/.test(link)) {

    console.log(profiles);

    profile = profiles.pop();
    console.log(profile);
    if (profile != undefined){
      let nextLink = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${profile}&scene=124#wechat_redirect`
    console.log(nextLink);
//      let insertJs = `<script type="text/javascript">
//     var end = document.createElement("p");
//     document.body.appendChild(end);
//     (function scrollDown(){
//         // 下拉至页面最低端后，微信会自动向服务器请求数据
//         // end.scrollIntoView();
//         // var loadMore = document.getElementsByClassName("loadmore with_line")[0];
//         // 判断是否到达最早一篇文章
//         // if (!loadMore.style.display) {
//             // document.body.scrollIntoView();
//             // 插入meta，使10秒后自动翻页
//             var meta = document.createElement("meta");
//             meta.httpEquiv = "refresh";
//             meta.content = "10;url=${nextLink}";
//             document.head.appendChild(meta);
//         // } else {
//             // 每个随机时间段下拉网页
//             // window.scrollTo(0, document.body.scrollHeight);
//             // setTimeout(scrollDown,Math.floor(Math.random()*5000+3000));
//         // }
//     })();
// </script>`;
    let insertJs = `<script type="text/javascript">
    var end = document.createElement("p");
    document.body.appendChild(end);
    (function scrollDown(){
        // 下拉至页面最低端后，微信会自动向服务器请求数据
        end.scrollIntoView();
        var loadMore = document.getElementsByClassName("loadmore with_line")[0];
        // 判断是否到达最早一篇文章
        if (!loadMore.style.display) {
            document.body.scrollIntoView();
            // 插入meta，使10秒后自动翻页
            var meta = document.createElement("meta");
            meta.httpEquiv = "refresh";
            meta.content = "10;url=${nextLink}";
            document.head.appendChild(meta);
        } else {
            // 每个随机时间段下拉网页
            window.scrollTo(0, document.body.scrollHeight);
            setTimeout(scrollDown,Math.floor(Math.random()*5000+3000));
        }
    })();
</script>`;

      let content = newResponse.body.toString();
            if (/javascript">/.test(content)){
              content = content.replace('<!--headTrap<body></body><head></head><html></html>-->','').replace('<!--tailTrap<body></body><head></head><html></html>-->','');
              content = content.replace('</body>',insertJs + '\n</body>');
            }
            else{
              content += insertJs;
            }
      content += insertJs;
      newResponse.body = content;
      responseDetail.response = newResponse;
      console.log('===== new res  =======');
      console.log(newResponse.body.toString());
    }

    return new Promise((resolve, reject) => {
    setTimeout(() => { // delay the response for 5s
      resolve(responseDetail);
    }, 5000);
    });
  }
  

    // 文章页跳转
    } else if (/\/s\?__biz/.test(link) || /mp\/appmsg\/show/.test(link)) {
      insertJsToNextPage(link, serverResData).then((content) => {
        if (content) {
          // callback(content);
          return null;
        } else {
          // callback(serverResData);
          return null;
        }
      });
    } else if (/\/mp\/appmsg_comment/.test(link)) {
      if (config.isCrawlComments) getComment(link, serverResData);
      // callback(serverResData);
      return null;
    } else {
      // callback(serverResData);
      return null;
    }
  },


  /**
   * default to return null
   * the user MUST return a boolean when they do implement the interface in rule
   *
   * @param {any} requestDetail
   * @returns
   */
  *beforeDealHttpsRequest(requestDetail) {
    return null;
  },

  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onError(requestDetail, error) {
    return null;
  },


  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onConnectError(requestDetail, error) {
    return null;
  },
};
