# 去水印工作台

一个纯前端的图片、视频去水印工具，所有处理默认都在浏览器本地完成，不依赖后端。

## 本地使用

1. 直接打开 `index.html`。
2. 上传图片或视频。
3. 用“框选”处理大块区域，用“修复画笔”处理自动修补后的细小残痕。
4. 图片可下载为 `PNG`，视频可导出为 `WebM`。

## 发布前准备

- 页面已经补好了 `manifest`、图标、`robots.txt` 和 `404.html`。
- `edgeone.json` 已经放在项目根目录，可直接用于 EdgeOne Pages。
- 可以运行下面的命令生成发布包：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-release.ps1
```

生成结果：

- `release/site/`
- `release/watermark-studio.zip`

## 推荐发布方式

优先看 [DEPLOY.md](DEPLOY.md)。

- 想最快上线：用腾讯云 EdgeOne Pages 直接上传 `release/watermark-studio.zip`
- 想正式在中国大陆稳定访问：用已备案域名接入阿里云 OSS + CDN

## 说明

- 图片修补适合先自动处理，再用修复画笔收尾。
- 视频处理和导出更吃性能，长视频更建议在桌面浏览器里操作。
- 仅建议用于你有权编辑的媒体内容。
