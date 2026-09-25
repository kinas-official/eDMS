import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * scrypt from node:crypto rather than a native argon2 package: no extra build
 * step on Windows or in the Tauri toolchain.
 *
 * Stored format: `scrypt$N$r$p$<salt b64>$<hash b64>`, so parameters can be
 * raised later without breaking existing hashes.
 */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;

function derive(password: string, salt: Buffer, opts: ScryptOptions, keyLen: number) {
	return new Promise<Buffer>((resolve, reject) =>
		// 128 * N * r bytes is needed; leave headroom over the 32 MB default.
		scrypt(password, salt, keyLen, { ...opts, maxmem: 256 * 1024 * 1024 }, (err, key) =>
			err ? reject(err) : resolve(key)
		)
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await derive(password, salt, { N, r: R, p: P }, KEY_LEN);
	return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [algo, n, r, p, saltB64, hashB64] = stored.split('$');
	if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;

	const expected = Buffer.from(hashB64, 'base64');
	const actual = await derive(
		password,
		Buffer.from(saltB64, 'base64'),
		{ N: Number(n), r: Number(r), p: Number(p) },
		expected.length
	);
	return timingSafeEqual(actual, expected);
}
