const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Student = require('./StudentSchema'); // Ensure you have the Student model
const StudentDetails = require('./StudentdetailsSchema'); // Ensure you have the Student model
const Activity = require('./Activity');
const Eactivity = require('./Eactivity');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Atlas connection
mongoose.connect('mongodb+srv://132429sr:cxV2moxnFYZxT2Ts@studentprofileapi.ulmm7.mongodb.net/studentmarksnew', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
}).then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => {
  console.error('Error connecting to MongoDB Atlas:', err.message);
});

//Activities

app.post('/activity', async (req, res) => {
  try {
    const newActivity = new Activity(req.body);
    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Error saving activity:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/activity', async (req, res) => {
  try {
    const { rollNo } = req.query;
    console.log('Query parameter rollNo:', rollNo); // Debugging line
    let activities;

    if (rollNo) {
      activities = await Activity.find({ rno: rollNo });
    } else {
      activities = await Activity.find({});
    }

    console.log('Fetched activities:', activities); // Debugging line
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

//Extra Activities
app.post('/eactivity', async (req, res) => {
  try {
    const newEactivity = new Eactivity(req.body);
    await newEactivity.save();
    res.status(201).json(newEactivity);
  } catch (error) {
    console.error('Error saving activity:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/eactivity', async (req, res) => {
  try {
      const { rollNo } = req.query;
      let eactivities;

      if (rollNo) {
          eactivities = await Eactivity.find({ rno: rollNo });
      } else {
          eactivities = await Eactivity.find({});
      }

      res.json(eactivities);
  } catch (error) {
      console.error('Error fetching activities:', error.message);
      res.status(500).send('Internal Server Error');
  }
});

//Student Marks
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  console.log('File uploaded to:', filePath);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).send('No sheets found in the uploaded file.');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return res.status(400).send('Sheet data is undefined.');
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet);
    console.log('Excel data:', jsonData);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Save data to MongoDB
    await Student.insertMany(jsonData);

    res.json({ message: 'File uploaded and data saved to database successfully.' });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/students', async (req, res) => {
  try {
    const students = await Student.find({});
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/students/:rollNo', async (req, res) => {
  try {
    const updatedStudent = await Student.findOneAndUpdate({ rollNo: req.params.rollNo, subjectCode: req.body.subjectCode }, req.body, { new: true });
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/students/:rollNo/:subjectCode', async (req, res) => {
  try {
    const { rollNo, subjectCode } = req.params;
    const student = await Student.findOneAndDelete({ rollNo, subjectCode });
    if (!student) {
      return res.status(404).send('Student not found');
    }
    res.json(student);
  } catch (error) {
    console.error('Error deleting student data:', error);
    res.status(500).send('Internal Server Error');
  }
});

//studentdetails

app.post('/upload-student-details', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  console.log('File uploaded to:', filePath);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).send('No sheets found in the uploaded file.');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return res.status(400).send('Sheet data is undefined.');
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet);
    console.log('Excel data:', jsonData);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Save data to MongoDB
    await StudentDetails.insertMany(jsonData);

    res.json({ message: 'File uploaded and data saved to database successfully.' });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/studentdetails', async (req, res) => {
  try {
    const studentDetails = await StudentDetails.find({});
    res.json(studentDetails);
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).send('Internal Server Error');
  }
});

//Get whole Data

app.get('/student/:rollNo', async (req, res) => {
  try {
    const { rollNo } = req.params;
    
    console.log(`Fetching details for roll number: ${rollNo}`);
    
    const studentDetails = await StudentDetails.findOne({ rollNo });
    if (!studentDetails) {
      console.error('Student details not found for roll number:', rollNo);
      return res.status(404).send('Student details not found');
    }

    const studentMarks = await Student.find({ rollNo });
    const activities = await Activity.find({ rno: rollNo });
    const eactivities = await Eactivity.find({ rno: rollNo });

    res.json({
      studentDetails,
      studentMarks,
      activities,
      eactivities
    });
  } catch (error) {
    console.error('Error fetching student data:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/files', express.static("files"));

const corsOptions = {
  origin: 'http://localhost:3001', // Your frontend's origin
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());

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
  const hashedPassword = bcrypt.hashSync(pwd, 10);
  const sql = 'INSERT INTO users (fname, lname, email, rollno, password, role) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [fname, lname, email, rollno, hashedPassword, role], (err, result) => {
    if (err) {
      console.error('Error signing up user:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(201).send('User registered');
    }
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Error logging in:', err);
      res.status(500).send('Internal Server Error');
    } else if (results.length === 0) {
      res.status(401).send('Invalid email or password');
    } else {
      const user = results[0];
      if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey', { expiresIn: '1h' });
        res.json({ token });
      } else {
        res.status(401).send('Invalid email or password');
      }
    }
  });
});


<<<<<<< HEAD
app.listen(5000, () => {
=======
app.listen(4000, () => {
>>>>>>> d4f84815e050eda4e2358357feb5a1257e04bb11
  console.log('Server is running on port 5000');
});


mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});
