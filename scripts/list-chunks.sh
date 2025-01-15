# List root level
docker-compose exec localstack awslocal s3 ls s3://dev-consultations-audio/

# List specific consultation
docker-compose exec localstack awslocal s3 ls s3://dev-consultations-audio/consultations/

# Current structure:
//dev-consultations-audio/
//└── consultations/
//    └── {sessionId}/
//        └── chunks/
//            ├── 1.wav
//            ├── 2.wav
//            ├── 3.wav
//            └── 4.wav