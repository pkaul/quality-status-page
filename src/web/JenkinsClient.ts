import {RestClient} from "./RestClient";

/**
 * (REST-) client for fetching job/build data from Jenkins
 */
export class JenkinsClient extends RestClient {

    /**
     * Fetches job data
     */
    public read(jobIdOrPath: string): Promise<JenkinsJobResponse | JenkinsMultiJobResponse> {

        const url:string = this._baseUrl + "/job/" + RestClient.urlEncodeIdOrPath(jobIdOrPath) + "/api/json";
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
}




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


