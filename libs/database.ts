import { DynamoDB, Response } from 'aws-sdk'
const dynamoDbClientParams = {};
if (process.env.IS_OFFLINE) {
    dynamoDbClientParams['region'] = 'localhost'
    dynamoDbClientParams['endpoint'] = 'http://localhost:8000'
}
const dynamoDbClient = new DynamoDB.DocumentClient(dynamoDbClientParams);
const db = {
    wallets: process.env.STAGE + "_WalletsTable",
    transactions: process.env.STAGE + "_TransactionsTable",
    faucet: process.env.STAGE + "_FaucetTable"
}
const put = (table, item): any => {
    return new Promise(async response => {
        try {
            await dynamoDbClient.put({
                TableName: table,
                Item: item,
            }).promise();
            response(true)
        } catch (err) {
            console.log("INSERT ERROR")
            console.log({
                TableName: table,
                Item: item,
            })
            console.log('--')
            console.log(err)
            response(false)
        }
    })
}

const update = (table, key, expression, values): any => {
    return new Promise(async response => {
        try {
            const updated = await dynamoDbClient.update({
                TableName: table,
                Key: key,
                UpdateExpression: expression,
                ExpressionAttributeValues: values,
                ReturnValues: "UPDATED_NEW"
            }).promise()
            response(updated)
        } catch (err) {
            console.log(err)
            response(false)
        }
    })
}

const get = (table, key): any => {
    return new Promise(async response => {
        try {
            const { Item } = await dynamoDbClient.get({
                TableName: table,
                Key: key,
            }).promise();
            response(Item)
        } catch (err) {
            console.log("GET ERROR")
            console.log({
                TableName: table,
                Key: key,
            })
            console.log("--")
            console.log(err)
            response(false)
        }
    })
}

const scan = (table, query?, params?, forceArray?): any => {
    return new Promise(response => {
        try {
            let scanOptions = {
                TableName: table
            }
            // Check if query is defined and is not empty
            if (query !== undefined && query.length > 0) {
                scanOptions['FilterExpression'] = query
            }
            // Check if params are defined and there are keys inside
            if (params !== undefined && Object.keys(params).length > 0) {
                scanOptions['ExpressionAttributeValues'] = params
            }
            dynamoDbClient.scan(scanOptions, function (err, data) {
                if (err) {
                    console.log("SCAN ERROR")
                    console.log(scanOptions)
                    console.log("--")
                    console.log(err)
                    response(false);
                } else {
                    if (forceArray === undefined || (forceArray !== undefined && forceArray === false)) {
                        if (data.Items !== undefined && data.Items.length > 1) {
                            response(data.Items)
                        } else if (data.Items !== undefined && data.Items.length === 1) {
                            response(data.Items[0])
                        } else if (data.Items !== undefined && data.Items.length === 0) {
                            response(null)
                        }
                    } else {
                        response(data.Items)
                    }
                }
            })
        } catch (err) {
            console.log(err);
            response(false);
        }
    })
}

const remove = (table, key): any => {
    return new Promise(async response => {
        try {
            const deleted = await dynamoDbClient.delete({
                TableName: table,
                Key: key,
            }).promise();
            response(deleted)
        } catch (err) {
            console.log("GET ERROR")
            console.log({
                TableName: table,
                Key: key,
            })
            console.log("--")
            console.log(err)
            response(false)
        }
    })
}

export { scan, get, update, put, remove, db }