export type XansqlErrorCode =
   | "INVALID_ARGUMENTS"
   | "VALIDATION_ERROR"
   | "QUERY_ERROR"
   | "CONNECTION_ERROR"
   | "NOT_FOUND"
   | "UNIQUE_CONSTRAINT"
   | "FOREIGN_KEY_CONSTRAINT"
   | "MIGRATION_ERROR"
   | "INTERNAL_ERROR"
   | "FILE_ERROR"

export interface XansqlErrorOptions {
   code: XansqlErrorCode
   message: string
   model?: string
   field?: string
   sql?: string
   params?: object
}

// 🎨 ANSI helpers
const ansi = {
   reset: "\x1b[0m",
   bold: "\x1b[1m",
   dim: "\x1b[2m",

   red: "\x1b[31m",
   yellow: "\x1b[33m",
   cyan: "\x1b[36m",
   magenta: "\x1b[35m",
   gray: "\x1b[90m",

   bgRed: "\x1b[41m",
   black: "\x1b[30m",
   white: "\x1b[37m",
}

const color = {
   bold: (s: string) => ansi.bold + s + ansi.reset,
   red: (s: string) => ansi.red + s + ansi.reset,
   yellow: (s: string) => ansi.yellow + s + ansi.reset,
   cyan: (s: string) => ansi.cyan + s + ansi.reset,
   magenta: (s: string) => ansi.magenta + s + ansi.reset,
   gray: (s: string) => ansi.gray + s + ansi.reset,
   bgRedWhite: (s: string) => ansi.bgRed + ansi.white + s + ansi.reset,
}

export class XansqlError extends Error {
   public readonly code: XansqlErrorCode
   public readonly model?: string
   public readonly field?: string
   public readonly sql?: string
   public readonly params?: object

   constructor(options: XansqlErrorOptions) {
      super(options.message)

      this.name = "XansqlError"
      this.code = options.code
      this.model = options.model
      this.field = options.field
      this.sql = options.sql
      this.params = options.params

      Object.setPrototypeOf(this, new.target.prototype)
      Error.captureStackTrace?.(this, XansqlError)
   }

   // 🎨 Pretty colored output (terminal)
   get pretty(): string {
      const context: string[] = []
      if (this.model) context.push(color.cyan("Model: ") + this.model)
      if (this.field) context.push(color.cyan("Field: ") + this.field)
      if (this.sql) context.push(color.cyan("SQL: ") + this.sql)
      if (this.params) {
         context.push(
            color.cyan("Params: ") +
            color.gray(JSON.stringify(this.params, null, 2))
         )
      }

      return [
         color.bold(color.bgRedWhite(" XANSQL ERROR ")) +
         " " +
         color.bold(color.red(this.code)),
         "",
         color.bold(color.yellow("Message:")),
         "  " + this.message,
         "",
         context.length ? context.join("\n") : color.gray("  (none)"),
         "",
      ].join("\n")
   }
}

export default XansqlError