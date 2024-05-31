// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User_register");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "thenaemischadnanshamacaslsldthenme");
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token });

    if (!user) {
      throw new Error();
      
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate." });
  }
};

module.exports = auth;