import CryptoJS from 'crypto-js';

const DEFAULT_SECRET = 'Rashal117_SecretSalt_KeepItSafe';

function getSecretKey(): string {
  // In Node.js server, we have process.env.ENCRYPTION_SECRET.
  // In client-side, we fall back to a stable default secret.
  if (typeof process !== 'undefined' && process.env && process.env.ENCRYPTION_SECRET) {
    return process.env.ENCRYPTION_SECRET;
  }
  return DEFAULT_SECRET;
}

export function encryptLink(plainText: string): string {
  try {
    const key = getSecretKey();
    return CryptoJS.AES.encrypt(plainText, key).toString();
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

export function decryptLink(cipherText: string): string {
  try {
    const key = getSecretKey();
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '';
  }
}
