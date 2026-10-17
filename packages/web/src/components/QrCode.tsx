import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/** QR code rendered to a data URL image (allowed by the CSP's img-src data:). */
export function QrCode({ value, size, label }: { value: string; size: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2,
      color: { dark: '#1a1c24', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);
  return src ? (
    <img src={src} width={size} height={size} alt={label} className="rounded-lg bg-white" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-lg bg-white" />
  );
}
