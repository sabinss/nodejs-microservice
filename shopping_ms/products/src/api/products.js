const ProductService = require("../services/product-service")
const UserAuth = require("./middlewares/auth")
const { PublishMessage } = require("../utils")
const { CUSTOMER_SERVICE, SHOPPING_SERVICE } = require("../config")
// const { PublishCustomerEvent, PublishShoppingEvent } = require("../utils")

module.exports = (app, channel) => {
  const service = new ProductService()
  // const customerService = new CustomerService();

  app.post("/product/create", async (req, res, next) => {
    try {
      const { name, desc, type, unit, price, available, suplier, banner } =
        req.body
      // validation
      const { data } = await service.CreateProduct({
        name,
        desc,
        type,
        unit,
        price,
        available,
        suplier,
        banner
      })
      return res.json(data)
    } catch (err) {
      next(err)
    }
  })

  app.get("/category/:type", async (req, res, next) => {
    const type = req.params.type

    try {
      const { data } = await service.GetProductsByCategory(type)
      return res.status(200).json(data)
    } catch (err) {
      next(err)
    }
  })

  app.get("/:id", async (req, res, next) => {
    const productId = req.params.id

    try {
      const { data } = await service.GetProductDescription(productId)
      return res.status(200).json(data)
    } catch (err) {
      next(err)
    }
  })

  app.post("/ids", async (req, res, next) => {
    try {
      const { ids } = req.body
      const products = await service.GetSelectedProducts(ids)
      return res.status(200).json(products)
    } catch (err) {
      next(err)
    }
  })

  app.put("/wishlist", async (req, res, next) => {
    const { _id } = req.user || "63bd2519e16f264e029e5f70"
    //get payload to send cutomer service
    try {
      // const product = await service.GetProductById(req.body._id)
      // const wishList = await customerService.AddToWishlist(_id, product)
      const { data } = await service.GetProductPayload(
        _id,
        { productId: req.body._id },
        "ADD_TO_WISHLIST"
      )
      // PublishCustomerEvent(data)
      PublishMessage(
        channel,
        CUSTOMER_SERVICE,
        JSON.stringify({
          _id: "63bd259b0976fb4c61755802",
          name: "Olive Oil",
          desc: "great Quality of Oil",
          type: "oils",
          unit: 1,
          price: 400,
          available: true,
          suplier: "Golden seed firming",
          banner: "http://codergogoi.com/youtube/images/oliveoil.jpg",
          __v: 0
        })
      )
      return res.status(200).json(data.data)
    } catch (err) {}
  })

  app.delete("/wishlist/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user
    const productId = req.params.id

    try {
      const { data } = await service.GetProductPayload(
        _id,
        { productId: productId },
        "REMOVE_FROM_WISHLIST"
      )
      // PublishCustomerEvent(data)
      PublishMessage(channel, CUSTOMER_SERVICE, JSON.stringify(data))
      return res.status(200).json(data.data.product)
    } catch (err) {
      next(err)
    }
  })

  app.put("/cart", async (req, res, next) => {
    const { _id, qty } = req.body

    try {
      // const product = await service.GetProductById(_id)
      const { data } = await service.GetProductPayload(
        _id,
        { productId: req.body._id, qty: req.body.qty },
        "ADD_TO_CART"
      )
      // PublishCustomerEvent(data)
      PublishMessage(channel, CUSTOMER_SERVICE, JSON.stringify(data))
      // PublishShoppingEvent(data)
      PublishMessage(channel, SHOPPING_SERVICE, JSON.stringify(data))
      return res.status(200).json({
        product: data.data.product
      })
    } catch (err) {
      next(err)
    }
  })

  app.delete("/cart/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user

    try {
      // const product = await service.GetProductById(req.params.id)
      // const result = await customerService.ManageCart(_id, product, 0, true)
      const { data } = await service.GetProductPayload(
        _id,
        { productId: req.params.id },
        "REMOVE_FROM_CART"
      )
      PublishCustomerEvent(data)
      PublishShoppingEvent(data)
      const response = {
        product: data.data.product,
        unit: data.data.qty
      }
      return res.status(200).json(response)
    } catch (err) {
      next(err)
    }
  })

  //get Top products and category
  app.get("/", async (req, res, next) => {
    //check validation
    try {
      const { data } = await service.GetProducts()
      return res.status(200).json(data)
    } catch (error) {
      next(err)
    }
  })
}
