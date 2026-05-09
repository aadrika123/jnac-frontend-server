pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Resolve target') {
      steps {
        script {
          def branchName = env.BRANCH_NAME ?: env.GIT_BRANCH?.replaceFirst(/^[^\/]+\//, '') ?: 'staging'
          def map = [
            staging: [server: 'aadrika@172.18.1.52',         sshCred: 'staging-deploy-key'],
            main:    [server: 'akola_production@172.18.1.51', sshCred: 'production-deploy-key'],
          ]
          def t = map[branchName]
          if (!t) { error "Branch ${branchName} is not deployable. Edit Jenkinsfile to add it." }
          env.DEPLOY_SERVER = t.server
          env.SSH_CRED      = t.sshCred
          env.BRANCH        = branchName
          echo "Deploying ${branchName} -> ${env.DEPLOY_SERVER}"
        }
      }
    }

    stage('Deploy (git pull + pm2 restart)') {
      steps {
        withCredentials([sshUserPrivateKey(credentialsId: env.SSH_CRED,
                                           keyFileVariable: 'SSH_KEY',
                                           usernameVariable: 'SSH_USER')]) {
          sh '''
            set -eu
            SSH_OPTS="-o StrictHostKeyChecking=accept-new -i $SSH_KEY"
            ssh $SSH_OPTS "${DEPLOY_SERVER}" "
              set -e
              cd ~/jnac-frontend-server
              git fetch origin ${BRANCH}
              git reset --hard origin/${BRANCH}
              npm ci --omit=dev || npm install --omit=dev
              pm2 restart jnac-frontend-server || pm2 start server.js --name jnac-frontend-server
              pm2 save
            "
          '''
        }
      }
    }
  }

  post {
    success { echo "OK: jnac-frontend-server reloaded on ${env.DEPLOY_SERVER}" }
    failure { echo "FAIL: see Console Output" }
  }
}
