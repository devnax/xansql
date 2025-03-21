import { SchemaMap } from "../types";
import BaseDialect from "./BaseDialect";

class PostgresDialect extends BaseDialect {
   typeAcceptValue: string[] = [
      "string",
      "enum"
   ]

   constructor(schema: SchemaMap) {
      super({
         schema,
         dialect: "postgres",
         types: {
            integer: "INTEGER",
            bigInteger: "BIGINT",
            decimal: "DECIMAL",
            float: "REAL",
            boolean: "BOOLEAN",
            tinyint: "SMALLINT",

            string: "VARCHAR",
            text: "TEXT",

            date: "DATE",
            time: "TIME",
            datetime: "TIMESTAMP",
            timestamp: "TIMESTAMP",

            json: "JSON",
            jsonb: "JSONB",
            binary: "BYTEA",

            uuid: "UUID",
            enum: "TEXT CHECK",
         }
      });
   }
}

export default PostgresDialect;
