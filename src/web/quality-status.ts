// Entry point

import {HtmlSubstitution} from "./HtmlSubstitution";
import {JenkinsJobComponent} from "./JenkinsJobComponent";
import {TravisBuildComponent} from "./TravisBuildComponent";
import {AuthenticationConfigComponent} from "./AuthenticationConfigComponent";

document.addEventListener("DOMContentLoaded", () => {
    new HtmlSubstitution({
        "auth-config": AuthenticationConfigComponent,
        "jenkins-job": JenkinsJobComponent,
        "travis-build": TravisBuildComponent
    }).substitute();
});








