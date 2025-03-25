import { SchemaMap } from "../types";
import BaseDialect from "./BaseDialect";

class MssqlDialect extends BaseDialect {
   typeAcceptValue: string[] = ["string", "enum", "tinyint"]
   constructor(schema: SchemaMap) {
      super({
         schema,
         dialect: "mssql",
         types: {
            integer: "INT",
            bigInteger: "BIGINT",
            decimal: "DECIMAL",
            float: "FLOAT",
            boolean: "BIT",
            tinyint: "TINYINT",

            string: "NVARCHAR",
            text: "TEXT",

            date: "DATE",
            time: "TIME",
            datetime: "DATETIME",
            timestamp: "DATETIME2",

            json: "NVARCHAR(MAX)",
            jsonb: "NVARCHAR(MAX)",
            binary: "VARBINARY(MAX)",

            uuid: "UNIQUEIDENTIFIER",
            enum: "NVARCHAR(255)",
         }
      })
   }
}

export default MssqlDialect;
