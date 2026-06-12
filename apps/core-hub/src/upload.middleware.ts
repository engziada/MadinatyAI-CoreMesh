import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Request, Response, NextFunction } from 'express';

/**
 * Express middleware that handles PUT/GET for local file uploads.
 *
 * Registered in main.ts BEFORE NestJS routing so raw binary PUTs
 * bypass NestJS JSON body parsing entirely.
 *
 *   PUT /api/v1/uploads/<key>  → saves raw body to disk
 *   GET /api/v1/uploads/<key>  → streams the file back
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SECURITY (R-11 F-02)
 * ─────────────────────────────────────────────────────────────────────────
 * This middleware bypasses every NestJS guard, including JwtAuthGuard. It
 * was only ever intended as a dev-only fallback for environments without R2
 * configured. In production, R2 is mandatory (KANTO_R2_ENDPOINT must be
 * set + presigned URLs handle uploads), so this code path MUST NOT be
 * registered. We refuse to register it when NODE_ENV === 'production'.
 *
 * Additional v1 hardening for the dev/staging path:
 *   - 10 MB raw-body cap (matches the FE-side cap in the wizard)
 *   - Extension allowlist; reject anything not in IMAGE_EXTENSIONS
 *   - Disallow absolute paths and path traversal
 *   - Force a sanitised content-type on GET so the browser can't be tricked
 *     into rendering a .svg / .html attachment as a script
 */
const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads');
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif',
]);

function safeContentTypeFor(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  if (lower.endsWith('.avif')) return 'image/avif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  // Anything else: opaque download. Never `text/html` or `image/svg+xml`.
  return 'application/octet-stream';
}

function extensionOf(key: string): string {
  const idx = key.lastIndexOf('.');
  return idx >= 0 ? key.slice(idx).toLowerCase() : '';
}

export function uploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  const prefix = '/api/v1/uploads/';
  if (!req.path.startsWith(prefix)) {
    next();
    return;
  }

  // R-11 F-02: refuse the entire path in production. R2 must be configured.
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Local upload disabled in production' });
    return;
  }

  const key = req.path.slice(prefix.length);
  // Reject empty, absolute, traversal, and backslash variants. Then verify the
  // resolved path stays under UPLOAD_DIR (defence in depth — `..` filter alone
  // can be bypassed by encoded slashes on some setups).
  if (!key || key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    res.status(400).json({ error: 'Invalid upload key' });
    return;
  }
  const ext = extensionOf(key);
  if (!IMAGE_EXTENSIONS.has(ext)) {
    res.status(400).json({ error: 'Unsupported file extension' });
    return;
  }
  const filePath = join(UPLOAD_DIR, key);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    res.status(400).json({ error: 'Invalid upload key' });
    return;
  }

  // GET — serve file with a sanitised content-type so browsers can't be
  // tricked into rendering a stored payload as HTML/script.
  if (req.method === 'GET') {
    res.setHeader('Content-Type', safeContentTypeFor(key));
    res.setHeader('Content-Disposition', `inline; filename="${key.split('/').pop() ?? 'file'}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: 'Not found' });
      }
    });
    return;
  }

  // PUT — save raw body to disk with a size cap.
  if (req.method === 'PUT') {
    let received = 0;
    let truncated = false;
    const chunks: Buffer[] = [];

    // Enforce Content-Length up front when the client supplies it.
    const declared = Number(req.headers['content-length'] ?? 0);
    if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }

    req.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_UPLOAD_BYTES) {
        truncated = true;
        req.destroy(); // abort the stream
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', async () => {
      if (truncated) {
        if (!res.headersSent) res.status(413).json({ error: 'Payload too large' });
        return;
      }
      try {
        const buffer = Buffer.concat(chunks);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, buffer);
        res.status(200).json({ ok: true });
      } catch {
        res.status(500).json({ error: 'Save failed' });
      }
    });
    req.on('error', () => {
      if (!res.headersSent) res.status(500).json({ error: 'Upload stream error' });
    });
    return;
  }

  next();
}
