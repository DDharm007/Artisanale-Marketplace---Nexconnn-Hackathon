/**
 * ConvoCart Asymmetric RSA-2048 (RSA-OAEP SHA-256) + Legacy AES-GCM End-to-End Encryption Utility
 *
 * Strict Directional Cryptography:
 * - Sender -> Receiver: payload is encrypted using Receiver's RSA-2048 Public Key (SPKI).
 *   ONLY Receiver's RSA-2048 Private Key (PKCS8) can decrypt `rsaForRecipient`.
 * - Receiver -> Sender: reply is encrypted using Sender's RSA-2048 Public Key (SPKI).
 *   ONLY Sender's RSA-2048 Private Key (PKCS8) can decrypt `rsaForRecipient`.
 * - An independent sender self-copy (`rsaForSender`) is encrypted with the sender's own Public Key
 *   so each party exclusively decrypts their own ciphertexts with their own Private Key.
 */

import { apiRequest } from './api';

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

const RSA_PREFIX = 'RSA2048:';
const RSA_DIRECT_MAX_BYTES = 180;
const PRIV_STORAGE_PREFIX = 'convocart_rsa_priv_';
const PUB_STORAGE_PREFIX = 'convocart_rsa_pub_';

interface RsaWireEnvelope {
  v: 1;
  alg: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM';
  fp?: string;
  wk?: string;
  iv?: string;
  c: string;
}

export interface RecipientPublicKeyRecord {
  uid: string;
  displayName?: string;
  role?: string;
  rsaPublicKey: string | null;
  rsaKeyFingerprint?: string | null;
}

const pubKeyCache = new Map<string, { record: RecipientPublicKeyRecord; fetchedAt: number }>();
const syncedUidCache = new Map<string, string>();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

export function isRsaCiphertext(value?: string | null): boolean {
  return Boolean(value && typeof value === 'string' && value.startsWith(RSA_PREFIX));
}

export function formatPem(base64Key: string, type: 'PUBLIC' | 'PRIVATE'): string {
  const clean = base64Key.replace(/\s+/g, '');
  const lines = clean.match(/.{1,64}/g)?.join('\n') || clean;
  return `-----BEGIN ${type} KEY-----\n${lines}\n-----END ${type} KEY-----`;
}

export async function computePublicKeyFingerprint(publicKeyBase64: string): Promise<string> {
  const der = base64ToBytes(publicKeyBase64);
  const digest = await crypto.subtle.digest('SHA-256', der as BufferSource);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
  return hex.match(/.{1,4}/g)?.join(':').toUpperCase() || hex.toUpperCase();
}

