import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface BarcodeImageProps {
  value: string;
  className?: string;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  margin?: number;
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
    });
  }, [value, height, fontSize, displayValue, margin]);

  return <svg ref={svgRef} className={className} role="img" aria-label={`Barcode ${value}`} />;
}
