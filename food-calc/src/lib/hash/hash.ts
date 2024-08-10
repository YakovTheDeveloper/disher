import CryptoJS from 'crypto-js';

const passphrase = "your-passphrase"

export function generateHash(input: string): string {
    const encrypted = CryptoJS.AES.encrypt(input, passphrase).toString();
    const base64Encoded = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encrypted));
    return base64Encoded;
}


export function fromHash(encoded: string): string {
    const base64Decoded = CryptoJS.enc.Base64.parse(encoded).toString(CryptoJS.enc.Utf8);
    const decryptedBytes = CryptoJS.AES.decrypt(base64Decoded, passphrase);
    const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedString;
}