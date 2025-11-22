import { isNode, isBun, isDeno } from "./runtime";

export class FileSystem {
   // ------------------------
   // Exists (file or folder)
   // ------------------------
   static async exists(path: string): Promise<boolean> {
      if (isNode()) {
         const fs = await import("fs/promises");
         try {
            await fs.stat(path);
            return true;
         } catch {
            return false;
         }
      }

      if (isBun()) {
         try {
            const file = Bun.file(path);
            return await file.exists();
         } catch {
            return false;
         }
      }

      if (isDeno()) {
         try {
            await Deno.stat(path);
            return true;
         } catch {
            return false;
         }
      }

      throw new Error("Unsupported runtime");
   }

   // ------------------------
   // Create folder
   // ------------------------
   static async mkdir(path: string): Promise<void> {
      if (isNode()) {
         const fs = await import("fs/promises");
         await fs.mkdir(path, { recursive: true });
         return;
      }

      if (isBun()) {
         await Bun.fileSystem.mkdir(path, { recursive: true });
         return;
      }

      if (isDeno()) {
         await Deno.mkdir(path, { recursive: true });
         return;
      }

      throw new Error("Unsupported runtime");
   }

   // ------------------------
   // Create or write file
   // ------------------------
   static async write(path: string, content: string | Uint8Array): Promise<void> {
      if (isNode()) {
         const fs = await import("fs/promises");
         await fs.writeFile(path, content);
         return;
      }

      if (isBun()) {
         await Bun.write(path, content);
         return;
      }

      if (isDeno()) {
         const data =
            typeof content === "string"
               ? new TextEncoder().encode(content)
               : content;
         await Deno.writeFile(path, data);
         return;
      }

      throw new Error("Unsupported runtime");
   }

   // ------------------------
   // Read file
   // ------------------------
   static async read(path: string): Promise<Uint8Array> {
      if (isNode()) {
         const fs = await import("fs/promises");
         return new Uint8Array(await fs.readFile(path));
      }

      if (isBun()) {
         const file = Bun.file(path);
         return new Uint8Array(await file.arrayBuffer());
      }

      if (isDeno()) {
         return await Deno.readFile(path);
      }

      throw new Error("Unsupported runtime");
   }

   // ------------------------
   // Delete file or folder
   // ------------------------
   static async remove(path: string): Promise<void> {
      if (isNode()) {
         const fs = await import("fs/promises");
         await fs.rm(path, { recursive: true, force: true });
         return;
      }

      if (isBun()) {
         await Bun.fileSystem.rm(path, { recursive: true, force: true });
         return;
      }

      if (isDeno()) {
         await Deno.remove(path, { recursive: true });
         return;
      }

      throw new Error("Unsupported runtime");
   }

   // ------------------------
   // Check if file
   // ------------------------
   static async isFile(path: string): Promise<boolean> {
      if (!(await FileSystem.exists(path))) return false;

      if (isNode()) {
         const fs = await import("fs/promises");
         return (await fs.stat(path)).isFile();
      }

      if (isBun()) {
         const info = await Bun.fileSystem.stat(path);
         return info.type === "file";
      }

      if (isDeno()) {
         const info = await Deno.stat(path);
         return info.isFile;
      }

      return false;
   }

   // ------------------------
   // Check if directory
   // ------------------------
   static async isDir(path: string): Promise<boolean> {
      if (!(await FileSystem.exists(path))) return false;

      if (isNode()) {
         const fs = await import("fs/promises");
         return (await fs.stat(path)).isDirectory();
      }

      if (isBun()) {
         const info = await Bun.fileSystem.stat(path);
         return info.type === "directory";
      }

      if (isDeno()) {
         const info = await Deno.stat(path);
         return info.isDirectory;
      }

      return false;
   }
}


export default FileSystem;