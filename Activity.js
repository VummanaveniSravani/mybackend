const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  sname: String,
  rno:String,
  branch: String,
  aname: String,
  date:Date,
  year:String,
  description: String,
  host: String
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
