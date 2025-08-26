
export interface WhereSubCondition {
   equals?: string | number | boolean;
   not?: string | number | boolean;
   lt?: string | number;
   lte?: string | number;
   gt?: string | number;
   gte?: string | number;
   in?: (string | number)[];
   notIn?: (string | number)[];
   between?: [string | number, string | number];
   notBetween?: [string | number, string | number];
   contains?: string;
   notContains?: string;
   startsWith?: string;
   endsWith?: string;
   isNull?: boolean;
   isNotNull?: boolean;
   isEmpty?: boolean;
   isNotEmpty?: boolean;
   isTrue?: boolean;
   isFalse?: boolean;
   like?: string;
   notLike?: string;
}

export type WhereArgsValue = string | number | boolean | WhereSubCondition | null | Date | WhereArgs
export interface WhereArgs {
   [column: string]: WhereArgsValue | WhereArgsValue[];
}

export type LimitArgs = {
   take?: number;
   skip?: number;
   [column: string]: LimitArgs | number | undefined
}

export type OrderByArgs = {
   [column: string]: "asc" | "desc" | OrderByArgs;
}

export type SelectRelationArgs = {
   where?: WhereArgs;
   select?: SelectArgs;
   limit?: LimitArgs
   orderBy?: OrderByArgs;
   cache?: boolean;
}

export type SelectArgs = {
   [column: string | "*"]: boolean | SelectRelationArgs
}

export type ColumnDataType = string | number | boolean | Date | null

export type DataArgs = {
   [column: string]: ColumnDataType | DataArgs[] | DataArgs;
}

