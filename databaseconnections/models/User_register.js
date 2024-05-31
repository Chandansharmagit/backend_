const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Define the cart item schema
const cartItemSchema = new mongoose.Schema({
  itemId: { type: String },
  quantity: { type: Number },
});

// Define the user schema
const userSchema = new mongoose.Schema({
  name: { type: String, },
  email: { type: String,  },
  password: { type: String, },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipcode: { type: String },
  image: { type: String },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  cartitems: [cartItemSchema],
}, {
  timestamps: true,
});

// Hash the password before saving the user model
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to generate auth token
userSchema.methods.generateAuthToken = async function () {
  try {
    if (!this._id) {
      throw new Error('User ID (_id) is not available.');
    }
    const token = jwt.sign({ _id: this._id.toString() }, "thenaemischadnanshamacaslsldthenme", { expiresIn: '1h' });
    this.tokens = this.tokens.concat({ token });
    await this.save();
    return token;
  } catch (error) {
    console.error("Error generating auth token:", error);
    throw new Error("Token generation failed");
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
