import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom/client'

const CAMERA_WIDTH = 400;
const CAMERA_HEIGHT = 680;

function Popup() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        chrome.storage.local.get(['cameraEnabled'], (result) => {
            setIsEnabled(result.cameraEnabled === true);
        });
    }, []);

    const openCameraWindow = async () => {
        const stored = await chrome.storage.session.get('cameraWindowId');
        if (typeof stored.cameraWindowId === 'number') {
            try {
                await chrome.windows.update(stored.cameraWindowId, { focused: true });
                return;
            } catch {
                // The previous camera window is already closed.
            }
        }

        const win = await chrome.windows.create({
            url: chrome.runtime.getURL('index.html'),
            type: 'popup',
            width: CAMERA_WIDTH,
            height: CAMERA_HEIGHT,
            left: Math.max(0, window.screen.availWidth - CAMERA_WIDTH - 16),
            top: 40,
            focused: true,
        });

        if (win && win.id != null) {
            await chrome.storage.session.set({ cameraWindowId: win.id });
        }
    };

    const toggleCamera = async () => {
        const next = !isEnabled;
        setError(null);

        try {
            if (next) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.storage.local.set({ cameraEnabled: true });
                await chrome.runtime.sendMessage({ type: 'ARM', tabId: tab?.id }).catch(() => undefined);
                await openCameraWindow();
            } else {
                await chrome.storage.local.set({ cameraEnabled: false });
                const stored = await chrome.storage.session.get('cameraWindowId');
                if (typeof stored.cameraWindowId === 'number') {
                    try {
                        await chrome.windows.remove(stored.cameraWindowId);
                    } catch {
                        // The window was already closed.
                    }
                }
            }
            setIsEnabled(next);
        } catch (e) {
            console.error(e);
            setError('Не вдалося відкрити вікно камери');
        }
    };

    return (
        <div style={{ width: '240px', padding: '12px', fontFamily: 'system-ui, sans-serif' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '16px' }}>Touchless Control</h2>
            <p style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.4 }}>
                Відкриється вікно камери. Натисни там «Дозволити камеру». Курсор піде на звичайний сайт, не на нову вкладку.
            </p>
            <button onClick={toggleCamera} style={{ width: '100%' }}>
                {isEnabled ? 'Вимкнути камеру' : 'Увімкнути камеру'}
            </button>
            {error ? <p style={{ color: '#ff4d4d', fontSize: '12px' }}>{error}</p> : null}
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
)
