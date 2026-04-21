/**
 * ARES WEB - PII Encryption Utility
 * Uses Web Crypto API (AES-GCM) for authenticated encryption.
 * Output Format: "iv_hex:ciphertext_hex"
 **/

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = enc.encode(secret);
  
  // Use SHA-256 to derive a 256-bit key from the secret string
  const hash = await crypto.subtle.digest("SHA-256", keyMaterial);
  
  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string, secret: string): Promise<string> {
  if (!text) return "";
  const key = await getCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `${ivHex}:${cipherHex}`;
}

export async function decrypt(encryptedText: string, secret: string): Promise<string> {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  
  try {
    const [ivHex, cipherHex] = encryptedText.split(":");
    if (!ivHex || !cipherHex) return encryptedText;
    
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const key = await getCryptoKey(secret);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("[Crypto] Decryption failed:", err);
    // Fallback: return raw text (lazy migration support)
    return encryptedText;
  }
}
