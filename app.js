//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to MongoDB by port and catch errors.
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin-mak:Test123@cluster0.wecbzg0.mongodb.net/todolistDB')
  // await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB')
  // mongodb+srv://admin-mak:<password>@cluster0.wecbzg0.mongodb.net/?retryWrites=true&w=majority
  .then(() => console.log('Connected!'));

  // Defining a model schema
  const itemsSchema = new mongoose.Schema({
    name: String
  });

  const Item = new mongoose.model("Item", itemsSchema);

  const item1 = new Item({
    name: "Welcome to your todolist!"
  });
  
  const item2 = new Item({
    name: "Hit the + button to add a new item."
  });
  
  const item3 = new Item({
    name: "<-- Hit this to delete an item."
  });
  
  const defaultItems = [item1, item2, item3];

  const listSchema = {
    name: String,
    items: [itemsSchema]
  };

  const List = mongoose.model("List", listSchema);

  app.get("/", async function main(req, res) {

    Item.find({})
    .then(function(foundElements) {
      if (foundElements.length === 0) {
        
        Item.insertMany(defaultItems)
        .then(function(element) {
          console.log("Successfully saved default items to DB.");
        })
        .catch(function(err) {
          console.log(err);
        });

        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundElements});
      }
      
    })
    .catch(function(err) {
      console.log(err);
    });

    

  });

  app.post("/", async function main(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      await List.findOne({name: listName}).exec()
      .then(function(element) {
        element.items.push(item);
        element.save();
        res.redirect("/" + listName);
      })
      .catch(function(err) {
        console.log(err);
      });
    }


  });

  app.post("/delete", async function main(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId)
      .then(function(element) {
        console.log("Deleted the item.");
      })
      .catch(function(err) {
        console.log(err);
      });
    
      res.redirect("/");
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      .then(function(element) {
        res.redirect("/" + listName);
      })
      .catch(function(err) {
        console.log(err);
      });
    }


  });

  app.get("/:customListName", async function main(req, res) {
    try {
      const customListName = _.capitalize(req.params.customListName);
      const listTest = await List.findOne({name: customListName}).exec();

      if (listTest == null) {
        console.log("Doesn't exist!");

        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        
        list.save();

        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        
        res.render("list", {listTitle: listTest.name, newListItems: listTest.items});
      }
    

      //list.save();
    } catch(err) {
      console.log(err);
    }
    
  });
  /*
  app.get("/work", function(req,res){
    res.render("list", {listTitle: "Work List", newListItems: workItems});
  });

  app.get("/about", function(req, res){
    res.render("about");
  });
  */
  app.listen(process.env.PORT || 3000, function() {
    console.log("Server started succesfully.");
  });

}
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

