import crypto from 'node:crypto';

/**
 * Result of webhook signature validation.
 */
export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Verifies HMAC-SHA256 signature for incoming webhooks using constant-time comparison.
 *
 * @param rawBody - Exact raw request payload as a string or Buffer.
 * @param signatureHeader - Value of the X-Signature or webhook signature header.
 * @param secret - Secret key shared between merchant and platform.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined | null,
  secret: string | undefined | null
): WebhookVerificationResult {
  if (!secret) {
    return { isValid: false, error: 'WEBHOOK_SECRET_MISSING' };
  }

  if (!signatureHeader) {
    return { isValid: false, error: 'SIGNATURE_HEADER_MISSING' };
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    const computedDigest = hmac.update(bodyBuffer).digest('hex');

    const digestBuffer = Buffer.from(computedDigest, 'utf8');
    const signatureBuffer = Buffer.from(signatureHeader.trim(), 'utf8');

    // Timing-safe equal requires matching buffer lengths
    if (digestBuffer.length !== signatureBuffer.length) {
      return { isValid: false, error: 'SIGNATURE_LENGTH_MISMATCH' };
    }

    const isMatch = crypto.timingSafeEqual(digestBuffer, signatureBuffer);
    return isMatch ? { isValid: true } : { isValid: false, error: 'SIGNATURE_INVALID' };
  } catch (err: any) {
    return { isValid: false, error: `VERIFICATION_FAILED: ${err.message}` };
  }
}
