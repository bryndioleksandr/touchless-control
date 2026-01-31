async function ensureOffscreenCreated() {
    if (await chrome.offscreen.hasDocument()) return;

    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Gestures recognition'
    });
}

chrome.runtime.onStartup.addListener(ensureOffscreenCreated);
chrome.runtime.onInstalled.addListener(ensureOffscreenCreated);

chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.cameraEnabled) {
        if (changes.cameraEnabled.newValue) {
            await ensureOffscreenCreated();
        } else {
            chrome.offscreen.closeDocument();
        }
    }
});
