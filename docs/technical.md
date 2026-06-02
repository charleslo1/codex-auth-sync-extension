# 技术说明

## 概览

Codex Auth Sync 从已经登录 ChatGPT 的 Chrome 读取当前 session，把它转换成 Codex
客户端使用的 `auth.json` 结构，并写入：

```text
~/.codex/auth.json
```

项目由两部分组成：

- Chrome 插件：请求 `https://chatgpt.com/api/auth/session`，展示转换后的 JSON，
  支持复制，并调用本机助手。
- Native Messaging 本机助手：接收插件传来的 auth payload，并写入本机 Codex
  配置目录。

## 项目文件

- `extension/manifest.json`：Chrome MV3 扩展清单。
- `extension/popup.html`：扩展弹窗结构。
- `extension/popup.css`：扩展弹窗样式。
- `extension/popup.js`：请求 session、转换 JSON、复制、调用 native host。
- `native-host/codex_auth_sync_host.py`：写入 `~/.codex/auth.json` 的本机助手。
- `install-native-host.sh`：注册 Chrome Native Messaging host。

## Chrome 插件

插件请求：

```text
https://chatgpt.com/api/auth/session
```

然后把响应转换成 Codex auth JSON，并展示在弹窗里。弹窗提供两个操作：

- `复制`：复制生成后的 JSON。
- `同步到Codex`：把生成后的 JSON 发给 native host 写入本机文件。

扩展权限如下：

```json
{
  "permissions": ["nativeMessaging"],
  "host_permissions": ["https://chatgpt.com/*"]
}
```

## Native Messaging

Chrome 插件不能直接写入任意本机文件。`同步到Codex` 按钮通过 Chrome Native
Messaging 调用本机 host：

```text
com.codex.auth_sync
```

`install-native-host.sh` 会安装：

- Python host 脚本：`~/.codex/codex_auth_sync_host.py`
- Chrome Native Messaging manifest：
  `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.codex.auth_sync.json`

manifest 里的 `allowed_origins` 会绑定安装时传入的 Chrome 扩展 ID：

```text
chrome-extension://<chrome-extension-id>/
```

如果用户删除并重新加载 unpacked extension，Chrome 可能会生成新的扩展 ID。这时需要用新的
ID 重新运行安装脚本。

## 转换规则

ChatGPT session 到 Codex auth 的映射关系：

- `tokens.access_token` = `session.accessToken`
- `tokens.id_token` = `session.accessToken`
- `tokens.refresh_token` = `session.accessToken`
- `tokens.account_id` = `session.account.id`
- `last_refresh` = 当前 UTC 时间

输出结构：

```json
{
  "last_refresh": "2026-06-02T03:34:23.183000Z",
  "tokens": {
    "access_token": "<accessToken>",
    "id_token": "<accessToken>",
    "refresh_token": "<accessToken>",
    "account_id": "<account.id>"
  }
}
```

## 安全行为

- 默认写入 `~/.codex/auth.json`。
- native host 会在需要时创建 `~/.codex`。
- native host 会尽量把 `~/.codex` 权限设置为 `0700`。
- 写出的 `auth.json` 权限会设置为 `0600`。
- 覆盖已有 `auth.json` 前会自动备份。
- 本项目不会上传 token。

## Release 打包

通过 GitHub Release 分发时，建议 zip 包包含：

- `extension/`
- `native-host/`
- `install-native-host.sh`
- `README.md`
- `docs/`

不要把 `.crx` 作为 macOS 或 Windows 普通用户的主要分发方式。当前推荐的 Release
安装路径是 Chrome Developer mode + `Load unpacked`。

建议资产名称：

```text
codex-auth-sync-extension-v<version>.zip
```

## 兼容性说明

Codex 的 `auth.json` 是本地客户端登录状态文件，内部格式可能随 Codex 客户端变化。
如果 Codex 不再接受生成后的 auth 文件，需要用新的可用 `auth.json` 样例重新校验并更新转换规则。
