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
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
    select: false
  },
  availableDates: {
    type: [String],
    default: undefined
  },
  availableDays: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
