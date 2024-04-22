import * as moment from "moment";
import { JWK, JWE } from "node-jose";


export function generateReqId(current_date: moment.Moment, provider_code: string): string {
    const date = current_date.format("YYYYMMDDHHmmss");
    return `${provider_code}${date}000000`;
}

export async function encryptData(payload: object, public_key: string): Promise<string> {
    let publicKey = await JWK.asKey(public_key, "pem");
    const buffer = Buffer.from(JSON.stringify(payload))
    const encrypted = await JWE.createEncrypt({ format: "compact", contentAlg: "A256GCM", fields: { alg: "ECDH-ES+A256KW" } }, publicKey)
        .update(buffer).final();
    return encrypted;
}