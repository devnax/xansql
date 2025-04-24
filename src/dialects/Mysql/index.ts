import Model from "../../model";
import Column from "../../schema/core/Column";
import IDField from "../../schema/core/IDField";
import Relation from "../../schema/core/Relation";
import { XansqlDialectDriver } from "../../type";
import { formatValue, isServer } from "../../utils";
import BaseDialect from "../BaseDialect";

class MysqlDialect extends BaseDialect {
   driver: XansqlDialectDriver = "mysql"
   private excuter: any;

   private getType(column: Column) {
      let type: any = this.types[column.type] || "TEXT";
      const value = column?.value;
      if (this.typeAcceptValue.includes(column.type) && value.length) {
         type += `(${value.join(',')})`;
      }
      return type
   };

   private constraints(name: string, column: Column) {
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
         let foreign = `FOREIGN KEY (\`${name}\`) REFERENCES \`${ref.table}\`(\`${ref.column}\`)`;
         // if (constraints.onDelete) foreign += ` ON DELETE ${constraints.onDelete}`;
         // if (constraints.onUpdate) foreign += ` ON UPDATE ${constraints.onUpdate}`;
         footer.push(foreign);
      }

      if (constraints.index) footer.push(`INDEX ${name}_index (\`${name}\`)`);
      if (constraints.check) sql += ` CHECK (${constraints.check})`;
      if (constraints.collate) sql += ` COLLATE ${constraints.collate}`;
      if (constraints.comment) sql += ` COMMENT '${constraints.comment}'`;

      return { footer, sql: sql.trim() }
   }

   buildSchema(model: Model): string {
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
         let c = this.constraints(key, column)
         footer = [...footer, ...c.footer]
         return `\`${key}\` ${this.getType(column)} ${c.sql}`;
      }).filter(Boolean).join(",\n");

      let sql = columns;
      if (footer.length) {
         sql += `,\n${footer.join(",\n")}`;
      }

      return `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n${sql}\n);`;
   }

   async excute(sql: any) {
      if (isServer) {
         if (!this.excuter) {
            const mod = await import("./excuter");
            this.excuter = new mod.default(this.xansql.config);
         }
         return await this.excuter.excute(sql);
      }
   }

}

export default MysqlDialect