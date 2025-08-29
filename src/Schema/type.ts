import { DataArgs, LimitArgs, OrderByArgs, SelectArgs, WhereArgs } from "./Query/types";


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


export type CreateArgs = {
   data: DataArgs | DataArgs[];
   select?: SelectArgs;
}

export type UpdateArgs = {
   data: Partial<DataArgs> | Partial<DataArgs>[];
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