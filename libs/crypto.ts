import { returnSecret } from './aws';
import { db, scan, get } from './database'
import NodeRSA from "node-rsa"
const crypto = require('crypto')
const { ethers } = require('ethers')

const encrypt = ((val, password) => {
    return new Promise<any>(async response => {
        let iv = crypto.randomBytes(8).toString('hex')
        let pwd = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
        let cipher = crypto.createCipheriv('aes-256-cbc', pwd, iv)
        let encrypted = cipher.update(val, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        response(iv.toString('hex') + '*' + encrypted)
    })
})

const decrypt = ((encrypted, password) => {
    return new Promise<any>(async response => {
        try {
            let parts = encrypted.split('*')
            let pwd = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
            let decipher = crypto.createDecipheriv('aes-256-cbc', pwd, parts[0])
            let decrypted = decipher.update(parts[1], 'hex', 'utf8')
            response(decrypted + decipher.final('utf8'))
        } catch (e) {
            response(false)
        }
    })
})

const hash = ((text) => {
    let buf = Buffer.from(text)
    var sha = crypto.createHash('sha256').update(buf).digest()
    return sha.toString('hex')
})

const verify = (message, signature) => {
    return new Promise(async response => {
        const verified = await ethers.utils.verifyMessage(message, signature)
        response(verified)
    })
}

const coldEncrypt = (data) => {
    return new Promise(async response => {
        try {
            const keyData = await returnSecret("pub_rsa")
            const key = new NodeRSA(keyData);
            const encrypted = key.encrypt(data, 'base64');
            response(encrypted)
        } catch (e) {
            console.log("Encryption errored:", e.message)
            response(false)
        }
    })
}

const unlockWallet = (identifier, password) => {
    return new Promise(async response => {
        let checkUser = <any>null
        if (identifier.indexOf("@") === -1 && identifier.indexOf("+") === -1) {
            checkUser = await get(db.wallets, { walletId: identifier })
        } else if (identifier.indexOf("@") !== -1) {
            checkUser = await scan(db.wallets, "email = :e", { ":e": identifier })
        } else if (identifier.indexOf("+") !== -1) {
            checkUser = await scan(db.wallets, "mobile = :m", { ":m": identifier })
        }

        if (checkUser !== null && checkUser !== false && checkUser.walletId !== undefined) {
            const mnemonic = await decrypt(checkUser.encrypted, password);
            if (mnemonic !== false) {
                const wallet = await new ethers.Wallet.fromMnemonic(mnemonic)
                if (wallet.mnemonic?.phrase !== undefined) {
                    response({ error: false, wallet, mnemonic, user: checkUser.walletId })
                } else {
                    response({ error: true, reason: "WRONG_PASSWORD" })
                }
            } else {
                response({ error: true, reason: "WRONG_PASSWORD" })
            }
        } else {
            response({ error: true, reason: "NOT_FOUND" })
        }
    })
}

export { encrypt, decrypt, hash, verify, coldEncrypt, unlockWallet }