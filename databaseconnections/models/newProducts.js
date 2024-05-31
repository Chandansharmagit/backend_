const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    // Remove the unique constraint if it's not needed
    // unique: true, 
    // Set `sparse` to true to allow multiple documents to have null values
    sparse: true,
  },
  items: [
    {
      itemId: String,
      quantity: {
        type: Number,
        required: true,
        min: 1,
      }
    }
  ],
  totalPrice: Number
});

const Userproducts = mongoose.model('Userproducts', userSchema);

module.exports = Userproducts;
