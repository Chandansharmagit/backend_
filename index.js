const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const User = require('./databaseconnections/models/User_register');
const Userproducts = require('./databaseconnections/models/newProducts');
const database = require('./databaseconnections/database'); // Ensure this file correctly sets up your database connection
const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
const { createServer } = require('http');
const auth = require('./databaseconnections/auth/auth')

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware setup

app.use(
  cors({
    origin: "*", // Allow requests from any origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow specified methods
    allowedHeaders: "Content-Type", // Allow specifided headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Hello World');
});


app.post('/register', upload.single('image'), async (req, res) => {
  const { name, email, password, phone, address, state, zipcode, city } = req.body;
  const image = req.file.path;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      state,
      zipcode,
      city,
      image
    });

    const token = await newUser.generateAuthToken();
    res.cookie('jwt', token, {
      expires: new Date(Date.now() + 600000),
      httpOnly: true,
    });

    await newUser.save();

    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//adding the products to database if the user id matched to previou logined user


app.post('/api/placeOrder', async (req, res) => {
  const { userId, items, totalPrice } = req.body;

  try {
    const existingOrder = await User.findOne({
      userId,
      items: { $eq: items }, // Check for exact item match
      status: 'pending', // Only consider pending orders
    });

    if (existingOrder) {
      return res.status(400).json({ message: 'Duplicate order already in progress' });
    }

    const order = new Userproducts({ userId, items, totalPrice, status: 'pending' }); // Set initial status as pending
    await order.save();

    res.status(200).json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Middleware for authorization



// API endpoint for logout
app.post('/api/logout', async (req, res) => {
  // Clear session data


  try {
    // logout from all devices
    req.user.tokens = [];

    res.clearCookie("jwt");
    console.log("logout successful...");
    await req.user.save();
    res.render("index");
  } catch (error) {
    res.status(500).send(error);
  }
});




// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'thenaemischadnanshamacaslsldthenme',
      { expiresIn: '1h' }
    );

    // res.status(200).json({ message: 'Success', token });
    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('Error during login: ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get user details
app.get('/user_details', async (req, res) => {
  try {
    const details = await User.find();
    res.status(200).json(details);
  } catch (error) {
    console.error('Error fetching user details: ', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadDirectory));

const SECRET_KEY = process.env.SECRET_KEY || 'thenameischanansharmaclassnepalsecondaryschoolthename';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'utamsharma57@gmail.com',
    pass: 'dbsq lvct gjep lowe',
  },
});

app.post('/forgot_email', async (req, res) => {
  try {
    const { email } = req.body;

    User.findOne({ email }).then((user) => {
      if (!user) {
        return res.status(400).json({ error: 'Email does not exist' });
      }

      const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1d' });
      const resetPasswordURL = `http://localhost:3000/Createpassword/${user._id}/${token}`;

      const mailOptions = {
        from: 'utamsharma575757@gmail.com',
        to: email,
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
          `Please click on the following link, or paste it into your browser to complete the process:\n\n` +
          resetPasswordURL + '\n\n' +
          `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).send('Failed to send email');
        } else {
          console.log('Email sent: ' + info.response);
          res.status(200).send('Email sent successfully (if email exists)');
        }
      });
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Failed to send email' });
  }
});

app.post('/createpassword/:id/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;
    const decode = jwt.verify(token, SECRET_KEY);

    if (decode.id !== id) {
      return res.status(400).json({ error: 'Token does not match user id' });
    }

    const hashing = await bcrypt.hash(password, 10);
    const updateUser = await User.findByIdAndUpdate(id, { password: hashing }, { new: true });

    if (updateUser) {
      res.status(200).json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update password' });
    }
  } catch (error) {
    console.error('Error updating password:', error);
    const errorMessage = error.name === 'JsonWebTokenError' ? 'Invalid or expired token' : 'Failed to update password';
    return res.status(400).json({ message: errorMessage });
  }
});

// Socket.IO connection
// io.on('connection', (socket) => {

//   console.log("user connected", socket.id);

//   socket.on("message", (data) => {
//     console.log(data);
//     io.emit("recieve-message", data)
//   })






//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
