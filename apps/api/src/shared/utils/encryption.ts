import { ERROR_CODE } from "../../express/constant";
import { appError } from "../../express/errors";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomInt,
  createHash,
} from "crypto";
import bcrypt from "bcrypt";
import { env } from "../env";

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const DEFAULT_RANDOM =
  "QW5df3dgx2h9j9_Y23243565reubdjcqfz8gb3nqmLZXCVBNM0123%##U_U(!@U]-i32e9#$@";

function getKey(): Buffer {
  const secret = env.ENCRYPTION_KEY;
  if (!secret) {
    appError("Encryption key not set", ERROR_CODE.INVLDDATA);
  }
  // aes-256-gcm requires exactly 32 bytes. Hashing ensures any string length works securely.
  return createHash("sha256").update(secret).digest();
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

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomStr(len: number) {
  const resp: string[] = [];
  for (let i = len; i > 0; i--) {
    resp.push(DEFAULT_RANDOM[randomInt(DEFAULT_RANDOM.length - 1)]);
  }

  return resp.join("");
}

export interface VerificationTokenData {
  email: string;
  expiresAt: number;
}

export function decodeVerificationToken(token: string): VerificationTokenData {
  try {
    const decrypted = decryptText(token);
    const parts = decrypted.split("::");

    if (parts.length !== 4) {
      appError("Invalid token format", ERROR_CODE.INVLDDATA);
    }

    const email = parts[1];
    const expiresAt = parseInt(parts[3], 10);

    if (isNaN(expiresAt)) {
      appError("Invalid expiration time in token", ERROR_CODE.INVLDDATA);
    }

    return { email, expiresAt };
  } catch (error: any) {
    if (error?.isApplicationError) {
      throw error;
    }
    appError("Invalid or corrupted token", ERROR_CODE.INVLDDATA);
  }
}
