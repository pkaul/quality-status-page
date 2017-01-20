Status CI
===

JavaScript library for building status pages for continuous integration jobs


How to use
---

      <html>
	<head>
	    <link rel="stylesheet" href="./statusci.css"/>
	    <script type="text/javascript" src="./statusci.js"></script>
	</head>
      <body>
      	<!-- configures a Jenkins server url with optional credentials -->
	<server id="default" url="http://yourjenkinshost:8080" username="admin" password="admin"></server>
	<table width="100%">
	    <tr>
		<td>
		    <!-- renders Jenkins job "MyJob" -->
		    <jenkins_job server="default" name="MyJob"></jenkins_job>
		</td>
		<td>
		    <jenkins_job server="default" name="MyJob2"></jenkins_job>
		</td>
	    </tr>
	</table>
      </body>
      </html>

Build
---
* Precondition: node.js is installed
* `npm install`
* `grunt`



Jenkins Configuration
---
Fetching Jenkins job data is via AJAX is not allowed as a default. In order to enable Jenkins to serve data properly, these steps need to be executed
* [Cors Filter Plugin](https://wiki.jenkins-ci.org/display/JENKINS/Cors+Filter+Plugin) needs to be installed
* In "Manage Jenkins" -> "Configure System" -> "CORS Filter" needs to be configured like
        Is Enabled:                     true
        Access-Control-Allow-Origins:   * (or a list of "host:port")
        Access-Control-Allow-Methods:   GET