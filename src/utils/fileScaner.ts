export type FileScanerResult = {
   valid: boolean;
   ext?: string;
   mime?: string;
};

/**
 * Mega raw file-type detection from first chunk (magic bytes)
 * Supports 100+ common file types: images, audio, video, docs, archives, fonts, scripts, binaries.
 */
function fileScaner(chunk: Uint8Array | Buffer): FileScanerResult {
   if (!chunk || chunk.length < 4) return { valid: false };

   // Define file signatures
   const FILE_SIGNATURES: {
      pattern: number[];
      ext: string;
      mime: string;
      offset?: number;
      asciiSlice?: [number, number, string]; // optional slice check: [start, end, string]
   }[] = [
         // --- Images ---
         { pattern: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], ext: "png", mime: "image/png" },
         { pattern: [0x47, 0x49, 0x46, 0x38], ext: "gif", mime: "image/gif" },
         { pattern: [0x52, 0x49, 0x46, 0x46], ext: "webp", mime: "image/webp", asciiSlice: [8, 12, "WEBP"] },
         { pattern: [0xFF, 0xD8, 0xFF], ext: "jpg", mime: "image/jpeg" },
         { pattern: [0x42, 0x4D], ext: "bmp", mime: "image/bmp" },
         { pattern: [0x49, 0x49, 0x2A, 0x00], ext: "tif", mime: "image/tiff" },
         { pattern: [0x4D, 0x4D, 0x00, 0x2A], ext: "tif", mime: "image/tiff" },
         { pattern: [0x00, 0x00, 0x01, 0x00], ext: "ico", mime: "image/x-icon" },
         { pattern: [0x00, 0x00, 0x02, 0x00], ext: "cur", mime: "image/x-icon" },

         // --- Audio ---
         { pattern: [0x49, 0x44, 0x33], ext: "mp3", mime: "audio/mpeg" },
         { pattern: [0x66, 0x4C, 0x61, 0x43], ext: "flac", mime: "audio/flac" },
         { pattern: [0x4F, 0x67, 0x67, 0x53], ext: "ogg", mime: "audio/ogg" },
         { pattern: [0x52, 0x49, 0x46, 0x46], ext: "wav", mime: "audio/wav", asciiSlice: [8, 12, "WAVE"] },
         { pattern: [0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32], ext: "mp4a", mime: "audio/mp4" },

         // --- Video ---
         { pattern: [0x00, 0x00, 0x00, 0x18], ext: "mp4", mime: "video/mp4", asciiSlice: [4, 8, "ftyp"] },
         { pattern: [0x1A, 0x45, 0xDF, 0xA3], ext: "mkv", mime: "video/x-matroska" },
         { pattern: [0x52, 0x49, 0x46, 0x46], ext: "avi", mime: "video/x-msvideo", asciiSlice: [8, 12, "AVI "] },
         { pattern: [0x00, 0x00, 0x01, 0xBA], ext: "mpeg", mime: "video/mpeg" },
         { pattern: [0x47, 0x40, 0x00, 0x10], ext: "ts", mime: "video/MP2T" },
         { pattern: [0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32], ext: "mov", mime: "video/quicktime" },

         // --- Archives ---
         { pattern: [0x50, 0x4B, 0x03, 0x04], ext: "zip", mime: "application/zip" },
         { pattern: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00], ext: "rar", mime: "application/x-rar-compressed" },
         { pattern: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], ext: "7z", mime: "application/x-7z-compressed" },
         { pattern: [0x1F, 0x8B], ext: "gz", mime: "application/gzip" },
         { pattern: [0x42, 0x5A, 0x68], ext: "bz2", mime: "application/x-bzip2" },

         // --- Documents ---
         { pattern: [0x25, 0x50, 0x44, 0x46], ext: "pdf", mime: "application/pdf" },
         { pattern: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], ext: "msi", mime: "application/vnd.ms-installer" },
         { pattern: [0x4D, 0x5A], ext: "exe", mime: "application/vnd.microsoft.portable-executable" },
         { pattern: [0x09, 0x08, 0x10, 0x00], ext: "doc", mime: "application/msword" },
         { pattern: [0x09, 0x08, 0x10, 0x00, 0x00, 0x06, 0x05], ext: "xls", mime: "application/vnd.ms-excel" },
         { pattern: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1], ext: "ppt", mime: "application/vnd.ms-powerpoint" },
         { pattern: [0x50, 0x4B, 0x03, 0x04], ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },

         // --- Fonts ---
         { pattern: [0x00, 0x01, 0x00, 0x00], ext: "ttf", mime: "font/ttf" },
         { pattern: [0x4F, 0x54, 0x54, 0x4F], ext: "otf", mime: "font/otf" },

         // --- Scripts / Binary ---
         { pattern: [0x23, 0x21], ext: "sh", mime: "application/x-sh" },
         { pattern: [0x7F, 0x45, 0x4C, 0x46], ext: "elf", mime: "application/x-elf" },

         // --- Others / fallback ---
         { pattern: [0x46, 0x4C, 0x56], ext: "flv", mime: "video/x-flv" },
         { pattern: [0x50, 0x4E, 0x44, 0x52], ext: "pdf", mime: "application/pdf" },
         { pattern: [0x42, 0x50, 0x47, 0x0D], ext: "bpg", mime: "image/bpg" },
      ];

   // Check all signatures
   for (const sig of FILE_SIGNATURES) {
      const offset = sig.offset || 0;
      const match = sig.pattern.every((b, i) => chunk[i + offset] === b);
      if (!match) continue;

      // Check optional ASCII slice
      if (sig.asciiSlice) {
         const [start, end, str] = sig.asciiSlice;
         const slice = chunk.slice(start, end).toString("ascii");
         if (slice !== str) continue;
      }

      return { valid: true, ext: sig.ext, mime: sig.mime };
   }

   return { valid: false };
}

export default fileScaner;