const SQL_RESERVED_KEYWORDS = [
   "ADD", "ALL", "ALTER", "AND", "ANY", "AS", "ASC", "BETWEEN", "BY",
   "CASE", "CAST", "CHECK", "COLUMN", "CONSTRAINT", "CREATE", "CROSS",
   "CURRENT", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP",
   "DEFAULT", "DELETE", "DESC", "DISTINCT", "DROP", "ELSE", "EXISTS",
   "FALSE", "FETCH", "FOR", "FOREIGN", "FROM", "FULL", "GRANT", "GROUP",
   "HAVING", "INNER", "INSERT", "INTERSECT", "INTO", "IS", "JOIN",
   "KEY", "LEFT", "LIKE", "LIMIT", "NOT", "NULL", "ON", "OR", "ORDER",
   "OUTER", "PRIMARY", "REFERENCES", "RIGHT", "ROLLBACK", "SELECT", "SET",
   "TABLE", "THEN", "TO", "TRUE", "UNION", "UNIQUE", "UPDATE",
   "USING", "VALUES", "VIEW", "WHEN", "WHERE", "WITH", "SECTION",

   // custom
   "INDEX", "OPTIONAL", "NULLABLE", "META", "METAARRAY", "SCHEMA", "ARRAY",
   "equals", "not", "lt", "lte", "gt", "gte", "in", "notIn", "between", "notBetween", "contains", "notContains", "startsWith", "endsWith", "isNull", "isNotNull", "isEmpty", "isNotEmpty", "isTrue", "isFalse",

   "AGGREGATE", "GROUPBY", "ORDERBY", "LIMIT", "SKIP", "TAKE", "DISTINCT", "ALIAS",
];

const restrictedColumn = (column: string): boolean => {
   return SQL_RESERVED_KEYWORDS.includes(column.toUpperCase());
}

export default restrictedColumn;