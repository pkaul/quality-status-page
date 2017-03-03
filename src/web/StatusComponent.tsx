import * as React from "react";
import {Styles} from "./Styles";

export abstract class StatusComponent extends React.Component<StatusProperties, Status> {

    protected static AGE_INTERVAL_MILLIS:number = 24 * 60 * 60 * 1000; // 24 hours
    protected static REFRESH_INTERVAL_MILLIS:number = 10 * 1000; // 10 s

    private _refreshInterval:number = StatusComponent.REFRESH_INTERVAL_MILLIS;
    private _triggerHandle:number;

    public componentWillMount(): void {

        if (!this.props.url) {
            this.setState({
                name: this.getDisplayNameFromPropOrState(),
                error: ErrorSource.CONFIG,
                errorMessage: "Missing property url'"
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

    /**
     * Renders status in different flavours
     */
    protected renderStatus(status:Status):JSX.Element {

        const now:number = new Date().getTime();

        let name:string = status.name;

        // age: distinct value between 0 and 5
        let age:number = null;
        if( !status.computing && status.time ) {

            age = Math.round((now - status.time) / StatusComponent.AGE_INTERVAL_MILLIS);
            if (age < 0) {
                age = 0;
            }
            if (age > 5) {
                age = 5;
            }
        }

        let info:string[] = [];
        if( status.error ) {
            let errorMessage:string = !!status.errorMessage ? status.errorMessage : "Error";
            info.push(errorMessage);

            // name = "\u026A0 "+name; // TODO warning symbol
        }


        let signalStyle:string = StatusComponent.signalAsStyle(status.signal);

        let className:string = `status ${signalStyle}`;
        if( status.computing ) {
            className += " building";
        }
        if( age ) {
            className += " age-"+age;
        }

        if (status.error) {
            className += " " + Styles.LOADING_ERROR;
        }

        if( status.loading ) {
            className += " "+Styles.LOADING;
        }

        let progressBar = null;
        if( status.computing ) {
            progressBar =  <progress value={status.progress} max="100"></progress>;
        }

        if( status.time ) {
            info.push("Last built: "+new Date(status.time));
        }
        if( status.health != null ) {
             info.push("Health: "+status.health+"%");
        }

        let nameWithLink = !!status.url ? <a href={status.url} target="_blank">{name}</a> : name;
        let children:JSX.Element;
        if( (status as MultiStatus).children ) {
            children = this.renderChildren((status as MultiStatus).children);
        }

        return <div className={className} title={info.join("\n")}>
            <h3>{nameWithLink}</h3>
            {progressBar}
            {children}
        </div>;
    }

    protected renderChildren(children:Status[]):JSX.Element {
        return null;
    }

    // protected renderStatus(status: Status): JSX.Element {
    //
    //     let statusClass: string = "status";
    //     if (status.loading) {
    //         statusClass += " " + Styles.LOADING;
    //     }
    //     if (status.error) {
    //         statusClass += " " + Styles.LOADING_ERROR;
    //     }
    //
    //     let errorMessage: string = !!status.errorMessage ? status.errorMessage : "Error";
    //     let jobLinkName = !!status.url ? <a href={status.url} target="_blank">{status.name}</a> : status.name;
    //
    //     return <div className={statusClass} title={errorMessage}><h3>{jobLinkName}</h3></div>;
    // }


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

    /**
     * Helper that builds a new state object that resets all previous values in order to prevent merge. This is somehow related to "Immutability Helpers"
     * @param newState values of new state object
     * @return state object to store with #setState
     */
    protected asFreshState(newState:Object):Object {

        var result:Object = {};

        // 1.) add all keys from current state and set value to null ("reset")
        for( var k in this.state ) {
            if( this.state.hasOwnProperty(k) ) {
                result[k] = null;
            }
        }
        // 2.) add all key/value from new state
        for( var k in newState ) {
            if( newState.hasOwnProperty(k) ) {
                result[k] = newState[k];
            }
        }

        return result;
    }

    private static signalAsStyle(signal:Signal):string {

        switch (signal) {
            case Signal.ERROR:
                return Styles.STATUS_ERROR;
            case Signal.WARNING:
                return Styles.STATUS_WARN;
            case Signal.SUCCESS:
                return Styles.STATUS_SUCCESS;
            default:
                return "";
        }
    }


}


export enum ErrorSource {
    NONE = 0,
    CONFIG = 1,
    LOADING = 2,
    PROVIDER = 3
}


export interface StatusProperties {

    // URL to fetch item's status
    url:string
    // optional human readable name to be shown by this component
    name?: string,

}

export enum Signal {

    UNDEFINED = 0,

    SUCCESS = 1,
    WARNING = 2,
    ERROR = 3,

    UNKNOWN = 4
}

/**
 * An item's (e.g. job) status .
 */
export interface Status {

    // display name
    name: string;
    // status item url
    url?: string;

    // whether the status is currently being loaded/refreshed
    loading?: boolean;

    // code if status couldn't be loaded
    error?: ErrorSource,
    errorMessage?: string

    // whether status is currently being computed
    computing?:boolean,

    // progress when #computing. From 0 (just started) to 100 (finished)
    progress?:number,

    // status signal of the item. Available of not #computing (anymore)
    signal?:Signal,

    // time when the item has computed last time
    time?:number,

    // item's health (percent: 0..100)
    health?:number
}

export interface MultiStatus extends Status {
    children:Status[]
}


