import { SchemaMap } from "../types";
import BaseDialect from "./BaseDialect";

class MysqlDialect extends BaseDialect {
   typeAcceptValue: string[] = ['string', 'enum', 'tinyint']

   constructor(schema: SchemaMap) {
      super({
         schema,
         dialect: "mysql",
         types: {
            integer: "INT",
            bigInteger: "BIGINT",
            decimal: "DECIMAL",
            float: "FLOAT",
            boolean: "TINYINT(1)",
            tinyint: "TINYINT",

            string: "VARCHAR",
            text: "TEXT",

            date: "DATE",
            time: "TIME",
            datetime: "DATETIME",
            timestamp: "TIMESTAMP",

            json: "JSON",
            jsonb: "JSON",
            binary: "BLOB",

            uuid: "CHAR(36)",
            enum: "ENUM",
         }
      })
   }


}

export default MysqlDialect;