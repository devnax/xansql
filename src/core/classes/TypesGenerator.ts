import Model from "../../model";
import ValueFormatter from "../../model/include/ValueFormatter";
import XqlArray from "../../Types/fields/Array";
import XqlBoolean from "../../Types/fields/Boolean";
import XqlDate from "../../Types/fields/Date";
import XqlEnum from "../../Types/fields/Enum";
import XqlFile from "../../Types/fields/File";
import XqlIDField from "../../Types/fields/IDField";
import XqlNumber from "../../Types/fields/Number";
import XqlObject from "../../Types/fields/Object";
import XqlRecord from "../../Types/fields/Record";
import XqlSchema from "../../Types/fields/Schema";
import XqlString from "../../Types/fields/String";
import XqlTuple from "../../Types/fields/Tuple";
import XqlUnion from "../../Types/fields/Union";
import { XqlFields } from "../../Types/types";
import Xansql from "../Xansql";
import Foreign from "./ForeignInfo";


const ucf = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

class TypesGenerator {
   xansql: Xansql;

   constructor(xansql: Xansql) {
      this.xansql = xansql;
   }

   async generate(model?: Model) {
      const xansql = this.xansql;
      const models = model ? [model] : Array.from(xansql.models.values());

      let typescript = ``;
      let WhereInputSubConditions = `export type WhereInputSubConditions<T> = {\n`;
      WhereInputSubConditions += `    equals?: T;\n`;
      WhereInputSubConditions += `    not?: T;\n`;
      WhereInputSubConditions += `    lt?: T;\n`;
      WhereInputSubConditions += `    lte?: T;\n`;
      WhereInputSubConditions += `    gt?: T;\n`;
      WhereInputSubConditions += `    gte?: T;\n`;
      WhereInputSubConditions += `    in?: T[];\n`;
      WhereInputSubConditions += `    notIn?: T[];\n`;
      WhereInputSubConditions += `    between?: [T, T];\n`;
      WhereInputSubConditions += `    notBetween?: [T, T];\n`;
      WhereInputSubConditions += `    contains?: T;\n`;
      WhereInputSubConditions += `    notContains?: T;\n`;
      WhereInputSubConditions += `    startsWith?: T;\n`;
      WhereInputSubConditions += `    endsWith?: T;\n`;
      WhereInputSubConditions += `    isNull?: boolean;\n`;
      WhereInputSubConditions += `    isNotNull?: boolean;\n`;
      WhereInputSubConditions += `    isEmpty?: boolean;\n`;
      WhereInputSubConditions += `    isNotEmpty?: boolean;\n`;
      WhereInputSubConditions += `    isTrue?: boolean;\n`;
      WhereInputSubConditions += `    isFalse?: boolean;\n`;
      WhereInputSubConditions += `}\n`;
      typescript += WhereInputSubConditions + `\n`;
      typescript += `export type WhereInputColumn<T> = T | T[] | WhereInputSubConditions<T> |  WhereInputSubConditions<T>[];\n\n`;

      typescript += `export type SelectArgs<Columns, SchemaColumns, SchemaArrayColumns> = {\n`;
      typescript += `  [K in keyof Columns]?: K extends SchemaColumns ? boolean : K extends SchemaArrayColumns ? boolean : never;\n`;
      typescript += `}\n\n`;



      for (let model of models) {
         typescript += `//========== ${model.table} Table types=============\n\n`.toUpperCase();
         let SelectInput = `export type ${ucf(model.table)}SelectInput = {\n`;
         let CreateDataInput = `export type ${ucf(model.table)}CreateDataInput = {\n`;
         let WhereInput = `export type ${ucf(model.table)}WhereInput {\n`;

         let columns = `export type ${ucf(model.table)}Columns = {\n`;
         let columnsSchema = []
         let columnsSchemaArray = []


         for (let column in model.schema) {
            const field = model.schema[column];
            const meta = field.meta || {};
            if (Foreign.is(field)) {
               const foreign = Foreign.get(model, column);
               const FModel = model.xansql.getModel(foreign.table);
               const type = this.getType(FModel.schema[foreign.column]);

               SelectInput += `  ${column}?: boolean | {\n`;
               SelectInput += `    select?: ${ucf(FModel.table)}SelectInput;\n`;
               SelectInput += `    where?: ${ucf(FModel.table)}WhereInput;\n`;
               SelectInput += `  };\n`;

               if (Foreign.isArray(field)) {
                  columnsSchemaArray.push(`'${column}'`);
                  // SelectInput += `  ${column}?: boolean | ${ucf(FModel.table)}SelectInput;\n`;
                  CreateDataInput += `  ${column}?: (${type} | null)[];\n`;
                  WhereInput += `  ${column}?: ${ucf(FModel.table)}WhereInput | ${ucf(FModel.table)}WhereInput[];\n`;
               } else {
                  columnsSchema.push(`'${column}'`);
                  CreateDataInput += `  ${column}?: ${type} | null;\n`;
                  WhereInput += `  ${column}?: number | ${ucf(FModel.table)}WhereInput | WhereInputColumn<number>\n`;
               }
            } else {
               let columnType = this.getType(field);
               columns += `  ${column}${meta.optional || meta.nullable ? "?" : ""}: ${columnType}${meta.nullable ? " | null" : ""};\n`;
               SelectInput += `  ${column}?: boolean;\n`;
               CreateDataInput += `  ${column}${meta.optional || meta.nullable ? "?" : ""}: ${columnType}${meta.nullable ? " | null" : ""};\n`;
               WhereInput += `  ${column}?: WhereInputColumn<${columnType}>\n`;

            }
         }
         columns += `}\n\n`;
         WhereInput += `}\n\n`;


         // typescript += WhereInput;
         typescript += columns;
         if (columnsSchema.length) {
            typescript += `export type ${ucf(model.table)}SchemaColumns = ${columnsSchema.join(" | ")}\n`;
         }
         if (columnsSchemaArray.length) {
            typescript += `export type ${ucf(model.table)}SchemaArrayColumns = ${columnsSchemaArray.join(" | ")}\n\n`;
         }


      }
      return typescript;
   }

   iof(field: XqlFields, ...instances: any[]) {
      return instances.some(instance => field instanceof instance);
   }

   getType(field: XqlFields) {
      if (this.iof(field, XqlArray) && !Foreign.is(field)) {
         return "any[]"
      } else if (this.iof(field, XqlBoolean)) {
         return "boolean"
      } else if (this.iof(field, XqlIDField, XqlNumber)) {
         return "number"
      } else if (this.iof(field, XqlString)) {
         return "string"
      } else if (this.iof(field, XqlDate)) {
         return "Date"
      } else if (this.iof(field, XqlEnum)) {
         const enumValues = (field as XqlEnum).meta?.values || [];
         return enumValues.map((v: string | number) => typeof v === "string" ? `"${v}"` : v).join(" | ");
      } else if (this.iof(field, XqlFile)) {
         return "File | string"
      } else if (this.iof(field, XqlObject)) {
         return "Record<string, any>"
      } else if (this.iof(field, XqlRecord)) {
         const keyType: any = this.getType((field as any).keyType);
         const valueType: any = this.getType((field as any).valueType);
         return `Record<${keyType}, ${valueType}>`
      } else if (this.iof(field, XqlTuple)) {
         const types = (field as any).types.map((t: XqlFields) => this.getType(t));
         return `[${types.join(", ")}]`
      } else if (this.iof(field, XqlUnion)) {
         const types = (field as any).types.map((t: XqlFields) => this.getType(t));
         return types.join(" | ")
      }
   }
}

export default TypesGenerator;