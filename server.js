require('dotenv').config(); 
const express = require('express'); // [cite: 84]
const cors = require('cors'); // [cite: 85]
const { MongoClient } = require('mongodb'); // [cite: 559]

const app = express(); // [cite: 86]
app.use(cors()); // [cite: 87]
app.use(express.json()); // [cite: 88]

// Pull the connection string from your .env file
const url = process.env.MONGODB_URI;
const client = new MongoClient(url); // [cite: 561]

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect(); // [cite: 562]
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("MongoDB Connection Error:", e);
  }
}
connectDB();

// Login API 
app.post('/api/login', async (req, res) => { // [cite: 564]
  let error = ''; // [cite: 568]
  const { login, password } = req.body; // [cite: 569]
  
  try {
    const db = client.db('COP4331Cards'); // [cite: 570]
    const results = await db.collection('Users').find({ Login: login, Password: password }).toArray(); // [cite: 571]
    
    let id = -1; // [cite: 572]
    let fn = ''; // [cite: 573]
    let ln = ''; // [cite: 574]
    
    if (results.length > 0) { // [cite: 575]
      id = results[0].UserID; // [cite: 577]
      fn = results[0].FirstName; // [cite: 578]
      ln = results[0].LastName; // [cite: 579]
    } else {
      error = 'Invalid user name/password'; // [cite: 429]
    }
    
    res.status(200).json({ id, firstName: fn, lastName: ln, error }); // [cite: 582]
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Add Card API 
app.post('/api/addcard', async (req, res) => { // [cite: 602]
  const { userId, card } = req.body; // [cite: 606]
  const newCard = { Card: card, UserId: userId }; // [cite: 607]
  let error = ''; // [cite: 608]
  
  try {
    const db = client.db('COP4331Cards'); // [cite: 611]
    await db.collection('Cards').insertOne(newCard); // [cite: 612]
  } catch (e) {
    error = e.toString(); // [cite: 616]
  }
  
  res.status(200).json({ error }); // [cite: 620]
});

// Search Cards API 
app.post('/api/searchcards', async (req, res) => { // [cite: 623]
  let error = ''; // [cite: 627]
  const { userId, search } = req.body; // [cite: 628]
  const _search = search.trim(); // [cite: 629]
  
  try {
    const db = client.db('COP4331Cards'); // [cite: 630]
    const results = await db.collection('Cards').find({ "Card": { $regex: _search + '.*', $options: 'i' } }).toArray(); // [cite: 631]
    
    const _ret = results.map(item => item.Card);
    res.status(200).json({ results: _ret, error }); // [cite: 638]
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

// Start Server
app.listen(5000, () => {
  console.log('Server running on port 5000'); // [cite: 102]
});