import argon2 from "argon2";

export function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19 * 1024,
    timeCost: 3,
    parallelism: 1
  });
}

export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}
