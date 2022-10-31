node('imf2public') {
    try {
        parameters {
            string(name: 'APPSERVER', defaultValue: 'ALPHERATZ')
            }

        withEnv(["GIT_SSL_NO_VERIFY=true",
                 "PYTHONPATH=${env.PYTHON_AGS_3}/",
                 "WRKSPC=E:/sw_nt/jenkins/workspace/waops/ago_all_gov_group_update_tool/",
				 ]) {

        stage ('SCM prepare'){
				deleteDir()
				checkout([$class: 'GitSCM', branches: [[name: '${gitTag}']], doGenerateSubmoduleConfigurations: false, extensions: [], gitTool: 'Default', submoduleCfg: [], userRemoteConfigs: [[url: 'https://github.com/bcgov/ago-all-gov-group-update-tool.git']]])		
		}

		stage("Copy Configs to the ${env.ENV} Server and run script to push data to ArcGIS Online") {
                timeout(time: 20, unit: 'MINUTES') {
                     bat '''
                    set TEMP=%WORKSPACE%
                    set TMP=%TEMP%
                    
                    %PYTHONPATH%python.exe ago-group-update.py -user %agouser% -pwd %agopassword% -group %group%
                '''
            }
        }
    } 
    
    } catch (e) {
        currentBuild.result = "FAILED"
        notifyFailed()
        throw e
    }
}

def notifyFailed() {
    emailext (
        subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
        body: """<html><body><p>FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]':</p>
            <p>Check console output at "<a href="${env.BUILD_URL}">${env.JOB_NAME} [${env.BUILD_NUMBER}]</a>"</p></html></body>""",
        to: 'datamaps@gov.bc.ca'
    )
}