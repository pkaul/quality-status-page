import * as React from "react";
const NAMESPACE:string = 'quality_status_authentication_';

/**
 * React component for defining authentication configuration (such as credentials)
 */
export class AuthenticationConfigComponent extends React.Component<AuthenticationConfig, any> {

    constructor(props: AuthenticationConfig) {
        super(props);

        if( !props['base-url'] ) {
            throw new Error("Missing base-url: "+JSON.stringify(props));
        }
        addConfig(props);
    }

    public render() {
        return null;
    }
}

export interface AuthenticationConfig {

    /**
     * (Base) url where this config is bound to
     */
    "base-url": string,

    // Username/password for basic authentication
    username?:string,
    password?:string

    /**
     * Whether to use cross side access control (-> CORS)
     */
    cors:boolean
}



/**
 * Stores config globally
 */
function addConfig(config:AuthenticationConfig):void {

    if( !window[NAMESPACE] ) {
        window[NAMESPACE] = {};
    }

    let id:string = config['base-url']

    if( window[NAMESPACE].hasOwnProperty(id) ) {
        throw new Error("Config for "+id+" already exists");
    }

    window[NAMESPACE][id] = config;
    console.info("authentication config for "+id+": "+JSON.stringify(config));
}


/**
 * Provides a config for a given URL or null if no such config exists
 */
export function getConfig(url:string):AuthenticationConfig {

    if(!url) {
        throw new Error("Missing url");
    }

    let configs:Object = window[NAMESPACE];
    if( !configs) {
        return null;
    }

    let result:AuthenticationConfig = null;
    for( let baseUrl in configs) {

        let current:AuthenticationConfig = configs[baseUrl];
        if( configs.hasOwnProperty(baseUrl) && url.startsWith(baseUrl) &&
            (result == null || result['base-url'].length < current['base-url'].length)  ) {
            // use config only if it is more specific (=longer base url) than config found before

            result = current;
        }

    }

    return result;
}
