export function parseBigIntParam(value: string): bigint | null {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}
