// Entry point

import {HtmlSubstitution} from "./HtmlSubstitution";
import {JenkinsJobComponent} from "./JenkinsJobComponent";
import {StatusProviderComponent} from "./StatusProviderComponent";
import {TravisBuildComponent} from "./TravisBuildComponent";
import {AuthenticationConfigComponent} from "./AuthenticationConfigComponent";

document.addEventListener("DOMContentLoaded", () => {
    new HtmlSubstitution({
        "authentication-config": AuthenticationConfigComponent,
        "status-provider": StatusProviderComponent,
        "jenkins-job": JenkinsJobComponent,
        "travis-build": TravisBuildComponent
    }).substitute();
});








