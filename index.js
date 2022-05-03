require('dotenv').config();
const axios = require('axios');
const express = require('express');
const path = require('path');
const url = require('url');
const {google} = require('googleapis');
const app = express();

// Set port for ngrok
const PORT=3000; 

const MongoClient = require('mongodb').MongoClient; 
const mongoUrl = 'mongodb://127.0.0.1:27017'; 

//Connect to MongoDB To Host Testing Reservation Info Database
MongoClient.connect(mongoUrl, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}, (err, client) => { 
  if (err) { 
      return console.log(err); 
  }

  // Specify database you want to access 
  const db = client.db('testDB'); 
  console.log(`MongoDB Connected: ${mongoUrl}`); 
  
  const users = db.collection('users');

// Set GCP Project OAUTH Variables
app.use(express.static('static'));
var YOUR_CLIENT_ID = ""
var YOUR_CLIENT_SECRET = ""
var YOUR_REDIRECT_URL = ""                 // eg. "https://fddc-198-2-93-123.ngrok.io/oauth-callback"
var phoneNum;


// Initialize Oauth Client with Variables
const oauth2Client = new google.auth.OAuth2(
  YOUR_CLIENT_ID,
  YOUR_CLIENT_SECRET,
  YOUR_REDIRECT_URL
);

// Add required scopes to get User's PhoneNumber
const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile', 
  'https://www.googleapis.com/auth/user.phonenumbers.read'
];

// Generate Authorization URL
const authorizationUrl = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',
  scope: scopes,
  // Prompt the user to sign-in everytime (Good for testing purposes)
  prompt: "consent",
  // Enable incremental authorization. Recommended as a best practice.
  include_granted_scopes: true
});
//console.log(authorizationUrl)
  
  app.listen(PORT, () => console.log(`API Connected on localhost:${PORT}`)) 
  
  //-----------------------OAUTH RELATED ENDPOINTS-------------------------------------------------------------------
  

  // Returns Authorization URL. (Miniapps calls this and puts the link in an announcement)
  app.get("/authurl", (req, res) => {
    res.status(200).json({ "url" : authorizationUrl })
  });


  // After user completes sign-in they are redirected here
  app.get('/oauth-callback', async (req, res) => {
    // HTML file should auto-close. Contents isn't important otherwise
    res.sendFile(path.join(__dirname, '/static/indexredirect.html'));

    // Parse URL to Retreive Authetication Code
    let q = url.parse(req.url, true).query;
    // Exchange Auth Code for Tokens
    let { tokens } = await oauth2Client.getToken(q.code);
    
    // Use Access Token to retrieve user's phone number from Google API
    axios
    .get("https://people.googleapis.com/v1/people/me?personFields=phoneNumbers", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })
    .then(res => {
        console.log("Success")

        // Retrieve phone number from returned json and format it
        var phoneNum = res.data.phoneNumbers[0].canonicalForm
        phoneNum = phoneNum.substring(2)

        // Set phoneNumber variable (this is what /oauthnum checks for)
        app.set('phoneNumber', phoneNum)
    })
    .catch(error => {
      console.log(error)
    })
  });


  // Miniapps calls this once the user has agreed to sign in. It returns the phone number once sign-in is complete
  app.get("/oauthnum", async (req, res) => {
    var count = 0
    // Default value for phone number is 0
    var numOut = "0"
    while (numOut == "0") {
      count++;
      // Check to see if phoneNumber field has been populated due to the user completing sign-in.
      // If so update numOut allowing loop to exit
      if (req.app.get('phoneNumber')){
          numOut = req.app.get('phoneNumber')
      }

      // Prevents the Miniapp request from timing out which happens after ~ 9 seconds.
      // Miniapps will send another request immediately if it recieves the default "0" response
      if (count > 85){
        break;
      }
      // Wait 100ms before checking for phoneNumber again
      await new Promise(r => setTimeout(r, 100));
    }
    res.status(200).json({ "num" : numOut })
    // Reset Phone Number (For Testing Purposes)
    app.set('phoneNumber', "0")

    
  });

  // ________________MOCK DATABASE ENDPOINTS________________________

  // Get user's info relating to a specific phone number
  app.get("/users", (req, res) => { 
      console.log(req.body) 
      const phoneNumber = {"phoneNumber": req.query.phoneNumber} 
      users.findOne(phoneNumber, (err, result) => { 
          if (err) { 
              console.error(err) 
              res.status(500).json({ err: err }) 
              return 
          }
          console.log(result) 
          res.status(200).json({users: result}) 
      }) 
  })


  //Get All Users (Not Currently Used For Anything)
  app.get("/usersList", (req, res) => { 
      console.log(req.body) 
      users.find().toArray((err, result) => { 
          if (err) { 
              console.error(err) 
              res.status(500).json({ err: err }) 
              return 
          } 
          
          console.log(result) 
          res.status(200).json({ users: result }) 
      }) 
  })
});







