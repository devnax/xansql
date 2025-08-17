import xansql from "../..";
import Model from "../../model";
import Column from "../../Schema/core/Column";
import IDField from "../../Schema/core/IDField";
import Relation from "../../Schema/core/Relation";
import { DialectOptions } from "../../type";
import { formatValue, isServer } from "../../utils";

const types = {
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

const typeAcceptValue: string[] = [

]

const getType = (column: Column) => {
   let type: any = types[column.type] || "TEXT";
   // const value = column?.value;
   // if (typeAcceptValue.includes(column.type) && value.length) {
   //    type += `(${value.join(',')})`;
   // }
   return type
};

const constraints = (name: string, column: Column, table: string) => {
   const constraints = column.constraints;
   let footer: string[] = []
   let indexes = []

   let sql = '';
   sql += constraints.unique ? ' UNIQUE' : "";
   sql += constraints.null ? ' NULL' : ' NOT NULL'
   sql += constraints.unsigned ? ' UNSIGNED' : "";

   let _default = constraints.default;
   if (_default !== undefined) {
      sql += ` DEFAULT ${_default === 'CURRENT_TIMESTAMP' ? 'CURRENT_TIMESTAMP' : formatValue(_default)}`;
   }

   if (constraints.onUpdate) {
      delete constraints.onUpdate
      //sql += ` ON UPDATE ${constraints.onUpdate}`;
   }
   if (constraints.references) {
      // const ref = constraints.references;
      // let foreign = `FOREIGN KEY (\`${name}\`) REFERENCES \`${ref.table}\`(\`${ref.column}\`)`;
      // if (constraints.onDelete) foreign += ` ON DELETE ${constraints.onDelete}`;
      // if (constraints.onUpdate) foreign += ` ON UPDATE ${constraints.onUpdate}`;
      // footer.push(foreign);
   }

   if (constraints.index) indexes.push(`CREATE INDEX IF NOT EXISTS ${name}_index ON \`${table}\`(\`${name}\`)`);
   if (constraints.check) sql += ` CHECK (${constraints.check})`;
   if (constraints.collate) sql += ` COLLATE ${constraints.collate}`;
   if (constraints.comment) {
      delete constraints.comment
   };

   return { sql: sql.trim(), footer, indexes }
}

const buildSchema = (model: Model): string => {
   const schema = model.schema.get()
   const tableName = model.table
   let footer: string[] = []
   let indexes: string[] = []

   const columns = Object.keys(schema).map((key) => {
      key = key.toLowerCase();
      const column = schema[key];
      if (column instanceof Relation) return '';

      if (column instanceof IDField) {
         return `\`${key}\` INTEGER PRIMARY KEY AUTOINCREMENT`;
      }
      let c = constraints(key, column, model.table)
      footer = [...footer, ...c.footer]
      indexes = [...indexes, ...c.indexes]
      return `\`${key}\` ${getType(column)} ${c.sql}`;
   }).filter(Boolean).join(",\n");

   let sql = columns;
   if (footer.length) {
      sql += `,\n${footer.join(",\n")}`;
   }
   sql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n${sql}\n);`;
   if (indexes.length) {
      sql += `\n${indexes.join(";\n")};`;
   }
   // sql += `\nPRAGMA foreign_keys = ON;`;
   // sql += `\nPRAGMA journal_mode = WAL;`;

   return sql
}


let mod: any = null;
const SqliteDialect = async (xansql: xansql): Promise<DialectOptions> => {
   const config = await xansql.getConfig();
   let excuter: any = null;

   return {
      buildSchema,
      excute: async (sql: any, model: Model): Promise<any> => {
         if (typeof window === "undefined") {
            if (!mod) {
               mod = (await import("./excuter")).default;
               excuter = new mod(config);
            }
            return await excuter.excute(sql);
         } else {
            return await xansql.excuteClient(sql, model);
         }
      },
      addColumn: async (model: Model, columnName: string) => {
         const schema = model.schema.get()
         const column = schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} not found in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot add relation or IDField as a column: ${columnName}`);
         }
         return await model.excute(`ALTER TABLE \`${model.table}\` ADD COLUMN \`${columnName}\` ${getType(column)};`);
      },
      dropColumn: async (model: Model, columnName: string) => {
         const schema = model.schema.get()
         const column = schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} not found in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot drop relation or IDField as a column: ${columnName}`);
         }
         return await model.excute(`ALTER TABLE \`${model.table}\` DROP COLUMN \`${columnName}\`;`);
      },
      renameColumn: async (model: Model, oldName: string, newName: string) => {
         const schema = model.schema.get()
         const column = schema[oldName];
         if (!column) {
            throw new Error(`Column ${oldName} not found in model ${model.table}`);
         }
         return await model.excute(`ALTER TABLE \`${model.table}\` RENAME COLUMN \`${oldName}\` TO \`${newName}\`;`);
      },
      addIndex: async (model: Model, columnName: string) => {
         const schema = model.schema.get()
         const column = schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} not found in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot add index to relation or IDField: ${columnName}`);
         }
         return await model.excute(`CREATE INDEX IF NOT EXISTS ${model.table}_${columnName}_index ON \`${model.table}\` (\`${columnName}\`);`);
      },
      dropIndex: async (model: Model, columnName: string) => {
         return await model.excute(`DROP INDEX IF EXISTS ${model.table}_${columnName}_index;`);
      },
   }
}

export default SqliteDialect;