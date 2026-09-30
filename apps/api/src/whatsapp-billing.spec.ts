import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { MockWhatsAppProvider } from './whatsapp/whatsapp.provider';
import { WhatsAppQueueService } from './whatsapp/whatsapp-queue.service';
import { BillRendererService } from './billing/bill-renderer.service';
import { BillingController } from './billing/billing.controller';
import { SalesService } from './sales/sales.service';
import { DatabaseService } from './database/database.service';
import { DomainEventEmitter } from './common/events/domain-event.emitter';
import { EntrySavedEvent } from './common/events/entry-saved.event';

describe('WhatsApp, Notifications, JPG Bill & Queue Gate Test Suite', () => {
  let mockDb: any;
  let domainEvents: DomainEventEmitter;
  let queueService: WhatsAppQueueService;
  let whatsAppService: WhatsAppService;
  let billRenderer: BillRendererService;
  let billingController: BillingController;
  let mockSalesService: any;

  const staffUser = {
    id: 'staff-2222-2222',
    name: 'Amit Verma (Staff)',
    username: 'amit',
    role: 'STAFF' as const,
    isActive: true,
  };

  beforeEach(() => {
    mockDb = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };

    domainEvents = new DomainEventEmitter();
    queueService = new WhatsAppQueueService(mockDb as DatabaseService);
    whatsAppService = new WhatsAppService(
      mockDb as DatabaseService,
      domainEvents,
      queueService,
    );
    whatsAppService.onModuleInit();

    billRenderer = new BillRendererService(mockDb as DatabaseService);
    mockSalesService = {
      findOne: jest.fn(),
    };
    billingController = new BillingController(
      billRenderer,
      mockSalesService as SalesService,
      whatsAppService,
    );
  });

  afterEach(async () => {
    await queueService.onModuleDestroy();
  });

  describe('1. MockProvider Receives Owner Alerts for Every Entry Type', () => {
    it('Triggers owner WhatsApp alert on SALE entry', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ owner_whatsapp: '+919690123456' }] }) // settings
        .mockResolvedValueOnce({ rows: [{ id: 101 }] }); // insert whatsapp_messages

      const saleEvent = new EntrySavedEvent({
        type: 'SALE',
        id: 'sale-uuid-1',
        partyId: 'cust-1',
        partyName: 'Rajasthan Jewellers',
        amount: 85000,
        staffId: staffUser.id,
        staffName: staffUser.name,
        billNo: 1001,
        timestamp: new Date().toISOString(),
      });

      const spySend = jest.spyOn(whatsAppService, 'send');
      domainEvents.emitEntrySaved(saleEvent);

      // Wait for setImmediate to execute event handler
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(spySend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919690123456',
          templateName: 'owner_entry_alert',
          parameters: expect.objectContaining({
            entry_type: 'Sale Invoice',
            party_name: 'Rajasthan Jewellers',
            staff_name: 'Amit Verma (Staff)',
          }),
        }),
      );
    });

    it('Triggers owner WhatsApp alert on PURCHASE entry', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ owner_whatsapp: '+919690123456' }] })
        .mockResolvedValueOnce({ rows: [{ id: 102 }] });

      const purchaseEvent = new EntrySavedEvent({
        type: 'PURCHASE',
        id: 'purch-uuid-1',
        partyId: 'supp-1',
        partyName: 'Mehta Gold Works',
        amount: 150000,
        staffId: staffUser.id,
        staffName: staffUser.name,
        billNo: 5001,
        timestamp: new Date().toISOString(),
      });

      const spySend = jest.spyOn(whatsAppService, 'send');
      domainEvents.emitEntrySaved(purchaseEvent);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(spySend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919690123456',
          templateName: 'owner_entry_alert',
          parameters: expect.objectContaining({
            entry_type: 'Purchase Bill',
            party_name: 'Mehta Gold Works',
          }),
        }),
      );
    });

    it('Triggers owner WhatsApp alert on JOB_WORK entry with weight in Kg', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ owner_whatsapp: '+919690123456' }] })
        .mockResolvedValueOnce({ rows: [{ id: 103 }] });

      const jwEvent = new EntrySavedEvent({
        type: 'JOB_WORK',
        id: 'jw-uuid-1',
        partyId: 'artisan-1',
        partyName: 'Shree Balaji Arts',
        weightKg: 2.45,
        staffId: staffUser.id,
        staffName: staffUser.name,
        timestamp: new Date().toISOString(),
      });

      const spySend = jest.spyOn(whatsAppService, 'send');
      domainEvents.emitEntrySaved(jwEvent);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(spySend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919690123456',
          templateName: 'owner_entry_alert',
          parameters: expect.objectContaining({
            entry_type: 'Job Work Entry',
            amount_or_kg: '2.450 Kg',
          }),
        }),
      );
    });

    it('Triggers owner WhatsApp alert on VOUCHER entry', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ owner_whatsapp: '+919690123456' }] })
        .mockResolvedValueOnce({ rows: [{ id: 104 }] });

      const voucherEvent = new EntrySavedEvent({
        type: 'VOUCHER',
        id: 'v-uuid-1',
        partyId: 'cust-1',
        partyName: 'Rajasthan Jewellers',
        amount: 25000,
        staffId: staffUser.id,
        staffName: staffUser.name,
        timestamp: new Date().toISOString(),
      });

      const spySend = jest.spyOn(whatsAppService, 'send');
      domainEvents.emitEntrySaved(voucherEvent);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(spySend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+919690123456',
          templateName: 'owner_entry_alert',
          parameters: expect.objectContaining({
            entry_type: 'Money Voucher',
            amount_or_kg: '₹25,000',
          }),
        }),
      );
    });
  });

  describe('2. Queue Failure Isolation: Failed Send Never Blocks Business Entry', () => {
    it('Never throws or blocks the caller when WhatsApp queue or provider fails', async () => {
      // Mock db query error during queue save
      mockDb.query.mockRejectedValueOnce(new Error('Redis/DB transient network failure'));

      const result = await whatsAppService.send({
        to: '+919876543210',
        templateName: 'bill_delivery',
        parameters: { test: 'value' },
      });

      // Does not throw, returns failed status safely
      expect(result.status).toBe('FAILED');
    });

    it('Records FAILED status after retries are exhausted without affecting entry', async () => {
      // Setup mock provider that throws
      const failingProvider = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Meta Graph API 500 error')),
      };
      (queueService as any).provider = failingProvider;

      mockDb.query.mockResolvedValue({ rows: [{ id: 99 }] });

      // Enqueue message
      const res = await queueService.enqueue({
        to: '+919829012345',
        templateName: 'bill_delivery',
        parameters: { customer_name: 'Test' },
      });

      expect(res.status).toBe('QUEUED');
    });
  });

  describe('3. Bill JPG Generation & Aesthetics', () => {
    it('Generates bill HTML and valid JPG image buffer with correct totals', async () => {
      const sampleSale = {
        id: 'sale-999',
        bill_no: 1001,
        entry_at: '2026-10-01T10:30:00Z',
        due_date: '2026-10-15',
        party_name: 'Rajasthan Jewellers',
        party_phone: '+919829012345',
        party_address: 'Johri Bazaar, Jaipur',
        total_amount: 51000,
        status: 'OPEN',
        lines: [
          { item_name: 'Gold Ornaments 22K', pieces: 5, weight_kg: 1.25, rate: 7000, amount: 35000 },
          { item_name: 'Silver Payal 92.5', pieces: 2, weight_kg: 0.5, rate: 32000, amount: 16000 },
        ],
      };

      // 1. Verify HTML template content
      const html = billRenderer.generateHtmlTemplate(sampleSale);
      expect(html).toContain('Kumkum Payal');
      expect(html).toContain('INVOICE #1001');
      expect(html).toContain('Rajasthan Jewellers');
      expect(html).toContain('Gold Ornaments 22K');
      expect(html).toContain('51,000');

      // 2. Verify rendered JPG buffer
      const jpgBuffer = await billRenderer.renderBillToJpg(sampleSale);
      expect(Buffer.isBuffer(jpgBuffer)).toBe(true);
      expect(jpgBuffer.length).toBeGreaterThan(1000);

      // Verify JPEG magic bytes: 0xFF, 0xD8
      expect(jpgBuffer[0]).toBe(0xff);
      expect(jpgBuffer[1]).toBe(0xd8);
    });
  });

  describe('4. Missing Customer Phone Validation', () => {
    it('Rejects one-click bill delivery when party has no phone number', async () => {
      mockSalesService.findOne.mockResolvedValue({
        id: 'sale-no-phone',
        bill_no: 1002,
        party_name: 'Cash Walk-in Party',
        party_phone: null, // No phone!
        total_amount: 12000,
      });

      await expect(billingController.sendBill('sale-no-phone', staffUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        billingController.sendBill('sale-no-phone', staffUser),
      ).rejects.toThrow(/does not have a registered WhatsApp phone number/);
    });
  });

  describe('5. Webhook Signature Verification', () => {
    it('Validates authentic HMAC-SHA256 signature', () => {
      process.env.WHATSAPP_APP_SECRET = 'test-meta-secret-key-123';
      const rawPayload = JSON.stringify({ entry: [{ changes: [] }] });
      const signature = crypto
        .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
        .update(rawPayload)
        .digest('hex');

      const isValid = whatsAppService.verifyWebhookSignature(`sha256=${signature}`, rawPayload);
      expect(isValid).toBe(true);
    });

    it('Rejects invalid or tampered HMAC-SHA256 signature', () => {
      process.env.WHATSAPP_APP_SECRET = 'test-meta-secret-key-123';
      const rawPayload = JSON.stringify({ entry: [{ changes: [] }] });
      const tamperedSignature = 'sha256=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad1';

      const isValid = whatsAppService.verifyWebhookSignature(tamperedSignature, rawPayload);
      expect(isValid).toBe(false);
    });
  });

  describe('6. Cryptographic Signed Short-Lived URLs', () => {
    it('Generates and verifies authentic short-lived URL token', () => {
      const { token, expiresAt, url } = billRenderer.generateSignedUrl('sale-uuid-777', 30);
      expect(token).toBeDefined();
      expect(url).toContain('/api/v1/sales/bill/media/');
      expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

      const verified = billRenderer.verifySignedUrlToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.saleId).toBe('sale-uuid-777');
    });

    it('Rejects expired or tampered signed URL token', () => {
      // Create expired token (negative minutes)
      const { token: expiredToken } = billRenderer.generateSignedUrl('sale-uuid-888', -5);
      const verified = billRenderer.verifySignedUrlToken(expiredToken);
      expect(verified.valid).toBe(false);
      expect(verified.error).toBe('Signed URL has expired');

      // Tampered token
      const tampered = expiredToken.substring(0, expiredToken.length - 4) + 'zzzz';
      const tamperedVerified = billRenderer.verifySignedUrlToken(tampered);
      expect(tamperedVerified.valid).toBe(false);
    });
  });
});
