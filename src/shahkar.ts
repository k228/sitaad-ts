import { ServiceCall } from "service-call";
import moment from "moment";
import { encryptData, generateReqId } from "helpers";
import { ShahkarResponseInterface } from "interfaces";

export class Shahkar {
    constructor(private readonly serviceCall: ServiceCall) { }

    public async matchingNationalCodeWithPhone(phone: string, identification_no: string, cmsUserId: number, identification_type = 0): Promise<ShahkarResponseInterface> {

        const current_date = moment();
        const timestamps = Math.floor(current_date.valueOf() / 1000);

        const encrypted_identification_no = await encryptData({ data: identification_no, iat: timestamps }, this.serviceCall.options.public_key);
        const encrypted_phone = await encryptData({ data: phone, iat: timestamps }, this.serviceCall.options.public_key);

        const payload = {
            serviceType: 2,
            identificationType: identification_type,
            identificationNo: encrypted_identification_no,
            requestId: generateReqId(current_date, this.serviceCall.options.provider_code),
            serviceNumber: encrypted_phone
        }

        const { res } = await this.serviceCall.getAccessToken("password");

        try {
            const matching_response: any = await this.serviceCall.call("/api/client/apim/v1/shahkaar/gwsh/serviceIDmatchingencrypted", "post", payload, {
                'Authorization': `Bearer ${res.access_token}`,
                'basicAuthorization': `Basic ${this.serviceCall.options.sitaad_shahkar_basic_auth_token}`,
                'pid': this.serviceCall.options.sitaad_pid,
                'cmsUserId': cmsUserId
            }, false);

            if (matching_response.status !== 200) {
                return {
                    result: {
                        isValid: false,
                        tryAgain: true
                    }
                }
            }

            const final_result = matching_response.res.result.data.result.data;

            const matching_state = final_result.response === 200;

            return {
                result: {
                    isValid: matching_state,
                    tryAgain: !matching_state
                }
            }
        } catch (error) {
            return {
                result: {
                    isValid: false,
                    tryAgain: true
                }
            }
        }
    }
}