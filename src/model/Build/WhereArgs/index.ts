import Model from "../..";
import XansqlError from "../../../core/XansqlError";
import { isObject } from "../../../utils";
import { RelationManyInfo } from "../../../xt/fields/RelationMany";
import ModelWhere from "../../ModelWhere";
import { SchemaShape, WhereArgs, WhereSubConditionArgs } from "../../types";

type Aliases = {
   [table: string]: number
}

const sub_keys = ["is", "not", "lt", "lte", "gt", "gte", "in", "notIn", "between", "contains", "startsWith", "endsWith"]

class BuildWhereArgs<S extends SchemaShape, M extends Model<any>> {
   readonly parts: string[];
   private model: M

   get sql() {
      if (!this.parts.length) return "";
      return `WHERE ${this.parts.join(" AND ")}`;
   }

   constructor(args: WhereArgs<S>, model: M, aliases: Aliases = {}) {
      this.model = model
      const schema = model.schema();
      const parts: string[] = [];
      aliases[model.table] = model.table in aliases ? aliases[model.table] : 0
      const alias = `${model.alias}${aliases[model.table] || ""}`

      if (Array.isArray(args)) {
         const _parts = []
         for (const arg of args) {
            const w_parts = new BuildWhereArgs(arg, model, { ...aliases }).parts
            if (w_parts.length) {
               if (w_parts.length > 1) {
                  _parts.push(`(${w_parts.join(" AND ")})`)
               } else {
                  _parts.push(w_parts.join(" AND "))
               }
            }
         }
         if (_parts.length) {
            parts.push(_parts.join(" OR "))
         }
      } else {
         for (const col in args) {
            const val = args[col];

            if (!(col in schema)) {
               throw new XansqlError({
                  code: "NOT_FOUND",
                  model: model.table,
                  field: col,
                  message: `Unknown column ${col} in ${model.table}`,
               });
            }

            const field = schema[col];
            if (field.isRelation) {
               const br = this.buildRelation(field, col, val, alias, aliases)
               br && parts.push(br)
            } else {
               // Array of subconditions → OR
               if (Array.isArray(val)) {
                  const subParts: string[] = [];
                  for (const subargs of val as any) {
                     if (!isObject(subargs)) {
                        throw new XansqlError({
                           message: "Invalid argument",
                           code: "VALIDATION_ERROR",
                           model: model.table,
                           field: col,
                           params: subargs
                        })
                     }
                     const cond = this.condition(col, subargs, alias, aliases);
                     if (cond) {
                        const keys = Object.keys(subargs);
                        if (keys.length > 1) {
                           subParts.push(`(${cond})`);
                        } else {
                           subParts.push(cond);
                        }
                     }
                  }

                  if (subParts.length) {
                     const keys = Object.keys(val);
                     if (keys.length > 1) {
                        parts.push(`(${subParts.join(" OR ")})`);
                     } else {
                        parts.push(`${subParts.join(" OR ")}`);
                     }
                  }
               } else if (isObject(val)) {
                  const cond = this.condition(col, val, alias, aliases);
                  if (cond) {
                     const keys = Object.keys(val);
                     if (keys.length > 1) {
                        parts.push(`(${cond})`);
                     } else {
                        parts.push(cond);
                     }
                  }
               } else {
                  parts.push(`${alias}.${col}=${this.format(col, val)}`);
               }
            }
         }
      }
      aliases[model.table] = aliases[model.table] + 1
      this.parts = parts;
   }


