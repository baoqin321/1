# 发布说明

## 推荐方案：腾讯云 EdgeOne Pages

适合你现在这个项目，因为它本身就是纯静态站，不需要服务器，不需要数据库，也不需要构建步骤。

### 直接上线

1. 先在项目目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-release.ps1
```

2. 打开 EdgeOne Pages 直传页面或控制台创建项目。
3. 选择 `Direct Upload`。
4. 上传 `release/watermark-studio.zip`。
5. 部署完成后先用平台分配的预览地址测试。

### 区域怎么选

- 只是先公开演示：可以先用平台预览域名。
- 想让中国大陆访问更稳，并绑定你自己的域名：项目区域选中国大陆可用区或包含中国大陆的全球可用区，然后绑定自定义域名。

### 需要注意

- 你项目根目录里的 `edgeone.json` 会一起生效，已经配置好了基础缓存和安全响应头。
- 如果你绑定自己的域名，并且项目区域选的是中国大陆可用区或“全球可用区（含中国大陆）”，域名需要先完成 ICP 备案。

## 正式国内方案：阿里云 OSS + CDN

如果你是准备长期正式使用，而且希望中国大陆访问更稳，这个方案更传统，也更可控。

### 基本做法

1. 准备一个已经备案的域名。
2. 在 OSS 创建 Bucket，并开启静态网站托管。
3. 把 `release/site/` 里的文件上传到 OSS。
4. 给 OSS 绑定自定义域名。
5. 再给这个域名接入阿里云 CDN。

### 为什么不是只用 OSS 默认地址

- OSS 官方文档明确说明，直接用 Bucket 默认域名访问 HTML 时，浏览器会强制下载而不是正常打开网页。
- 从 2025-03-20 起，中国大陆地域的新 OSS 用户也不能再通过默认公网 Endpoint 公开访问数据 API，需要改用自定义域名。

所以如果你走 OSS 方案，实际可用的正式做法就是：

`OSS 静态托管 + 自定义域名 + CDN`

## 手机和电脑访问

这个站现在已经补了：

- 移动端 `viewport` 和安全区适配
- 响应式布局
- `manifest` 和站点图标
- `404.html`

因此只要托管平台提供 HTTPS，手机和电脑都能直接访问。

## 我给你准备好的文件

- `edgeone.json`：EdgeOne Pages 配置
- `site.webmanifest`：移动端安装信息
- `favicon.svg`：站点图标
- `404.html`：错误页
- `build-release.ps1`：一键生成发布包

## 官方资料

- EdgeOne Pages 直传文档：https://pages.edgeone.ai/document/direct-upload
- EdgeOne `edgeone.json` 文档：https://pages.edgeone.ai/document/edgeone-json
- EdgeOne 自定义域名文档：https://pages.edgeone.ai/document/custom-domain
- EdgeOne Pages Drop：https://pages.edgeone.ai/drop
- 阿里云 OSS 静态网站托管：https://www.alibabacloud.com/help/en/oss/user-guide/hosting-static-websites
- 阿里云 OSS 自定义域名：https://www.alibabacloud.com/help/en/oss/user-guide/access-buckets-via-custom-domain-names
- 阿里云 OSS CDN 加速：https://www.alibabacloud.com/help/en/oss/user-guide/cdn-acceleration
