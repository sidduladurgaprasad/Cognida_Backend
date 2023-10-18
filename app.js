


require("dotenv").config();
const cors = require('cors');
const express = require("express"); // Changed "exp" to "express" for clarity
const { ObjectId } = require("mongodb");
const app = express();
const axios = require("axios")
app.use(express.json()); // Used "express" instead of "exp" for better readability
app.use(cors(
    {
        origin: '*'
    }
));

const PORT = process.env.PORT || 4000;
let mclient = require("mongodb").MongoClient;

let DBurl = process.env.DBurl;

mclient.connect(DBurl)
  .then((client) => {
    let dbobj = client.db("Cognida");
    let userCollectionObj = dbobj.collection("Users");
    let bookingCollectionObj = dbobj.collection("Products");
    app.set("productsCollectionObj",bookingCollectionObj);
    app.set("userCollectionObj", userCollectionObj);
    console.log("DB connection success");
  })
  .catch((error) => {
    console.log("Error in DB connection:", error); // Added the error message for better debugging
  });

app.get("/get-user", async (request, response) => {
  let userCollectionObj = app.get("userCollectionObj");
  try {
    let users = await userCollectionObj.find().toArray();
    response.send({ message: "All users", payload: users });
  } catch (error) {
    response.status(500).send({ message: "Error retrieving users", error: error.message });
  }
});


app.post("/post-user", async (request, response) => {
  let obj = request.body;
  console.log(obj);
  let userCollectionObj = app.get("userCollectionObj");
  try {
    await userCollectionObj.insertOne(obj);
    response.send({ message: "User created successfully" });
  } catch (error) {
    response.status(500).send({ message: "Error creating user", error: error.message });
  }
});

app.get("/get-user", async (request, response) => {
  const userCollectionObj = app.get("userCollectionObj");
  const userEmail = request.query.email; // Get the email from the query parameter

  try {
    const user = await userCollectionObj.findOne({ email: userEmail });

    if (user) {
      response.send({ message: "User found", payload: user });
    } else {
      response.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    response.status(500).send({ message: "Error fetching user", error: error.message });
  }
});


app.put("/update-user/:id", async (request, response) => {
  const userCollectionObj = app.get("userCollectionObj");
  const userId = request.params.id; // Get the user ID from the URL parameter
  const updatedUserData = request.body; // The updated user data should be in the request body

  try {
    // Use `updateOne` to update the user by their ID
    const result = await userCollectionObj.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatedUserData }
    );

    if (result.modifiedCount === 1) {
      response.send({ message: "User updated successfully" });
    } else {
      response.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    response.status(500).send({ message: "Error updating user", error: error.message });
  }
});

app.post("/convert-cart-to-orders", async (request, response) => {
  const userEmail = request.body.email; // Get the user's email from the request body.

  // Retrieve the user's cart items from the database.
  const userCollectionObj = app.get("userCollectionObj");
  try {
    const user = await userCollectionObj.findOne({ email: userEmail });

    if (user) {
      const cartItems = user.cartItems;

      // Create order items based on cart items.
      const orderItems = {};
      for (const productId in cartItems) {
        orderItems[productId] = cartItems[productId];
      }

      // Save the order items to the orders field.
      await userCollectionObj.updateOne(
        { email: userEmail },
        { $set: { orders: orderItems } }
      );

      response.send({ message: 'Cart items converted to orders successfully' });
    } else {
      response.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    response.status(500).send({ message: 'Error converting cart items to orders', error: error.message });
  }
});
//to restart the online server every 14 minutes
setInterval(()=>{
  axios.get("https://cognida-backend.onrender.com/get-products").then(
    console.log("restarted")
  ).catch((err)=> console.log(err))
},60*14*1000)

app.get("/get-products", async (request, response) => {
  let bookingCollectionObj = app.get("productsCollectionObj");
  try {
    let bookings = await bookingCollectionObj.find().toArray();
    response.send({ message: "All bookings", payload: bookings });
  } catch (error) {
    response.status(500).send({ message: "Error retrieving booking data", error: error.message });
  }
}); 

app.post("/post-products", async (request, response) => {
  let obj = request.body;
  console.log(obj);
  let bookingCollectionObj = app.get("productsCollectionObj");
  try {
    await bookingCollectionObj.insertOne(obj);
    response.send({ message: "product created successfully" });
  } catch (error) {
    response.status(500).send({ message: "Error in adding products", error: error.message });
  }
});
app.delete("/delete-products/:id", async (request, response) => {
  let bookingCollectionObj = app.get("productsCollectionObj");
  let id = request.params.id; // Use request.params.id to get the ID from the URL parameter
  console.log(id);
  try {
    let bookings = await bookingCollectionObj.deleteOne({ "_id": new ObjectId(id) }); // Use new ObjectId to convert the ID to MongoDB ObjectId
    response.send({ message: "products deleted" });
  } catch (error) {
    response.status(500).send({ message: "Error in deleting products", error: error.message });
  }
});




app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
