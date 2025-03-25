import Model from "./model";
import Schema from "./schema";
import { Dialects } from "./schema/types";

export type XansqlConfig = {
   dialect?: Dialects;
}

export type TableName = string;

export type ModelValue = {
   model: any;
}
export type ModelsType = Map<TableName, {
   model: Model;
   schema: Schema;
   schemaSQL: string;
   table: TableName;
}>;