async function importRsaPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const der = base64ToBytes(publicKeyBase64);
  return crypto.subtle.importKey(
    'spki',
    der as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

async function importRsaPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const der = base64ToBytes(privateKeyBase64);
  return crypto.subtle.importKey(
    'pkcs8',
    der as BufferSource,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

/** Generate a fresh RSA-2048 OAEP (SHA-256) keypair in browser WebCrypto. */
export async function generateRsaKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}> {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  const publicKey = bytesToBase64(new Uint8Array(spki));
  const privateKey = bytesToBase64(new Uint8Array(pkcs8));
  const fingerprint = await computePublicKeyFingerprint(publicKey);

  return { publicKey, privateKey, fingerprint };
}

/** Ensure a per-user RSA-2048 keypair exists in localStorage for `uid`. Never shared across UIDs. */
export async function ensureUserRsaKeyPair(uid: string): Promise<{
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}> {
  const existingPriv = localStorage.getItem(`${PRIV_STORAGE_PREFIX}${uid}`);
  const existingPub = localStorage.getItem(`${PUB_STORAGE_PREFIX}${uid}`);

  if (existingPriv && existingPub) {
    try {
      await importRsaPrivateKey(existingPriv);
      await importRsaPublicKey(existingPub);
      const fingerprint = await computePublicKeyFingerprint(existingPub);
      return { publicKey: existingPub, privateKey: existingPriv, fingerprint };
    } catch {
      // Regenerate below if corrupted
    }
  }

  const created = await generateRsaKeyPair();
  localStorage.setItem(`${PRIV_STORAGE_PREFIX}${uid}`, created.privateKey);
  localStorage.setItem(`${PUB_STORAGE_PREFIX}${uid}`, created.publicKey);
  return created;
}

export async function getLocalRsaKeyInfo(
  uid: string
): Promise<{ publicKey: string; fingerprint: string; hasPrivateKey: boolean } | null> {
  if (typeof window === 'undefined' || !uid) return null;
  const priv = localStorage.getItem(`${PRIV_STORAGE_PREFIX}${uid}`);
  const pub = localStorage.getItem(`${PUB_STORAGE_PREFIX}${uid}`);
  if (!pub) return null;
  try {
    const fingerprint = await computePublicKeyFingerprint(pub);
    return { publicKey: pub, fingerprint, hasPrivateKey: Boolean(priv) };
  } catch {
    return null;
  }
}

export function exportLocalRsaKeyBundle(uid: string): {
  uid: string;
  publicKey: string;
  privateKey: string;
  publicKeyPem: string;
  privateKeyPem: string;
} | null {
  if (typeof window === 'undefined' || !uid) return null;
  const pub = localStorage.getItem(`${PUB_STORAGE_PREFIX}${uid}`);
  const priv = localStorage.getItem(`${PRIV_STORAGE_PREFIX}${uid}`);
  if (!pub || !priv) return null;
  return {
    uid,
    publicKey: pub,
    privateKey: priv,
    publicKeyPem: formatPem(pub, 'PUBLIC'),
    privateKeyPem: formatPem(priv, 'PRIVATE'),
  };
}

export async function importLocalRsaKeyBundle(
  uid: string,
  privateKeyInput: string,
  publicKeyInput: string
): Promise<{ publicKey: string; fingerprint: string }> {
  const privClean = privateKeyInput
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const pubClean = publicKeyInput
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');

  await importRsaPrivateKey(privClean);
  await importRsaPublicKey(pubClean);

  localStorage.setItem(`${PRIV_STORAGE_PREFIX}${uid}`, privClean);
  localStorage.setItem(`${PUB_STORAGE_PREFIX}${uid}`, pubClean);
  const fingerprint = await computePublicKeyFingerprint(pubClean);

  const published = await apiRequest<{ rsaPublicKey: string; rsaKeyFingerprint: string }>(
    '/auth/public-key',
    {
      method: 'POST',
      body: JSON.stringify({ rsaPublicKey: pubClean }),
    }
  );
  syncedUidCache.set(uid, pubClean);
  return {
    publicKey: published.rsaPublicKey || pubClean,
    fingerprint: published.rsaKeyFingerprint || fingerprint,
  };
}

/** Ensure current user's RSA-2048 keypair exists locally and its PUBLIC key is published on backend. */
export async function syncMyRsaPublicKey(
  uid: string,
  serverKnownPublicKey?: string
): Promise<{ publicKey: string; fingerprint: string } | null> {
  if (typeof window === 'undefined' || !uid) return null;
  const pair = await ensureUserRsaKeyPair(uid);

  if (
    syncedUidCache.get(uid) === pair.publicKey &&
    serverKnownPublicKey === pair.publicKey
  ) {
    return { publicKey: pair.publicKey, fingerprint: pair.fingerprint };
  }

  try {
    await apiRequest('/auth/public-key', {
      method: 'POST',
      body: JSON.stringify({ rsaPublicKey: pair.publicKey }),
    });
    syncedUidCache.set(uid, pair.publicKey);
    pubKeyCache.delete(uid);
  } catch (err) {
    console.warn('[RSA] Failed to publish public key:', err);
  }

  return { publicKey: pair.publicKey, fingerprint: pair.fingerprint };
}

export async function fetchRecipientRsaPublicKey(
  targetId: string,
  forceRefresh = false
): Promise<RecipientPublicKeyRecord | null> {
  if (!targetId) return null;
  const cached = pubKeyCache.get(targetId);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < 10_000) {
    return cached.record;
  }

  try {
    const rec = await apiRequest<RecipientPublicKeyRecord>(
      `/auth/public-key/${encodeURIComponent(targetId)}`
    );
    pubKeyCache.set(targetId, { record: rec, fetchedAt: Date.now() });
    return rec;
  } catch {
    return null;
  }
}

