import Model from "../../model";
import Column from "../../schema/core/Column";
import IDField from "../../schema/core/IDField";
import Relation from "../../schema/core/Relation";
import { XansqlDialectDriver } from "../../type";
import { isServer } from "../../utils";
import BaseDialect from "../BaseDialect";

class MysqlDialect extends BaseDialect {
   driver: XansqlDialectDriver = "mysql"
   private excuter: any;
   private footer: string[] = [];

   private getType(column: Column) {
      let type: any = this.types[column.type] || "TEXT";
      const value = column?.value;
      if (this.typeAcceptValue.includes(column.type) && value.length) {
         type += `(${value.join(',')})`;
      }
      return type
   };

   private constraints(name: string, column: Column, tableName: string) {
      const constraints = column.constraints;

      let sql = '';
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
         this.footer.push(foreign);
      }

      if (constraints.index) this.footer.push(`INDEX ${name}_index (${name})`);
      if (constraints.check) sql += ` CHECK (${constraints.check})`;
      if (constraints.collate) sql += ` COLLATE ${constraints.collate}`;
      if (constraints.comment) sql += ` COMMENT '${constraints.comment}'`;

      return sql;
   }

   buildSchema(model: Model): string {
      const schema = model.schema.get()
      const tableName = model.table

      const columns = Object.keys(schema).map((key) => {
         key = key.toLowerCase();
         const column = schema[key];
         if (column instanceof Relation) return '';
         if (column instanceof IDField) {
            return `${key} INT PRIMARY KEY AUTO_INCREMENT`;
         }
         return `${key} ${this.getType(column)} ${this.constraints(key, column, tableName)}`;
      }).filter(Boolean).join(",\n");

      let sql = columns;
      if (this.footer.length) {
         sql += `,\n${this.footer.join(",\n")}`;
      }

      return `CREATE TABLE ${tableName} (\n${sql}\n);`;
   }

   async excute(sql: any) {
      const xanconfig = await this.xansql.getConfig()
      if (isServer) {
         if (!this.excuter) {
            const mod = await import("./excuter");
            let options = typeof xanconfig.connection === 'string' ? { uri: xanconfig.connection } : xanconfig.connection;
            this.excuter = new mod.default(options);
         }
         return await this.excuter.excute(sql);
      }
   }

}

export default MysqlDialect