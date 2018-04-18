# anyproxy_weixin
使用anyproxy获取wx_gzh文章 (mac下AnyProxy = 4.0+)

断断续续挣扎了接近一周, 现在实现了自动上滑获取公众号历史文章后, 进行翻页获取下一个公众号历史文章.处理文章的代码还需要再改改!

整个工程里包含了anyproxy的源码,  自己修改了lib/rule_default.js, 还从其他工程里粘贴过来了一个rule文件夹到lib文件夹下(目前只修改了rule/getProfileData.js).

推荐参考的两个小哥哥的文章:

一个地址是:

windows版

[使用AnyProxy自动抓取微信公众号数据-包括阅读数和点赞数](https://gitee.com/zsyoung01/AnyProxy)

另一个小哥哥的文章地址:

AnyProxy版本是3.10+

[持续更新，微信公众号文章批量采集系统的构建](https://zhuanlan.zhihu.com/p/24302048)

[微信公众号文章采集的入口--历史消息页详解](https://zhuanlan.zhihu.com/p/24350954)

一.
![](https://note.youdao.com/yws/public/resource/85744f2f6e1ee633358d566919ef23ef/6dbed156370be50e3063e256b45ccf52)

anyproxy接收到response后,进行三个操作:

1.修改微信服务器返回的数据, 插入js

2.解析数据, 并插入到数据库中

3.拦截请求, 用本地的图片替换返回的所有网络图片, 加快请求速度, 减少不必要的请求

二. js注入讲解
1.文章页自动翻页原理为在网页head 部分插入类似以下形式代码，表示隔5s 跳转至下一个文章页
```
<meta http-equiv="refresh" content="5;url=https://..." />
```
2.历史消息页注入Js 脚本示例，将以下脚本插入至返回给微信客户端的数据中，可以使网页自动下拉至最低端，到最早一篇文章之后再跳转至下一个历史消息详情页：

```
let nextLink = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${profile}&scene=124#wechat_redirect`
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
```


三. rule_default.js

````
*beforeSendResponse(requestDetail, responseDetail) {
    let link = requestDetail.url;
    let serverResData = responseDetail.response.body;
    let res = responseDetail.response;
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
````




