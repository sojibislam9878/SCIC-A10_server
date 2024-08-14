const express = require('express');

const app = express()
const port = process.env.PORT || 3000

app.get("/", (req, res)=>{
    res.send("This server is runing")
})

app.listen(port, ()=>{
    console.log(`this server is runing on port no: ${port}`)
})