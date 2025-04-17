
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
   matches?: string;
}

export type WhereArgsValue = string | number | boolean | WhereSubCondition | null | Date | WhereArgs
export interface WhereArgs {
   [column: string]: WhereArgsValue | WhereArgsValue[];
}

export type LimitClause = {
   take?: number;
   skip?: number;
   page?: number;
   [foregin: string]: LimitClause | number | undefined
}

export type OrderByClause = {
   [column: string]: "asc" | "desc" | OrderByClause;
}

export type SelectClause = {
   [column: string | "*"]: boolean | SelectClause;
}

export type FindArgs = {
   limit?: LimitClause
   orderBy?: OrderByClause;
   where: WhereArgs;
   select?: SelectClause;
}

export type DataClause = {
   [column: string]: string | number | boolean | Date | null;
}

export type CreateArgsData = {
   [column: string]: DataClause | CreateArgs;
}

export type CreateArgs = {
   data: CreateArgsData | CreateArgsData[];
   select?: SelectClause;
}

export type UpdateArgs = {
   data?: DataClause;
   where?: WhereArgs;
   select?: SelectClause;
}

export type DeleteInclude = {
   [column: string]: boolean | DeleteInclude;
}
export type DeleteArgs = {
   where?: WhereArgs;
   include?: DeleteInclude;
}





export type GetRelationType = {
   single: boolean;
   main: {
      table: string;
      column: string;
      alias: string;
   };
   foregin: {
      table: string;
      column: string;
      alias: string;
   };
}