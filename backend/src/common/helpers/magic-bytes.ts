const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'application/pdf': [new Uint8Array([0x25, 0x50, 0x44, 0x46])],
  'application/msword': [
    new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
  ],
  'application/vnd.ms-excel': [
    new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
  ],
  'image/jpeg': [new Uint8Array([0xff, 0xd8, 0xff])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
  'image/gif': [new Uint8Array([0x47, 0x49, 0x46, 0x38])],
  'application/zip': [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
};

const TEXT_LIKE_TYPES = new Set(['text/plain', 'text/csv', 'application/json']);

function bufferToUint8(buf: Buffer): Uint8Array {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function matchesMagic(data: Uint8Array, magic: Uint8Array): boolean {
  if (data.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (data[i] !== magic[i]) return false;
  }
  return true;
}

function hasNullBytes(data: Uint8Array): boolean {
  for (let i = 0; i < Math.min(data.length, 512); i++) {
    if (data[i] === 0) return true;
  }
  return false;
}

export function validateMagicBytes(
  fileBuffer: Buffer,
  declaredMime: string,
): boolean {
  const data = bufferToUint8(fileBuffer);
  if (data.length === 0) return false;

  const magics = MAGIC_BYTES[declaredMime];
  if (magics) {
    return magics.some((m) => matchesMagic(data, m));
  }

  if (TEXT_LIKE_TYPES.has(declaredMime)) {
    return !hasNullBytes(data);
  }

  return false;
}
