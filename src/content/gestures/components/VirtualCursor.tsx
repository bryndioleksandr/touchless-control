import { forwardRef } from "react";

const VirtualCursor = forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '20px',
                height: '20px',
                backgroundColor: '#ff4d4d',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                transform: 'translate(-100px, -100px)',
                transition: 'transform 0.05s linear',
                boxShadow: '0 0 10px rgba(255, 77, 77, 0.8)'
            }}
        />
    );
});

export default VirtualCursor;
