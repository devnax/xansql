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

class XansqlError extends Error {
   public readonly code: XansqlErrorCode
   public readonly model?: string
   public readonly field?: string
   public readonly sql?: string
   public readonly params?: object
   public readonly timestamp: string

   constructor(options: XansqlErrorOptions) {
      super(options.message)

      this.name = "XansqlError"
      this.code = options.code
      this.model = options.model
      this.field = options.field
      this.sql = options.sql
      this.params = options.params
      this.timestamp = new Date().toISOString()
      Error.captureStackTrace?.(this, XansqlError)
      super.message = this.format() as string

   }

   toJSON() {
      return {
         name: this.name,
         code: this.code,
         message: this.message,
         model: this.model,
         field: this.field,
         sql: this.sql,
         params: this.params,
         timestamp: this.timestamp,
      }
   }

   format(): string {
      let context = []
      if (this.model) {
         context.push(`Model: ${this.model}`)
      }
      if (this.field) {
         context.push(`Field: ${this.field}`)
      }
      if (this.sql) {
         context.push(`SQL: ${this.sql}`)
      }
      if (this.params) {
         context.push(`Params: ${JSON.stringify(this.params, null, 2)}`)
      }
      return `  XANSQL ERROR  •  ${this.code}

- Message
  ${this.message}

- Context
${context.join("\n")}
Time  : ${this.timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()
   }


}

export default XansqlError