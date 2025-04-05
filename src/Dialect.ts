import xansql from ".";
import Model from "./model";
import { XansqlDialectDriver, XansqlDialectExcuteReturn } from "./type";

class Dialect {
   driver!: XansqlDialectDriver
   xansql: xansql;
   types: { [key: string]: string } = {
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

   typeAcceptValue: string[] = [
      'string',
      'enum'
   ]

   constructor(xansql: xansql) {
      this.xansql = xansql;
   }

   buildSchema(model: Model): string {
      throw new Error(`buildSchema method not implemented in dialect ${this.driver}`);
   }

   buildQuery(option: any): string {
      throw new Error("")
   }

   async excute(sql: any): Promise<XansqlDialectExcuteReturn<any>> {
      throw new Error(`excute method not implemented in dialect ${this.driver}`);
   }
}

export default Dialect