   private buildRelation(field: any, col: string, val: any, alias: string, aliases: Aliases) {
      const model = this.model
      const xansql = model.xansql
      const relArgs = val as WhereArgs<any>;
      const RModel = xansql.model(field.model);
      const parts: string[] = [];
      aliases[RModel.table] = RModel.table in aliases ? aliases[RModel.table] + 1 : 0
      const ralias = `${RModel.alias}${aliases[RModel.table] || ""}`
      const rinfo = field.relationInfo as RelationManyInfo
      const relationSql = `${alias}.${rinfo.self.relation}=${ralias}.${rinfo.target.relation}`

      if (Array.isArray(relArgs)) {
         const _parts = []
         for (const rargs of relArgs) {
            if (!isObject(rargs)) { }
            const b = this.buildRelation(field, col, rargs, alias, aliases)
            _parts.push(`(${b})`)
         }
         if (_parts.length) {
            parts.push(_parts.join(" OR "))
         }
      } else {
         const _sparts: string[] = []
         let _args: { [col: string]: any } = {}
         if (field.type === "relation-one") {
            if (relArgs === null) {
               parts.push(`${alias}.${col} IS NULL`);
            } else if (typeof relArgs === "number") {
               parts.push(`${alias}.${col}=${this.format(col, val)}`);
            } else {
               const _subargs: { [col: string]: any } = {}
               for (let col in relArgs) {
                  const val = relArgs[col]
                  if (sub_keys.includes(col)) {
                     _subargs[col] = val
                  } else {
                     _args[col] = val
                  }
               }

               if (Object.keys(_subargs).length) {
                  const cond = this.condition(col, _subargs, alias, aliases);
                  if (cond) {
                     _sparts.push(cond)
                  }
               }
            }
         } else {
            _args = relArgs
         }

         if (Object.keys(_args).length) {
            const relWhere = new BuildWhereArgs(_args, RModel, aliases);
            const relSql = relWhere.parts.join(" AND ");
            _sparts.push(
               `EXISTS (SELECT 1 FROM ${RModel.table} as ${ralias} WHERE ${relationSql}${relSql ? ` AND ${relSql}` : ""})`
            );
         }
         if (_sparts.length) {
            parts.push(_sparts.join(" AND "))
         }
      }

      return parts.join(" AND ")
   }

