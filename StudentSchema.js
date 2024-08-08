const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  rollNo: String,
  batch: String,
  branch: String,
  semester: String,
  subjectCode: String,
  subject: String,
  credits: Number,
  internalMarks: Number,
  grade: String,
  sgpa:Number,
  cgpa:Number
});

module.exports = mongoose.model('Student', studentSchema);
