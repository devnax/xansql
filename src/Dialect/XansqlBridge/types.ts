import { ListenerInfo, SecurequServerConfig } from "securequ";
import Model from "../../model";

export type XansqlBridgeAuthorizedInfo = {
   method: "GET" | "POST" | "PUT" | "DELETE";
   model: Model | null;
   action: string;
}

export type XansqlBridgeInfo = {
   body: any;
   headers: { [key: string]: string };
}

export type XansqlBridgeResponse = {
   status: number;
   value: any;
};

export type XansqlBridgeServerConfig = {
   basepath: string;
   mode?: "production" | "development";
   isAuthorized?: (info: XansqlBridgeAuthorizedInfo) => Promise<boolean>;
   file?: SecurequServerConfig["file"];
};

export type ListenOptions = ListenerInfo