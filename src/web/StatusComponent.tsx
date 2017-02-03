import * as React from "react";
import {Styles} from "./Styles";
import {ServerConfig} from "./StatusProviderComponent";

export abstract class StatusComponent extends React.Component<StatusProperties, Status> {

    protected static AGE_INTERVAL_MILLIS:number = 24 * 60 * 60 * 1000; // 24 hours
    protected static REFRESH_INTERVAL_MILLIS:number = 10 * 1000; // 10 s

    private _refreshInterval:number = StatusComponent.REFRESH_INTERVAL_MILLIS;
    private _triggerHandle:number;

    public componentWillMount(): void {

        if (!this.props['provider-ref'] || !this.props['id-ref']) {
            this.setState({
                name: this.getDisplayNameFromPropOrState(),
                error: ErrorSource.CONFIG,
                errorMessage: "Missing property 'provider-ref' and/or 'id-ref'"
            });
        }
        else {
            this.triggerLoadStatus();
        }
    }

    public componentWillUnmount():void {
        window.clearTimeout(this._triggerHandle);
    }


    public render():JSX.Element {
        return this.renderStatus(this.state);
    }

    // ===============

    protected abstract loadStatus():Promise<Status>;

    protected renderStatus(status: Status): JSX.Element {

        let statusClass: string = "status";
        if (status.loading) {
            statusClass += " " + Styles.LOADING;
        }
        if (status.error) {
            statusClass += " " + Styles.ERROR;
        }

        let errorMessage: string = !!status.errorMessage ? status.errorMessage : "Error";
        let jobLinkName = !!status.url ? <a href={status.url} target="_blank">{status.name}</a> : status.name;

        return <div className={statusClass} title={errorMessage}><h3>{jobLinkName}</h3></div>;
    }


    protected getDisplayNameFromPropOrState(): string {

        if (!!this.state && this.state.name) {
            // name is already defined by state
            return this.state.name;
        }
        else {
            // use name or fallback to id
            return !!this.props.name ? this.props.name : this.props['id-ref'];
        }
    }

    protected triggerLoadStatus():void {

        let interval:number = this._refreshInterval+Math.random()*500;

        this.setState({
            "name": this.getDisplayNameFromPropOrState(),
            "loading": true,
        });
        this.loadStatus().then((state: Status) => {
            this.setState(state);
            this._triggerHandle = window.setTimeout(() => this.triggerLoadStatus(), interval);
        }).catch(() => {
            this._triggerHandle = window.setTimeout(() => this.triggerLoadStatus(), interval);
        });
    }


}


export enum ErrorSource {
    CONFIG = 1,
    LOADING = 2,
    PROVIDER = 3
}


export interface StatusProperties {

    // provider id (references 'status-provider')
    "provider-ref": string,
    // build id/path
    "id-ref": string,
    // optional human readable name to be shown by this component
    name?: string,

}


export interface Status {

    // display name
    name: string;
    url?: string;

    // whether the status is currently being loaded/refreshed
    loading?: boolean;
    // code if status couldn't be loaded/refreshed
    error?: ErrorSource,
    errorMessage?: string
}

