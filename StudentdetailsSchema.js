const mongoose = require('mongoose');

const studentDetailsSchema = new mongoose.Schema({
  name: String,
  fatherName: String,
  rollNo: String,
  batch:String,
  branch:String,
  mobileNumber: String,
  parentNumber: String,
  email: String,
  dateOfBirth: Date,
  address: String,
  gender: String
});

const StudentDetails = mongoose.model('StudentDetails', studentDetailsSchema);

module.exports = StudentDetails;
