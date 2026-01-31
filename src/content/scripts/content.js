// src/content/scripts/content.js

// Функція, яка чітко знає: показати чи сховати
function updateOverlayState(shouldBeEnabled) {
    const existingIframe = document.getElementById('touchless-overlay-frame');

    if (shouldBeEnabled) {
        if (!existingIframe) {
            console.log('enable content script');
            createOverlay();
        }
    } else {
        if (existingIframe) {
            console.log('disable content script');
            existingIframe.remove();
        }
    }
}

function createOverlay() {
    const iframe = document.createElement('iframe');
    iframe.id = 'touchless-overlay-frame';
    iframe.src = chrome.runtime.getURL('index.html');
    iframe.allow = "camera; microphone";

    Object.assign(iframe.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '350px',
        height: '250px',
        border: 'none',
        zIndex: '2147483647',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        background: 'transparent'
    });

    document.body.appendChild(iframe);
}


chrome.storage.local.get(['cameraEnabled'], (result) => {
    if (result.cameraEnabled) {
        updateOverlayState(true);
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.cameraEnabled) {
        const newValue = changes.cameraEnabled.newValue;
        updateOverlayState(newValue);
    }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "TOGGLE_OVERLAY") {
//         const existingIframe = document.getElementById('touchless-overlay-frame');
//         const newState = !existingIframe;
//
//         updateOverlayState(newState);
//
//     }
// });
