const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 4002;
const app = express();
const router = express.Router();

app.use(express.json());
app.use(cors()); // Enable CORS
app.use('/files', express.static("files"));
const corsOptions = {
  origin: 'http://localhost:3000', // Your frontend's origin
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
// const PdfDetails = require('./PdfDetails'); // Import your model

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Admin@123',
  database: 'studentprofile'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    throw err;
  }
  console.log('MySQL connected');
});

app.post('/signup', (req, res) => {
  const { fname, lname, email, rollno, pwd, role } = req.body;
  if (!fname || !lname || !email || !rollno || !pwd || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPwd = bcrypt.hashSync(pwd, 8);
  const user = { fname, lname, email, rollno, pwd: hashedPwd, role };

  db.query('INSERT INTO user SET ?', user, (err, result) => {
    if (err) {
      console.error('Error signing up user:', err);
      return res.status(400).json({ error: 'Error signing up user' });
    }
    res.json({
      message: 'User registered!',
      user: { fname, lname, email, rollno, role }
    });
  });
});

app.post('/login', (req, res) => {
  const { email, pwd } = req.body;

  if (!email || !pwd) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const query = 'SELECT * FROM user WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    if (bcrypt.compareSync(pwd, user.pwd)) {
      const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
      res.json({
        message: 'Login successful!',
        user: {
          id: user.id,
          role: user.role,
          fname: user.fname,
          lname: user.lname,
          token
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});







const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb://localhost:27017/Sravani";
// MongoDB connection URI

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });


// Ensure the upload directory exists and has the correct permissions
// const fs = require('fs');
// const uploadDir = './files';

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + file.originalname;
//     cb(null, uniqueSuffix);
//   }
// });

// const upload = multer({ storage: storage });

// router.post("/upload-files", upload.single('file'), async (req, res) => {
//   const { title, rollNo } = req.body;
//   const fileName = req.file.filename;

//   try {
//     const newPdf = new PdfDetails({ title, rollNo, pdf: fileName });
//     await newPdf.save();
//     res.send({ status: "ok" });
//   } catch (error) {
//     res.status(500).json({ status: error.message });
//   }
// });

// router.get("/get-files", async (req, res) => {
//   const rollNo = req.query.rollNo;

//   try {
//     const query = rollNo ? { rollNo } : {};
//     const data = await PdfDetails.find(query);
//     res.send({ status: "ok", data: data });
//   } catch (error) {
//     res.status(500).json({ status: error.message });
//   }
// });

// Define the schema and model
const markSchema = new mongoose.Schema({
  rollNo: String,
  name: String,
  batch: String,
  branch: String,
  semester: String,
  subject: String,
  code: String,
  externalMarks: String,
  internalMarks: String,
  grade: String,

});

const Mark = mongoose.model('Mark', markSchema);

// Routes
router.post('/api/marks', async (req, res) => {
  try {
    const newMark = new Mark(req.body);
    await newMark.save();
    res.status(201).json(newMark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/marks/:rollNo', async (req, res) => {
  try {
    const marks = await Mark.find({ rollNo: req.params.rollNo });
    res.json(marks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/api/marks/:id', async (req, res) => {
  try {
    const updatedMark = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/api/marks/:id', async (req, res) => {
  try {
    await Mark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mark deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.get("/", async (req, res) => {
  res.send("Connected");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = router;