/**
 * Encrypt plaintext strictly with Receiver's RSA-2048 Public Key (SPKI).
 * Decryption is ONLY possible with Receiver's matching RSA Private Key.
 */
export async function rsaEncryptWithPublicKey(
  plaintext: string,
  receiverPublicKeyBase64: string
): Promise<{
  envelope: string;
  algorithm: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM';
  fingerprint: string;
}> {
  const pubKey = await importRsaPublicKey(receiverPublicKeyBase64);
  const fp = await computePublicKeyFingerprint(receiverPublicKeyBase64);
  const raw = TEXT_ENCODER.encode(plaintext);

  if (raw.byteLength <= RSA_DIRECT_MAX_BYTES) {
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      pubKey,
      raw as BufferSource
    );
    const envelopeObj: RsaWireEnvelope = {
      v: 1,
      alg: 'RSA-OAEP-256',
      fp,
      c: bytesToBase64(new Uint8Array(encrypted)),
    };
    const jsonBytes = TEXT_ENCODER.encode(JSON.stringify(envelopeObj));
    return {
      envelope: `${RSA_PREFIX}${bytesToBase64(jsonBytes)}`,
      algorithm: 'RSA-OAEP-256',
      fingerprint: fp,
    };
  }

  // Hybrid RSA-OAEP-256 key wrapping + AES-256-GCM payload cipher for >180 byte payloads
  const rawAesKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.importKey('raw', rawAesKey, 'AES-GCM', false, ['encrypt']);
  const aesCipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    raw as BufferSource
  );
  const wrappedAesKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    rawAesKey as BufferSource
  );

  const envelopeObj: RsaWireEnvelope = {
    v: 1,
    alg: 'RSA-OAEP-256+AES-256-GCM',
    fp,
    wk: bytesToBase64(new Uint8Array(wrappedAesKey)),
    iv: bytesToBase64(iv),
    c: bytesToBase64(new Uint8Array(aesCipher)),
  };
  const jsonBytes = TEXT_ENCODER.encode(JSON.stringify(envelopeObj));
  return {
    envelope: `${RSA_PREFIX}${bytesToBase64(jsonBytes)}`,
    algorithm: 'RSA-OAEP-256+AES-256-GCM',
    fingerprint: fp,
  };
}

/** Decrypt RSA2048 envelope strictly with Receiver's Private Key (PKCS8 Base64). */
export async function rsaDecryptWithPrivateKey(
  ciphertextEnvelope: string,
  receiverPrivateKeyBase64: string
): Promise<string> {
  if (!isRsaCiphertext(ciphertextEnvelope)) {
    throw new Error('Not an RSA-2048 envelope');
  }

  const encoded = ciphertextEnvelope.slice(RSA_PREFIX.length);
  const envelopeJson = TEXT_DECODER.decode(base64ToBytes(encoded));
  const envelope = JSON.parse(envelopeJson) as RsaWireEnvelope;
  const privKey = await importRsaPrivateKey(receiverPrivateKeyBase64);

  if (envelope.alg === 'RSA-OAEP-256') {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privKey,
      base64ToBytes(envelope.c) as BufferSource
    );
    return TEXT_DECODER.decode(decrypted);
  }

  if (envelope.alg === 'RSA-OAEP-256+AES-256-GCM' && envelope.wk && envelope.iv) {
    const rawAesKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privKey,
      base64ToBytes(envelope.wk) as BufferSource
    );
    const aesKey = await crypto.subtle.importKey('raw', rawAesKey, 'AES-GCM', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(envelope.iv) as BufferSource },
      aesKey,
      base64ToBytes(envelope.c) as BufferSource
    );
    return TEXT_DECODER.decode(decrypted);
  }

  throw new Error('Unsupported RSA envelope algorithm');
}

