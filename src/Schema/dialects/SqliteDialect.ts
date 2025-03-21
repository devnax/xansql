import { SchemaMap } from "../types";
import BaseDialect from "./BaseDialect";

class SqliteDialect extends BaseDialect {
   footer: string[] = [];

   typeAcceptValue: string[] = []

   constructor(schema: SchemaMap) {
      super({
         schema,
         dialect: "sqlite",
         types: {
            integer: "INTEGER",
            bigInteger: "BIGINT",
            decimal: "NUMERIC",
            float: "REAL",
            boolean: "INTEGER",
            tinyint: "INTEGER",

            string: "TEXT",
            text: "TEXT",

            date: "TEXT",
            time: "TEXT",
            datetime: "TEXT",
            timestamp: "TEXT",

            json: "TEXT",
            jsonb: "TEXT",
            binary: "BLOB",

            uuid: "TEXT",
            enum: "TEXT",
         }
      })
   }
}

export default SqliteDialect;
