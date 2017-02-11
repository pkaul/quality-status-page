import * as React from "react";
import {
    JenkinsClient, JenkinsJobResponse, isBuilding, JenkinsBuildResponse, getProgressPercent, JenkinsBuildStatus, getBuildStatus, isSingleJob, isMultiJob,
    JenkinsJobRefResponse, JenkinsMultiJobResponse, getHealth
} from "./JenkinsClient";
import {StatusComponent, StatusProperties, Status, ErrorSource, Signal, MultiStatus} from "./StatusComponent";


/**
 * React component for rendering Jenkins job status
 */
export class JenkinsJobComponent extends StatusComponent {

    private client:JenkinsClient = new JenkinsClient();

    constructor(props: StatusProperties) {
        super(props);
    }

    // public render():JSX.Element {
    //
    //     if( !!this.state.error ) {
    //         return this.renderStatus(this.state);
    //     }
    //     else if( !!(this.state as JobState).buildStatus ) {
    //         return this.renderJob(this.state as JobState);
    //     }
    //     else if( !!(this.state as MultiJobState).jobs ) {
    //         return this.renderMultiJob(this.state as MultiJobState);
    //     }
    //     else {
    //         return this.renderStatus(this.state);
    //     }
    // }

    // --------------


    protected renderChildren(status:Status[]):JSX.Element {

        return <div className="status-group">
                    {
                        status.map(item =>
                            // dynamically create a React component with a virtual job id
                            React.createElement(JenkinsJobComponent, {"url": item.url}, null)
                        )
                    }
                </div>;
    }

    // private renderJob(job:JobState):JSX.Element {
    //
    //     const now:number = new Date().getTime();
    //
    //     // age: distinct value between 0 and 5
    //     let age:number = null;
    //     if( !job.computing && job.time ) {
    //
    //         age = Math.round((now - job.time) / JenkinsJobComponent.AGE_INTERVAL_MILLIS);
    //         if (age < 0) {
    //             age = 0;
    //         }
    //         if (age > 5) {
    //             age = 5;
    //         }
    //     }
    //
    //     let className:string = `status ${job.buildStatus}`;
    //     if( job.building ) {
    //         className += " building";
    //     }
    //     if( age ) {
    //         className += " age-"+age;
    //     }
    //
    //     if( job.loading ) {
    //         className += " "+Styles.LOADING;
    //     }
    //
    //     let progressBar = null;
    //     if( job.computing ) {
    //         progressBar =  <progress value={job.progress} max="100"></progress>;
    //     }
    //
    //     let info:string[] = ["Last built: "+new Date(job.time)];
    //     if( job.buildHealth != null ) {
    //          info.push("Health: "+job.buildHealth+"%");
    //     }
    //
    //     return <div className={className} title={info.join("\n")}>
    //         <h3><a href={job.url} target="_blank">{job.name}</a></h3>
    //         {progressBar}
    //     </div>;
    // }

    protected loadStatus(): Promise<Status> {

        // load status
        const url:string = this.props.url;
        const client:JenkinsClient = this.client;

        return client.read(url).then((job: JenkinsJobResponse | JenkinsMultiJobResponse) => {

                // determine name: lookup explicit name from properties, from job definition and (fallback) use id
                let name: string = !!this.props.name ? this.props.name : job.displayName;
                if (!name) {
                    name = this.props.url;
                }
                //
                if (isSingleJob(job)) {

                    let singleJob: JenkinsJobResponse = job as JenkinsJobResponse;
                    return client.readBuild(singleJob.lastBuild).then((build: JenkinsBuildResponse) => {

                        return Promise.resolve({
                            "name": name,
                            "url": job.url,
                            "loading": false,
                            "signal": JenkinsJobComponent.asSignal(singleJob),
                            "computing": isBuilding(singleJob),
                            "progress": getProgressPercent(build),
                            "time": build.timestamp,
                            "health": getHealth(singleJob)
                        } as Status) as Promise<Status>
                    });
                }
                else if (isMultiJob(job)) {

                    let multiJob: JenkinsMultiJobResponse = job as JenkinsMultiJobResponse;

                    let children:Status[] = [];
                    for( let i:number=0; i<multiJob.jobs.length; i++ ) {
                        let child:JenkinsJobRefResponse = multiJob.jobs[i];
                        children.push({
                            name: child.name,
                            url: child.url
                        });
                    }

                    return Promise.resolve({
                        "name": this.getDisplayNameFromPropOrState(),
                        "url": url,
                        "loading": false,
                        "children": children
                    } as MultiStatus) as Promise<Status>;
                }
                else {

                    return Promise.resolve({
                        name: this.getDisplayNameFromPropOrState(),
                        loading: false,
                        error: ErrorSource.PROVIDER,
                        errorMessage: "Unexpected response format: "+JSON.stringify(job)
                    } as Status) as Promise<Status>;
                }

            }, (error: any) => {

                return Promise.resolve({
                    url: url,
                    name: this.getDisplayNameFromPropOrState(),
                    loading: false,
                    error: ErrorSource.LOADING,
                    errorMessage: "Error: "+JSON.stringify(error)
                } as JobState);
            }
        );
    }

    // -----------

    private static asSignal(job:JenkinsJobResponse):Signal {

        let status:JenkinsBuildStatus = getBuildStatus(job);
        if( status === JenkinsBuildStatus.SUCCESS ) {
            return Signal.SUCCESS;
        }
        else if( status === JenkinsBuildStatus.WARN ) {
            return Signal.WARNING;
        }
        else if( status === JenkinsBuildStatus.ERROR ) {
            return Signal.ERROR;
        }
        else {
            return Signal.UNKNOWN;
        }
    }
}



interface JobState extends Status {

    buildStatus: string;
    // whether job is currently building
    building:boolean;
    // progress (0..100) for build to finish
    buildProgress:number;
    buildTimestamp:number;
    buildHealth:number;
}

interface MultiJobState extends Status {
    jobs:JenkinsJobRefResponse[]
}



