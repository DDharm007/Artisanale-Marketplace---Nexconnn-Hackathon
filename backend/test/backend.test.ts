import { describe, it, expect } from 'vitest';
import { ORDER_STATUS_FLOW, DEFAULT_TAX_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from '../../shared';
import { razorpayService } from '../src/services/razorpayService';
import { aiAgentService } from '../src/services/aiAgentService';
import { db } from '../src/services/dataStore';

describe('1. Price & Cart Calculations', () => {
  it('calculates discount and subtotal accurately', () => {
    const originalPrice = 299;
    const discountPercent = 15;
    const discountedPrice = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));
    expect(discountedPrice).toBe(254.15);

    const quantity = 2;
    const subtotal = discountedPrice * quantity;
    expect(subtotal).toBe(508.3);

    const tax = Number((subtotal * DEFAULT_TAX_RATE).toFixed(2));
    expect(tax).toBe(40.66);

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    expect(shipping).toBe(0); // Above $500 free shipping threshold

    const total = Number((subtotal + tax + shipping).toFixed(2));
    expect(total).toBe(548.96);
  });

  it('applies standard shipping fee for orders under free threshold', () => {
    const subtotal = 120;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    expect(shipping).toBe(STANDARD_SHIPPING_FEE);
  });
});

describe('2. Order State Machine Transitions', () => {
  it('permits valid next transitions', () => {
    expect(ORDER_STATUS_FLOW['pending']).toContain('confirmed');
    expect(ORDER_STATUS_FLOW['confirmed']).toContain('processing');
    expect(ORDER_STATUS_FLOW['processing']).toContain('shipped');
    expect(ORDER_STATUS_FLOW['shipped']).toContain('delivered');
    expect(ORDER_STATUS_FLOW['delivered']).toContain('return_requested');
  });

  it('prohibits invalid transitions', () => {
    expect(ORDER_STATUS_FLOW['delivered']).not.toContain('pending');
    expect(ORDER_STATUS_FLOW['cancelled']).toHaveLength(0);
  });
});

describe('3. Payment Signature Verification', () => {
  it('validates test signature correctly', () => {
    const orderId = 'ord_test_123';
    const paymentId = 'pay_test_456';
    const testValidSignature = 'sig_test_valid_sandbox_99';
    const isValid = razorpayService.verifySignature(orderId, paymentId, testValidSignature);
    expect(isValid).toBe(true);
  });

  it('rejects empty or corrupt payment signatures', () => {
    const isValid = razorpayService.verifySignature('ord_1', 'pay_1', '');
    expect(isValid).toBe(false);
  });
});

describe('4. AI Vendor Agent Grounding & Escalation', () => {
  it('escalates refund and dispute requests to human vendor', async () => {
    const result = await aiAgentService.generateGroundedResponse(
      'vendor_nexconn_audio',
      'I want a refund because my item is damaged'
    );
    expect(result.escalateToHuman).toBe(true);
    expect(result.replyText).toContain('cannot approve refunds');
  });

  it('answers grounded product questions without inventing facts', async () => {
    const result = await aiAgentService.generateGroundedResponse(
      'vendor_nexconn_audio',
      'What is the price of Nexconn SonicPro?'
    );
    expect(result.isAiGenerated).toBe(true);
    expect(result.replyText).toContain('SonicPro');
  });
});

describe('5. Database Store Integrity', () => {
  it('contains seed users and products', () => {
    const users = db.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);

    const products = db.getProducts();
    expect(products.length).toBeGreaterThanOrEqual(5);

    const vendor = db.findVendorById('vendor_nexconn_audio');
    expect(vendor).toBeDefined();
    expect(vendor?.businessName).toContain('Nexconn');
  });
});
