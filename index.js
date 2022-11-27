const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("auth", authHeader);
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const usersCollection = client.db("resale-products").collection("users");
    const productsCollection = client
      .db("resale-products")
      .collection("products");
    const carCategoriesCollection = client
      .db("resale-products")
      .collection("categories");
    const bookingsCollection = client
      .db("resale-products")
      .collection("bookings");
    const advertiseCollection = client
      .db("resale-products")
      .collection("advertise");

    // Save user email & generate JWT
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      console.log("user", user);
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
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    //get All user
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const user = await usersCollection.find(query).toArray();
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
      const query = { name: name };
      const categories = await productsCollection.find(query).toArray();
      res.send(categories);
    });

    //get all products
    /*  app.get("/products ", async (req, res) => {
      const name = req.query.name;
      console.log(name);
      const query = { name: name };
      const result = await productsCollection.find(query).toArray();

      res.send(result);
    }); */

    //getAllProducts by email
    app.get("/products", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = {
          email: email,
        };
      }
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    //myproducts
    app.get("/my-products", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const saveProduct = req.body;
      const result = await productsCollection.insertOne(saveProduct);
      res.send(result);
    });

    //delete product
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = productsCollection.deleteOne(query);
      res.send(result);
    });

    //set bookings
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //get bookings
    app.get("/bookings", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = { buyerEmail: email };
      }
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // post advertise item
    app.post("/publish", async (req, res) => {
      const advertise = req.body;
      const result = await advertiseCollection.insertOne(advertise);
      res.send(result);
    });

    /*     app.put("/publish/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const data = req.body;
        console.log("data", data);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: data,
        };
        const result = await productsCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        console.log("result", result);

        res.send(result);
      } catch (err) {
        console.log(err);
      }
    }); */

    app.put("/publish/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            advertised: "yes",
          },
        };
        const result = await productsCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    //get Advertised product
    app.get("/addvertise", async (req, res) => {
      const query = {};
      const result = await advertiseCollection.find(query).toArray();
      res.send(result);
    });

    //Get advertised item

    app.get("/advertiseditem/:prodid", async (req, res) => {
      const id = req.params.prodid;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    console.log("DB Connected");
  } finally {
  }
}

run().catch(console.log());

app.listen(port, () => console.log(` Portal running on ${port}`));
