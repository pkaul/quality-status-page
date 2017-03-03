import {Response} from "rest";
import {Client} from "rest";
import rest = require("rest");
import basicAuth = require("rest/interceptor/basicAuth");
import defaultRequest = require("rest/interceptor/defaultRequest");
import {Request} from "rest";
import {getConfig, AuthenticationConfig} from "./AuthenticationConfigComponent";
export class RestClient {

    protected request(url:string):Promise<any> {

        let client: Client = rest.getDefaultClient();
        let config:AuthenticationConfig = getConfig(url);

        // basic authentication
        if(!!config && !!config.username && !!config.password ) {
            client = client.wrap(basicAuth, {
                username: config.username,
                password: config.password
            });
        }


        let withCredentials:boolean = !!config && config.hasOwnProperty('cors') ? config.cors : false;
        client = client.wrap(defaultRequest, {
            "method":   "GET",
            "path":     url,
            // enabling sending existing authentication cookie via CORS
            "mixin":    {"withCredentials": withCredentials},
        });

        const request: Request = {
            // "method": "GET",
            // "path": url
        };


        return new Promise<any>((resolve:(r:any)=>void, reject:(reason:any) => void) => {

            client(request).then((response: Response) => {

                //console.info("Received " + JSON.stringify(response)+" from "+url);

                if (response.status.code === 200 && !!response.entity) {

                    let jsonEntity: Object = JSON.parse(response.entity);
                    // JenkinsClient.correctTimestamp(jsonEntity, response);
                    resolve(jsonEntity);
                }
                else {
                    reject(RestClient.asRestError(url, response));
                }
            }).catch((errorResponse: Object) => {

                reject(RestClient.asRestError(url, errorResponse));
            });
        });
    }

    private static asRestError(url:string, response:Object):RestError {

        console.info("Error loading " + url +" ("+(response ? ": "+JSON.stringify(response): "")+")");

        if( !!response ) {

            if( response['error'] ) {
                return {
                    url: url,
                    code: response['error'],
                    message: "Check JavaScript console and/or web traffic for more details.",
                    details: JSON.stringify(response)
                };
            }
            else if( !!response['status'] && !!response['status']['code'] ) {

                let code:number = response['status']['code'];
                let text:string = response['status']['text'];
                if( code == 404 ) {

                    text += "Not found or not authenticated or not authorized."
                }

                return {    url: url,
                            code: code+"",
                            message: text,
                            details: JSON.stringify(response)} as RestError;

            }
            else {
                return {
                    url: url,
                    code: "unknown",
                    message: "Check JavaScript console and/or web traffic for more details.",
                    details: JSON.stringify(response)} as RestError;
            }
        }
        else {
            return {
                url: url,
                code: "unknown",
                message: "Check JavaScript console and/or web traffic for more details."} as RestError;
        }
    }


    /**
     * Correct timestamp property from Jenkins entity based on server "Date".
     * TODO: requires "Date" to be allowed via CORS
     */
    protected correctTimestamp(entity:Object, response:Response):void {

        try {
            const serverTimeString: string = response.headers["Date"];
            if (entity.hasOwnProperty("timestamp") && !!serverTimeString) {
                // server has sent a Date header
                let currentTime: number = new Date().getTime();

                let serverTime: number = new Date(serverTimeString).getTime();
                let timeOffset: number = serverTime - currentTime;

                console.info("Correcting time " + timeOffset);

                entity['timestamp'] = entity['timestamp'] + timeOffset;
            }
        }
        catch(e) {
            console.info("Error correcting timestamp", e);
        }
    }
    //
    // /**
    //  * Url encodes a given ID or path by encoding path segments
    //  */
    // protected static urlEncodeIdOrPath(idOrPath:string):string {
    //     let result:string = "";
    //     idOrPath.split("/").forEach((pathElement:string) => {result += (result.length > 0 ? "/" : "")+encodeURIComponent(pathElement)});
    //     return result;
    // }
}


export interface RestError {

    /** URL that caused the error */
    url:string,
    /** error code */
    code:string,
    /** error message */
    message?:string,
    /** additional details */
    details?:Object

}