import * as React from "react";
import {
    JenkinsClient, JenkinsJobResponse, isBuilding, JenkinsBuildResponse, getProgressPercent, JenkinsBuildStatus, getBuildStatus
} from "./JenkinsClient";
import {getConfig, ServerConfig} from "./ServerConfigComponent";
import {Styles} from "./Styles";



/**
 * React component for rendering Jenkins job status
 *
 * Requires Jenkins to have plugin "CORS support for Jenkins" installed with config:
 *  "Access-Control-Allow-Methods": "GET",
 *  "Access-Control-Allow-Headers": "authorization",
 *  "Access-Control-Allow-Origins": "*"
 *
 */
export class JenkinsJobComponent extends React.Component<JobProperties, JobState> {

    private _refreshInterval:number = 3000;
    private _triggerHandle:number;

    constructor(props: JobProperties) {
        super(props);
        if( !props.server || !props.id ) {
            throw new Error("Missing property 'server' and/or 'name': "+JSON.stringify(props));
        }
    }

    public componentWillMount():void {
        this.triggerLoadJob();
    }

    public componentWillUnmount():void {
        window.clearTimeout(this._triggerHandle);
    }

    public render() {

        const now:number = new Date().getTime();

        // age: distinct value between 0 and 5
        let age:number = null;
        if( !this.state.building && this.state.buildTimestamp ) {

            // distinct age values are based on 6-hours intervals
            const ageIntervalMillis:number = 6 * 60 * 60 * 1000; // 6 hours
            age = Math.round((now - this.state.buildTimestamp) / ageIntervalMillis);
            if (age < 0) {
                age = 0;
            }
            if (age > 5) {
                age = 5;
            }
        }


        // const jobUrl = this.state.jobUrl;
        let className:string = `status ${this.state.loadStatus} ${this.state.buildStatus}`;
        if( this.state.building ) {
            className += " building";
        }
        if( age ) {
            className += " age-"+age;
        }

        let progressBar = null;
        if( this.state.building ) {
            progressBar =  <progress value={this.state.buildProgress} max="100"></progress>;
        }
        const infoString:string = "Date: "+new Date(this.state.buildTimestamp)+"\nTest: Hello";   // TODO

        return <div className={className} title={infoString}>
                    <h3><a href={this.state.jobUrl} target="_blank">{this.state.name}</a></h3>
                    {progressBar}
                </div>;
    }

    // --------------

    private triggerLoadJob():void {

        let interval:number = this._refreshInterval+Math.random()*500;
        this.setState({
            "name": !!this.props.name ? this.props.name : this.props.id,
            "loadStatus": "loading",
        });
        this.loadJob().then((state: JobState) => {
                this.setState(state);
                this._triggerHandle = window.setTimeout(() => this.triggerLoadJob(), interval);
            }).catch(() => {
                this._triggerHandle = window.setTimeout(() => this.triggerLoadJob(), interval);
            });
    }



    private loadJob(): Promise<JobState> {

        const client:JenkinsClient = this.getClient();
        return client.readJob(this.props.id).then((job: JenkinsJobResponse) => {

                return client.readBuild(job.lastBuild).then((build:JenkinsBuildResponse) => {

                    let name:string = !!this.props.name ? this.props.name : job.displayName;
                    if( !name ) {
                        name = this.props.id;
                    }

                    return {
                        "name": name,
                        "jobUrl": job.url,
                        "loadStatus": "loading-done",
                        "buildCount": job && job.builds ? job.builds.length : 0,
                        "buildStatus": JenkinsJobComponent.asStatusStyle(job),
                        "building": isBuilding(job),
                        "buildProgress": getProgressPercent(build),
                        "buildTimestamp": build.timestamp,
                    }
                });


            }, (error: any) => {
                console.log("Error " + error);
                return {
                    "name": !!this.props.name ? this.props.name : this.props.id,
                    "loadStatus": "loading-error",
                    "buildStatus": Styles.STATUS_NONE
                };
            }
        );
    }

    // -----------

    private getClient():JenkinsClient {
        let config:ServerConfig = this.getConfig();
        return new JenkinsClient(config.url, config.username, config.password);
    }

    private getConfig():ServerConfig {
        return getConfig(this.props.server);
    }

    private static asStatusStyle(job:JenkinsJobResponse):string {

        let status:JenkinsBuildStatus = getBuildStatus(job);
        if( status === JenkinsBuildStatus.SUCCESS ) {
            return Styles.STATUS_SUCCESS;
        }
        else if( status === JenkinsBuildStatus.WARN ) {
            return Styles.STATUS_WARN;
        }
        else if( status === JenkinsBuildStatus.ERROR ) {
            return Styles.STATUS_ERROR;
        }
        else {
            return Styles.STATUS_NONE;
        }
    }
}





export interface JobProperties {
    // server (id from server element) to use for this use
    server: string,
    // jenkins job id
    id: string,
    // optional human readable name to be shown by this component
    name?:string
}

export interface JobState {

    // display name
    name:string;
    loadStatus: string;
    buildCount?: number;
    buildStatus?: string;
    // whether job is currently building
    building?:boolean;
    // progress (0..100) for build to finish
    buildProgress?:number;
    jobUrl?:string;
    buildTimestamp?:number;
}

