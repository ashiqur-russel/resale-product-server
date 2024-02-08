const express = require("express");
const cors = require("cors");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.removeListener.PORT || process.env.PORT;
const app = express();

//middleare
app.use(cors());
app.use(express.json());
function verifyJWT(req, res, next) {
  try {
    const authHeader = req.headers;
    console.log("Auth Header==", authHeader);
    if (!authHeader) {
      return res.status(401).send("unauthorized access");
    }

    const token = authHeader.split(" ")[1];
    console.log("Token verify fznction==", token);
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "forbidden access" });
      }
      req.decoded = decoded;
    });
    next();
  } catch (err) {
    console.log(err);
  }
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.irpitar.mongodb.net/?retryWrites=true&w=majority`;

if(uri){
  console.log('database connected')
}


const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.get("/", async (req, res) => {
  res.send({
    status: "200",
    message: "Auto-Haus Server !",
    version: "1.0.0",
    author: "ashiqur russel",
  });
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
    const bookingsCollection = client
      .db("resale-products")
      .collection("bookings");
    const advertiseCollection = client
      .db("resale-products")
      .collection("advertise");
    const paymentsCollection = client
      .db("resale-products")
      .collection("payments");

    // Save user email & generate JWT
    app.put("/user/:email", async (req, res) => {
      console.log("inside '/user/:email");
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      console.log("## updateDoc ## ", updateDoc);
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      console.log("## result ## ", result);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      console.log("generate token", token);
      res.send({ result, token });
    });
    //
    // Save user email & generate JWT
    app.put("/users/:email", async (req, res) => {
      console.log("inside pu users");
      const email = req.params.email;
      const user = req.body;
      console.log("req###", email);
      const filter = { email: email };
      const newFilter = { sellerEmail: email };
      const options = { upsert: true };

      const updatedDocp = {
        $set: {
          sellerVerified: "verified",
        },
      };
      console.log("## updatedDocp ## ", updatedDocp);

      const updateProduct = await productsCollection.updateMany(
        filter,
        updatedDocp,
        options
      );

      console.log("## updateProduct ## ", updateProduct);
      const updateaddveritse = await advertiseCollection.updateMany(
        newFilter,
        updatedDocp,
        options
      );
      console.log("## updateaddveritse ## ", updateaddveritse);

      const updateDoc = {
        $set: user,
      };
      console.log("## updateDoc ## ", updateDoc);

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("## result ## ", result);

      res.send(result);
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

    // delete user

    app.delete("/user", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };

      const user = await usersCollection.deleteOne(query);
      res.send(user);
    });

    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;

      //const findProdOnAdvertise = { _id: ObjectId(id) };
      if (id) {
        const query = { _id: ObjectId(id) };

        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            reported: true,
          },
        };

        const result = await productsCollection.updateOne(
          query,
          updatedDoc,
          options
        );
        res.send(result);
      }
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

    //STRIPE PAYMENT
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          currency: "usd",
          amount: amount,
          payment_method_types: ["card"],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (err) {
        console.log("Intent", err);
      }
    });

    //payment
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const productId = payment.productId;
      const productFilter = { product_id: productId };
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          isBooked: "yes",
          transactionId: payment.transactionId,
        },
      };

      const productFilterUpdate = { _id: ObjectId(productId) };

      const newUpdatedDocProduct = await productsCollection.deleteOne(
        productFilterUpdate
      );

      const deleteProductFromBooking = await advertiseCollection.deleteOne(
        productFilter
      );

      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

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
      try {
        const query = { _id: ObjectId(id) };
        const bookingObjectQuery = { productId: id };
        const advertisedObjectQuery = { product_id: id };

        console.log(id, query, bookingObjectQuery, advertisedObjectQuery);
        const bookingObjectDelete = await bookingsCollection.deleteOne(
          bookingObjectQuery
        );
        const advertisedObjectDelete = await advertiseCollection.deleteOne(
          advertisedObjectQuery
        );
        const result = productsCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
        res
          .status(201)
          .send({ status: false, message: "There is something wrong" });
      }
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

    //Get booking by id
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    // post advertise item
    app.post("/publish", async (req, res) => {
      const advertise = req.body;
      const result = await advertiseCollection.insertOne(advertise);
      res.send(result);
    });

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
