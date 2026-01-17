import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
                try {
                    scanner.clear();
                } catch (e) {
                    console.error("Failed to clear scanner", e);
                }
            },
            (error) => {
                // Ignore errors for now as they happen on every frame with no QR
            }
        );

        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {
                    console.error("Failed to clear scanner on unmount", e);
                }
            }
        };
    }, [onScan]);

    return (
        <div className="w-full max-w-sm mx-auto bg-black rounded-xl overflow-hidden relative">
            <style>{`
                #reader { border: none !important; }
                #reader__scan_region img { display: none; }
                #reader__dashboard_section_csr button { 
                    background-color: white !important; 
                    color: black !important; 
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 8px !important;
                    margin-top: 10px !important;
                    font-weight: bold !important;
                }
            `}</style>
            <div id="reader" className="w-full"></div>
        </div>
    );
};

export default QrScanner;
