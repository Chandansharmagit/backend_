const mongoose = require("mongoose");

const database =
  "mongodb+srv://chandansharma575757:GAehdyw6piv4xcsw@newsmartfurniture.varvif4.mongodb.net/?retryWrites=true&w=majority&appName=newsmartfurniture";

mongoose
  .connect(database, {})
  .then(() => {
    console.log("database connected");
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = database;
