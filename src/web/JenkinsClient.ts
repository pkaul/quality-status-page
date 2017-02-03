
import rest = require("rest");
import basicAuth = require("rest/interceptor/basicAuth");
import defaultRequest = require("rest/interceptor/defaultRequest");
import {Client} from "rest";
import {Request} from "rest";
import {Response} from "rest";


import {Promise} from 'es6-shim';

/**
 * (REST-) client for fetching job/build data from Jenkins
 */
export class JenkinsClient {

    private _baseUrl:string;
    private _userName:string;
    private _password:string;

    constructor(baseUrl:string, userName:string, password:string) {
        this._baseUrl = baseUrl;
        this._userName = userName;
        this._password = password;
    }

    /**
     * Fetches job data
     */
    public read(jobIdOrPath: string): Promise<JenkinsJobResponse | JenkinsMultiJobResponse> {

        // encode everything that is not a slash
        let normalizedId:string = "";
        jobIdOrPath.split("/").forEach((pathElement:string) => {normalizedId += (normalizedId.length > 0 ? "/" : "")+encodeURIComponent(pathElement)});

        // must not apply encodeURIComponent() on job id since it might contain slashes!
        const url:string = this._baseUrl + "/job/" + jobIdOrPath + "/api/json";
        return this.request(url).then((entity:any) => {
            return entity;
        });
    }

    /**
     * Fetches job data
     */
    public readJob(job: JenkinsJobRefResponse): Promise<JenkinsJobResponse> {

        return this.request(job.url).then((entity:any) => {
            return <JenkinsJobResponse> entity;
        });
    }

    /**
     * Fetches job build data
     */
    public readBuild(buildRef:JenkinsBuildRefResponse):Promise<JenkinsBuildResponse> {

        const url:string = buildRef.url + "/api/json";
        return this.request(url).then((entity:any) => {
            return <JenkinsBuildResponse> entity;
        });
    }

    // -------------

    private request(url:string):Promise<any> {

        let client: Client = rest.getDefaultClient();

        // if configured: send credentials via basic authorization
        if(!!this._userName && !!this._password ) {
            client = client.wrap(basicAuth, {username: this._userName, password: this._password});
        }


        client = client.wrap(defaultRequest, {
            "method":   "GET",
            "path":     url,
            // enabling sending existing authentication cookie via CORS
            "mixin":    {"withCredentials": true},
        });

        const request: Request = {
            // "method": "GET",
            // "path": url
        };


        return new Promise<JenkinsJobResponse>((resolve:(r:any)=>void, reject:(reason:any) => void) => {

            client(request).then((response: Response) => {

                //console.info("Received " + JSON.stringify(response)+" from "+url);

                if (response.status.code === 200 && !!response.entity) {

                    let jsonEntity: Object = JSON.parse(response.entity);
                    // JenkinsClient.correctTimestamp(jsonEntity, response);
                    resolve(jsonEntity);
                }
                else {
                    console.info("Error loading " + url +": "+JSON.stringify(response));
                    reject(this.getErrorMessage(response));
                }
            }).catch((errorResponse: Object) => {
                console.info("Error loading " + url +": "+JSON.stringify(errorResponse));
                reject(this.getErrorMessage(errorResponse));
            });
        });
    }

    private getErrorMessage(response:Object):string {

        if( !!response ) {

            if( response['error'] ) {
                return response['error'];
            }
            else if( !!response['status'] && !!response['status']['code'] && !!response['status']['text'] ) {
                return "HTTP "+response['status']['code']+": "+response['status']['text'];
            }
            else {
                return "unknown";
            }
        }
        else {
            return "unknown";
        }
    }


    /**
     * Correct timestamp property from Jenkins entity based on server "Date".
     * TODO: requires "Date" to be allowed via CORS
     */
    private static correctTimestamp(entity:Object, response:Response):void {

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

}


// ----------------------------



/**
 * A single job representation
 */
export interface JenkinsJobResponse {

