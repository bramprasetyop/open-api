@Library('jenkins-semci')
import ai.stainless.jenkins.ReleaseManager
def releaseManager = new ReleaseManager(this)

def updateSource(env){
   // Put Token Gitsource
   withCredentials([usernamePassword(credentialsId: 'gitsource', usernameVariable: 'GIT_USERNAME', passwordVariable: 'GIT_PASSWORD')]){
   sh "sed -i 's|^ *ARG USERNAME=.*|ARG USERNAME=$GIT_USERNAME|' Dockerfile"
   sh "sed -i 's|^ *ARG PASSWORD=.*|ARG PASSWORD=$GIT_PASSWORD|' Dockerfile"
   sh "sed -i 's|^ *ARG ENVIRONMENT=.*|ARG ENVIRONMENT=${env}|' Dockerfile" 
   }
}

def dockerBuild(version){
   sh "docker version"
   echo "$version" // check apakah inputannya benar
   withCredentials([usernamePassword(credentialsId: 'DOCKER', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
   sh "docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD"
   sh "docker build --no-cache=true -t $version ."
   sh "docker push $version"
   sh "docker image list"
   }
}

def toDeploy(p1, p2, p3, p4, p5){
   echo "$p1" // credentialsId
   echo "$p2" // host
   echo "$p3" // nama job
   echo "$p4" // nama image 
   echo "$p5" // file docker-composenya, contoh: docker-compose.sit.yaml
   withCredentials([usernamePassword(credentialsId: "$p1", usernameVariable: 'SSH_USERNAME', passwordVariable: 'SSH_PASSWORD')]) {
         script{

         def remote = [:]
         remote.name = "$p1"
         remote.host = "$p2"
         remote.user = SSH_USERNAME
         remote.password = SSH_PASSWORD
         remote.allowAnyHosts = true

         // Create directory
            sshCommand remote: remote, command: """
                  mkdir -p /data/${p3}
                  mkdir -p /data/${p3}/logs
                  mkdir -p /data/${p3}/src
                  mkdir -p /data/${p3}/public/uploads
            """ 

         // Put files
            sshPut remote: remote, from: "$p5", into: "/data/$p3"

         // Execute   
            sshCommand remote: remote, command: """
               cd /data/${p3}
               sed -i 's|^ *# image: docker-image:tag|    image: ${p4}|' ${p5}
               sed -i 's/^ *build:/    #build:/' ${p5}
               sed -i 's/^ *context: ./       #context: ./' ${p5}
               sed -i 's/^ *dockerfile: Dockerfile/       #dockerfile: Dockerfile/' ${p5}
               docker-compose -f ${p5} down
               docker-compose -f ${p5} pull
               docker-compose -f ${p5} up -d --build
            """    
         }
      } 
}

def telegramNotification(message) {
    sh """
    curl --location 'https://api.telegram.org/bot$teleToken/sendMessage' --form 'text="$message"' --form 'chat_id="$teleChatID"'
    """
}

pipeline{
   agent any

   environment{
      // Set Job Name
      def jobBaseName = "${env.JOB_NAME}".split('/').first()
      // Set docker image name
      def dockerImageTag = "endiazequitylife/$jobBaseName"
      def releaseVersion = releaseManager.artifactVersion()
      // Get Credentials Telegram
      teleToken = credentials('telegramToken')
      teleChatId = credentials('telegramChatId')
   }

      stages{
            stage('Clone Repo') {
               steps{
                  script{
                     try{
                        retry(3){
                        checkout scm
                        }
                     } catch (Exception e){
                        telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStage: ${env.STAGE_NAME}\nStatus : Failed")
                        error("Error Details: ${e.message}")
                     }
                  }
               }
            }

            stage('Pre-build') {
                  steps {
                     script {
                        // Telegram Message Pre Build
                        CURRENT_BUILD_NUMBER = "${currentBuild.number}"
                        GIT_MESSAGE = sh(returnStdout: true, script: "git log -n 1 --format=%s ${GIT_COMMIT}").trim()
                        GIT_AUTHOR = sh(returnStdout: true, script: "git log -n 1 --format=%ae ${GIT_COMMIT}").trim()
                        GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short ${GIT_COMMIT}").trim()
                        GIT_INFO = "Branch(Version) : ${GIT_BRANCH}\nLast Message : ${GIT_MESSAGE}\nAuthor : ${GIT_AUTHOR}\nCommit : ${GIT_COMMIT_SHORT}"
                        TEXT_BREAK = "[Jenkins]"
                        TEXT_PRE_BUILD = "${TEXT_BREAK}\nJob Name : ${JOB_NAME}\n${GIT_INFO}\nStatus : Detect new commit, pipeline start"
                        telegramNotification("$TEXT_PRE_BUILD")
                     }
                  }
            }

            stage("Static Code Analysis") {
               when{
                  branch 'dev'
               }
               steps{
                  script{
                     try{
                        retry(3){
                           def scannerHome = tool 'sonarqube-scanner';
                           withSonarQubeEnv() {
                              sh "${scannerHome}/bin/sonar-scanner"
                           }
                        }
                     } catch (Exception e){
                        telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStage: ${env.STAGE_NAME}\nStatus : Failed")
                        error("Error Details: ${e.message}")
                     }
                  }
               }
            }

            stage("Quality Gate") {
               when{
                  branch 'dev'
               }
               steps{
                  script{
                     try{
                        retry(3){
                           timeout(time: 1, unit: 'HOURS') {
                           waitForQualityGate abortPipeline: true
                           }
                        }
                     } catch (Exception e){
                        telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStage: ${env.STAGE_NAME}\nStatus : Failed")
                        error("Error Details: ${e.message}")
                     }
                  }
               }
            }

            stage("Deploy SIT") {
               when{
                  branch 'dev'
               }
               steps{
                  script{
                     try{
                         retry(3){
                           stage("Update GitSource Credentials Dockerfile"){
                              updateSource("sit")
                           }
                         }  
                        retry(3){
                           stage("Docker Build"){
                              dockerBuild("$dockerImageTag:dev")
                           }
                        }
                        retry(3){
                           stage("Execute"){
                              toDeploy("SSH_TO_MW", "sit-mw01.myequity.id", "$jobBaseName", "$dockerImageTag:dev", "docker-compose.sit.yaml"
                              )
                           }
                        }
                     } catch (Exception e){
                        telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStage: ${env.STAGE_NAME}\nStatus : Failed")
                        error("Error Details: ${e.message}")
                     }
                  }
               }
            }

            stage("Deploy UAT") {
               when{
                  branch 'dev'
               }
               steps{
                  script{
                     try{
                         retry(3){
                              echo "$dockerImageTag:$releaseVersion"
                         }  
                     } catch (Exception e){
                        telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStage: ${env.STAGE_NAME}\nStatus : Failed")
                        error("Error Details: ${e.message}")
                     }
                  }
               }
            }

            stage("Deploy PROD") {
               when{
                  branch 'master'
               }
               steps{
                  script{
                     try{
                         retry(3){
                              echo "$dockerImageTag:$releaseVersion"
                         }  
                     } catch (Exception e){
                        telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStage: ${env.STAGE_NAME}\nStatus : Failed")
                        error("Error Details: ${e.message}")
                     }
                  }
               }
            }
      }
      post {
         success {
            telegramNotification("[Jenkins]\nJob Name : ${JOB_NAME}\nBuild Number : #${env.BUILD_NUMBER}\nStatus : Success")
         }
      }   
 }