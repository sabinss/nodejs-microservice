const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const amqplib = require("amqplib")
const { APP_SECRET, MSG_QUEUE_URL, EXCHANGE_NAME } = require("../config")

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
    return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" })
  } catch (error) {
    console.log(error)
    return error
  }
}

module.exports.ValidateSignature = async (req) => {
  try {
    const signature = req.get("Authorization")
    // console.log(signature)
    const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET)
    console.log("payload", payload)
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

//Raise Events
module.exports.PublishCustomerEvent = async (payload) => {
  axios.post("http://localhost:8000/customer/app-events/", {
    payload
  })

  //     axios.post(`${BASE_URL}/customer/app-events/`,{
  //         payload
  //     });
}

//Raise Events
module.exports.PublishShoppingEvent = async (payload) => {
  axios.post("http://localhost:8000/shopping/app-events/", {
    payload
  })

  //     axios.post(`${BASE_URL}/customer/app-events/`,{
  //         payload
  //     });
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

module.exports.PublishMessage = (channel, service, msg) => {
  channel.publish(EXCHANGE_NAME, service, Buffer.from(msg))
  console.log("Sent: from Products", msg)
}

//  - subscribe messages

module.exports.SubscribeMessage = async (channel, service, binding_key) => {
  try {
    // console.log("EXCHANGE_NAME", EXCHANGE_NAME, binding_key)
    console.log("Subscribe message")
    const appQueue = await channel.assertQueue(QUEUE_NAME)

    channel.bindQueue(appQueue.queue, EXCHANGE_NAME, binding_key)

    channel.consume(appQueue.queue, (data) => {
      console.log("received data in PRoduct service")
      console.log(data.connect.toString())
      service.SubscribeMessage(data.connect.toString())
      channel.ack(data)
    })
  } catch (err) {
    throw err
  }
}
