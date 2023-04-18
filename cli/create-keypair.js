const NodeRSA = require('node-rsa');

async function main() {
    const key = new NodeRSA({ b: 2048 })
    console.log("Public: " + key.exportKey("public"))
    console.log("Private: " + key.exportKey("private"))
}

main()