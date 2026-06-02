const SESSION_URL = "https://chatgpt.com/api/auth/session";
const NATIVE_HOST = "com.codex.auth_sync";

const statusEl = document.getElementById("status");
const outputEl = document.getElementById("authOutput");
const refreshButton = document.getElementById("refreshButton");
const copyButton = document.getElementById("copyButton");
const saveButton = document.getElementById("saveButton");

let latestAuth = null;

document.addEventListener("DOMContentLoaded", () => {
  refreshButton.addEventListener("click", refreshAuth);
  copyButton.addEventListener("click", copyAuth);
  saveButton.addEventListener("click", saveAuth);
  refreshAuth();
});

async function refreshAuth() {
  setStatus("正在读取 ChatGPT session...");
  setBusy(true);
  latestAuth = null;
  outputEl.value = "";

  try {
    const response = await fetch(SESSION_URL, {
      credentials: "include",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`session 请求失败：HTTP ${response.status}`);
    }

    const session = await response.json();
    latestAuth = convertSessionToAuth(session);
    outputEl.value = JSON.stringify(latestAuth, null, 2);
    copyButton.disabled = false;
    saveButton.disabled = false;
    setStatus("已生成 auth.json 内容。", "success");
  } catch (error) {
    outputEl.value = "";
    copyButton.disabled = true;
    saveButton.disabled = true;
    setStatus(error.message || String(error), "error");
  } finally {
    setBusy(false);
  }
}

function convertSessionToAuth(session) {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    throw new Error("session JSON 不是对象，请确认 ChatGPT 已登录。");
  }

  const accessToken = session.accessToken;
  const accountId = session.account && session.account.id;

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("session 缺少 accessToken，请确认 ChatGPT 已登录。");
  }
  if (typeof accountId !== "string" || accountId.length === 0) {
    throw new Error("session 缺少 account.id。");
  }

  return {
    last_refresh: new Date().toISOString().replace("Z", "000Z"),
    tokens: {
      access_token: accessToken,
      id_token: accessToken,
      refresh_token: accessToken,
      account_id: accountId
    }
  };
}

async function copyAuth() {
  if (!latestAuth) {
    return;
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(latestAuth, null, 2));
    setStatus("已复制。", "success");
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
}

async function saveAuth() {
  if (!latestAuth) {
    return;
  }

  setBusy(true);
  setStatus("正在保存到 ~/.codex/auth.json...");

  try {
    const response = await sendNativeMessage({
      type: "saveAuth",
      auth: latestAuth
    });

    if (!response || response.ok !== true) {
      throw new Error((response && response.error) || "Native host 保存失败。");
    }

    const backupText = response.backup_path ? `，已备份旧文件` : "";
    setStatus(`已保存到 ${response.path}${backupText}。`, "success");
  } catch (error) {
    setStatus(`${error.message || String(error)}。请先安装 native host。`, "error");
  } finally {
    setBusy(false);
  }
}

function sendNativeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function setBusy(isBusy) {
  refreshButton.disabled = isBusy;
  if (latestAuth) {
    copyButton.disabled = isBusy;
    saveButton.disabled = isBusy;
  }
}

function setStatus(message, tone = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${tone}`.trim();
}
