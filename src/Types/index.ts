import { XVEnumValues, XVObjectType } from "xanv";
import XqlString from "./fields/String";
import XqlBoolean from "./fields/Boolean";
import XqlArray from "./fields/Array";
import XqlDate from "./fields/Date";
import XqlEnum from "./fields/Enum";
import XqlNumber from "./fields/Number";
import XqlObject from "./fields/Object";
import XqlRecord from "./fields/Record";
import XqlTuple from "./fields/Tuple";
import XqlUnion from "./fields/Union";
import XqlIDField from "./fields/IDField";
import XqlFile from "./fields/File";
import XqlSchema from "./fields/Schema";
import { XqlFields } from "./types";

export const x = {
   id: () => new XqlIDField(),
   array: (type: XqlFields, length?: number) => new XqlArray(type as any, length),
   boolean: () => new XqlBoolean(),
   date: () => new XqlDate(),
   enum: (values: XVEnumValues) => new XqlEnum(values),
   number: (length?: number) => new XqlNumber(length),
   object: (arg?: XVObjectType) => new XqlObject(arg),
   record: (key: XqlFields, value: XqlFields) => new XqlRecord(key as any, value as any),
   string: (length?: number) => new XqlString(length),
   tuple: (type: XqlFields[]) => new XqlTuple(type as any),
   union: (type: XqlFields[]) => new XqlUnion(type as any),
   file: (size?: number) => new XqlFile(size),
   schema: (table: string, column: string) => new XqlSchema(table, column),
}

export default x;