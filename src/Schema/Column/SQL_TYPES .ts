import { XansqlDataTypesMap } from "./types";

const SQL_TYPES: XansqlDataTypesMap = {
   mysql: {
      integer: "INT",
      bigInteger: "BIGINT",
      decimal: "DECIMAL",
      float: "FLOAT",
      boolean: "TINYINT(1)",
      tinyint: "TINYINT",

      string: "VARCHAR",
      text: "TEXT",

      date: "DATE",
      time: "TIME",
      datetime: "DATETIME",
      timestamp: "TIMESTAMP",

      json: "JSON",
      jsonb: "JSON", // Not supported in MySQL
      binary: "BLOB",

      uuid: "CHAR(36)",
      enum: "ENUM",
   },
   postgres: {
      integer: "SERIAL",
      bigInteger: "BIGSERIAL",
      decimal: "DECIMAL",
      float: "REAL",
      boolean: "BOOLEAN",
      tinyint: "SMALLINT",

      string: "VARCHAR",
      text: "TEXT",

      date: "DATE",
      time: "TIME",
      datetime: "TIMESTAMP",
      timestamp: "TIMESTAMP",

      json: "JSON",
      jsonb: "JSONB",
      binary: "BYTEA",

      uuid: "UUID",
      enum: "TEXT CHECK (column IN (...))", // Emulating ENUM in PostgreSQL
   },
   sqlite: {
      integer: "INTEGER",
      bigInteger: "BIGINT",
      decimal: "NUMERIC",
      float: "REAL",
      boolean: "INTEGER", // SQLite doesn't have BOOLEAN, uses 0/1 in INTEGER
      tinyint: "INTEGER",

      string: "TEXT",
      text: "TEXT",

      date: "TEXT",
      time: "TEXT",
      datetime: "TEXT",
      timestamp: "TEXT",

      json: "TEXT", // No native JSON type in SQLite
      jsonb: "TEXT",
      binary: "BLOB",

      uuid: "TEXT",
      enum: "TEXT",
   },
   mssql: {
      integer: "INT",
      bigInteger: "BIGINT",
      decimal: "DECIMAL",
      float: "FLOAT",
      boolean: "BIT",
      tinyint: "TINYINT",

      string: "NVARCHAR",
      text: "TEXT",

      date: "DATE",
      time: "TIME",
      datetime: "DATETIME",
      timestamp: "DATETIME2",

      json: "NVARCHAR(MAX)", // Stored as text in MSSQL
      jsonb: "NVARCHAR(MAX)",
      binary: "VARBINARY(MAX)",

      uuid: "UNIQUEIDENTIFIER",
      enum: "NVARCHAR(255)",
   },
};

export default SQL_TYPES;