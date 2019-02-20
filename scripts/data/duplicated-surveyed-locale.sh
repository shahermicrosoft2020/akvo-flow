#!/bin/sh

# USAGE: ./duplicated-surveyed-locale.sh akvoflowsandbox

APP_ID=$1
SERVICE_ACCOUNT="sa-$APP_ID@$APP_ID.iam.gserviceaccount.com"
P12_FILE_PATH="/path/to/akvo-repositories/akvo-flow-server-config/$1/$1.p12"

java -cp bin:"lib/*" \
     org.akvo.gae.remoteapi.RemoteAPI \
     DuplicateSdurveyedLocale \
     $APP_ID \
     $SERVICE_ACCOUNT \
     $P12_FILE_PATH
