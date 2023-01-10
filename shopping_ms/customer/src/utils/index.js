const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const amqplib = require("amqplib")
const {
  APP_SECRET,
  MSG_QUEUE_URL,
  EXCHANGE_NAME,
  QUEUE_NAME,
  CUSTOMER_SERVICE
} = require("../config")
//Utility functions
module.exports.GenerateSalt = async () => {
  return await bcrypt.genSalt()
}

module.exports.GeneratePassword = async (password, salt) => {
  return await bcrypt.hash(password, salt)
}

module.exports.ValidatePassword = async (
  enteredPassword,
  savedPassword,
  salt
) => {
  return (await this.GeneratePassword(enteredPassword, salt)) === savedPassword
}

module.exports.GenerateSignature = async (payload) => {
  try {
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30m" })
  } catch (error) {
    console.log(error)
    return error
  }
}

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization")
    console.log(signature)
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET)
    req.user = payload
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports.FormateData = (data) => {
  if (data) {
    return { data }
  } else {
    throw new Error("Data Not found!")
  }
}

// implement message broker here
//  - create channel

module.exports.CreateChannel = async () => {
  try {
    const connection = await amqplib.connect(MSG_QUEUE_URL)
    const channel = await connection.createChannel()
    // assertExhcange is a distributor which districbuting message with in queue based on some configuration
    // it distributes messages between queues based on certain binding key
    await channel.assertExchange(EXCHANGE_NAME, "direct", false)
    return channel
  } catch (err) {
    console.log(err)
    throw err
  }
}

//  - publish message

module.exports.PublishMessage = async (channel, binding_key, message) => {
  try {
    await channel.publish(channel, binding_key, Buffer.from(message))
  } catch (err) {
    throw err
  }
}

//  - subscribe messages

module.exports.SubscribeMessage = async (channel, service) => {
  try {
    const appQueue = await channel.assertQueue(QUEUE_NAME)
    channel.bindQueue(appQueue.queue, EXCHANGE_NAME, CUSTOMER_SERVICE)

    channel.consume(appQueue.queue, (msg) => {
      console.log("the message is:", msg.content.toString())
      // console.log(data.connect.toString())
      service.SubscribeMessage(msg.content.toString())
      channel.ack(msg)
    })
  } catch (err) {
    throw err
  }
}
