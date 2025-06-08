# 小说评分排行榜 Chrome扩展

这是一个Chrome扩展，用于获取全网评分最高的各类型和题材小说前50名。

## 功能特点

- 支持多个数据源（Goodreads、豆瓣读书等）
- 按类型和题材分类展示小说
- 自动定期更新数据
- 可自定义显示设置
- 支持收藏喜爱的小说

## 安装方法

### 从Chrome应用商店安装

1. 访问[Chrome应用商店](https://chrome.google.com/webstore/category/extensions)
2. 搜索"小说评分排行榜"
3. 点击"添加到Chrome"按钮

### 开发者模式安装

1. 下载或克隆本仓库
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的文件夹

## 使用方法

1. 安装扩展后，点击Chrome工具栏中的扩展图标
2. 在弹出窗口中查看各类型小说的排行榜
3. 使用下拉菜单切换不同的小说类型
4. 点击小说项可查看详情
5. 点击设置链接可自定义扩展行为

## 开发说明

### 项目结构

```
novel-ratings-extension/
├── manifest.json      # 扩展配置文件
├── popup/             # 弹出窗口相关文件
├── background/        # 后台脚本
├── content/           # 内容脚本
├── options/           # 设置页面
├── utils/             # 工具函数
└── assets/            # 资源文件
```

### 技术栈

- HTML/CSS/JavaScript
- Chrome Extension API
- Web爬虫技术

### 构建与发布

1. 修改代码后，更新manifest.json中的版本号
2. 打包扩展：
   - 进入扩展管理页面
   - 开启开发者模式
   - 点击"打包扩展程序"
   - 选择项目文件夹
3. 提交到Chrome应用商店：
   - 访问[Chrome开发者控制台](https://chrome.google.com/webstore/devconsole)
   - 上传打包好的.crx文件

## 注意事项

- 本扩展仅用于学习和个人使用
- 请遵守各数据源的使用条款
- 不要过于频繁地请求数据，以避免IP被封

## 许可证

MIT 