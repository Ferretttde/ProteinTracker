import { useRef, useState, useCallback, useEffect } from 'react';

const ZOOM_STORAGE_KEY = 'pt_camera_zoom';

export interface ZoomInfo {
  min: number;
  max: number;
  step: number;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomInfo, setZoomInfo] = useState<ZoomInfo | null>(null);
  const [zoom, setZoomState] = useState<number>(1);

  // Attach stream to video element and explicitly call play() —
  // autoPlay attribute alone is not reliable on some Android browsers.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {
        // play() can throw if interrupted (e.g. user navigates away)
      });
    }
  }, [isActive]);

  const setZoom = useCallback(async (value: number) => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ zoom: value } as Record<string, unknown>],
      } as MediaTrackConstraints);
      setZoomState(value);
      localStorage.setItem(ZOOM_STORAGE_KEY, String(value));
    } catch {
      // zoom not supported on this device
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Read zoom capabilities and restore last saved value
      if (track) {
        try {
          const capabilities = track.getCapabilities?.() as Record<string, unknown> | undefined;
          const zoomCap = capabilities?.zoom as { min: number; max: number; step?: number } | undefined;
          if (zoomCap) {
            const info: ZoomInfo = {
              min: zoomCap.min,
              max: zoomCap.max,
              step: zoomCap.step ?? 0.1,
            };
            setZoomInfo(info);

            const saved = parseFloat(localStorage.getItem(ZOOM_STORAGE_KEY) ?? '');
            const initial = !isNaN(saved) && saved >= info.min && saved <= info.max
              ? saved
              : info.min;

            await track.applyConstraints({
              advanced: [{ zoom: initial } as Record<string, unknown>],
            } as MediaTrackConstraints);
            setZoomState(initial);
          }
        } catch {
          // zoom not supported, ignore
        }
      }

      streamRef.current = stream;
      // setIsActive triggers re-render → <video> appears in DOM →
      // useEffect runs and attaches stream + calls play()
      setIsActive(true);
    } catch (err) {
      setError('Kamerazugriff nicht möglich. Bitte Berechtigung erteilen.');
      console.error('Camera error:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    trackRef.current = null;
    setIsActive(false);
    setZoomInfo(null);
  }, []);

  const capture = useCallback((): Blob | null => {
    const video = videoRef.current;
    if (!video) return null;

    const MAX_SIZE = 1024;
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const scale = Math.min(1, MAX_SIZE / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }, []);

  return { videoRef, isActive, error, start, stop, capture, zoom, zoomInfo, setZoom };
}