   private condition(column: string, subargs: WhereSubConditionArgs<any>, alias: string, aliases: Aliases) {
      const parts: string[] = [];
      const col_name = `${alias}.${column}`
      const model = this.model
      const engin = model.xansql.dialect.engine

      for (const key in subargs) {
         const val = (subargs as any)[key];

         switch (key) {
            case "is":
               if (val === null) {
                  parts.push(`${col_name} IS NULL`);
               } else {
                  parts.push(`${col_name} = ${this.format(column, val)}`);
               }
               break;
            case "not":
               if (Array.isArray(val)) {
                  const notParts: string[] = [];
                  for (const v of val) {
                     if (!isObject(v)) {
                        throw new XansqlError({
                           code: "QUERY_ERROR",
                           message: "Invalid where condition",
                           field: column,
                           model: this.model.table,
                        })
                     }
                     const cond = this.condition(column, v as WhereSubConditionArgs<any>, alias, aliases);
                     if (cond) {
                        const keys = Object.keys(v);
                        if (keys.length > 1) {
                           notParts.push(`(${cond})`)
                        } else {
                           notParts.push(cond)
                        }
                     }
                  }
                  if (notParts.length) {
                     parts.push(`NOT (${notParts.join(" OR ")})`);
                  }
               } else if (isObject(val)) {
                  parts.push(`NOT (${this.condition(column, val, alias, aliases)})`);
               } else if (val === null) {
                  parts.push(`${col_name} IS NOT NULL`)
               } else {
                  parts.push(`${col_name} != ${this.format(column, val)}`);
               }
               break;

            case "lt":
               parts.push(`${col_name} < ${this.format(column, val)}`);
               break;

            case "lte":
               parts.push(`${col_name} <= ${this.format(column, val)}`);
               break;

            case "gt":
               parts.push(`${col_name} > ${this.format(column, val)}`);
               break;

            case "gte":
               parts.push(`${col_name} >= ${this.format(column, val)}`);
               break;

            case "in":
               if (val instanceof ModelWhere) {
                  const RModel = val.model
                  aliases[RModel.table] = RModel.table in aliases ? aliases[RModel.table] + 1 : 0
                  const ralias = `${RModel.alias}${aliases[RModel.table] || ""}`
                  const wargs = new BuildWhereArgs(val.where || {}, RModel, aliases)

                  parts.push(
                     `EXISTS (
                       SELECT 1
                       FROM ${val.model.table} AS ${ralias}
                       ${wargs.sql ? wargs.sql + " AND " : "WHERE "}
                       ${ralias}.${String(val.inColumn)} = ${col_name}
                     )`
                  );
               } else if (val?.length) {
                  parts.push(
                     `${col_name} IN (${val.map((v: any) => this.format(column, v)).join(", ")})`
                  );
               }
               break;

            case "notIn":
               if (val instanceof ModelWhere) {
                  const RModel = val.model
                  aliases[RModel.table] = RModel.table in aliases ? aliases[RModel.table] + 1 : 0
                  const ralias = `${RModel.alias}${aliases[RModel.table] || ""}`
                  const wargs = new BuildWhereArgs(val.where || {}, RModel, aliases)
                  parts.push(
                     `NOT EXISTS (
                       SELECT 1
                       FROM ${val.model.table} AS ${ralias}
                       ${wargs.sql ? wargs.sql + " AND " : "WHERE "}
                       ${ralias}.${String(val.inColumn)} = ${col_name}
                     )`
                  );
               } else if (val?.length) {
                  parts.push(
                     `${col_name} NOT IN (${val.map((v: any) => this.format(column, v)).join(", ")})`
                  );
               }
               break;

            case "between":
               parts.push(
                  `${col_name} BETWEEN ${this.format(column, val[0])} AND ${this.format(column, val[1])}`
               );
               break;

            case "contains":
               let csql = `${col_name} LIKE ${this.format(column, `%${val}%`, false)}`
               if ((subargs as any).mode === "insensitive") {
                  if (engin === "postgres") {
                     csql = `${col_name} ILIKE ${this.format(column, `%${val}%`, false)}`
                  } else {
                     csql = `LOWER(${col_name}) LIKE LOWER(${this.format(column, `%${val}%`, false)})`
                  }
               }
               parts.push(csql);
               break;

            case "startsWith":
               let ssql = `${col_name} LIKE ${this.format(column, `${val}%`, false)}`
               if ((subargs as any).mode === "insensitive") {
                  if (engin === "postgres") {
                     ssql = `${col_name} ILIKE ${this.format(column, `${val}%`, false)}`
                  } else {
                     ssql = `LOWER(${col_name}) LIKE LOWER(${this.format(column, `${val}%`, false)})`
                  }
               }
               parts.push(ssql);
               break;

            case "endsWith":
               let esql = `${col_name} LIKE ${this.format(column, `%${val}`, false)}`
               if ((subargs as any).mode === "insensitive") {
                  if (engin === "postgres") {
                     esql = `${col_name} ILIKE ${this.format(column, `%${val}`, false)}`
                  } else {
                     esql = `LOWER(${col_name}) LIKE LOWER(${this.format(column, `%${val}`, false)})`
                  }
               }
               parts.push(esql);
               break;
         }
      }

      return parts.join(" AND ");
   }

   private format(column: string, value: any, parse = true) {
      const model = this.model;
      const schema = model.schema()
      const field = schema[column];

      if (field.type === 'relation-one') {
         if (typeof value == "number" || value === null) {
            return value
         } else {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               message: `Invalid value for relation field "${column}" in table "${model.table}". Expected a number or null, received ${typeof value}.`,
               model: model.table,
               field: column
            })
         }
      }

      if (parse) {
         try {
            value = field.parse(value)
         } catch (error: any) {
            throw new XansqlError({
               code: "VALIDATION_ERROR",
               model: model.table,
               field: column,
               sql: `${column}=${value}`,
               message: error.message
            });
         }
      }

      if (value instanceof Date) {
         return `'${value.toISOString()}'`;
      }

      if (typeof value === "string") {
         return `'${value.replace(/'/g, "''")}'`;
      }

      if (typeof value === "boolean") {
         return value ? "TRUE" : "FALSE";
      }

      if (value === null) {
         return "NULL";
      }

      return value;
   }

}

export default BuildWhereArgs;
