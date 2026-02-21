import { useRef, useState, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      // Set zoom to main lens (avoids ultra-wide default on multi-camera phones)
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = track.getCapabilities?.() as Record<string, unknown> | undefined;
          const zoomCap = capabilities?.zoom as { min: number; max: number } | undefined;
          if (zoomCap) {
            // On most phones: min=1.0 is ultra-wide, main lens is ~2.0
            const mainLensZoom = Math.min(2.0, zoomCap.max);
            await track.applyConstraints({
              advanced: [{ zoom: mainLensZoom } as Record<string, unknown>],
            } as MediaTrackConstraints);
          }
        } catch {
          // Zoom not supported, ignore
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
    setIsActive(false);
  }, []);

  const capture = useCallback((): Blob | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }, []);

  return { videoRef, isActive, error, start, stop, capture };
}
