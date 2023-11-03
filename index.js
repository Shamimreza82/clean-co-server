const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')

const port = process.env.PORT || 5000; 


// meddileware
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:5174' ], 
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())


// clean-co-live
// 1GIiKkqORfGsz3g5




const uri = "mongodb+srv://clean-co-live:1GIiKkqORfGsz3g5@cluster0.gsuauby.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


  // middelware 

  const veryfiToken = (req, res, next) => {
      const token = req.cookies.token
      console.log(token);
      if(!token){
        return res.send({message: "unauthorize"})
      }
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
          if(err){
           return res.send({message: "unauthorize"})
          }  

          req.user = decoded 
          next()
      })


  }


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('servicesDB').collection('services')
    const bookingCollection = client.db('servicesDB').collection('booking')


    //auth
    app.post('/api/v1/auth/access-token', (req, res) => {
        const user = req.body; 
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: "1h"})
       

        res
        .cookie("token", token, {
          httpOnly: true,
          secure: false, 
        })
        .send({success: true})
    })

      // api 
    app.get('/api/v1/services', async (req, res) => {
        const cursor = serviceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })


    app.get('/api/v1/checkout/:id', async (req, res)=> {
        const id = req.params.id
        console.log(id);
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query)
        res.send(result)
      
    })

    app.post('/api/v1/user/create-booking', veryfiToken, async (req, res) => {
          const booking = req.body; 
          const user = req.user.email
          const authUser = req.body.email

          if(user !== authUser){
            return res.send({message: "Email dose not match"})
          }
          const result = await bookingCollection.insertOne(booking); 
          console.log(authUser);
          res.send(result)
    })

    app.delete('/api/v1/user/cancel-booking/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })

   


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Clean co server listening on port ${port}`)
}) 