    name:string,
    displayName: string,
    displayNameOrNull: string,
    description: string,
    url:string,

    builds: JenkinsBuildRefResponse[],
    lastBuild: JenkinsBuildRefResponse,
    color: string,
    healthReport: JenkinsHealthReport[]

}

/**
 * Multi-branch jobs representation
 */
export interface JenkinsMultiJobResponse {

    name:string,
    displayName: string,
    displayNameOrNull: string,
    description: string,
    url:string,

    jobs: JenkinsJobRefResponse[]
}


export interface JenkinsBuildResponse {

    id: string,
    building: boolean,
    number: number,
    duration: number,
    estimatedDuration:number,
    timestamp:number
}

export interface JenkinsBuildRefResponse {

    _class: string,
    number: number,
    url: string
}

export interface JenkinsJobRefResponse {
    name: string,
    url: string,
    color: string
}

export enum JenkinsBuildStatus {
    SUCCESS, WARN, ERROR, DISABLED, ABORTED, NOTBUILT, UNKNOWN
}

export interface JenkinsHealthReport {
    score:number;
}


// ----------------------------

/**
 * Determines whether an entity is a {@link JenkinsJobResponse}
 */
export function isSingleJob(job:JenkinsJobResponse | JenkinsMultiJobResponse):boolean {
        return !!(job as JenkinsJobResponse).builds;
}

/**
 * Determines whether an entity is a {@link JenkinsMultiJobResponse}
 */
export function isMultiJob(job:JenkinsJobResponse | JenkinsMultiJobResponse):boolean {
    return !!(job as JenkinsMultiJobResponse).jobs;
}

export function getBuildStatus(job:JenkinsJobResponse):JenkinsBuildStatus {

    if(!job.color) {
        return JenkinsBuildStatus.UNKNOWN;
    }
    else if( job.color.startsWith("red") ) {
        return JenkinsBuildStatus.ERROR;
    }
    else if( job.color.startsWith("yellow") ) {
        return JenkinsBuildStatus.WARN;
    }
    else if( job.color.startsWith("blue") ) {
        return JenkinsBuildStatus.SUCCESS;
    }
    else if( job.color.startsWith("notbuilt") ) {
        return JenkinsBuildStatus.NOTBUILT;
    }
    else if( job.color.startsWith("aborted") ) {
        return JenkinsBuildStatus.ABORTED;
    }
    else if( job.color.startsWith("disabled") ) {
        return JenkinsBuildStatus.DISABLED;
    }
    else {
        return JenkinsBuildStatus.UNKNOWN;
    }
}


export function isBuilding(job:JenkinsJobResponse):boolean {
    return !!job.color && job.color.indexOf("_anime") > -1;
}

// /**
//  * Age of a build in milliseconds
//  */
// export function getAge(build:JenkinsBuildResponse):number {
//
//     let now:number = new Date().getTime();
//     return now - (!!build.timestamp ? build.timestamp : 0)
// }

/**
 * Fetches job's current health
 */
export function getHealth(job:JenkinsJobResponse):number {

    if( job && job.healthReport && job.healthReport.length > 0 && job.healthReport[0].score ) {
        return job.healthReport[0].score;
    }
    else {
        return null;
    }
}

/**
 * @param build
 * @return {number} Progress of job. Value between 0 (just started) and 100 (finished)
 */
export function getProgressPercent(build:JenkinsBuildResponse):number {

    if( !build.building || !build.timestamp || !build.estimatedDuration ) {
        return 100;
    }

    let now:number = new Date().getTime();
    let elapsedMillis:number = now-build.timestamp;
    let result:number = Math.round(elapsedMillis * 100 / build.estimatedDuration);

    //console.log("Progress: ts="+(new Date(build.timestamp).toDateString())+" now="+now+" elapsed="+elapsedMillis+" estimated="+build.estimatedDuration+" result="+result);

    if( result < 0 || result > 100 ) {
        // wrong system time?
        return 0;
    }
    return result;
}


