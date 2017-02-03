# Quality Status Page


Library for building HTML pages for rendering quality status from various sources: 
Simply add this library to your HTML page and add custom tags, e.g. for rendering a Jenkins job status. 


## Example Usage

    <!doctype html>
    <html>
    
    <head>
        <title>Quality Status: Example Page</title>
        <link rel="stylesheet" href="https://pkaul.github.io/projects/quality-status-page/releases/0.2.0/quality-status.css"/>
        <script type="text/javascript" src="https://pkaul.github.io/projects/quality-status-page/releases/0.2.0/quality-status.min.js"></script>
    </head>
    
    <body>
        <h1>Quality Status: Example Page</h1>
        
        <status-provider id="myjenkins" url="http://your.jenkins.host" username="jenkins_user" password="secret"></status-provider>
        
        <div class="layout-group">
        
            <jenkins-job provider-ref="myjenkins" id-ref="job1" name="My Display Name"></jenkins-job>
            <jenkins-job provider-ref="myjenkins" id-ref="job2"></jenkins-job>
        
        </div>
    </body>
    </html>

## Tag Reference

### &lt;jenkins-job&gt;
Renders a Jenkins job status or (depending on configuration) a set of jobs.

|Attribute|Required|Description|
|---------|--------|-----------|
|provider-ref|yes|ID referencing a Jenkins &lt;status-provider&gt;|
|id-ref|yes|ID of Jenkins job to render. A multi branch pipeline job will be rendered as multiple status job|
|name|no|A name to be used when rendering this status. If omitted, the job's name will be fetched from provider|

### &lt;status-provider&gt;
Specifies a server (e.g. Jenkins) that provides status data via HTTP/REST.

|Attribute|Required|Description|
|---------|--------|-----------|
|id|yes|An arbitrary ID for referencing this provider|
|url|yes|Provider's base url|
|username|no|Username for authentication. Will be sent with every request if available. Can be omitted if a session cookie is available, e.g. by having logged in to this server manually (recommended)|
|password|no|Password for above's user|


#### Jenkins Security/CORS configuration
For security reasons, modern web browsers prevent fetching data via AJAX as a default. In order to enable data to be fetched, servers (here: Jenkins) need to
support [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) protocol. These steps need to be executed to make Jenkins aware or CORS

* Install [Cors Filter Plugin](https://wiki.jenkins-ci.org/display/JENKINS/Cors+Filter+Plugin) 
* Configure `"Manage Jenkins" -> "Configure System" -> "CORS Filter"` like

        Is Enabled:                     true
        Access-Control-Allow-Origins:   * (or a list of "host:port")



## Build this project
* Precondition: node.js is installed
* `npm install`
* `grunt`

[![Build Status](https://travis-ci.org/pkaul/quality-status-page.png?branch=master)](https://travis-ci.org/pkaul/quality-status-page)

