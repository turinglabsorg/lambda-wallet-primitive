# Wallet primitive with Lambda

## Local development

Assuming you have NodeJS, YARN and Docker:

```
// Install dependencies
yarn
cp .env.example .env

// Create local database
yarn db:create
yarn db:run
yarn db:migrate:wallets

// Run local lambda function
yarn dev
```

## Test

To test the API use Postman, docs are here: https://documenter.getpostman.com/view/3143294/2s93XzyNji

## Optional: Backup on AWS

Create an RSA key:
```
node cli/create-keypair
```

Then:
- Copy and save the public and private key, public key must go on `pub_rsa` parameter of `.env` file.
- Create an S3 bucket and an AWS key, then fill all required `.env` fields.
- Set `doBackupOnS3` to `true` in `.env` file

## Deploy

Deploy on serverless.com or directly AWS lambda, all the `.env` parameters must go to Parameter Store inside AWS. If you create a serverless.com application you can deploy using:

```
yarn deploy
```