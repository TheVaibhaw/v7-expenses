"use client";

import { useCallback, useRef, useState } from "react";
import { Check, X, ZoomIn } from "lucide-react";
import { QR_CROP_VIEWPORT, QR_OUTPUT_SIZE, QR_ZOOM_MAX, QR_ZOOM_MIN } from "@/lib/constants";

interface QrCropModalProps {
  src: string;
  onCancel: () => void;
  onConfirm: (croppedDataUrl: string) => void;
}

export function QrCropModal({ src, onCancel, onConfirm }: QrCropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(QR_ZOOM_MIN);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  const baseScale = naturalSize ? QR_CROP_VIEWPORT / Math.min(naturalSize.width, naturalSize.height) : 1;
  const effScale = baseScale * zoom;
  const displayedWidth = naturalSize ? naturalSize.width * effScale : QR_CROP_VIEWPORT;
  const displayedHeight = naturalSize ? naturalSize.height * effScale : QR_CROP_VIEWPORT;

  const clamp = useCallback(
    (left: number, top: number, forWidth = displayedWidth, forHeight = displayedHeight) => {
      const minLeft = Math.min(0, QR_CROP_VIEWPORT - forWidth);
      const minTop = Math.min(0, QR_CROP_VIEWPORT - forHeight);
      return {
        left: Math.min(0, Math.max(minLeft, left)),
        top: Math.min(0, Math.max(minTop, top)),
      };
    },
    [displayedWidth, displayedHeight],
  );

  /**
   * Re-centers the crop for a given displayed size - called directly from the image-load and
   * zoom-change event handlers (never from an effect) so there's no extra render-then-correct
   * cycle: the position is computed and set as part of the same event that changed the size.
   */
  const recenterFor = useCallback(
    (width: number, height: number) => {
      setPosition(clamp((QR_CROP_VIEWPORT - width) / 2, (QR_CROP_VIEWPORT - height) / 2, width, height));
    },
    [clamp],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, startLeft: position.left, startTop: position.top };
    },
    [position],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setPosition(clamp(dragState.current.startLeft + dx, dragState.current.startTop + dy));
    },
    [clamp],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    dragState.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    const img = imgRef.current;
    if (!img || !naturalSize) return;
    const srcSize = QR_CROP_VIEWPORT / effScale;
    const srcX = Math.min(Math.max(0, -position.left / effScale), naturalSize.width - srcSize);
    const srcY = Math.min(Math.max(0, -position.top / effScale), naturalSize.height - srcSize);

    const canvas = document.createElement("canvas");
    canvas.width = QR_OUTPUT_SIZE;
    canvas.height = QR_OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // PNG, not JPEG: a QR code's sharp black/white edges need lossless output to stay reliably
    // scannable - JPEG compression artifacts can corrupt the finer modules of a dense code.
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, QR_OUTPUT_SIZE, QR_OUTPUT_SIZE);
    onConfirm(canvas.toDataURL("image/png"));
  }, [naturalSize, effScale, position, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-slate-900">Crop your QR code</h3>
        <p className="mt-1 text-sm text-slate-500">Drag to reposition, use the slider to zoom.</p>

        <div
          className="relative mx-auto mt-4 touch-none overflow-hidden rounded-xl border-2 border-accent bg-slate-100"
          style={{ width: QR_CROP_VIEWPORT, height: QR_CROP_VIEWPORT }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pixel-level canvas cropping needs a real <img>, not next/image */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const width = e.currentTarget.naturalWidth;
              const height = e.currentTarget.naturalHeight;
              setNaturalSize({ width, height });
              // At load time zoom is always QR_ZOOM_MIN, so the displayed size is simply the
              // "cover" base scale applied to the freshly-known natural dimensions.
              const scale = QR_CROP_VIEWPORT / Math.min(width, height);
              recenterFor(width * scale, height * scale);
            }}
            className="absolute select-none"
            style={{ left: position.left, top: position.top, width: displayedWidth, height: displayedHeight }}
          />
          {/* Corner guides only - a full grid would visually clutter a small crop frame. */}
          <div className="pointer-events-none absolute inset-3 rounded-md border border-white/70" aria-hidden />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <input
            type="range"
            min={QR_ZOOM_MIN}
            max={QR_ZOOM_MAX}
            step={0.05}
            value={zoom}
            onChange={(e) => {
              const nextZoom = Number(e.target.value);
              setZoom(nextZoom);
              if (naturalSize) {
                const scale = baseScale * nextZoom;
                recenterFor(naturalSize.width * scale, naturalSize.height * scale);
              }
            }}
            aria-label="Zoom"
            className="w-full accent-accent"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary !px-4 !py-2 text-sm">
            <X className="h-4 w-4" aria-hidden />
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={!naturalSize} className="btn-primary !px-4 !py-2 text-sm">
            <Check className="h-4 w-4" aria-hidden />
            Use this crop
          </button>
        </div>
      </div>
    </div>
  );
}
