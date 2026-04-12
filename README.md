# 宝勤的博客

一个使用 Next.js App Router 构建的极简双语个人博客。

## 特性

- 默认访问 `/` 时跳转到 `/zh/about`
- 中英双语路由：`/zh/*` 与 `/en/*`
- About 和 Content 都通过本地 Markdown / YAML 文件管理
- Content 支持 `text`、`video`、`audio`、`link` 四种类型
- `draft: true` 的内容不会出现在正式列表或静态导出参数中
- 使用 `output: "export"` 生成静态站点到 `out/`

## 本地开发

```bash
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

## 构建静态站点

```bash
npm run build
```

构建完成后，静态文件会输出到：

```text
out/
```

## 内容结构

### About

```text
src/data/about/
  ABOUT.zh.md
  ABOUT.en.md
  metadata.json
```

### Content

```text
src/data/content/<slug>/
  meta.zh.yaml
  meta.en.yaml
  content.zh.md
  content.en.md
```

可选封面资源建议放在：

```text
public/images/content/<slug>/
```

如果 `meta.*.yaml` 里的 `cover` 使用 `./cover.svg` 这类相对路径，加载器会自动解析成对应的 `public/images/content/<slug>/...` 静态地址。
