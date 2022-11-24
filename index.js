const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.removeListener.PORT || 8000;
const app = express();
//middleare
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.irpitar.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const usersCollection = client.db("resale-products").collection("users");
    const productsCollection = client
      .db("resale-products")
      .collection("products");
    const carCategoriesCollection = client
      .db("resale-products")
      .collection("categories");

    // Save user email & generate JWT
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      console.log(token);
      res.send({ result, token });
    });

    //get a single user by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);

      res.send(user);
    });

    //get All user
    app.get("/users", async (req, res) => {
      const query = {};
      const user = await usersCollection.find(query).toArray();
      console.log(user);

      res.send(user);
    });

    //get categories
    app.get("/categories", async (req, res) => {
      let query = {};
      const categories = await carCategoriesCollection.find(query).toArray();
      res.send(categories);
    });

    app.get("/products/:name", async (req, res) => {
      const name = req.params.name;
      console.log(name);
      const query = { name: name };
      const categories = await productsCollection.find(query).toArray();

      res.send(categories);
    });

    //get categories ba name

    console.log("DB Connected");
  } finally {
  }
}

run().catch(console.log());

app.listen(port, () => console.log(`Dpctprs Portal running on ${port}`));
