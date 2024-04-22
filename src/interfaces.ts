export interface BaseOptions {
    base_url: string;
    timeout?: number;

    public_key: string;
    user_name: string;
    password: string;
    provider_code: string;
    basic_auth_token: string;
    sitaad_shahkar_basic_auth_token: string;
    sitaad_pid: string;

    elastic_instance: any;
    elastic_host: string;
    elastic_username: string;
    elastic_password: string;
    log_index: string;

    redis_instance: any;
}


export interface BaseResponse<T> {
    res: T;
    status?: number;
}

export interface SitaadGetAccessTokenResponseInterface {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
}

export interface ShahkarResponseInterface {
    result: {
        isValid?: boolean,
        tryAgain?: boolean
    }
}