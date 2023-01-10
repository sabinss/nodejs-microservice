const express = require("express")
const cors = require("cors")
const proxy = require("express-http-proxy")
const app = express()

app.use(cors())
app.use(express.json())

app.use("/customers", proxy("http://localhost:8005"))
app.use("/products", proxy("http://localhost:8003"))
app.use("/", proxy("http://localhost:8002")) //shopping

app.listen(8000, () => {
  console.log("Gateway is Listening to Port 8000")
})
