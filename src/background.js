let cameraOn = false;
let cameraKnown = false;
let activeTabId = null;
let trackedWindowId = null;
let cursorReady = null;
const retryAfter = new Map();

function isBrowserTab(tab) {
    if (!tab?.id || !tab.url) return false;
    return /^(https?|file):/.test(tab.url);
}

async function cameraEnabled() {
    if (!cameraKnown) {
        const result = await chrome.storage.local.get("cameraEnabled");
        cameraOn = result.cameraEnabled === true;
        cameraKnown = true;
    }
    return cameraOn;
}

function publishReady(ready) {
    if (cursorReady === ready) return;
    cursorReady = ready;
    chrome.storage.session.set({ cursorReady: ready });
}

async function rememberTab(tab) {
    if (!isBrowserTab(tab)) return;
    activeTabId = tab.id;
    trackedWindowId = tab.windowId;
    retryAfter.delete(tab.id);
    await chrome.storage.session.set({ activeTabId: tab.id });
    publishReady(true);
}

async function ensureContentScript(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { type: "PING" });
        return;
    } catch {
        // The page does not have the content script yet.
    }

    await chrome.scripting.executeScript({
        target: { tabId },
        files: ["assets/content.js"],
    });
}

async function setActiveTab(tabId) {
    if (!tabId) return;

    let tab;
    try {
        tab = await chrome.tabs.get(tabId);
    } catch {
        return;
    }
    if (!isBrowserTab(tab)) {
        activeTabId = null;
        publishReady(false);
        return;
    }

    await rememberTab(tab);
    try {
        await ensureContentScript(tab.id);
    } catch (error) {
        console.warn("content script inject failed", error);
        retryAfter.set(tab.id, Date.now() + 1500);
    }
}

async function followWindow(windowId) {
    if (!windowId) return;
    const win = await chrome.windows.get(windowId, { populate: true });
    if (win.type !== "normal") return;

    trackedWindowId = win.id;
    const tab = win.tabs?.find((item) => item.active);
    if (!tab?.id || !isBrowserTab(tab)) {
        activeTabId = null;
        publishReady(false);
        return;
    }

    await setActiveTab(tab.id);
}

async function currentTabId() {
    if (activeTabId) return activeTabId;
    const stored = await chrome.storage.session.get("activeTabId");
    if (typeof stored.activeTabId === "number") {
        activeTabId = stored.activeTabId;
    }
    return activeTabId;
}

async function relayGesture(message) {
    if (!(await cameraEnabled())) return;

    let tabId = await currentTabId();
    if (!tabId && trackedWindowId) {
        await followWindow(trackedWindowId);
        tabId = activeTabId;
    }
    if (!tabId) {
        publishReady(false);
        return;
    }
    if ((retryAfter.get(tabId) ?? 0) > Date.now()) return;

    try {
        await chrome.tabs.sendMessage(tabId, message);
        publishReady(true);
    } catch {
        try {
            await ensureContentScript(tabId);
            await chrome.tabs.sendMessage(tabId, message);
            publishReady(true);
        } catch (error) {
            console.warn("gesture relay failed", error);
            retryAfter.set(tabId, Date.now() + 1500);
            activeTabId = null;
            publishReady(false);
        }
    }
}

chrome.storage.local.get("cameraEnabled", (result) => {
    cameraOn = result.cameraEnabled === true;
    cameraKnown = true;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.cameraEnabled) {
        cameraOn = changes.cameraEnabled.newValue === true;
        cameraKnown = true;
        if (!cameraOn) publishReady(false);
    }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "ARM") {
        (async () => {
            const tab = message.tabId
                ? await chrome.tabs.get(message.tabId).catch(() => null)
                : null;
            if (tab?.windowId) {
                await followWindow(tab.windowId);
                return;
            }
            const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
            const win = windows.find((item) => item.focused) ?? windows[0];
            if (win?.id) await followWindow(win.id);
            else publishReady(false);
        })().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
        return true;
    }

    if (message?.type === "GESTURE") {
        relayGesture(message);
        sendResponse({ ok: true });
        return true;
    }

    return false;
});

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
    if (!(await cameraEnabled())) return;
    const win = await chrome.windows.get(windowId);
    if (win.type !== "normal") return;
    trackedWindowId = windowId;
    await setActiveTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!cameraOn) return;
    if (!changeInfo.url && changeInfo.status !== "complete") return;
    if (!tab.active || !isBrowserTab(tab)) return;

    chrome.windows.get(tab.windowId, (win) => {
        if (chrome.runtime.lastError || win.type !== "normal") return;
        if (trackedWindowId && tab.windowId !== trackedWindowId) return;
        setActiveTab(tabId);
    });
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
    if (!(await cameraEnabled())) return;
    await followWindow(windowId);
});

chrome.windows.onRemoved.addListener((windowId) => {
    chrome.storage.session.get("cameraWindowId", (stored) => {
        if (stored.cameraWindowId !== windowId) return;
        chrome.storage.session.remove("cameraWindowId");
        chrome.storage.local.set({ cameraEnabled: false });
    });
});
