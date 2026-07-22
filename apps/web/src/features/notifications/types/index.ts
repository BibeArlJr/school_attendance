/**
 * Reference interface for the mock-service pattern — see
 * docs/architecture/service-pattern.md. Every external/hardware
 * integration (SMS, barcode, scanner) follows this same shape.
 */
export interface INotificationService {
  notify(message: string): Promise<void>;
}
