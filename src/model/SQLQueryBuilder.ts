interface WhereCondition {
   [key: string]: string | number | boolean | WhereSubCondition;
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

class SQLQueryBuilder {
   private table: string;
   private selectColumns: string[] = [];
   private insertValues: { [key: string]: any } = {};
   private updateValues: { [key: string]: any } = {};
   private whereConditions: WhereCondition = {};
   private groupByColumns: string[] = [];
   private havingConditions: WhereCondition = {};
   private orderByColumns: string[] = [];
   private limitValue: number | undefined;
   private offsetValue: number | undefined;

   constructor(table: string) {
      this.table = table;
   }

   // SELECT
   select(...columns: string[]): this {
      this.selectColumns = columns;
      return this;
   }

   where(conditions: WhereCondition): this {
      this.whereConditions = conditions;
      return this;
   }

   groupBy(columns: string[]): this {
      this.groupByColumns = columns;
      return this;
   }

   having(conditions: WhereCondition): this {
      this.havingConditions = conditions;
      return this;
   }

   orderBy(columns: string[]): this {
      this.orderByColumns = columns;
      return this;
   }

   limit(limit: number): this {
      this.limitValue = limit;
      return this;
   }

   offset(offset: number): this {
      this.offsetValue = offset;
      return this;
   }

   buildSelect(): string {
      let query = `SELECT ${this.selectColumns.join(', ')} FROM ${this.table}`;

      if (Object.keys(this.whereConditions).length > 0) {
         query += ' WHERE ' + this.buildWhereConditions(this.whereConditions);
      }

      if (this.groupByColumns.length > 0) {
         query += ' GROUP BY ' + this.groupByColumns.join(', ');
      }

      if (Object.keys(this.havingConditions).length > 0) {
         query += ' HAVING ' + this.buildWhereConditions(this.havingConditions);
      }

      if (this.orderByColumns.length > 0) {
         query += ' ORDER BY ' + this.orderByColumns.join(', ');
      }

      if (this.limitValue !== undefined) {
         query += ` LIMIT ${this.limitValue}`;
      }

      if (this.offsetValue !== undefined) {
         query += ` OFFSET ${this.offsetValue}`;
      }

      return query;
   }

   // INSERT
   insert(values: { [key: string]: any }): this {
      this.insertValues = values;
      return this;
   }

   buildInsert(): string {
      const columns = Object.keys(this.insertValues).join(', ');
      const values = Object.values(this.insertValues)
         .map(value => `'${value}'`)
         .join(', ');

      return `INSERT INTO ${this.table} (${columns}) VALUES (${values})`;
   }

   // UPDATE
   update(values: { [key: string]: any }): this {
      this.updateValues = values;
      return this;
   }

   buildUpdate(): string {
      const setClause = Object.keys(this.updateValues)
         .map(key => `${key} = '${this.updateValues[key]}'`)
         .join(', ');

      const whereClause = Object.keys(this.whereConditions).length > 0
         ? ' WHERE ' + this.buildWhereConditions(this.whereConditions)
         : '';

      return `UPDATE ${this.table} SET ${setClause}${whereClause}`;
   }

   // DELETE
   buildDelete(): string {
      const whereClause = Object.keys(this.whereConditions).length > 0
         ? ' WHERE ' + this.buildWhereConditions(this.whereConditions)
         : '';

      return `DELETE FROM ${this.table}${whereClause}`;
   }

   private buildWhereConditions(conditions: WhereCondition): string {
      return Object.keys(conditions)
         .map((key) => {
            const condition: any = conditions[key];
            if (typeof condition === 'object') {
               const subConditions = Object.keys(condition)
                  .map((subKey) => {
                     const subValue = condition[subKey];
                     switch (subKey) {
                        case 'equals':
                           return `${key} = '${subValue}'`;
                        case 'not':
                           return `${key} != '${subValue}'`;
                        case 'lt':
                           return `${key} < '${subValue}'`;
                        case 'lte':
                           return `${key} <= '${subValue}'`;
                        case 'gt':
                           return `${key} > '${subValue}'`;
                        case 'gte':
                           return `${key} >= '${subValue}'`;
                        case 'in':
                           return `${key} IN (${subValue.join(', ')})`;
                        case 'notIn':
                           return `${key} NOT IN (${subValue.join(', ')})`;
                        case 'between':
                           return `${key} BETWEEN '${subValue[0]}' AND '${subValue[1]}'`;
                        case 'notBetween':
                           return `${key} NOT BETWEEN '${subValue[0]}' AND '${subValue[1]}'`;
                        case 'contains':
                           return `${key} LIKE '%${subValue}%'`;
                        case 'notContains':
                           return `${key} NOT LIKE '%${subValue}%'`;
                        case 'startsWith':
                           return `${key} LIKE '${subValue}%'`;
                        case 'endsWith':
                           return `${key} LIKE '%${subValue}'`;
                        case 'isNull':
                           return `${key} IS NULL`;
                        case 'isNotNull':
                           return `${key} IS NOT NULL`;
                        case 'isEmpty':
                           return `${key} = ''`;
                        case 'isNotEmpty':
                           return `${key} != ''`;
                        case 'isTrue':
                           return `${key} = TRUE`;
                        case 'isFalse':
                           return `${key} = FALSE`;
                        case 'like':
                           return `${key} LIKE '%${subValue}%'`;
                        case 'notLike':
                           return `${key} NOT LIKE '%${subValue}%'`;
                        case 'matches':
                           return `${key} REGEXP '${subValue}'`;
                        default:
                           return '';
                     }
                  })
                  .join(' AND ');
               return `(${subConditions})`;
            }
            return `${key} = '${condition}'`;
         })
         .join(' AND ');
   }

   // Final query builder, can be used to output specific queries
   build(): string {
      if (this.selectColumns.length > 0) {
         return this.buildSelect();
      }
      if (Object.keys(this.insertValues).length > 0) {
         return this.buildInsert();
      }
      if (Object.keys(this.updateValues).length > 0) {
         return this.buildUpdate();
      }
      return this.buildDelete();
   }
}

// Example Usage

// SELECT Query
const selectQuery = new SQLQueryBuilder('users');
selectQuery
   .select('id', 'name', 'age')
   .where({ age: { gt: 18 }, status: { equals: 'active' } })
   .groupBy(['age'])
   .having({ age: { gte: 18 } })
   .orderBy(['age DESC'])
   .limit(10)
   .offset(5);
console.log(selectQuery.build()); // SELECT query

// INSERT Query
const insertQuery = new SQLQueryBuilder('users');
insertQuery.insert({ name: 'John', age: 30, status: 'active' });
console.log(insertQuery.build()); // INSERT query

// UPDATE Query
const updateQuery = new SQLQueryBuilder('users');
updateQuery.update({ status: 'inactive' }).where({ id: { equals: 1 } });
console.log(updateQuery.build()); // UPDATE query

// DELETE Query
const deleteQuery = new SQLQueryBuilder('users');
deleteQuery.where({ id: { equals: 1 } });
console.log(deleteQuery.build()); // DELETE query
