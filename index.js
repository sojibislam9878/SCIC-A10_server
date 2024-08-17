const express = require('express');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000

// middleware
app.use(express.json());
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174',"https://scic-a10.web.app"],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lb51cqq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const itemCollection = client.db("scicItemsDB").collection("allItems")
    const usersCollection = client.db("scicItemsDB").collection("allUsers")

    app.get("/allitems",async (req, res)=>{
        const result = await itemCollection.find().toArray()
        console.log(result);
        res.send(result)
        
    })

    app.get("/allitemspagination", async (req, res) => {
        try {
            const size = parseInt(req.query.size) || 10;  
            const page = parseInt(req.query.page) - 1 || 0; 
            const filter = req.query.filter;
            const brand = req.query.brand
            const sort = req.query.sort;
            const sort2 = req.query.sort2;
            const search = req.query.search || "";
    console.log(brand,filter);
    
            // Build the query object
            let query = {};
            if (search) {
                query.name = { $regex: search, $options: "i" };
            }
    
            if (filter) {
                query.category = filter;
            }
            if (brand) {
                query.brand = brand;
            }
    
            let sortCriteria = {};
    
            if (sort === "low") {
                sortCriteria.numberPrice = 1; 
            } else if (sort === "high") {
                sortCriteria.numberPrice = -1; 
            }
    
            if (sort2 === "newest") {
                sortCriteria.createdAt = -1; 
            }
    
            let processes = [
                { $match: query },
                { $addFields: { numberPrice: { $toDouble: "$price" } } },
            ];
    
            if (Object.keys(sortCriteria).length > 0) {
                processes.push({ $sort: sortCriteria });
            }
    
            processes.push(
                { $project: { numberPrice: 0 } }, 
                { $skip: size * page }, 
                { $limit: size } 
            );
            
    
            const result = await itemCollection.aggregate(processes).toArray();
            res.send(result);
            
    
        } catch (error) {
            console.error("Error fetching items:", error);
            res.status(500).send({ error: "An error occurred while fetching items." });
        }
    });

    app.get("/itemscounts", async (req, res) => {
        try {
            const { filter, search,brand } = req.query;
    
            let query = {};
    
            if (search) {
                query.name = { $regex: search, $options: "i" };
            }
    
            if (filter) {
                query.category = filter;
            }

            if (brand) {
              query.brand = brand;
          }
    
            const count = await itemCollection.countDocuments(query);
    
            res.send({ count });
        } catch (error) {
            console.error("Error counting items:", error);
            res.status(500).send({ error: "An error occurred while counting items." });
        }
    });



      app.put("/users", async (req, res)=>{
        const user = req.body
        
        const isExist =await usersCollection.findOne({email:user?.email})
        if (isExist) {
          return
        }
        const options = {upsert: true}
        const query = {email: user?.email}
        const updateDocs = {
          $set:{
            ...user,
          }
        }
        const result =await usersCollection.updateOne(query, updateDocs, options)
        res.send(result)
      })


      // find user with email
    app.get("/user/:email" ,  async (req, res)=>{
      const email = req.params.email
      const result = await usersCollection.findOne({email})
      res.send(result)
    })




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