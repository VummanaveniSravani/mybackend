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

mongoose.connect('mongodb://localhost:27017/studentmarksnew', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
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
//Student Marks
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
  origin: 'https://bug-free-fortnight-p46vxwj9wrj3669j-3000.app.github.dev/', // Your frontend's origin
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

// Routes for marks
app.post('/api/marks', async (req, res) => {
  try {
    const newMark = new Mark(req.body);
    await newMark.save();
    res.status(201).json(newMark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/marks/:rollNo', async (req, res) => {
  try {
    const marks = await Mark.find({ rollNo: req.params.rollNo });
    res.json(marks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/marks/:id', async (req, res) => {
  try {
    const updatedMark = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/marks/:id', async (req, res) => {
  try {
    await Mark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mark deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


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
    const cocurricularActivities = await axios.get(`http://localhost:3001/activity?rollNo=${rollNo}`);

    res.json({
      studentDetails,
      studentMarks,
      cocurricularActivities: cocurricularActivities.data,
    });
  } catch (error) {
    console.error('Error fetching student data:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/", async (req, res) => {
  res.send("Connected");
});





app.listen(4000, () => {
  console.log('Server is running on port 4000');
});
