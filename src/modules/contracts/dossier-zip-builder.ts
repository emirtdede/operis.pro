/**
 * Zero-Dependency PKZip 2.0 Archive Builder
 *
 * Designed for serverless environments using native Node.js zlib.
 * Compliant with ISO/IEC 21320-1 (Document Container File - ZIP).
 */

import { deflateRawSync, crc32 } from "zlib";

export interface ZipEntryInput {
  name: string;
  content: string | Buffer;
  date?: Date;
}

export class DossierZipBuilder {
  private files: Array<{
    nameBuf: Buffer;
    contentBuf: Buffer;
    compressedBuf: Buffer;
    crc: number;
    uncompressedSize: number;
    compressedSize: number;
    dosTime: number;
    dosDate: number;
  }> = [];

  /**
   * Encodes a standard JS Date into MS-DOS 16-bit time and 16-bit date integers.
   */
  private static toDosDateTime(d: Date): { time: number; date: number } {
    const year = Math.max(1980, Math.min(2099, d.getFullYear()));
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = Math.floor(d.getSeconds() / 2);

    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    const dosDate = ((year - 1980) << 9) | (month << 5) | day;

    return { time: dosTime, date: dosDate };
  }

  /**
   * Adds a file or document to the archive.
   * Path should be forward-slash delimited (e.g. "folder/subfolder/file.md").
   */
  addFile(name: string, content: string | Buffer, date: Date = new Date("2026-09-19T12:00:00Z")): this {
    // Normalize path to forward slashes and strip leading slashes
    const normalizedName = name.replace(/\\/g, "/").replace(/^\/+/, "");
    const nameBuf = Buffer.from(normalizedName, "utf8");
    const contentBuf = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");

    const crcVal = typeof crc32 === "function" ? crc32(contentBuf) : 0;
    const compressedBuf = deflateRawSync(contentBuf);
    const { time: dosTime, date: dosDate } = DossierZipBuilder.toDosDateTime(date);

    this.files.push({
      nameBuf,
      contentBuf,
      compressedBuf,
      crc: crcVal,
      uncompressedSize: contentBuf.length,
      compressedSize: compressedBuf.length,
      dosTime,
      dosDate,
    });

    return this;
  }

  /**
   * Compiles the archive and returns a standard .zip Buffer.
   */
  build(): Buffer {
    const localRecords: Buffer[] = [];
    const centralRecords: Buffer[] = [];
    let currentOffset = 0;

    for (const file of this.files) {
      // 1. Local File Header (30 bytes + filename + compressed data)
      const lh = Buffer.alloc(30);
      lh.writeUInt32LE(0x04034b50, 0); // Local header signature
      lh.writeUInt16LE(20, 4); // Minimum version required (2.0)
      lh.writeUInt16LE(0x0800, 6); // General purpose bit flag (Bit 11: UTF-8 encoding)
      lh.writeUInt16LE(8, 8); // Compression method: 8 (Deflate)
      lh.writeUInt16LE(file.dosTime, 10);
      lh.writeUInt16LE(file.dosDate, 12);
      lh.writeUInt32LE(file.crc, 14);
      lh.writeUInt32LE(file.compressedSize, 18);
      lh.writeUInt32LE(file.uncompressedSize, 22);
      lh.writeUInt16LE(file.nameBuf.length, 26);
      lh.writeUInt16LE(0, 28); // Extra field length

      const localRecord = Buffer.concat([lh, file.nameBuf, file.compressedBuf]);
      localRecords.push(localRecord);

      // 2. Central Directory Header (46 bytes + filename)
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0); // Central directory signature
      cd.writeUInt16LE(20, 4); // Version made by (UNIX / DOS 2.0)
      cd.writeUInt16LE(20, 6); // Version needed to extract (2.0)
      cd.writeUInt16LE(0x0800, 8); // General purpose bit flag (UTF-8)
      cd.writeUInt16LE(8, 10); // Compression method (Deflate)
      cd.writeUInt16LE(file.dosTime, 12);
      cd.writeUInt16LE(file.dosDate, 14);
      cd.writeUInt32LE(file.crc, 16);
      cd.writeUInt32LE(file.compressedSize, 20);
      cd.writeUInt32LE(file.uncompressedSize, 24);
      cd.writeUInt16LE(file.nameBuf.length, 28);
      cd.writeUInt16LE(0, 30); // Extra field length
      cd.writeUInt16LE(0, 32); // File comment length
      cd.writeUInt16LE(0, 34); // Disk number start
      cd.writeUInt16LE(0, 36); // Internal file attributes
      cd.writeUInt32LE(0, 38); // External file attributes
      cd.writeUInt32LE(currentOffset, 42); // Relative offset of local header

      centralRecords.push(Buffer.concat([cd, file.nameBuf]));
      currentOffset += localRecord.length;
    }

    const centralDirectoryBuffer = Buffer.concat(centralRecords);
    const cdOffset = currentOffset;
    const cdSize = centralDirectoryBuffer.length;

    // 3. End of Central Directory Record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4); // Number of this disk
    eocd.writeUInt16LE(0, 6); // Disk where central directory starts
    eocd.writeUInt16LE(this.files.length, 8); // Number of central directory records on this disk
    eocd.writeUInt16LE(this.files.length, 10); // Total number of central directory records
    eocd.writeUInt32LE(cdSize, 12); // Size of central directory
    eocd.writeUInt32LE(cdOffset, 16); // Offset of start of central directory
    eocd.writeUInt16LE(0, 20); // Comment length

    return Buffer.concat([...localRecords, centralDirectoryBuffer, eocd]);
  }
}
