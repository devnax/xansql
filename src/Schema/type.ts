import { ColumnDataType, DataArgs, LimitArgs, OrderByArgs, SelectArgs, WhereArgs } from "./Query/types";


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

export type FindArgs = {
   where?: WhereArgs;
   select?: SelectArgs;
   limit?: LimitArgs
   orderBy?: OrderByArgs;
   cache?: boolean;
}

export type SelectType = "partial" | "full";

export type CreateArgs = {
   data: DataArgs | DataArgs[];
   select?: SelectType;
}

export type UpdateArgsData = {
   [column: string]: ColumnDataType | UpdateArgsData;
}

export type UpdateArgs = {
   data: UpdateArgsData | UpdateArgsData[];
   where: WhereArgs;
   select?: SelectType
}

export type DeleteArgs = {
   where: WhereArgs;
}

export type CountSelectArgs = {
   [relation_column: string]: boolean | CountSelectArgs;
}

export type CountArgs = {
   where: WhereArgs;
   select?: CountSelectArgs
}


export type GetRelationType = {
   single: boolean;
   main: {
      table: string;
      column: string;
      alias: string;
      field: string;
   };
   foregin: {
      table: string;
      column: string;
      alias: string;
      field: string;
   };
}

export type ReturnCount = {
   [column: string | '_count']: number | ReturnCount;
}