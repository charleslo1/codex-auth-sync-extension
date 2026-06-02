# Codex Auth Sync

把已经登录 ChatGPT 的 Chrome session 同步到 Codex 本地登录文件：

```text
~/.codex/auth.json
```

这个工具由一个 Chrome 插件和一个本机助手组成。插件负责读取 ChatGPT session，
本机助手负责把转换后的内容写入本机 Codex 配置目录。

> 只在你自己的电脑和你自己的账号上使用。工具不会上传 token。

目前安装脚本面向 macOS + Google Chrome。

## 从 GitHub Release 安装

1. 打开项目的 GitHub Releases 页面。

2. 下载最新版本的 zip 包资产，例如：

```text
codex-auth-sync-extension-v1.0.0.zip
```

3. 解压 zip 包到本机目录。

4. 打开 Chrome 扩展管理页：

```text
chrome://extensions
```

5. 打开右上角 `Developer mode`。

6. 点击 `Load unpacked`，选择解压目录里的 `extension` 文件夹。

7. 在扩展卡片里复制 Chrome 生成的扩展 ID。

8. 打开终端，进入解压后的项目目录，注册本机助手：

```bash
chmod +x ./install-native-host.sh
./install-native-host.sh <chrome-extension-id>
```

把 `<chrome-extension-id>` 替换为第 7 步复制的扩展 ID。

## 使用插件

1. 确认你已经在 Chrome 里登录 ChatGPT。

2. 点击 Chrome 工具栏里的 `Codex Auth Sync` 插件图标。

3. 插件会读取 session 并生成 Codex 可用的 `auth.json` 内容。

4. 点击 `同步到Codex`，写入：

```text
~/.codex/auth.json
```

如果这个文件已存在，工具会先自动备份为：

```text
~/.codex/auth.json.backup.<UTC timestamp>
```

## 常见问题

### 为什么还要运行安装脚本？

Chrome 插件不能直接写入 `~/.codex/auth.json`。安装脚本会注册一个 Chrome Native
Messaging 本机助手，让插件可以把生成的内容安全地写入本机文件。

### 可以不写入文件，只复制内容吗？

可以。插件弹窗里也会显示生成后的 JSON 内容，你可以手动复制。

### 更新插件时需要重新安装本机助手吗？

如果 Chrome 扩展 ID 没变，通常不需要。如果你删除后重新加载扩展，Chrome 可能会生成新的扩展
ID，这时需要重新运行：

```bash
./install-native-host.sh <new-chrome-extension-id>
```

## 技术说明

实现细节、转换规则、Native Messaging 说明和维护者说明见
[`docs/technical.md`](docs/technical.md)。