/**
 * High-level directional RSA encryption:
 * - Encrypts `rsaForRecipient` with Receiver's RSA Public Key (decryptable ONLY by Receiver's Private Key)
 * - Encrypts `rsaForSender` copy with Sender's RSA Public Key (decryptable ONLY by Sender's Private Key)
 */
export async function rsaEncryptDirectional(params: {
  plaintext: string;
  recipientPublicKey: string;
  senderPublicKey?: string | null;
}): Promise<{
  rsaForRecipient: string;
  rsaForSender?: string;
  algorithm: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM';
  recipientFingerprint: string;
}> {
  const forRecipient = await rsaEncryptWithPublicKey(params.plaintext, params.recipientPublicKey);
  let rsaForSender: string | undefined;

  if (params.senderPublicKey) {
    const forSender = await rsaEncryptWithPublicKey(params.plaintext, params.senderPublicKey);
    rsaForSender = forSender.envelope;
  }

  return {
    rsaForRecipient: forRecipient.envelope,
    rsaForSender,
    algorithm: forRecipient.algorithm,
    recipientFingerprint: forRecipient.fingerprint,
  };
}

/**
 * Strictly decrypts an RSA message/ticket envelope using ONLY the active signed-in user's own Private Key.
 * - If active user is Receiver (`currentUid === rsaRecipientUid`): decrypts `rsaForRecipient` with Receiver's Private Key.
 * - If active user is Sender (`currentUid === rsaSenderUid`): decrypts `rsaForSender` with Sender's Private Key.
 * - Never accesses any other user's private key.
 */
export async function rsaDecryptForCurrentUser(params: {
  primaryText?: string;
  rsaForRecipient?: string;
  rsaForSender?: string;
  rsaRecipientUid?: string;
  rsaSenderUid?: string;
  currentUid?: string;
}): Promise<{
  plaintext: string;
  status: 'decrypted' | 'locked' | 'plain';
  decryptedWith?: 'recipient-private-key' | 'sender-private-key';
}> {
  const {
    primaryText = '',
    rsaForRecipient,
    rsaForSender,
    rsaRecipientUid,
    rsaSenderUid,
    currentUid,
  } = params;

  const targetRecipientCipher = rsaForRecipient || (isRsaCiphertext(primaryText) ? primaryText : undefined);

  if (!targetRecipientCipher && !rsaForSender) {
    return { plaintext: primaryText, status: 'plain' };
  }

  if (!currentUid) {
    return {
      plaintext: '🔒 Encrypted with RSA-2048 Public Key (Sign in with Private Key to decrypt)',
      status: 'locked',
    };
  }

  const myPrivKey = localStorage.getItem(`${PRIV_STORAGE_PREFIX}${currentUid}`);
  if (!myPrivKey) {
    return {
      plaintext: '🔒 RSA Private Key missing on this device for decryption',
      status: 'locked',
    };
  }

  // Case 1: Active user is the intended Receiver -> decrypt with Receiver's RSA Private Key
  if (
    targetRecipientCipher &&
    (!rsaRecipientUid || currentUid === rsaRecipientUid)
  ) {
    try {
      const plaintext = await rsaDecryptWithPrivateKey(targetRecipientCipher, myPrivKey);
      return { plaintext, status: 'decrypted', decryptedWith: 'recipient-private-key' };
    } catch {
      // If active user's private key fails to decrypt recipient ciphertext, check if active user is sender below
    }
  }

  // Case 2: Active user is the Sender -> decrypt Sender's own copy with Sender's RSA Private Key
  if (
    rsaForSender &&
    (!rsaSenderUid || currentUid === rsaSenderUid)
  ) {
    try {
      const plaintext = await rsaDecryptWithPrivateKey(rsaForSender, myPrivKey);
      return { plaintext, status: 'decrypted', decryptedWith: 'sender-private-key' };
    } catch {
      // Wrong private key
    }
  }

  return {
    plaintext: '🔒 Encrypted with Receiver RSA-2048 Public Key (Requires Receiver Private Key)',
    status: 'locked',
  };
}

// =========================================================================
// Legacy AES-GCM symmetric helpers retained only to read historical tickets
// =========================================================================

