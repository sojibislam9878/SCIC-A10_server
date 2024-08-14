const express = require('express');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174',],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lb51cqq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
    const itemCollection = client.db("scicItemsDB").collection("allItems")

    app.get("/allitems",async (req, res)=>{
        const result = await itemCollection.find().toArray()
        console.log(result);
        res.send(result)
        
    })

    app.get("/itemscounts", async(req, res)=>{
        const filter = req.query.filter;
        const search = req.query.search;
  
        let query = {
          food_name: { $regex: search, $options: "i" },
        };
        if (filter) {
          query.food_category = filter;
        }
        const count = await foodsCollection.countDocuments(query);
        res.send({ count });
      });
  
      // gallerycolleciton functions
      app.get("/gallery", async (req, res) => {
        const cursor = galleryCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });
  
      app.post("/gallery", async (req, res) => {
        const newGallery = req.body;
        const result = await galleryCollection.insertOne(newGallery);
        res.send(result);
    })



    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res)=>{
    res.send("This server is runing")
})

app.listen(port, ()=>{
    console.log(`this server is runing on port no: ${port}`)
})