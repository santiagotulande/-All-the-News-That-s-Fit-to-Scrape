var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

var PORT = 3000;

var app = express();


app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines"

mongoose.connect( MONGODB_URI, { useNewUrlParser: true });

// Routes

// A GET route for scraping google news website
app.get("/scrape", function(req, res) {

  axios.get("https://news.google.com/").then(function(response) {
    var $ = cheerio.load(response.data);
   
    $("article").each(function(i, element) {

      var result = {};
    $("h4").each(function(i, element) {
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
    });
      $("p").each(function(i, element) {
          result.summary = $(this)
          .text();
           });

   db.Article.create(result)
   .then(function(dbArticle) {
   })
   .catch(function(err) {
   });
    res.send("Scrape Complete");
  });
});
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
 
  db.Article.findOne({ _id: req.params.id })
 
    .populate("note")
    .then(function(dbArticle) {
   
      res.json(dbArticle);
    })
    .catch(function(err) {
    
      res.json(err);
    });
});


app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {

      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
   
      res.json(dbArticle);
    })
    .catch(function(err) {
     
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
