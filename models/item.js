const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
  type: String,
  title: String,
  description: String,
  date: Date,
  location: String,
  contact: String,
  image: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });


module.exports= mongoose.model('Item', itemSchema);