import xansql from "../..";
import Model from "../../model";
import Column from "../../Schema/core/Column";
import IDField from "../../Schema/core/IDField";
import Relation from "../../Schema/core/Relation";
import { DialectOptions } from "../../type";
import { formatValue } from "../../utils";

const types = {
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

const typeAcceptValue: string[] = [
   'string',
   'enum'
]

const getType = (column: Column) => {
   let type: any = types[column.type] || "TEXT";
   const value = column?.value;
   if (typeAcceptValue.includes(column.type) && value.length) {
      type += `(${value.join(',')})`;
   }
   return type
};

const constraints = (name: string, column: Column, table: string) => {
   const constraints = column.constraints;
   let footer: string[] = []

   let sql = '';
   sql += constraints.unique ? ' UNIQUE' : "";
   sql += constraints.null ? ' NULL' : ' NOT NULL'
   sql += constraints.unsigned ? ' UNSIGNED' : "";

   let _default = constraints.default;
   if (_default !== undefined) {
      sql += ` DEFAULT ${_default === 'CURRENT_TIMESTAMP' ? 'CURRENT_TIMESTAMP' : formatValue(_default)}`;
   }

   if (constraints.onUpdate === 'CURRENT_TIMESTAMP') sql += ` ON UPDATE ${constraints.onUpdate}`;
   if (constraints.references) {
      const ref = constraints.references;
      // let foreign = `FOREIGN KEY (\`${name}\`) REFERENCES \`${ref.table}\`(\`${ref.column}\`)`;
      // if (constraints.onDelete) foreign += ` ON DELETE ${constraints.onDelete}`;
      // if (constraints.onUpdate) foreign += ` ON UPDATE ${constraints.onUpdate}`;
      // footer.push(foreign);
   }

   if (constraints.index) footer.push(`INDEX ${table}_${name}_index (\`${name}\`)`);
   if (constraints.check) sql += ` CHECK (${constraints.check})`;
   if (constraints.collate) sql += ` COLLATE ${constraints.collate}`;
   if (constraints.comment) sql += ` COMMENT '${constraints.comment}'`;

   return { footer, sql: sql.trim() }
}

const buildSchema = (model: Model): string => {
   const schema = model.schema.get()
   const tableName = model.table
   let footer: string[] = []

   const columns = Object.keys(schema).map((key) => {
      key = key.toLowerCase();
      const column = schema[key];
      if (column instanceof Relation) return '';

      if (column instanceof IDField) {
         return `\`${key}\` INT PRIMARY KEY AUTO_INCREMENT`;
      }
      let c = constraints(key, column, tableName);
      footer = [...footer, ...c.footer]
      return `\`${key}\` ${getType(column)} ${c.sql}`;
   }).filter(Boolean).join(",\n");

   let sql = columns;
   if (footer.length) {
      sql += `,\n${footer.join(",\n")}`;
   }

   return `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n${sql}\n);`;
}



let mod: any = null;
const mysqldialect = async (xansql: xansql): Promise<DialectOptions> => {
   const config = await xansql.getConfig();
   let excuter: any = null;
   const opt = {
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
            throw new Error(`Column ${columnName} does not exist in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot add relation or IDField as a column: ${columnName}`);
         };
         const constraintsResult = constraints(columnName, column, model.table);
         const sql = `ALTER TABLE \`${model.table}\` ADD COLUMN \`${columnName}\` ${getType(column)} ${constraintsResult.sql}`;
         const res = await opt.excute(sql, model);
         for (const _footer of constraintsResult.footer) {
            await opt.addIndex(model, columnName);
         }
         return res;
      },

      dropColumn: async (model: Model, columnName: string) => {
         const schema = model.schema.get()
         const column = schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} does not exist in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot add relation or IDField as a column: ${columnName}`);
         };
         if (column.constraints.index) {
            await opt.dropIndex(model, columnName);
         }
         return await opt.excute(`ALTER TABLE \`${model.table}\` DROP COLUMN \`${columnName}\``, model);
      },

      renameColumn: async (model: Model, oldName: string, newName: string) => {
         const schema = model.schema.get()
         const column = schema[newName];
         if (!column) {
            throw new Error(`Column ${newName} does not exist in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot add relation or IDField as a column: ${newName}`);
         };
         await opt.excute(`ALTER TABLE ${model.table} RENAME COLUMN ${oldName} TO ${newName};`, model);
      },

      addIndex: async (model: Model, columnName: string) => {
         const schema = model.schema.get()
         const column = schema[columnName];
         if (!column) {
            throw new Error(`Column ${columnName} does not exist in model ${model.table}`);
         }
         if (column instanceof Relation || column instanceof IDField) {
            throw new Error(`Cannot add index to relation or IDField: ${columnName}`);
         };
         return await opt.excute(`CREATE INDEX ${model.table}_${columnName}_index ON \`${model.table}\` (\`${columnName}\`);`, model);
      },

      dropIndex: async (model: Model, columnName: string) => {
         return await opt.excute(`DROP INDEX ${model.table}_${columnName}_index ON \`${model.table}\`;`, model);
      }
   }

   return opt
}

export default mysqldialect;