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

    app.get("/allitemspagination", async (req, res) => {
      try {
          const size = parseInt(req.query.size) || 10;  // Set default size to 10 if not provided
          const page = parseInt(req.query.page) - 1 || 0; // Default to page 1 (index 0)
          const filter = req.query.filter;
          const sort = req.query.sort;
          const search = req.query.search || ""; // Default to an empty string if search is not provided
  
          // Build the query object
          let query = {};
          if (search) {
              query.name = { $regex: search, $options: "i" };
          }
  
          if (filter) {
              query.category = filter;
          }
  
          // Build the aggregation pipeline
          let processes = [
              { $match: query },
              { $addFields: { numberPrice: { $toDouble: "$price" } } },
              { $sort: { numberPrice: sort === "low" ? 1 : -1 } }, // Sort by price, low to high or high to low
              { $project: { numberPrice: 0 } }, // Exclude the temporary 'numberPrice' field from the result
              { $skip: size * page }, // Skip documents for pagination
              { $limit: size }, // Limit the number of documents returned
          ];
  
          // Execute the aggregation pipeline
          const result = await itemCollection.aggregate(processes).toArray();
          res.send(result);
  
      } catch (error) {
          console.error("Error fetching items:", error);
          res.status(500).send({ error: "An error occurred while fetching items." });
      }
  });

    app.get("/itemscounts", async (req, res) => {
        try {
            const { filter, search } = req.query;
    
            // Create the base query object
            let query = {};
    
            // If search is provided, add it to the query with case-insensitive regex
            if (search) {
                query.name = { $regex: search, $options: "i" };
            }
    
            // If filter is provided, add it to the query
            if (filter) {
                query.category = filter;
            }
    
            // Count the documents matching the query
            const count = await itemCollection.countDocuments(query);
    
            // Send the count as a response
            res.send({ count });
        } catch (error) {
            console.error("Error counting items:", error);
            res.status(500).send({ error: "An error occurred while counting items." });
        }
    });



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