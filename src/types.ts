import Model from "./Model";
import Schema from "./schema";
import { Dialects } from "./schema/types";

export type XansqlConfig = {
   dialect: Dialects;
   storage?: string;
   host: string;
}

export type TableName = string;

export type ModelValue = {
   model: any;
}
export type ModelsType = Map<TableName, Model>;
