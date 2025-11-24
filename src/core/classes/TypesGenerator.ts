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

      let ts = ``;
      ts += `export type WhereInputSubConditions<T> = {\n`;
      ts += `    equals?: T;\n`;
      ts += `    not?: T;\n`;
      ts += `    lt?: T;\n`;
      ts += `    lte?: T;\n`;
      ts += `    gt?: T;\n`;
      ts += `    gte?: T;\n`;
      ts += `    in?: T[];\n`;
      ts += `    notIn?: T[];\n`;
      ts += `    between?: [T, T];\n`;
      ts += `    notBetween?: [T, T];\n`;
      ts += `    contains?: T;\n`;
      ts += `    notContains?: T;\n`;
      ts += `    startsWith?: T;\n`;
      ts += `    endsWith?: T;\n`;
      ts += `    isNull?: boolean;\n`;
      ts += `    isNotNull?: boolean;\n`;
      ts += `    isEmpty?: boolean;\n`;
      ts += `    isNotEmpty?: boolean;\n`;
      ts += `    isTrue?: boolean;\n`;
      ts += `    isFalse?: boolean;\n`;
      ts += `}\n`;

      ts += `export type WhereArgsColumn<T> = T | T[] | WhereInputSubConditions<T> |  WhereInputSubConditions<T>[];\n\n`;

      ts += `export type SchemaColumnExtends = Record<string, { Columns: any; SchemaColumns: Record<string, any>; SchemaArrayColumns: Record<string, any> }>\n\n`
      ts += `export type WhereArgs<Columns, SchemaColumns extends SchemaColumnExtends, SchemaArrayColumns extends SchemaColumnExtends>  = \n`;
      ts += ` & {[K in keyof Columns]?: WhereArgsColumn<Columns[K]> | WhereArgs<Columns, SchemaColumns, SchemaArrayColumns>[]}\n`;
      ts += ` & { [SK in keyof SchemaColumns]?: number | WhereArgsColumn<number> | WhereArgs<SchemaColumns[SK]['Columns'], SchemaColumns[SK]['SchemaColumns'], SchemaColumns[SK]['SchemaArrayColumns']> | WhereArgs<SchemaColumns[SK]['Columns'], SchemaColumns[SK]['SchemaColumns'], SchemaColumns[SK]['SchemaArrayColumns']>[] }\n`
      ts += ` & { [SA in keyof SchemaArrayColumns]?: WhereArgs<SchemaArrayColumns[SA]['Columns'], SchemaArrayColumns[SA]['SchemaColumns'], SchemaArrayColumns[SA]['SchemaArrayColumns']> | WhereArgs<SchemaArrayColumns[SA]['Columns'], SchemaArrayColumns[SA]['SchemaColumns'], SchemaArrayColumns[SA]['SchemaArrayColumns']>[] }\n\n\n`


      // limit args
      ts += `export type LimitArgs = "all" | { take?: number; skip?: number; };\n\n`;

      // order by args
      ts += `export type OrderByArgs<Columns> = { [K in keyof Columns]?: "asc" | "desc" };\n\n`;

      // Aggregate args

      ts += `export type AggregateFunctions = "count" | "sum" | "avg" | "min" | "max";\n`;
      ts += `export type AggregateSelectArgsColumnType = {\n`;
      ts += `   [func in AggregateFunctions]?: boolean | {\n`;
      ts += `       alias?: string;\n`;
      ts += `       orderBy?: "asc" | "desc";\n`;
      ts += `       round?: number;\n`;
      ts += `       distinct?: boolean;\n`;
      ts += `   };\n`;
      ts += `}\n\n`;

      ts += `export type FindArgsAggregate<SchemaArrayColumns extends SchemaColumnExtends> = {\n`;
      ts += `   {[K in keyof SchemaArrayColumns]?: {\n`;
      ts += `       [func in AggregateFunctions]?: boolean | {\n`;
      ts += `           columns?: (keyof SchemaArrayColumns[K]['Columns'] & keyof SchemaArrayColumns[K]['SchemaColumns'])[];\n`;
      ts += `           alias?: string;\n`;
      ts += `           orderBy?: "asc" | "desc";\n`;
      ts += `           round?: number;\n`;
      ts += `           distinct?: boolean;\n`;
      ts += `       };\n`;
      ts += `   }}\n`;
      ts += `}\n\n`;


      ts += `export type SelectArgs<Columns, SchemaColumns extends SchemaColumnExtends, SchemaArrayColumns extends SchemaColumnExtends> = \n`;
      ts += ` & {[K in keyof Columns]?: boolean}\n`;
      ts += ` & { [SK in keyof SchemaColumns]?: boolean | FindArgs<SchemaColumns[SK]['Columns'], SchemaColumns[SK]['SchemaColumns'], SchemaColumns[SK]['SchemaArrayColumns']>}\n`;
      ts += ` & { [SA in keyof SchemaArrayColumns]?: boolean | FindArgs<SchemaArrayColumns[SA]['Columns'], SchemaArrayColumns[SA]['SchemaColumns'], SchemaArrayColumns[SA]['SchemaArrayColumns']>}\n\n`;

      ts += `type FindArgs<Columns, SchemaColumns extends SchemaColumnExtends, SchemaArrayColumns extends SchemaColumnExtends> = {\n`;
      ts += `   distinct?: (keyof Columns & keyof SchemaColumns)[];\n`;
      ts += `   where?: WhereArgs<Columns, SchemaColumns, SchemaArrayColumns>;\n`;
      ts += `   select?: SelectArgs<Columns, SchemaColumns, SchemaArrayColumns>;\n`;
      ts += `   orderBy?: OrderByArgs<Columns>;\n`;
      ts += `   limit?: LimitArgs\n`;
      ts += `   aggregate?: {\n`;
      ts += `       [func in "count" | "sum" | "avg" | "min" | "max"]?: boolean | {\n`;
      ts += `           columns?: (keyof Columns & keyof SchemaColumns)[];\n`;
      ts += `           alias?: string;\n`;
      ts += `           orderBy?: "asc" | "desc";\n`;
      ts += `           round?: number;\n`;
      ts += `           distinct?: boolean;\n`;
      ts += `       };\n`;
      ts += `   };\n`;
      ts += `}\n\n`;




      for (let model of models) {
         ts += `//========== ${model.table} Table types=============\n\n`.toUpperCase();
         let WhereInput = `export type ${ucf(model.table)}WhereInput {\n`;

         let columns = `export type ${ucf(model.table)}Columns = {\n`;
         let columnsSchema = `export type ${ucf(model.table)}SchemaColumns = {\n`
         let columnsSchemaArray = `export type ${ucf(model.table)}SchemaArrayColumns = {\n`


         for (let column in model.schema) {
            const field = model.schema[column];
            const meta = field.meta || {};
            if (Foreign.is(field)) {
               const foreign = Foreign.get(model, column);
               const FModel = model.xansql.getModel(foreign.table);
               const name = ucf(FModel.table)
               if (Foreign.isArray(field)) {
                  columnsSchemaArray += `    ${column}: {\n`
                  columnsSchemaArray += `       Columns: ${name}Columns;\n`
                  columnsSchemaArray += `       SchemaColumns: ${name}SchemaColumns;\n`
                  columnsSchemaArray += `       SchemaArrayColumns: ${name}SchemaArrayColumns\n`
                  columnsSchemaArray += `    }\n`
                  WhereInput += `  ${column}?: ${name}WhereInput | ${name}WhereInput[];\n`;
               } else {
                  columnsSchema += `    ${column}: {\n`
                  columnsSchema += `       Columns: ${name}Columns;\n`
                  columnsSchema += `       SchemaColumns: ${name}SchemaColumns;\n`
                  columnsSchema += `       SchemaArrayColumns: ${name}SchemaArrayColumns\n`
                  columnsSchema += `    }\n`
                  WhereInput += `  ${column}?: number | ${name}WhereInput | WhereInputColumn<number>\n`;
               }
            } else {
               let columnType = this.getType(field);
               columns += `  ${column}${meta.optional || meta.nullable ? "?" : ""}: ${columnType}${meta.nullable ? " | null" : ""};\n`;
               WhereInput += `  ${column}?: WhereInputColumn<${columnType}>\n`;

            }
         }
         columns += `}\n\n`;
         columnsSchema += `}\n\n`;
         columnsSchemaArray += `}\n\n`;

         WhereInput += `}\n\n`;


         // ts += WhereInput;
         ts += columns;
         ts += columnsSchema;
         ts += columnsSchemaArray;


      }
      return ts;
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