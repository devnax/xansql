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
import XqlName from "./additional/Name";
import XqlPassword from "./additional/Password";
import XqlUsername from "./additional/Username";
import XqlSlug from "./additional/Slug";
import XqlUrl from "./additional/Url";
import XqlPhoto from "./additional/Photo";
import XqlPhone from "./additional/Phone";
import XqlIP from "./additional/IP";
import { XVType } from "xanv";
import RelationMany from "./fields/RelationMany";
import Model from "../model";
import RelationOne from "./fields/RelationOne";
import { ModelClass } from "../model/types";

const xt = {
   id: () => new XqlIDField(),
   array: <T extends XVType<any>>(type: T) => new XqlArray(type),
   boolean: () => new XqlBoolean(),
   date: () => new XqlDate(),
   enum: <const T extends string | number>(input: readonly T[] | Record<string, T>) => new XqlEnum<T>(input),
   number: (length?: number) => new XqlNumber(length),
   object: <const T extends Record<string, XVType<any>>>(shape: T) => new XqlObject<T>(shape),
   record: <K extends XVType<any>, V extends XVType<any>>(key: K, value: V) => new XqlRecord(key as any, value as any),
   string: (length?: number) => new XqlString(length),
   tuple: <T extends XVType<any>[]>(type: T) => new XqlTuple(type),
   union: <T extends XVType<any>[]>(types: T) => new XqlUnion(types),
   file: (size?: number) => new XqlFile(size),
   many: <M extends Model, T extends string>(m: ModelClass<M>, targetColum: T) => new RelationMany(m, targetColum),
   one: <M extends Model, T extends string>(m: ModelClass<M>, targetColum: T) => new RelationOne(m, targetColum),

   createdAt: () => xt.date().createdAt(),
   updatedAt: () => xt.date().updatedAt(),
   // Custom Types
   name: () => new XqlName,
   password: () => new XqlPassword,
   email: () => xt.string().email().index().unique(),
   gender: () => xt.enum(['male', 'female', 'other'] as const).index(),
   status: <const T extends string | number>(input: readonly T[] | Record<string, T>) => xt.enum(input).index(),
   role: <const T extends string | number>(input: readonly T[] | Record<string, T>) => xt.enum(input).index(),
   username: () => new XqlUsername,
   slug: () => new XqlSlug,
   url: () => new XqlUrl,
   photo: () => new XqlPhoto,
   amount: () => xt.number().float().min(0).max(1000000000),
   phone: () => new XqlPhone,
   title: () => xt.string().min(1).max(200),
   description: () => xt.string().max(1000),
   metadata: () => xt.record(
      xt.string(),
      xt.union([
         xt.string(),
         xt.number(),
         xt.boolean(),
         xt.date()
      ])
   ),
   ip: () => new XqlIP,
   key: () => xt.string().max(100).index(),
   value: () => xt.string().max(1000),
   token: () => xt.string(64).index().unique(),
}

export default xt;