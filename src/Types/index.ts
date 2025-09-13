import { XVEnumValues, XVInstanceType, XVObjectType } from "xanv";
import SQString from "./fields/String";
import SQBoolean from "./fields/Boolean";
import SQArray from "./fields/Array";
import SQDate from "./fields/Date";
import SQEnum from "./fields/Enum";
import SQMap from "./fields/Map";
import SQNumber from "./fields/Number";
import SQObject from "./fields/Object";
import SQRecord from "./fields/Record";
import SQSet from "./fields/Set";
import SQTuple from "./fields/Tuple";
import SQUnion from "./fields/Union";
import SQIDField from "./fields/IDField";
import XqlCreatedAt from "./fields/CreatedAt";
import XqlUpdatedAt from "./fields/UpdatedAt";
import XqlSchema from "./fields/Schema";
import { XqlFields } from "./types";
export const x = {
   id: () => new SQIDField(),
   array: (type: XqlFields, length?: number) => new SQArray(type as any, length),
   boolean: () => new SQBoolean(),
   date: () => new SQDate(),
   enum: (values: XVEnumValues) => new SQEnum(values),
   map: (key: XqlFields, value: XqlFields) => new SQMap(key as any, value as any),
   number: (length?: number) => new SQNumber(length),
   object: (arg?: XVObjectType) => new SQObject(arg),
   record: (key: XqlFields, value: XqlFields) => new SQRecord(key as any, value as any),
   set: (type: XqlFields) => new SQSet(type as any),
   string: (length?: number) => new SQString(length),
   tuple: (type: XqlFields[]) => new SQTuple(type as any),
   union: (type: XqlFields[]) => new SQUnion(type as any),
   schema: (table: string, column: string) => new XqlSchema(table, column),
   createdAt: () => new XqlCreatedAt(),
   updatedAt: () => new XqlUpdatedAt(),

}

export default x;