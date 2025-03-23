interface WhereCondition {
   [key: string]: string | number | boolean | WhereSubCondition | WhereCondition;
}

interface WhereSubCondition {
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

export type SelectClause = {
   [key: string]: boolean | SelectClause;
}


export type FindOptions = {
   take?: number;
   skip?: number;
   orderBy?: {
      [key: string]: "asc" | "desc";
   };
   where?: WhereCondition;
   select?: SelectClause;
}




export type DataClause = {
   [key: string]: string | number | boolean | Date | null | DataClause;
}

export type UpdateOptions = {
   data?: DataClause;
   where?: WhereCondition;
   select?: SelectClause;
}

export type DeleteOptions = {
   where?: WhereCondition;
   select?: SelectClause;
}





export type CreateArgValue = string | number | boolean | null

export type CreateArgsData = {
   [field: string]: CreateArgValue | CreateArgs;
}

export type CreateArgs = {
   data: CreateArgsData | CreateArgsData[];
   select?: {
      [field: string]: boolean;
   };
}
