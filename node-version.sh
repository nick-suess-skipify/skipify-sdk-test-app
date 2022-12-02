export NVM_DIR="/opt/circleci/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install v16.13.0 && nvm use v16.13.0 && nvm alias default v16.13.0
