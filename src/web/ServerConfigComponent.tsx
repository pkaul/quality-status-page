
import * as React from "react";

const NAMESPACE:string = '_serverconfig';

export interface ServerConfig {
    id: string,
    url: string,
    username?:string,
    password?:string
}


export class ServerConfigComponent extends React.Component<ServerConfig, any> {

    constructor(props: ServerConfig) {
        super(props);

        if( !props.id || !props.url ) {
            throw new Error("Missing id and/or base_url: "+JSON.stringify(props));
        }

        const id:string = props.id;
        setConfig(id, props);
    }

    public render() {
        return null;
    }
}



/**
 * Stores config globally
 */
function setConfig(id:string, config:ServerConfig):void {

    if( !window[NAMESPACE] ) {
        window[NAMESPACE] = {};
    }

    if( window[NAMESPACE].hasOwnProperty(id) ) {
        throw new Error("Config for "+id+" already exists");
    }

    window[NAMESPACE][id] = config;
    console.info("Server config for "+id+": "+JSON.stringify(config));
}


export function getConfig(id:string):ServerConfig {

    if(!id) {
        throw new Error("Missing id");
    }
    if( !window[NAMESPACE]) {
        throw new Error("No config at all");
    }
    let result:ServerConfig = window[NAMESPACE][id];
    if( !result ) {

        throw new Error("No config found for "+id);
    }
    return result;
}




