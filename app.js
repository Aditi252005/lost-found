const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Item = require('./models/item');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
require('dotenv').config();
const { storage } = require('./config/cloudinary');
const upload = multer({ storage });
const flash = require('connect-flash');

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));



app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});


// const storage = multer.diskStorage({
//   destination: './public/uploads',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });


app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  next();
});

function isLoggedIn(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}


// home route
app.get('/', async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.render("index.ejs", { items });
});

// show route
app.get('/items/:id', async (req, res) => {
  const item = await Item.findById(req.params.id);
  res.render('show', { item });
});




// lost route
app.get('/lost',isLoggedIn, (req, res) => {
  res.render('lost');
});

// found route
app.get('/found',isLoggedIn, (req, res) => {
  res.render('found');
});


//submit route
app.post('/submit', upload.single('image'), async (req, res) => {
  try {
    const { type, title, description, date, location, contact } = req.body;
    const image = req.file ? req.file.path : '';
    const item = new Item({ type, title, description, date, location, image, contact, userId: req.session.userId });

    await item.save();
    req.flash('success', 'Your report has been submitted!');
    res.redirect('/');
  } catch (err) {
    console.error('Submission Error:', err);
    req.flash('error', 'Something went wrong while submitting.');
    res.redirect('/');
  }
});



// my-report route
app.get('/my-reports', isLoggedIn, async (req, res) => {
  const items = await Item.find({ userId: req.session.userId }).sort({ createdAt: -1 });
  res.render('myReports', { items });
});


// signup route
app.get('/signup', (req, res) => {
  res.render('signUp');
});
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.send('User already exists');
    }

    const user = new User({ email, password: hashedPassword });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error signing up');
  }
});

// login route
app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.session.userId = user._id;
    req.flash('success', 'Successfully logged in!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/login');
  }
});


// logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// mark as done (delete) route
app.delete('/items/:id', isLoggedIn, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item || !item.userId.equals(req.session.userId)) return res.status(403).send('Forbidden');

  await Item.findByIdAndDelete(req.params.id);
  res.redirect('/my-reports');
});

app.get('/api/items', async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});



// app.listen(3000, () => console.log('listning to port'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