async function deriveKey(channelKey: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(channelKey.padEnd(32, '_').slice(0, 32)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: TEXT_ENCODER.encode('convocart_e2ee_v1_salt'),
      iterations: 10000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(plaintext: string, channelKey: string): Promise<string> {
  try {
    const key = await deriveKey(channelKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = TEXT_ENCODER.encode(plaintext);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return `E2EE:${btoa(String.fromCharCode(...combined))}`;
  } catch {
    return plaintext;
  }
}

export async function decryptMessage(ciphertext: string, channelKey: string): Promise<string> {
  if (!ciphertext.startsWith('E2EE:')) return ciphertext;

  try {
    const raw = Uint8Array.from(atob(ciphertext.slice(5)), (c) => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const data = raw.slice(12);
    const key = await deriveKey(channelKey);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return TEXT_DECODER.decode(decryptedBuffer);
  } catch {
    return '[Encrypted Message — Decryption Pending]';
  }
}

/**
 * Encrypt support ticket / reply payload using Receiver's RSA-2048 Public Key
 * (+ Sender's own Public Key for sender history), falling back to legacy AES-GCM only
 * when the receiver has not yet published an RSA public key.
 */
export async function encryptSupportPayload(params: {
  plaintext: string;
  receiverLookupId: string;
  senderUid?: string;
  senderServerPublicKey?: string;
  legacyChannelKey: string;
}): Promise<{
  message: string;
  encrypted: boolean;
  rsaEncrypted: boolean;
  encryptionAlgorithm?: 'RSA-OAEP-256' | 'RSA-OAEP-256+AES-256-GCM' | 'AES-GCM';
  rsaForRecipient?: string;
  rsaForSender?: string;
  rsaRecipientUid?: string;
  rsaSenderUid?: string;
}> {
  const { plaintext, receiverLookupId, senderUid, senderServerPublicKey, legacyChannelKey } = params;
  const recipientRec = await fetchRecipientRsaPublicKey(receiverLookupId, true);
  const senderKey = senderUid
    ? await syncMyRsaPublicKey(senderUid, senderServerPublicKey)
    : null;

  if (recipientRec?.rsaPublicKey) {
    const res = await rsaEncryptDirectional({
      plaintext,
      recipientPublicKey: recipientRec.rsaPublicKey,
      senderPublicKey: senderKey?.publicKey,
    });
    return {
      message: res.rsaForRecipient,
      encrypted: true,
      rsaEncrypted: true,
      encryptionAlgorithm: res.algorithm,
      rsaForRecipient: res.rsaForRecipient,
      rsaForSender: res.rsaForSender,
      rsaRecipientUid: recipientRec.uid,
      rsaSenderUid: senderUid,
    };
  }

  const fallback = await encryptMessage(plaintext, legacyChannelKey);
  return {
    message: fallback,
    encrypted: true,
    rsaEncrypted: false,
    encryptionAlgorithm: 'AES-GCM',
  };
}

/** Decrypt either an RSA-2048 envelope (strictly with active user's Private Key) or legacy AES-GCM. */
export async function decryptSupportPayload(params: {
  text?: string;
  encrypted?: boolean;
  rsaEncrypted?: boolean;
  rsaForRecipient?: string;
  rsaForSender?: string;
  rsaRecipientUid?: string;
  rsaSenderUid?: string;
  currentUid?: string;
  legacyChannelKey: string;
}): Promise<string> {
  const { text = '', encrypted, rsaEncrypted, rsaForRecipient, rsaForSender, rsaRecipientUid, rsaSenderUid, currentUid, legacyChannelKey } = params;
  if (!text) return '';

  if (rsaEncrypted || isRsaCiphertext(text) || rsaForRecipient || rsaForSender) {
    const res = await rsaDecryptForCurrentUser({
      primaryText: text,
      rsaForRecipient,
      rsaForSender,
      rsaRecipientUid,
      rsaSenderUid,
      currentUid,
    });
    return res.plaintext;
  }

  if (encrypted || text.startsWith('E2EE:')) {
    return decryptMessage(text, legacyChannelKey);
  }

  return text;
}

