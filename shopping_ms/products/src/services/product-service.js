const { ProductRepository } = require("../database")
const { FormateData } = require("../utils")
const { APIError } = require("../utils/app-errors")

// All Business logic will be here
class ProductService {
  constructor() {
    this.repository = new ProductRepository()
  }

  async CreateProduct(productInputs) {
    try {
      const productResult = await this.repository.CreateProduct(productInputs)
      return FormateData(productResult)
    } catch (err) {
      throw new APIError("Data Not found")
    }
  }

  async GetProducts() {
    try {
      const products = await this.repository.Products()

      let categories = {}

      products.map(({ type }) => {
        categories[type] = type
      })

      return FormateData({
        products,
        categories: Object.keys(categories)
      })
    } catch (err) {
      throw new APIError("Data Not found")
    }
  }

  async GetProductDescription(productId) {
    try {
      const product = await this.repository.FindById(productId)
      return FormateData(product)
    } catch (err) {
      throw new APIError("Data Not found")
    }
  }

  async GetProductsByCategory(category) {
    try {
      const products = await this.repository.FindByCategory(category)
      return FormateData(products)
    } catch (err) {
      throw new APIError("Data Not found")
    }
  }

  async GetSelectedProducts(selectedIds) {
    try {
      const products = await this.repository.FindSelectedProducts(selectedIds)
      return FormateData(products)
    } catch (err) {
      throw new APIError("Data Not found")
    }
  }

  async GetProductById(productId) {
    try {
      return await this.repository.FindById(productId)
    } catch (err) {
      throw new APIError("Data Not found")
    }
  }

  async GetProductPayload(userId, { productId, qty }, event) {
    const product = this.repository.FindById(productId)
    if (product) {
      const payload = {
        event,
        data: { userId, product, qty }
      }

      return FormateData(payload)
    } else {
      return FormateData({ error: "No product Available" })
    }
  }

  async SubscribeEvents(payload) {
    payload = JSON.parse(payload)
    const { event, data } = payload

    const { userId, product, order, qty } = data

    switch (event) {
      case "ADD_TO_WISHLIST":
      case "REMOVE_FROM_WISHLIST":
        this.AddToWishlist(userId, product)
        break
      case "ADD_TO_CART":
        this.ManageCart(userId, product, qty, false)
        break
      case "REMOVE_FROM_CART":
        this.ManageCart(userId, product, qty, true)
        break
      case "CREATE_ORDER":
        this.ManageOrder(userId, order)
        break
      case "TESTING":
        console.log("Test subscriber working")
        break
      default:
        break
    }
  }
}

module.exports = ProductService
