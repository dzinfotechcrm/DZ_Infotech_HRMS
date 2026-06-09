function requiredEnv(names) {
  const keys = Array.isArray(names) ? names : [names];
  for (const name of keys) {
    const value = import.meta.env[name];
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${keys.join(' or ')}`);
}

function normalizePublicId(path) {
  const input = String(path || `uploads/${Date.now()}`);
  return input
    .replace(/\\/g, '/')
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\/{2,}/g, '/');
}

async function sha1(message) {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return sha1(`${stringToSign}${secret}`);
}

export async function uploadFile(path, file) {
  const cloudName = requiredEnv(['VITE_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_CLOUD_NAME']);
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || import.meta.env.CLOUDINARY_UPLOAD_PRESET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || import.meta.env.CLOUDINARY_API_SECRET;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const body = new FormData();

  body.append('file', file);
  body.append('public_id', normalizePublicId(path));

  if (uploadPreset) {
    body.append('upload_preset', uploadPreset);
  } else if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    body.append('api_key', apiKey);
    body.append('timestamp', String(timestamp));
    body.append('signature', await buildSignature({ public_id: normalizePublicId(path), timestamp }, apiSecret));
  } else {
    throw new Error(
      'Missing Cloudinary upload configuration. Provide VITE_CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_PRESET, or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET in your environment.'
    );
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body,
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || 'Cloudinary upload failed';
    throw new Error(message);
  }

  return payload.secure_url;
}

export async function deleteFile() {
  // Cloudinary destroy requires signed server-side calls. Not supported from client-only app.
  return Promise.resolve();
}
