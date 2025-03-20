import Column from "./Column";
import { DialectTypes } from "./Column/types";
import { integer, bigInteger, tinyint, decimal, float, boolean, string, text, date, time, datetime, timestamp, json, jsonb, binary, uuid, enums, increments, id, unique, createdAt, updatedAt } from "./sqltypes";
import MysqlDialect from "./Dialects/mysql";

/* 
MySQL
PostgreSQL
SQLite3
MSSQL (Microsoft SQL Server)
Oracle
MariaDB
Amazon Redshift
*/


type Schemas = {
   [key: string]: Column
}

class Schema {
   table: string;
   schemas: Schemas
   constructor(table: string, schemas: Schemas) {
      this.table = table;
      this.schemas = schemas;
   }

   toSql(dialect: DialectTypes = "mysql") {
      const sqlmaker = new MysqlDialect(this.schemas);
      return sqlmaker.toSql(this.table);
   }

   toJson() {
      return JSON.stringify(this.schemas);
   }
}


const userSchema = new Schema("users", {
   id: id(),
   name: string(),
   email: string(),
   password: string(),
   created_at: createdAt(),
   updated_at: updatedAt(),
})

const userMetaSchema = new Schema("user_meta", {
   increments: increments(),
   bigInteger: bigInteger(),
   tinyint: tinyint(),
   decimal: decimal(),
   float: float().default(0.0),
   boolean: boolean().default(false),
   string: string().default("welcome"),
   text: text().unique().notNull(),
   text1: text().unsigned(),
   date: date(),
   time: time(),
   datetime: datetime(),
   timestamp: timestamp(),
   json: json(),
   jsonb: jsonb(),
   binary: binary(),
   uuid: uuid(),
   enums: enums(['a', 'b', 'c']),
   unique: unique(),
   createdAt: createdAt(),
   updatedAt: createdAt(),

   relation_id: id().references("users", "id").onDelete("CASCADE").onUpdate("CASCADE"),
   index: string().index("name"),
})

const sql = userMetaSchema.toSql();
console.log(sql);




