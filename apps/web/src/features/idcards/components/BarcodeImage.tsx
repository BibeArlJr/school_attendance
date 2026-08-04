import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/shared/lib/utils';

interface BarcodeImageProps {
  value: string;
  className?: string;
  /** Rendered width/height in px — QR codes are square, unlike Code128's wide/short shape, so one dimension replaces the old height/width/fontSize props entirely. */
  size?: number;
  /**
   * Quiet zone, in QR "modules" (the code's own unit, not px) — unlike a
   * linear barcode's scanner pass, a QR reader needs clear space on all 4
   * sides equally, so there's no left/right-only equivalent to the old
   * marginLeft/marginRight props.
   */
  marginSize?: number;
  /**
   * Shows the raw value as text under the QR code — default true, matching
   * the prior Code128 rendering's own displayValue default. A QR code
   * can't be read by eye the way a barcode's bars roughly could, so this
   * text is the only fallback a staff member has to manually type the
   * code into Gate Scanner if a scan ever fails.
   */
  displayValue?: boolean;
}

/**
 * Real client-side QR encoding (qrcode.react), not a placeholder image —
 * same Standing Clause 2 commitment the prior Code128 rendering made: the
 * code's value and its rendering are real, only physical printing happens
 * outside the system. Encodes the exact same `barcode_value` string this
 * component always has — a scanner-gun swap (barcode gun -> QR gun, still
 * USB keyboard-emulation) is a visual-only change; the value, its
 * generation (SequenceGeneratorService), and every backend scan-processing
 * rule are untouched.
 */
export function BarcodeImage({
  value,
  className,
  size = 96,
  marginSize = 2,
  displayValue = true,
}: BarcodeImageProps) {
  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <QRCodeSVG
        value={value}
        size={size}
        marginSize={marginSize}
        level="M"
        role="img"
        title={`QR code ${value}`}
      />
      {displayValue && <span className="font-mono text-[10px] text-muted-foreground">{value}</span>}
    </div>
  );
}
