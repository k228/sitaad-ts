import { BaseOptions } from "./interfaces";
import { ServiceCall } from "./service-call";
import { Shahkar } from "./shahkar";

export class Sitaad {
    protected _shahkar: Shahkar;
    protected serviceCall: ServiceCall;

    constructor(option: BaseOptions) {
        this.serviceCall = new ServiceCall(option);
        this._shahkar = new Shahkar(this.serviceCall);
    }

    public get shahkar(): Shahkar {
        return this._shahkar;
    }
}

export * from './helpers';
export * from './index';
export * from './interfaces';
export * from './service-call';
export * from './shahkar'