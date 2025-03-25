import Column from "../Column";
import { ColumnTypes } from "../Column/types";
import Relation from "../Relation";
import { Dialects, SchemaMap } from "../types";

export type DialecteDataTypes = {
   [key in ColumnTypes]: string
}

export type BaseConfig = {
   schema: SchemaMap;
   dialect: Dialects;
   types: DialecteDataTypes;
}

abstract class BaseDialect {
   dialect: Dialects;

   typeAcceptValue = [
      'string',
      'enum'
   ]

   types: DialecteDataTypes = {
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
   };

   schema: SchemaMap;
   end: string[] = [];
   footer: string[] = [];


   constructor({ schema, types, dialect }: BaseConfig) {
      if (!schema.id) throw new Error("Missing id column in schema");
      if (schema.id instanceof Relation) throw new Error("id column must be a Column not a Relation");
      if (!schema.id.constraints.primaryKey) throw new Error("id column must be a primary key");
      if (!schema.id.constraints.autoincrement) throw new Error("id column must be autoincrement");
      if (schema.id.constraints.notNull) throw new Error("id column must be not null");

      this.schema = schema;
      this.types = { ...this.types, ...types };
      this.dialect = dialect;
   }

   getType(column: Column) {
      let type: any = this.types[column.type] || "TEXT";
      const value = column?.value;
      if (this.typeAcceptValue.includes(column.type) && value.length) {
         type += `(${value.join(',')})`;
      }
      if (column.constraints.autoincrement) {
         switch (this.dialect) {
            case "mysql":
               if (column.type === 'bigInteger') {
                  type = 'BIGINT AUTO_INCREMENT';
               } else {
                  type = 'INT AUTO_INCREMENT';
               }
               break;
            case "sqlite":
               type += ' AUTOINCREMENT';
               break;
            case "postgres":
               type = column.type === "bigInteger" ? "BIGSERIAL" : "SERIAL";
               break;
            case "mssql":
               type += ' IDENTITY(1,1)';
               break;
         }
      }
      return type
   };

   constraints(name: string, column: Column, tableName: string) {
      const constraints = column.constraints;

      switch (this.dialect) {
         case "mysql":

            break;
         case "sqlite":
            if (constraints.comment) {
               delete constraints.comment
            }
            if (constraints.onUpdate) {
               delete constraints.onUpdate
            }
            break;
         case "postgres":
            if (constraints.onUpdate === 'CURRENT_TIMESTAMP') {
               delete constraints.onUpdate

               this.footer.push(`
               CREATE OR REPLACE FUNCTION update_${tableName}_${name}() 
               RETURNS TRIGGER AS $$
               BEGIN
                   NEW.${name} = CURRENT_TIMESTAMP;
                   RETURN NEW;
               END;
               $$ LANGUAGE plpgsql;

               CREATE TRIGGER set_${name}
               BEFORE UPDATE ON "${tableName}"
               FOR EACH ROW
               EXECUTE FUNCTION update_${tableName}_${name}();
              `)
            }
            break;
         case "mssql":
            if (constraints.onUpdate === 'CURRENT_TIMESTAMP') {
               delete constraints.onUpdate

               this.footer.push(`
                  CREATE TRIGGER update_${tableName}_${name}
                  ON "${tableName}"
                  AFTER UPDATE
                  AS
                  BEGIN
                      UPDATE "${tableName}"
                      SET "${name}" = CURRENT_TIMESTAMP
                      FROM "${tableName}"
                      INNER JOIN inserted ON "${tableName}"."id" = inserted."id";
                  END;
               `);
            }
            break;
      }

      let sql = '';
      if (constraints.primaryKey) sql += ' PRIMARY KEY';
      if (constraints.unique) sql += ' UNIQUE';
      if (constraints.notNull) sql += ' NOT NULL';
      if (constraints.unsigned) sql += ' UNSIGNED';

      if (constraints.default !== undefined) {
         if (constraints.default === 'CURRENT_TIMESTAMP') {
            sql += ` DEFAULT ${constraints.default}`;
         } else if (typeof constraints.default === 'string') {
            sql += ` DEFAULT '${constraints.default}'`;
         } else if (typeof constraints.default === 'number') {
            sql += ` DEFAULT ${constraints.default}`;
         } else if (typeof constraints.default === 'boolean') {
            sql += ` DEFAULT ${constraints.default ? 1 : 0}`;
         } else {
            sql += ` DEFAULT ${constraints.default}`;
         }
      }

      if (constraints.onUpdate === 'CURRENT_TIMESTAMP') sql += ` ON UPDATE ${constraints.onUpdate}`;
      if (constraints.references) {
         const ref = constraints.references;
         let foreign = `FOREIGN KEY (${name}) REFERENCES ${ref.table}(${ref.column})`;
         if (constraints.onDelete) foreign += ` ON DELETE ${constraints.onDelete}`;
         if (constraints.onUpdate) foreign += ` ON UPDATE ${constraints.onUpdate}`;
         this.end.push(foreign);
      }

      if (constraints.index) {
         this.end.push(`INDEX ${name}_index (${name})`);
      }

      if (constraints.check) {
         sql += ` CHECK (${constraints.check})`;
      }

      if (constraints.collate) {
         sql += ` COLLATE ${constraints.collate}`;
      }

      if (constraints.comment) {
         sql += ` COMMENT '${constraints.comment}'`;
      }

      return sql;
   }

   toSQL(tableName: string): string {
      const columns = Object.keys(this.schema).map((key) => {
         key = key.toLowerCase();
         const column = this.schema[key];
         if (column instanceof Relation) return '';
         let type = this.getType(column);
         let sql = `${type} ${this.constraints(key, column, tableName)}`;
         return `${key} ${sql}`;
      }).filter(Boolean).join(",\n");

      let sql = `CREATE TABLE ${tableName} (\n${columns}`;

      if (this.end.length) {
         sql += `,\n${this.end.join(",\n")}`;
      }

      sql += `\n);\n${this.footer.join("\n")}`;
      return sql;
   }

}

export default BaseDialect;

