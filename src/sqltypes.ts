class ColumnType {
   type: string;
   options: Record<string, any>;

   constructor(type: string, options: Record<string, any> = {}) {
      this.type = type;
      this.options = options;
   }

   primary(): this {
      this.options.primary = true;
      return this;
   }

   unique(): this {
      this.options.unique = true;
      return this;
   }

   notNull(): this {
      this.options.notNull = true;
      return this;
   }

   default(value: any): this {
      this.options.default = value;
      return this;
   }

   unsigned(): this {
      this.options.unsigned = true;
      return this;
   }

   autoIncrement(): this {
      this.options.autoIncrement = true;
      return this;
   }

   toSQL(dialect: string = "mysql"): { type: string; options: Record<string, any> } {
      let sqlType = this.type;
      switch (dialect) {
         case "postgres":
            if (sqlType === "increments") sqlType = "SERIAL";
            if (sqlType === "uuid") sqlType = "UUID";
            if (sqlType === "json") sqlType = "JSONB";
            if (sqlType === "boolean") sqlType = "BOOLEAN";
            if (sqlType === "bigInteger") sqlType = "BIGINT";
            break;
         case "sqlite":
            if (sqlType === "increments") sqlType = "INTEGER PRIMARY KEY AUTOINCREMENT";
            if (sqlType === "uuid") sqlType = "TEXT";
            if (sqlType === "json") sqlType = "TEXT";
            if (sqlType === "bigInteger") sqlType = "INTEGER";
            break;
         case "mssql":
            if (sqlType === "increments") sqlType = "INT IDENTITY(1,1)";
            if (sqlType === "uuid") sqlType = "UNIQUEIDENTIFIER";
            if (sqlType === "boolean") sqlType = "BIT";
            if (sqlType === "bigInteger") sqlType = "BIGINT";
            break;
         default: // MySQL
            if (sqlType === "increments") sqlType = "INT AUTO_INCREMENT";
            if (sqlType === "uuid") sqlType = "CHAR(36)";
            if (sqlType === "json") sqlType = "JSON";
            if (sqlType === "bigInteger") sqlType = "BIGINT";
            break;
      }
      return { type: sqlType, options: this.options };
   }

   toJSON(): string {
      return JSON.stringify({ type: this.type, options: this.options });
   }
}

// Basic Types
const increments = (): ColumnType => new ColumnType("increments").primary().autoIncrement();
const uuid = (): ColumnType => new ColumnType("uuid").primary();
const binary = (length: number = 16): ColumnType => new ColumnType("binary", { length });

// Numeric Types
const integer = (length: number = 11): ColumnType => new ColumnType("integer", { length });
const bigInteger = (): ColumnType => new ColumnType("bigInteger");
const decimal = (precision: number = 10, scale: number = 2): ColumnType => new ColumnType("decimal", { precision, scale });
const float = (): ColumnType => new ColumnType("float");
const double = (): ColumnType => new ColumnType("double");
const unsignedInteger = (): ColumnType => integer().unsigned();

// String Types
const string = (length: number = 255): ColumnType => new ColumnType("string", { length });
const char = (length: number = 10): ColumnType => new ColumnType("char", { length });
const text = (): ColumnType => new ColumnType("text");
const longText = (): ColumnType => new ColumnType("longText");
const email = (): ColumnType => string(255).unique();
const hashedString = (length: number = 255): ColumnType => new ColumnType("hashedString", { length });

// Boolean Type
const boolean = (): ColumnType => new ColumnType("boolean");

// Date & Time Types
const timestamp = (): ColumnType => new ColumnType("timestamp");
const datetime = (): ColumnType => new ColumnType("datetime");
const date = (): ColumnType => new ColumnType("date");
const time = (): ColumnType => new ColumnType("time");

// JSON & Spatial Types
const json = (): ColumnType => new ColumnType("json");
const point = (): ColumnType => new ColumnType("point");
const polygon = (): ColumnType => new ColumnType("polygon");

// Enum & Set Types
const enumType = (values: string[]): ColumnType => new ColumnType("enum", { values });
const set = (values: string[]): ColumnType => new ColumnType("set", { values });

// Relation Types
const relation = (table: string, foreignKey: string): ColumnType => new ColumnType("relation", { table, foreignKey });
const hasOne = (table: string, foreignKey: string): ColumnType => new ColumnType("hasOne", { table, foreignKey });
const hasMany = (table: string, foreignKey: string): ColumnType => new ColumnType("hasMany", { table, foreignKey });
const belongsTo = (table: string, foreignKey: string): ColumnType => new ColumnType("belongsTo", { table, foreignKey });
const belongsToMany = (table: string, pivotTable: string): ColumnType => new ColumnType("belongsToMany", { pivotTable });

// Special Functions
const ip = (): ColumnType => new ColumnType("ip");
const mac = (): ColumnType => new ColumnType("mac");
const slug = (): ColumnType => new ColumnType("slug");
const timestamps = (): Record<string, ColumnType> => ({
   created_at: timestamp().default("CURRENT_TIMESTAMP"),
   updated_at: timestamp()
});
const softDeletes = (): ColumnType => new ColumnType("softDeletes");

// SQL Query Generator
function generateSQLQuery(tableName: string, schema: Record<string, ColumnType>, dialect: string = "mysql"): string {
   let columnsSQL = Object.entries(schema)
      .map(([name, column]) => {
         const { type, options } = column.toSQL(dialect);
         let columnDef = `\"${name}\" ${type}`;
         if (options.primary) columnDef += " PRIMARY KEY";
         if (options.autoIncrement) columnDef += " AUTOINCREMENT";
         if (options.notNull) columnDef += " NOT NULL";
         if (options.default !== undefined) columnDef += ` DEFAULT '${options.default}'`;
         return columnDef;
      })
      .join(", ");
   return `CREATE TABLE \"${tableName}\" (${columnsSQL});`;
}

export {
   ColumnType,
   increments, uuid, binary,
   integer, bigInteger, decimal, float, double, unsignedInteger,
   string, char, text, longText, email, hashedString,
   boolean,
   timestamp, datetime, date, time,
   json, point, polygon,
   enumType, set,
   relation, hasOne, hasMany, belongsTo, belongsToMany,
   ip, mac, slug, timestamps, softDeletes,
   generateSQLQuery
};
