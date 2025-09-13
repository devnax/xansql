
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
}

export type WhereArgsValue = string | number | boolean | WhereSubCondition | null | Date | WhereArgs

export interface WhereArgs {
   [column: string]: WhereArgsValue | WhereArgsValue[];
}

export type LimitArgs = {
   take?: number;
   skip?: number;
}

export type OrderByArgs = {
   [column: string]: "asc" | "desc";
}

export type SelectRelationArgs = {
   where?: WhereArgs;
   select?: SelectArgs;
   limit?: LimitArgs
   orderBy?: OrderByArgs;
   cache?: boolean;
}

export type SelectArgs = {
   [column: string]: boolean | SelectRelationArgs | {
      unique?: boolean;
   }
}

export type DataValue =
   | string
   | number
   | boolean
   | Date
   | null
   | Map<any, any>
   | Set<any>
   | File
   | Record<string | number, any>
   | any[]

export type DataArgs = {
   [column: string]: DataValue | DataArgs[] | DataArgs;
}

export type BuildResultStructure = {
   model: string;
   columns: string[];
   ids: number[];
   field: string;
   args: object;
   type: "main" | "relation";
   relations: BuildResultStructure[];
}

export type BuildResult = {
   type: "main" | "relation";
   cache_key?: string;
   results: ({ [key: string]: any })[] | null;
   structure: BuildResultStructure;
}


export type Count = {
   [column: string]: boolean | {
      unique?: boolean;
   }
}

export type FindArgs = {
   distinct?: string[];
   count?: string[];
   where?: WhereArgs;
   select?: SelectArgs;
   limit?: LimitArgs
   orderBy?: OrderByArgs;
   cache?: boolean;
}


export type CreateArgs = {
   data: DataArgs | DataArgs[];
   select?: SelectArgs;
}

export type UpdateDataRelationArgs = {
   data: UpdateDataArgs;
   where?: WhereArgs;
}

export type UpdateDataArgs = {
   [column: string]: DataValue | UpdateDataRelationArgs;
}

export type UpdateArgs = {
   data: UpdateDataArgs;
   where: WhereArgs;
   select?: SelectArgs
}


export type DeleteArgs = {
   where: WhereArgs;
   select?: SelectArgs;
}

export type CountSelectArgs = {
   [relation_column: string]: boolean | CountSelectArgs;
}

export type CountArgs = {
   where: WhereArgs;
   select?: CountSelectArgs
}


export type ReturnCount = {
   [column: string | '_count']: number | ReturnCount;
}