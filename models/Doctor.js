const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  bio: {
    type: String
  },
  consultationFee: {
    type: Number,
    required: true
  },
  profileImage: {
    type: String
  },
  availableDays: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);