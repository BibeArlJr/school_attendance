import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface BarcodeImageProps {
  value: string;
  className?: string;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  /** Uniform quiet zone on all 4 sides — overridden per-side by marginLeft/Right/Top/Bottom below, where those are given. */
  margin?: number;
  /**
   * Quiet zone (Prompt 52) is only physically meaningful left/right — a
   * laser scanner reads a horizontal pass, so that's the space it needs
   * to reliably detect where the bars start/stop. Top/bottom margin is
   * just visual breathing room, not a scan-reliability requirement, so
   * it doesn't need to match. undefined falls back to the uniform
   * `margin` above (JsBarcode's own behavior).
   */
  marginLeft?: number;
  marginRight?: number;
  /** Module width in px — the width of the narrowest bar (JsBarcode's own default is 2). Exposed so callers whose container can't fit the default can deliberately generate a smaller intrinsic size (Prompt 52), rather than the browser silently CSS-scaling an oversized one down. */
  width?: number;
}

/**
 * Real client-side Code128 encoding (jsbarcode), not a placeholder image —
 * per this phase's Standing Clause 2, the barcode value and its rendering
 * are real; only physical printing happens outside the system.
 */
export function BarcodeImage({
  value,
  className,
  height = 60,
  fontSize = 14,
  displayValue = true,
  margin = 8,
  marginLeft,
  marginRight,
  width = 2,
}: BarcodeImageProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      displayValue,
      fontSize,
      height,
      margin,
      marginLeft,
      marginRight,
      width,
    });
  }, [value, height, fontSize, displayValue, margin, marginLeft, marginRight, width]);

  return <svg ref={svgRef} className={className} role="img" aria-label={`Barcode ${value}`} />;
}
