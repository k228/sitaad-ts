import axios, { AxiosInstance } from "axios";
import { BaseOptions, BaseResponse, SitaadGetAccessTokenResponseInterface } from "interfaces";
import { Redis } from "ioredis";
import { ElasticsearchService } from "@nestjs/elasticsearch";



export class ServiceCall {
    private http: AxiosInstance;
    public options: BaseOptions;
    private logger: ElasticsearchService;
    private redis: Redis

    constructor(options: BaseOptions) {
        this.options = options;
        this.logger = this.options.elastic_instance;
        this.redis = this.options.redis_instance;
        this.http = axios.create({
            baseURL: options.base_url,
            timeout: options.timeout ?? 60000
        })

       this.http.interceptors.response.use((response) => {
            this.logger.index({
                index: options.log_index,
                body: {
                    headers: response.headers,
                    config: response.config,
                    status: response.status,
                    statusText: response.statusText,
                    _response: JSON.stringify(response.data),
                    timestamp: new Date().toISOString()
                }
            })
            return response;
        }, (error) => {
            this.logger.index({
                index: options.log_index,
                body: {
                    headers: error.response?.headers,
                    config: error.response?.config,
                    _e: JSON.stringify(error.message),
                    _response: JSON.stringify(error.response?.data),
                    timestamp: new Date().toISOString()
                }
            })
            return Promise.reject(error);
        })

    }

    public async call<T>(url: string, method: string, data: object, headers: any, transform: boolean, retry = true): Promise<BaseResponse<T>> {
        try {

            const request = await this.http({
                url: url,
                method: method,
                data: data,
                headers: headers,
                ...(transform && { transformRequest: [(data) => new URLSearchParams(data).toString()] })
            })

            return { res: request.data, status: request.status };
        } catch (err: any) {
            if (err?.response?.data?.code == 401 && retry) {
                const { res } = await this.getAccessToken("password", true);
                headers['Authorization'] = `Bearer ${res.access_token}`;
                return await this.call(url, "post", data, headers, transform, false)
            }
            return { res: {} as any, status: err?.response?.data?.code }
        }
    }


    public async getAccessToken(grant_type: "password" | "refresh_token", getNewToken = false) {
        const access_token = await this.redis.get("SITAAD_ACCESS_TOKEN");

        if (!getNewToken && access_token) return {
            res: {
                access_token: access_token,
                expires_in: 0,
                refresh_token: "",
                scope: "",
                token_type: ""
            },
            status: 200
        }
        const get_token = await this.call<SitaadGetAccessTokenResponseInterface>('/oauth/token', "post", {
            grant_type: grant_type,
            username: this.options.user_name,
            password: this.options.password
        }, {
            'Authorization': `Basic ${this.options.basic_auth_token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }, true)
        await this.redis.set("SITAAD_ACCESS_TOKEN", get_token.res.access_token)
        const ttl = get_token.res.expires_in > 100 ? get_token.res.expires_in - 100 : get_token.res.expires_in;
        await this.redis.expire("SITAAD_ACCESS_TOKEN", ttl)
        return get_token;
    }
}