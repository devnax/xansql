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
import XqlJoin from "./fields/Join";
export const x = {
   array: (type: XVInstanceType, length?: number) => new SQArray(type, length),
   boolean: () => new SQBoolean(),
   date: () => new SQDate(),
   enum: (values: XVEnumValues) => new SQEnum(values),
   map: (key: XVInstanceType, value: XVInstanceType) => new SQMap(key, value),
   number: (length?: number) => new SQNumber(length),
   object: (arg?: XVObjectType) => new SQObject(arg),
   record: (key: XVInstanceType, value: XVInstanceType) => new SQRecord(key, value),
   set: (type: XVInstanceType) => new SQSet(type),
   string: (length?: number) => new SQString(length),
   tuple: (type: XVInstanceType[]) => new SQTuple(type),
   union: (type: XVInstanceType[]) => new SQUnion(type),

   id: () => new SQIDField(),
   join: (table: string) => new XqlJoin(table),

}

export default x;