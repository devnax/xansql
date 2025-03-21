import Column from "./Column";
import Relation from "./Relation";

// Numeric: INT, BIGINT, DECIMAL, NUMERIC, FLOAT
export const integer = () => new Column(`integer`);
export const bigInteger = () => new Column('bigInteger');
export const tinyint = () => new Column('tinyint');
export const decimal = (length = 10, decimal = 2) => new Column(`decimal`, [length, decimal]);
export const float = () => new Column('float');
export const boolean = () => new Column('boolean');

// String: CHAR, VARCHAR, TEXT, ENUM, BLOB
export const string = (length = 255) => new Column(`string`, [length]);
export const text = () => new Column('text');

// Date/Time: DATE, TIMESTAMP, DATETIME, TIME
export const date = () => new Column('date');
export const time = () => new Column('time');
export const datetime = () => new Column('datetime');
export const timestamp = () => new Column('timestamp');

// JSON: JSON, JSONB
export const json = () => new Column('json');
export const jsonb = () => new Column('jsonb');
export const binary = (length = 16) => new Column(`binary`, [length]);

export const uuid = () => new Column('uuid');
export const enums = (values: string[]) => new Column(`enum`, values);

export const increments = () => integer().autoincrement().primaryKey();
export const id = () => increments();
export const unique = (length = 255) => string(length).unique();

export const createdAt = () => timestamp().default('CURRENT_TIMESTAMP');
export const updatedAt = () => timestamp().default('CURRENT_TIMESTAMP').onUpdateCurrentTimestamp();

export const reference = (table: string, foreignKey: string) => integer().references(table, foreignKey);
export const relation = (table_or_column: string, column?: string) => new Relation(table_or_column, column);