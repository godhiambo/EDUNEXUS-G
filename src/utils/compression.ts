import LZString from 'lz-string';

const COMPRESSION_PREFIX = '_COMPRESSED_LZ64_:';

/**
 * Compresses a string value using LZ-string compression if it meets length requirements.
 */
export function compressString(val: string): string {
  if (!val || typeof val !== 'string') return val;
  // Only compress if the string is reasonably long (e.g., 1000 characters) to avoid compression overhead
  if (val.length < 1000) return val;
  try {
    const compressed = LZString.compressToBase64(val);
    // Only use compressed version if it is actually smaller!
    if (compressed.length < val.length) {
      return COMPRESSION_PREFIX + compressed;
    }
  } catch (e) {
    console.error('Compression failed:', e);
  }
  return val;
}

/**
 * Decompresses a string value if it was previously compressed using LZ-string compression.
 */
export function decompressString(val: string): string {
  if (typeof val !== 'string' || !val.startsWith(COMPRESSION_PREFIX)) {
    return val;
  }
  try {
    const compressedData = val.substring(COMPRESSION_PREFIX.length);
    const decompressed = LZString.decompressFromBase64(compressedData);
    if (decompressed !== null) {
      return decompressed;
    }
  } catch (e) {
    console.error('Decompression failed:', e);
  }
  return val;
}

/**
 * Recursively compresses all string fields in an object (like a Document) if they are large enough.
 */
export function compressObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => compressObject(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (typeof val === 'string') {
        result[key] = compressString(val);
      } else if (typeof val === 'object' && val !== null) {
        result[key] = compressObject(val);
      } else {
        result[key] = val;
      }
    }
    return result as T;
  }
  
  return obj;
}

/**
 * Recursively decompresses all string fields in an object (like a Document) that were compressed.
 */
export function decompressObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => decompressObject(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (typeof val === 'string') {
        result[key] = decompressString(val);
      } else if (typeof val === 'object' && val !== null) {
        result[key] = decompressObject(val);
      } else {
        result[key] = val;
      }
    }
    return result as T;
  }
  
  return obj;
}
