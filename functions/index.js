require('dotenv').config()
const csv=require('csv-parser')
const fuse=require('fuse.js')
const fs=require('fs')
const info=[]
const functions = require('firebase-functions');
const admin=require('firebase-admin')
const express=require('express')
const cors=require('cors')
const app=express()
app.use(cors({origin: true}))

//Secret Stuff
const serviceAccount = require("./serviceKey.json");
console.log(process.env.DATABASE_URL)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});
const db=admin.database()

//Get requests: Just english for now (/en/name)
app.get('/', (req, res)=>{
  return res.status(200).send("Hello World!")
})

app.get('/en/yokai/:name', async (req, res)=>{
  try{
    let searchName=req.params.name.replace(/[^0-9a-z]/gi, '').toLowerCase()
    const ref=db.ref("en/yokai")
    let docInfo
    await ref.once('value', snapshot=>{
      docInfo=snapshot
    })
    let array=[]
    for(let name in docInfo.toJSON())
      array.push({name, ...docInfo.toJSON()[name]})
    const options = {
      includeScore: false,
      keys: ['name']
    }
    const fuseRes = new fuse(array, options)
    const result = fuseRes.search(searchName)
    return res.status(200).send(result[0])
  }catch(err){
    return res.status(400).send("Bad request")
  }
})

app.get('/en/yokai', async(req,res)=>{
  try{
    const ref=db.ref('en/yokai')
    let docInfo
    await ref.once('value', snapshot=>{
      docInfo=snapshot
    })
    return res.status(200).send(docInfo)
  }catch(err){
    return res.status(500).send(err)
  }
})
//Upload new yokai info
app.post('/create', async(req, res)=>{
    try{
      //The password isn't password
      if(req.body.password===process.env.PASSWORD){
        const ref=db.ref("en/yokai/"+req.body.name.toLowerCase())
        //Null if a below field not applicable
        await ref.set({
          tribe: req.body.tribe,
          rank: req.body.rank,
          //Stats are at max level
          hp: req.body.hp,
          atk: req.body.attack,
          //Takes two fields, type and power (desc)
          soult: req.body.soult,
          //Desc and power
          skill: req.body.skill,
          //Yes or no
          gsoult: req.body.g,
          //Link to image of puni
          img: req.body.img,
          series: req.body.series,
          actualName: req.body.name
        })
        return res.status(200).send("Pushed "+req.body.name)
      }
      return res.status(404).send("Incorrect Password")
    }catch(err){
      console.log(err)
      return res.status(500).send("Bad request")
    }
})


exports.app=functions.https.onRequest(app)
