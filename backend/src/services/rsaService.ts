import crypto from 'node:crypto';

const RSA_PREFIX = 'RSA2048:';
const RSA_DIRECT_MAX_BYTES = 180; // 2048-bit RSA-OAEP SHA-256 ceiling is 190 bytes

export interface RsaEnvelope {
  v: 1;
  alg: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM';
  fp?: string;
  wk?: string; // RSA-OAEP encrypted 256-bit AES key (base64)
  iv?: string; // 96-bit AES-GCM IV (base64)
  c: string;   // RSA ciphertext OR AES-GCM ciphertext+tag (base64)
}

function spkiBase64ToKeyObject(publicKeyBase64: string): crypto.KeyObject {
  const clean = publicKeyBase64
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');
  const der = Buffer.from(clean, 'base64');
  return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
}

function pkcs8Base64ToKeyObject(privateKeyBase64: string): crypto.KeyObject {
  const clean = privateKeyBase64
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const der = Buffer.from(clean, 'base64');
  return crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

export class RsaService {
  /** Generate an RSA-2048 SPKI/PKCS8 keypair compatible with WebCrypto RSA-OAEP (SHA-256). */
  public generateRsaKeyPair(): { publicKey: string; privateKey: string; fingerprint: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');
    const privateKeyBase64 = Buffer.from(privateKey).toString('base64');

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      fingerprint: this.computeKeyFingerprint(publicKeyBase64),
    };
  }

  /** Validate whether a string is a valid SPKI RSA public key. */
  public isValidPublicKey(publicKeyBase64?: string): boolean {
    if (!publicKeyBase64 || typeof publicKeyBase64 !== 'string') return false;
    try {
      const keyObj = spkiBase64ToKeyObject(publicKeyBase64);
      return keyObj.asymmetricKeyType === 'rsa';
    } catch {
      return false;
    }
  }

  /** Compute deterministic SHA-256 fingerprint (colon-separated hex) from SPKI public key. */
  public computeKeyFingerprint(publicKeyBase64: string): string {
    const clean = publicKeyBase64
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');
    const der = Buffer.from(clean, 'base64');
    const hash = crypto.createHash('sha256').update(der).digest('hex').slice(0, 16);
    return hash.match(/.{1,4}/g)?.join(':').toUpperCase() || hash.toUpperCase();
  }

  /**
   * Encrypt plaintext strictly with the intended Receiver's RSA Public Key.
   * Only the holder of the matching RSA Private Key can decrypt the output.
   */
  public encryptWithPublicKey(plaintext: string, receiverPublicKeyBase64: string): string {
    const keyObj = spkiBase64ToKeyObject(receiverPublicKeyBase64);
    const fp = this.computeKeyFingerprint(receiverPublicKeyBase64);
    const raw = Buffer.from(plaintext, 'utf8');

    if (raw.length <= RSA_DIRECT_MAX_BYTES) {
      const encrypted = crypto.publicEncrypt(
        {
          key: keyObj,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        raw
      );

      const envelope: RsaEnvelope = {
        v: 1,
        alg: 'RSA-OAEP-256',
        fp,
        c: encrypted.toString('base64'),
      };
      return `${RSA_PREFIX}${Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')}`;
    }

    // Hybrid envelope for arbitrary-length payloads: AES-256-GCM DEK wrapped via RSA-OAEP SHA-256
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([cipher.update(raw), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([ciphertext, authTag]); // Matches WebCrypto AES-GCM output layout

    const wrappedKey = crypto.publicEncrypt(
      {
        key: keyObj,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    );

    const envelope: RsaEnvelope = {
      v: 1,
      alg: 'RSA-OAEP-256+AES-256-GCM',
      fp,
      wk: wrappedKey.toString('base64'),
      iv: iv.toString('base64'),
      c: combined.toString('base64'),
    };
    return `${RSA_PREFIX}${Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')}`;
  }

  /**
   * Decrypt an RSA2048 envelope strictly with the matching Receiver's RSA Private Key.
   * Throws an error if decrypted with any other user's private key or tampered ciphertext.
   */
  public decryptWithPrivateKey(ciphertextEnvelope: string, receiverPrivateKeyBase64: string): string {
    if (!ciphertextEnvelope.startsWith(RSA_PREFIX)) {
      throw new Error('Invalid RSA ciphertext envelope prefix');
    }

    const encoded = ciphertextEnvelope.slice(RSA_PREFIX.length);
    const envelope = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as RsaEnvelope;
    const privKeyObj = pkcs8Base64ToKeyObject(receiverPrivateKeyBase64);

    if (envelope.alg === 'RSA-OAEP-256') {
      const dec = crypto.privateDecrypt(
        {
          key: privKeyObj,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(envelope.c, 'base64')
      );
      return dec.toString('utf8');
    }

    if (envelope.alg === 'RSA-OAEP-256+AES-256-GCM' && envelope.wk && envelope.iv) {
      const aesKey = crypto.privateDecrypt(
        {
          key: privKeyObj,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(envelope.wk, 'base64')
      );

      const combined = Buffer.from(envelope.c, 'base64');
      const authTag = combined.subarray(combined.length - 16);
      const encBody = combined.subarray(0, combined.length - 16);

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        aesKey,
        Buffer.from(envelope.iv, 'base64')
      );
      decipher.setAuthTag(authTag);
      const plain = Buffer.concat([decipher.update(encBody), decipher.final()]);
      return plain.toString('utf8');
    }

    throw new Error(`Unsupported RSA envelope algorithm: ${envelope.alg}`);
  }
}

export const rsaService = new RsaService();
