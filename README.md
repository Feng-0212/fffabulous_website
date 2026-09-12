# FFFabulous 官网(本地开发版)

按《FFFabulous机器人社官网设计档案》v2.5 搭建的静态前台(Phase 1-2)。

## 本地预览

```bash
cd fffabulous-site
python -m http.server 8137
# 浏览器打开 http://localhost:8137/index.html
```

必须通过 HTTP 访问(直接双击 HTML 打开会因 fetch 限制看不到数据)。

## 结构

```
index.html            首页(轮播/统计/荣誉精选/机器人精选/动态/新人横幅/关注)
about.html            关于我们(简介 + 五分组)
history.html          历程与传承(时间线)
news.html             新闻动态(分类 Tab + 分页 + 置顶公告条)
news-detail.html      新闻详情(Markdown 渲染)
honors.html           荣誉墙(CSV 驱动 + 类别/级别/年份筛选)
robots.html           机器人作品集(按赛季分组)
robot-detail.html     机器人详情(参数表 / CAD 与代码空置占位 / B站视频位)
newbie.html           新人专区(方向卡 / 成长路线 / 资源导航 / FAQ)
gallery.html          照片图集(相册 + 灯箱)
data/                 全部内容数据(改这里 = 改网站,UTF-8)
assets/css/style.css  设计系统(复旦蓝 #00205B / 亮蓝 #2F6FED / 冰蓝 / 荣誉金)
assets/js/main.js     数据读取、CSV/Markdown 解析、各页渲染
assets/img/logo.jpg   队徽
```

## 修改内容

- 改文字/数据:编辑 `data/` 下对应文件,刷新即生效(无需构建);
- 荣誉记录:`data/honors.csv`,可用 Excel 编辑后「另存为 CSV UTF-8」覆盖;
- 新闻:在 `data/news/index.json` 加条目 + 同名 `.md` 正文;
- 机器人:`data/robots.json`(CAD / repo / codeSnippet 留空即显示占位框,填入即展示)。

## 下一步(未做)

- Phase 3:管理后台(Node.js,登录分权,表单编辑 data 文件);
- 字体自托管(Noto Sans SC / Montserrat woff2,当前用系统字体);
- 真实素材替换全部「占位」。
