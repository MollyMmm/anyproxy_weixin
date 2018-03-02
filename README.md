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


