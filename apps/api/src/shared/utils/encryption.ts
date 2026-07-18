import { ERROR_CODE } from "../../express/constant";
import { appError } from "../../express/errors";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import bcrypt from "bcrypt"

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    appError("Encryption key not set", ERROR_CODE.INVLDDATA);
  }
  return secret;
}

export function encryptText(plainText: string): string {
  const key = getKey();
  const initVector = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, initVector);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([initVector, tag, encrypted]).toString("hex");
}

export function decryptText(encryptText: string): string {
  const key = getKey();
  const buf = Buffer.from(encryptText, "hex");
  const initVector = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGORITHM, key, initVector);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}


export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}