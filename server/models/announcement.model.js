const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  orgId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  batchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null }, // null = org-wide
  title:     { type: String, required: true, trim: true },
  content:   { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPinned:  { type: Boolean, default: false },
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
