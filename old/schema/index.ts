export * from './functions'

import MssqlDialect from './dialects/MSSqlDialect';
import MysqlDialect from './dialects/MysqlDialect';
import PostgresDialect from './dialects/PostgresDialect';
import SqliteDialect from './dialects/SqliteDialect';
import { Dialects, SchemaMap } from "./types";

class Schema {
   schema: SchemaMap;
   tableName: string;

   constructor(tableName: string, schema: SchemaMap) {
      this.schema = schema;
      this.tableName = tableName;
   }

   toSQL(dialect: Dialects): string {
      switch (dialect) {
         case "mysql":
            return new MysqlDialect(this.schema).toSQL(this.tableName);
         case "postgres":
            return new PostgresDialect(this.schema).toSQL(this.tableName);
         case "sqlite":
            return new SqliteDialect(this.schema).toSQL(this.tableName);
         case "mssql":
            return new MssqlDialect(this.schema).toSQL(this.tableName);
         default:
            throw new Error(`Unsupported dialect: ${dialect}`);
      }
   }
}

export default Schema;

