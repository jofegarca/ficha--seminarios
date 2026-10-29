import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';

const SignaturePad = forwardRef(({ label, required = false }, ref) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [isEmpty, setIsEmpty] = useState(true);

  // Calcula posición del puntero escalando según dimensiones reales del canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    isDrawingRef.current = true;
    const pos = getCoordinates(e);
    lastPosRef.current = pos;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#15479E'; // Trazo azul especificado
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // Dibuja punto inicial en caso de pulsación rápida
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();

    if (isEmpty) {
      setIsEmpty(false);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCoordinates(e);

    ctx.beginPath();
    ctx.strokeStyle = '#15479E';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (err) {}
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  /**
   * Recorta los márgenes transparentes alrededor del trazo dibujado
   * para que al estampar en el PDF quede exactamente centrada
   */
  const getTrimmedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return null;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixels) return null;

    // Agregar un pequeño margen de 4px para no cortar bordes del trazo
    const padding = 4;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropX, (maxX - minX + 1) + padding * 2);
    const cropHeight = Math.min(height - cropY, (maxY - minY + 1) + padding * 2);

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = cropWidth;
    trimmedCanvas.height = cropHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    trimmedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return trimmedCanvas.toDataURL('image/png');
  };

  useImperativeHandle(ref, () => ({
    isEmpty: () => isEmpty,
    getSignature: () => getTrimmedSignature(),
    toDataURL: () => getTrimmedSignature(),
    clear: clearCanvas
  }), [isEmpty]);

  return (
    <div className="signature-pad-container">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label mb-0 fw-semibold text-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        <div>
          {isEmpty ? (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle me-2">
              Pendiente
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle me-2">
              <i className="bi bi-check-circle me-1"></i>Firmado
            </span>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={clearCanvas}
            title="Limpiar trazo"
          >
            <i className="bi bi-eraser me-1"></i>Limpiar firma
          </button>
        </div>
      </div>

      <div
        className="canvas-wrapper position-relative rounded border shadow-sm"
        style={{
          backgroundColor: '#f8fafc',
          touchAction: 'none',
          overflow: 'hidden'
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          style={{
            display: 'block',
            width: '100%',
            height: '140px',
            touchAction: 'none',
            cursor: 'crosshair'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {isEmpty && (
          <div
            className="position-absolute top-50 start-50 translate-middle text-muted text-center pe-none user-select-none opacity-50"
          >
            <i className="bi bi-pen fs-4 d-block mb-1"></i>
            <small>Firme aquí con el dedo o mouse</small>
          </div>
        )}
      </div>
      <div className="form-text text-muted small mt-1">
        <i className="bi bi-info-circle me-1"></i>
        La firma se registrará con trazo azul en el documento oficial.
      </div>
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
