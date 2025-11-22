export function isBun(): boolean {
   return (
      (typeof (globalThis as any).Bun !== "undefined") ||
      (typeof process !== "undefined" &&
         typeof (process as any).versions?.bun === "string")
   );
}

export function isDeno(): boolean {
   return (
      typeof (globalThis as any).Deno !== "undefined" &&
      typeof (globalThis as any).Deno.version?.deno === "string"
   );
}

export function isNode(): boolean {
   return (
      typeof process !== "undefined" &&
      typeof process.versions?.node === "string" &&
      !isBun() && // Bun mimics Node
      !isDeno()   // Deno sometimes polyfills process
   );
}


export function cwd(): string {
   if (isBun()) return Bun.cwd();
   if (isDeno()) return Deno.cwd();
   if (isNode()) return process.cwd();
   throw new Error("Unable to determine current working directory");
}
