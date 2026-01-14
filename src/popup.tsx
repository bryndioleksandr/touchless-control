// src/popup.tsx
import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom/client'

function Popup() {
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        chrome.storage.local.get(['cameraEnabled'], (result) => {
            const stateTemp = result.cameraEnabled;
            if(typeof stateTemp === "boolean")
                setIsEnabled(stateTemp || false);
        });
    }, []);

    const toggleCamera = async () => {
        setIsEnabled(!isEnabled);
        await chrome.storage.local.set({"cameraEnabled": !isEnabled});
        // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // if (tab.id) {
        //     chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_CAMERA" });
        //     window.close();
        // }
    };

    return (
        <div style={{ width: '200px', padding: '10px' }}>
            <h2>Touchless Control</h2>
            <button onClick={toggleCamera}>Вкл/Викл Камеру</button>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
)
