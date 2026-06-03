/**
 * Pino configuration builder.
 * Sets up multistream: console (JSON) + file:.log (JSON) + file:.err (text, errors only).
 */
import pino, { type LoggerOptions, type Level, type MultiStreamRes } from 'pino';
import { multistream } from 'pino';
import SonicBoom from 'sonic-boom';
import { mkdirSync } from 'fs';
import { join } from 'path';

export interface PinoConfigOptions {
  service: string;
  level: string;
  logDir: string;
  disableFile: boolean;
  disableConsole: boolean;
}

/**
 * Generate a filename in YYYYMMDD_HHMMSS format for the current process start.
 */
export function generateLogFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Create a pino destination for a file using sonic-boom (async, non-blocking).
 */
function fileDestination(filePath: string): SonicBoom {
  return new SonicBoom({ dest: filePath, mkdir: true, sync: false });
}

/**
 * Build the pino configuration with multistream.
 */
export function createPinoConfig(options: PinoConfigOptions): LoggerOptions {
  const streams: pino.StreamEntry[] = [];

  // Console stream (JSON)
  if (!options.disableConsole) {
    streams.push({ level: options.level as Level, stream: process.stdout });
  }

  // File streams
  if (!options.disableFile) {
    try {
      mkdirSync(options.logDir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    const baseName = generateLogFilename();

    // .log — all levels, JSON format
    const logPath = join(options.logDir, `${baseName}.log`);
    streams.push({ level: options.level as Level, stream: fileDestination(logPath) });

    // .err — ERROR/FATAL only, text format
    // We use a pino transport to format errors as text
    const errPath = join(options.logDir, `${baseName}.err`);
    // Simple text stream for .err
    const errStream = fileDestination(errPath);
    // Wrap with a text formatter
    const textFormatStream = {
      write: (data: string) => {
        try {
          const obj = JSON.parse(data);
          const ts = obj.ts ?? obj.time ?? new Date().toISOString();
          const levelNum = obj.level ?? 50;
          const levelName = pino.levels.labels[levelNum] ?? 'ERROR';
          const msg = obj.msg ?? '';
          const context = obj.service ?? '';
          errStream.write(
            `[${new Date(ts).toISOString()}] [${levelName.toUpperCase()}] ${context} | ${msg}\n`,
          );
        } catch {
          errStream.write(data + '\n');
        }
      },
    };
    streams.push({ level: 'error' as Level, stream: textFormatStream });
  }

  return {
    level: options.level as Level,
    defaultMeta: { service: options.service },
    streams: streams.length > 0 ? (multistream(streams) as unknown as MultiStreamRes) : undefined,
  } as LoggerOptions;
}
