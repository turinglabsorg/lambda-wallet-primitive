import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as AWS from "aws-sdk";
require('dotenv').config()

const returnSecret = (key): any => {
    return new Promise(async response => {
        if (process.env[key] === undefined) {
            try {
                const secret_key = process.env.SECRET_PREFIX + "/" + process.env.STAGE + "/" + key
                const client = new SSMClient({ region: process.env.AWS_REGION });
                const ssm = await client.send(new GetParameterCommand({ Name: secret_key, WithDecryption: true }));
                const secret = ssm?.Parameter?.Value
                if (secret !== undefined) {
                    response(secret)
                } else {
                    console.log("Error, secret is undefined")
                    response(false)
                }
            } catch (e) {
                console.log("Decryption error:", e)
                response(false)
            }
        } else {
            response(process.env[key])
        }
    })
}

const backupToS3 = (key, id): any => {
    return new Promise(async response => {
        try {
            const accessKeyId = await returnSecret("accessKeyId")
            const secretAccessKey = await returnSecret("secretAccessKey")
            const bucket_region = await returnSecret("bucket_region")
            const bucket_name = await returnSecret("bucket_name")
            const S3 = new AWS.S3({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                region: bucket_region
            });
            await S3.upload({
                ContentType: "plain/text",
                Body: key,
                Bucket: bucket_name,
                Key: id
            }).promise()
            response(true)
        } catch (e) {
            console.log("Upload error:", e.message)
            response(false)
        }
    })
}

export { returnSecret, backupToS3 }