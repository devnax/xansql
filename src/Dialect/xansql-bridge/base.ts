import { crypto } from "securequ";
import Xansql from "../../core/Xansql";

let secretCache: string | null = null;
export const makeSecret = async (xansql: Xansql) => {
   if (secretCache) return secretCache;
   const models = xansql.models
   let uid = ''
   for (let model of models.values()) {
      uid += model.table
      for (let column in model.schema) {
         uid += column
         const field = model.schema[column]
         const meta = field.meta || {}
         uid += JSON.stringify(meta)
      }
   }

   secretCache = await crypto.hash(uid)
   return secretCache;
}

export const makePath = async (path: string, xansql: Xansql) => {
   const secret = await makeSecret(xansql)
   const gen = `/${await crypto.hash(path + secret)}`
   return gen;
}


export type XansqlBridgeAction =
   | "SELECT"
   | "INSERT"
   | "UPDATE"
   | "DELETE"
   | "DROP"
   | "ALTER"
   | "CREATE"
   | "TRUNCATE"
   | "REPLACE"
   | "DESCRIBE"
   | "SHOW"
   | "USE"
   | "UNKNOWN";

export interface SqlParserResult {
   action: XansqlBridgeAction;
   table: string | null;
}

export const sqlparser = (sql: string): SqlParserResult => {
   const normalized = sql.trim().replace(/\s+/g, " ");

   // Detect the primary verb (first SQL keyword)
   const verbMatch = normalized.match(
      /^(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|DESCRIBE|DESC|SHOW|USE)\b/i
   );

   let verb: XansqlBridgeAction = "UNKNOWN";

   if (verbMatch) {
      const v = verbMatch[1].toUpperCase();
      verb = v === "DESC" ? "DESCRIBE" : (v as XansqlBridgeAction);
   }

   // Matches identifiers: table, `table`, "table", [table]
   const IDENT = `([\\\`"\\[]?)([A-Za-z0-9_.-]+)\\1`;

   const extractTable = (): string | null => {
      switch (verb) {
         case "SELECT": {
            // 1. Normal SELECT ... FROM table
            const normal = normalized.match(/\bFROM\s+([`"\[]?)([A-Za-z0-9_.-]+)\1/i);
            if (normal && normal[2] !== "(") {
               return normal[2]; // real table
            }

            // 2. Extract real tables inside a subquery: SELECT ... FROM ( SELECT ... FROM table )
            const inner = normalized.match(
               /\(\s*SELECT[\s\S]+?\bFROM\s+([`"\[]?)([A-Za-z0-9_.-]+)\1/i
            );
            if (inner) return inner[2];

            return null;
         }
         case "INSERT": {
            const match = new RegExp(`\\bINTO\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }
         case "UPDATE": {
            const match = new RegExp(`^UPDATE\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }
         case "DELETE": {
            const match = new RegExp(`\\bFROM\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // CREATE TABLE tableName
         case "CREATE": {
            const match = new RegExp(`\\bCREATE\\s+TABLE\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // DROP TABLE tableName
         case "DROP": {
            const match = new RegExp(`\\bDROP\\s+TABLE\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // ALTER TABLE tableName
         case "ALTER": {
            const match = new RegExp(`\\bALTER\\s+TABLE\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // TRUNCATE TABLE tableName
         case "TRUNCATE": {
            const match = new RegExp(`\\bTRUNCATE\\s+TABLE\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // REPLACE INTO tableName
         case "REPLACE": {
            const match = new RegExp(`\\bREPLACE\\s+INTO\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // DESCRIBE tableName
         case "DESCRIBE": {
            const match = new RegExp(`\\b(DESCRIBE|DESC)\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         // SHOW TABLES / SHOW DATABASES => no table
         case "SHOW": {
            const match = new RegExp(`\\bSHOW\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null; // e.g. SHOW TABLES
         }

         // USE databaseName
         case "USE": {
            const match = new RegExp(`\\bUSE\\s+${IDENT}`, "i").exec(normalized);
            return match ? match[2] : null;
         }

         default:
            return null;
      }
   };

   return {
      action: verb,
      table: extractTable(),
   };
};
