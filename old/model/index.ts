import xansql from "..";
import Column from "../schema/Column";
import Relation from "../schema/Relation";
import { SchemaMap } from "../schema/types";
import { TableName } from "../types";
import { CreateArgs, FindOptions } from "./types";
import SQLQueryBuilder from "./SQLQueryBuilder";

class Model<Data extends object = any> {
   table: TableName | null = null;
   schemaSQL: string | null = null;
   private xansql: xansql;
   constructor(xansql: xansql) {
      this.table = this.table || this.constructor.name.toLowerCase();
      this.xansql = xansql;
   }


   schema(): SchemaMap {
      throw new Error("Method not implemented.");
   }

   async create(args: CreateArgs) {
      const { data, select } = args;
      const schema = this.schema();
      const submodels: any = {}
      const formatedFields: any = {}

      for (let field in data) {
         if (!schema[field]) {
            throw new Error(`Invalid field ${field} in data clause`);
         }

         const rawValue = schema[field];
         const value = (data as any)[field];

         if (rawValue instanceof Column) {
            formatedFields[field] = value;
         } else if (rawValue instanceof Relation) {
            if (!rawValue.table) {
               // single relation
               if (Array.isArray(value.data)) {
                  throw new Error(`Invalid value for field ${field}, expected object`);
               }
               const relationField: any = schema[rawValue.column];
               if (!relationField || !(relationField instanceof Relation)) {
                  throw new Error(`Relation field ${rawValue.column} not found in schema`);
               }
               const modelFactory = this.xansql.models.get(relationField.table as string);
               if (!modelFactory) {
                  throw new Error(`Model ${relationField.table} not found`);
               }
            } else {
               // multiple relation
               if (!Array.isArray(value.data)) {
                  throw new Error(`Invalid value for field ${field}, expected array`);
               }
               const modelFactory = this.xansql.models.get(rawValue.table);
               if (!modelFactory) {
                  throw new Error(`Model ${rawValue.table} not found`);
               }
            }
            submodels[field] = {
               value,
               table: rawValue.table,
               column: rawValue.column,
            };
         } else {
            throw new Error(`Invalid field ${field} in data clause`);
         }
      }


      const builder = new SQLQueryBuilder(this.table as string);
      builder.insert(formatedFields);
      const query = builder.buildInsert();
      console.log(query);

      // execute the query
      const created: any = await this.xansql.excute(query);
      const result: any = await this.findOne({
         where: {
            id: created.insertId
         },
         select: select,
      })


      for (let field in submodels) {
         const submodel = submodels[field];
         const modelFactory = this.xansql.models.get(submodel.table);
         if (!modelFactory) {
            throw new Error(`Model ${submodel.table} not found`);
         }
         if (Array.isArray(submodel.value.data)) {
            for (let item of submodel.value.data) {
               const subresult = await modelFactory.model.create({
                  data: {
                     ...item
                  },
                  select: submodel.value.select
               })
               if (!result[field]) {
                  result[field] = []
               }
               result[field] = [
                  subresult
               ]
            }
         } else {
            const subresult = await modelFactory.model.create({
               data: submodel.value.data,
               select: submodel.value.select
            })
            result[field] = subresult
         }
      }

      return result
   }

   async find(args: FindOptions) {
      const { take, skip, orderBy, where, select } = args;
      const raw_schema = this.schema();

      for (let field in where) {
         if (!raw_schema[field]) {
            throw new Error(`Invalid field ${field} in where clause`);
         }

         const rawfield = raw_schema[field];
         const value = where[field];

         if (rawfield instanceof Column) {
            if (value instanceof Object) {
               // field is a condition
            } else {
               // field is a value
            }
         } else if (rawfield instanceof Relation) {
            const relTable = rawfield.table
            const relColumn = rawfield.column
            if (!relTable) {
               // single relation
            } else {
               // multiple relation
            }
         } else {
            throw new Error(`Invalid field ${field} in where clause`);
         }
      }
   }

   async findOne(args: FindOptions) {
      console.log('Find one')
   }

   async update(data: any) {
      console.log(data)
   }

   async delete() {
      console.log('Delete')
   }
}

export default Model;