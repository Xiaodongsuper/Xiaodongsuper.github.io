# 个人学术主页

纯静态网页，不需要安装依赖或配置 GitHub Token。内容统一维护在 `data.json`，页面读取公开文件，不读取浏览器草稿。

## 文件

- `data.json`：个人信息、研究方向、动态、论文、招生、项目、奖励等。
- `assets/avatar.jpg`：头像。更换图片时可覆盖此文件，或修改 JSON 中的 `avatar`。
- `index.html` / `style.css` / `app.js`：页面结构、样式和展示逻辑。

## 修改内容

直接编辑 `data.json`，保存后刷新网页。也可以在 GitHub 仓库中打开该文件，点击铅笔修改并提交。GitHub Pages 部署完成后，公开主页才会更新。

| 字段 | 内容 |
| --- | --- |
| `name` / `nameZh` | 中文名 / 英文名（沿用原字段名称） |
| `title` / `affiliation` / `address` | 职称、单位、地址 |
| `links` | 联系方式与外部链接；页面上的邮箱入口在这里修改 |
| `about` / `interests` | 简介 / 研究方向 |
| `news` | 动态，按数组顺序展示；建议最新的放前面，超过 4 条自动折叠 |
| `publications` | 论文；`selected: true` 表示代表作 |
| `recruit` | 招生介绍和各组要求 |
| `grants` / `honors` / `service` / `education` | 项目、奖励、学术服务、教育经历 |
| `projects` | 开源项目，空数组时不显示 |
| `footer` | 最后更新时间，请手动更新 |
| `labels` | 各栏目标题 |

添加论文：复制 `publications` 内一条记录后修改，例如以下仅作格式示范：

```json
{
  "title": "论文标题",
  "authors": "作者一, Xiao Dong, 作者三",
  "venue": "会议或期刊, 2026",
  "year": 2026,
  "selected": true,
  "image": "",
  "links": [
    { "label": "PDF", "url": "https://example.com/paper.pdf" },
    { "label": "Code", "url": "https://github.com/owner/repo" }
  ]
}
```

`year` 可选：未填写时从 `venue` 提取年份；无法确定年份的论文目前隐藏，不在公开列表和计数中展示；补全年份后会自动显示。各年份从新到旧排列，同年论文保持 JSON 中的先后顺序。`image` 可留空；有配图时填相对路径，如 `assets/paper.jpg`。`ccf` 也是可选项。

`highlightName` 控制作者列表中加粗的姓名。个人邮箱若在 `links`、`recruit.intro` 等位置重复出现，请同步修改相关文本。

JSON 使用英文双引号，不允许注释，也不能在最后一个元素后多写逗号。可在终端检查：

```bash
python3 -m json.tool data.json > /dev/null
```

## 本地预览

在本站文件夹中运行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

然后在浏览器打开 `http://127.0.0.1:8000`。不要直接双击 HTML，浏览器可能禁止读取本地 JSON。

## 发布

将 `index.html`、`style.css`、`app.js`、`data.json` 和 `assets/` 放入主页仓库所配置的 Pages 发布目录。保留原有 Pages 配置，提交修改后到 GitHub 的 Actions / Pages 查看部署结果。这里只交付本地改版，没有自动提交或发布到 GitHub。

以后更新内容只需修改 JSON 和对应图片，无需授权服务、Token 或网页编辑后台。

## 论文 GitHub 图标

每篇论文均可填写 `"code": "https://github.com/owner/repo"`。为空时不显示代码入口；填入后自动显示 GitHub 图标和 Code 链接，新标签页打开。原有 `links` 中的 GitHub 链接也会显示图标。请填写论文对应的真实仓库地址。

本次补充链接的依据：[ConsistentID](https://github.com/JackAILab/ConsistentID)、[CatVTON](https://github.com/Zheng-Chong/CatVTON)、[M5Product 官方文档](https://xiaodongsuper.github.io/M5Product_dataset/documentation.html)、[Product1M](https://github.com/zhanxlin/Product1M)。

## 论文 PDF 链接

每篇论文可填写 `"pdf": "https://arxiv.org/pdf/论文编号"` 或 `"pdf": "assets/papers/文件名.pdf"`，自动展示文档图标和 PDF 入口。留空则不显示；原有 arXiv / DOI 链接保留。arXiv 链接是预印本全文，不一定是期刊最终排版版。

## 中英文切换

导航右上角提供“中文 / English”。默认中文，切换后 URL 记录 `?lang=zh` 或 `?lang=en`，刷新与分享保留语言选择。页面链接仍指向本人主页和个人账户。

`data.json` 顶层字段为中文；`translations.en` 为对应英文内容。更新简介、动态、项目或招生内容时请同步维护两份。英文缺失字段回退到顶层内容。论文、PDF、代码链接共用顶层 `publications`，只需维护一次。

## 暂时隐藏招生

顶层 `showRecruit: false` 隐藏中英文招生栏目及所有入口，保留 `recruit` 和英文对应数据。改为 `true` 后恢复显示。
