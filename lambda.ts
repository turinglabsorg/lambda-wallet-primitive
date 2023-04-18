import express = require("express")
import { db, get, put, scan, update } from './libs/database'
import { coldEncrypt, encrypt, unlockWallet } from './libs/crypto'
import { backupToS3, returnSecret } from "./libs/aws"
import { ethers } from "ethers"
import { v4 as uuidv4 } from 'uuid'

const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');

// Init express server
const app = express();
app.use(cors());
app.use(express.json());

// Default response
app.post("/create", async function (req, res) {
  if (req.body.email !== undefined && req.body.password !== undefined) {
    // Checking password strength
    let uuid = req.body.uuid
    if (uuid === undefined) {
      uuid = uuidv4()
    }
    const checkUser = await scan(db.wallets, "email = :e", { ":e": req.body.email })
    if (checkUser === null) {
      // Create new key
      console.log("Generating new key pair..")
      const wallet = await ethers.Wallet.createRandom();
      const user_encrypted = await encrypt(wallet.mnemonic?.phrase, req.body.password)
      console.log("Encrypted key is:", user_encrypted)
      // Do S3 Backup if needed
      const doBackup = await returnSecret("doBackupOnS3")
      if (doBackup === "true") {
        console.log("Encrypting with cold keys..")
        const platform_encrypted = await coldEncrypt(wallet.mnemonic)
        if (platform_encrypted !== false) {
          console.log("Uploading to S3..")
          await backupToS3(platform_encrypted, uuid)
        }
      }
      console.log("Creating record in database..")
      const addresses = {
        eth: wallet.address
      }
      const inserted = await put(db.wallets, {
        walletId: uuid,
        email: req.body.email,
        addresses,
        encrypted: user_encrypted
      })
      if (inserted !== false) {
        res.send({ message: "Wallet generated correctly", uuid, addresses, error: false })
      } else {
        res.send({ message: "Service errored", error: true })
      }
    } else {
      res.send({ message: "User exists yet", uuid: checkUser.walletId, error: true })
    }
  } else {
    res.send({ message: "Malformed request", error: true })
  }
})

app.post("/unlock", async function (req, res) {
  if (req.body.email !== undefined && req.body.password !== undefined) {
    const unlock = <any>await unlockWallet(req.body.email, req.body.password)
    if (unlock !== false && unlock.error === false) {
      res.send({ message: "Export process completed", private_keys: { eth: unlock.wallet?.privateKey }, error: false })
    } else {
      res.send({ message: "Can't unlock wallet", reason: unlock.reason, error: true })
    }
  } else {
    res.send({ message: "Malformed request", error: true })
  }
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
})

module.exports.handler = serverless(app)
