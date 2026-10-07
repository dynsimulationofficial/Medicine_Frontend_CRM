pipeline {
    agent any

    environment {
        IMAGE = 'ghcr.io/wasiquekh/medicine-frontend-production'
        IMAGE_TAG = 'latest'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Medicine Frontend production...'

                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Medicine Frontend Docker image...'

                sh '''
                    docker build \
                      -t ${IMAGE}:${IMAGE_TAG} \
                      .
                '''
            }
        }

        stage('Login to GHCR') {
            steps {
                echo 'Logging into GitHub Container Registry...'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dynsimulation-offical-frontend-production',
                        usernameVariable: 'GHCR_USERNAME',
                        passwordVariable: 'GHCR_TOKEN'
                    )
                ]) {

                    sh '''
                        echo "$GHCR_TOKEN" | docker login ghcr.io \
                          -u "$GHCR_USERNAME" \
                          --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'Pushing Medicine Frontend image to GHCR...'

                sh '''
                    docker push ${IMAGE}:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy to Medicine Production') {
            steps {
                echo 'Deploying to 13.140.167.174...'

                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ssh-medicine-production',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {

                    sh '''
                        chmod 600 "$SSH_KEY"

                        ssh \
                          -i "$SSH_KEY" \
                          -o StrictHostKeyChecking=no \
                          "$SSH_USER@13.140.167.174" "
                            cd /root/Medicine_Frontend_CRM &&
                            chmod +x scripts/jenkins-deploy.sh &&
                            ./scripts/jenkins-deploy.sh
                          "
                    '''
                }
            }
        }
    }

    post {

        success {
            echo 'Medicine Frontend production deployment successful!'
        }

        failure {
            echo 'Medicine Frontend production deployment failed!'
        }

        always {
            sh '''
                docker logout ghcr.io || true
            '''
        }
    }
}