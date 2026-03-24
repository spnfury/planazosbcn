'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import adminStyles from '../admin.module.css';
import styles from './scanner.module.css';

export default function ScannerPage() {
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null); // { type: 'success'|'warning'|'error', data, message }
  const [validating, setValidating] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Load validation history
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('reservations')
      .select('*, plans(title)')
      .not('validated_at', 'is', null)
      .order('validated_at', { ascending: false })
      .limit(20);

    if (!error) setHistory(data || []);
    setHistoryLoading(false);
  }

  // QR scan callback
  const onScanSuccess = useCallback(async (decodedText) => {
    // Stop scanning immediately
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) { /* ignore */ }
      setScanning(false);
    }

    // Extract QR code from URL if it's a validation URL
    let code = decodedText;
    try {
      const url = new URL(decodedText);
      const codeParam = url.searchParams.get('code');
      if (codeParam) code = codeParam;
    } catch {
      // Not a URL, use the raw text
    }

    await lookupCode(code);
  }, []);

  // Start camera scanner
  async function startScanner() {
    if (!scannerRef.current) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-scanner-viewport');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        onScanSuccess,
        () => {} // Ignore scan failures (no QR detected yet)
      );

      setScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      alert('No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara.');
    }
  }

  // Stop camera scanner
  async function stopScanner() {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) { /* ignore */ }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch (e) { /* ignore */ }
      }
    };
  }, []);

  // Lookup a QR code or localizador
  async function lookupCode(code) {
    setValidating(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          type: 'error',
          message: data.error || 'Código no válido',
          data: null,
        });
      } else if (data.already_validated) {
        setResult({
          type: 'warning',
          message: data.message,
          data: data.reservation,
        });
      } else if (data.valid) {
        setResult({
          type: 'success',
          message: data.message,
          data: data.reservation,
        });
        loadHistory(); // Refresh history
      } else {
        // Pending validation — show details and allow user to validate
        setResult({
          type: 'pending',
          message: 'Entrada encontrada — pendiente de validar',
          data: data.reservation,
        });
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setResult({
        type: 'error',
        message: 'Error de conexión al verificar el código',
        data: null,
      });
    }

    setValidating(false);
  }

  // Handle manual submit
  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await lookupCode(manualCode.trim());
  }

  // Dismiss result and resume scanning
  function dismissResult() {
    setResult(null);
    setManualCode('');
  }

  // Restart scanner after dismissing result
  function dismissAndRescan() {
    dismissResult();
    if (mode === 'camera') {
      setTimeout(() => startScanner(), 300);
    }
  }

  const reservation = result?.data;
  const plan = reservation?.plans;

  return (
    <div className={styles.scannerPage}>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Scanner QR</h1>
          <p className={adminStyles.pageSubtitle}>Escanea o introduce un código para validar entradas</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'camera' ? styles.modeBtnActive : ''}`}
          onClick={() => { setMode('camera'); stopScanner(); }}
          id="mode-camera"
        >
          📷 Cámara
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
          onClick={() => { setMode('manual'); stopScanner(); }}
          id="mode-manual"
        >
          ⌨️ Manual
        </button>
      </div>

      {/* Camera Scanner */}
      {mode === 'camera' && (
        <div className={styles.scannerContainer}>
          <div className={styles.scannerViewport} ref={scannerRef}>
            <div id="qr-scanner-viewport" style={{ width: '100%', height: '100%' }} />
            {!scanning && (
              <button
                className={styles.scannerStartBtn}
                onClick={startScanner}
                id="start-scanner"
                style={{ position: 'absolute', inset: 0, zIndex: 5 }}
              >
                <span className={styles.scannerStartIcon}>📷</span>
                <span>Pulsa para activar la cámara</span>
              </button>
            )}
          </div>
          {scanning && (
            <div className={styles.cameraControls}>
              <button className={`${styles.cameraBtn} ${styles.cameraBtnStop}`} onClick={stopScanner} id="stop-scanner">
                ⏹ Detener cámara
              </button>
            </div>
          )}
          {!scanning && (
            <p className={styles.scannerHint}>
              Apunta la cámara al código QR de la entrada del cliente
            </p>
          )}
        </div>
      )}

      {/* Manual Input */}
      {mode === 'manual' && (
        <div className={styles.manualInput}>
          <div className={styles.manualInputTitle}>Código QR o Localizador</div>
          <form onSubmit={handleManualSubmit} className={styles.manualInputRow}>
            <input
              type="text"
              className={styles.manualInputField}
              placeholder="Ej: ABC123 o UUID del QR..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              autoFocus
              id="manual-code-input"
            />
            <button
              type="submit"
              className={styles.manualSubmitBtn}
              disabled={!manualCode.trim() || validating}
              id="manual-submit"
            >
              {validating ? 'Buscando...' : 'Verificar'}
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {validating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Verificando código...</span>
        </div>
      )}

      {/* Result Card */}
      {result && !validating && (
        <div className={`${styles.resultCard} ${
          result.type === 'success' ? styles.resultSuccess
          : result.type === 'warning' ? styles.resultWarning
          : result.type === 'pending' ? styles.resultSuccess
          : styles.resultError
        }`}>
          <div className={styles.resultHeader}>
            <span className={styles.resultIcon}>
              {result.type === 'success' ? '✅' : result.type === 'warning' ? '⚠️' : result.type === 'pending' ? '🎟️' : '❌'}
            </span>
            <div>
              <div className={styles.resultTitle}>
                {result.type === 'success' ? '¡Entrada validada!'
                  : result.type === 'warning' ? 'Entrada ya validada'
                  : result.type === 'pending' ? 'Entrada encontrada'
                  : 'Código no válido'}
              </div>
              <div className={styles.resultSubtitle}>{result.message}</div>
            </div>
          </div>

          {reservation && (
            <>
              <div className={styles.resultDetails}>
                <div className={styles.resultDetail}>
                  <div className={styles.resultDetailLabel}>Evento</div>
                  <div className={styles.resultDetailValue}>{plan?.title || 'Sin título'}</div>
                </div>
                <div className={styles.resultDetail}>
                  <div className={styles.resultDetailLabel}>Cantidad</div>
                  <div className={styles.resultDetailValue}>
                    {reservation.quantity} {reservation.quantity === 1 ? 'entrada' : 'entradas'}
                  </div>
                </div>
                <div className={styles.resultDetail}>
                  <div className={styles.resultDetailLabel}>Email</div>
                  <div className={styles.resultDetailValue} style={{ fontSize: '0.8rem' }}>
                    {reservation.customer_email}
                  </div>
                </div>
                <div className={styles.resultDetail}>
                  <div className={styles.resultDetailLabel}>
                    {reservation.localizador ? 'Localizador' : 'Nº Reserva'}
                  </div>
                  <div className={styles.resultDetailValue} style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                    {reservation.localizador || `#${String(reservation.id).padStart(5, '0')}`}
                  </div>
                </div>
                {plan?.date && (
                  <div className={styles.resultDetail}>
                    <div className={styles.resultDetailLabel}>Fecha</div>
                    <div className={styles.resultDetailValue}>{plan.date}</div>
                  </div>
                )}
                {plan?.venue && (
                  <div className={styles.resultDetail}>
                    <div className={styles.resultDetailLabel}>Lugar</div>
                    <div className={styles.resultDetailValue}>{plan.venue}</div>
                  </div>
                )}
              </div>

              {result.type === 'warning' && reservation.validated_at && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#F59E0B',
                  textAlign: 'center',
                }}>
                  ⏰ Validada el {new Date(reservation.validated_at).toLocaleString('es-ES')}
                </div>
              )}
            </>
          )}

          <div className={styles.resultActions}>
            <button
              className={`${styles.validateBtn} ${styles.validateBtnDismiss}`}
              onClick={dismissAndRescan}
              id="dismiss-result"
            >
              {mode === 'camera' ? '📷 Escanear otro' : '🔄 Nuevo código'}
            </button>
          </div>
        </div>
      )}

      {/* Validation History */}
      <div className={styles.historySection}>
        <div className={styles.historyTitle}>
          📋 Historial de validaciones
        </div>

        {historyLoading ? (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <span>Cargando historial...</span>
          </div>
        ) : history.length === 0 ? (
          <div className={styles.historyEmpty}>
            No hay entradas validadas todavía
          </div>
        ) : (
          <div className={styles.historyList}>
            {history.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyItemIcon}>✅</span>
                <div className={styles.historyItemInfo}>
                  <div className={styles.historyItemPlan}>
                    {item.plans?.title || `Plan #${item.plan_id}`}
                  </div>
                  <div className={styles.historyItemEmail}>
                    {item.customer_email}
                    {item.localizador && ` · ${item.localizador}`}
                  </div>
                </div>
                <div className={styles.historyItemTime}>
                  <div>{new Date(item.validated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
                  <div className={styles.historyItemQty}>
                    {new Date(item.validated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{item.quantity}x
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
