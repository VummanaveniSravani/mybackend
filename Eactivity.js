const mongoose = require('mongoose');

const eactivitySchema = new mongoose.Schema({
  sname: String,
  rno:String,
  branch: String,
  aname: String,
  pname:String,
  mname:String,
  acname:String,
  date:Date,
  year:String,
  description: String,
  host: String
});

const Activity = mongoose.model('Eactivity', eactivitySchema);

module.exports = Activity;
