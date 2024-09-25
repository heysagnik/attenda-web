import React, { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        result => onScanSuccess(result.data),
        {
          onDecodeError: onScanError,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: overlayRef.current,
        }
      );
      qrScannerRef.current.start();
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div style={styles.container}>
      <video ref={videoRef} style={styles.video} />
      <div ref={overlayRef} style={styles.overlay}>
        <div style={styles.scanRegion} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1000,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1001,
    pointerEvents: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanRegion: {
    border: '2px solid red',
    width: '80%',
    height: '80%',
    maxWidth: '300px',
    maxHeight: '300px',
  },
  '@media (max-width: 600px)': {
    scanRegion: {
      width: '90%',
      height: '90%',
      maxWidth: '200px',
      maxHeight: '200px',
    },
  },
};

export default QRScanner;