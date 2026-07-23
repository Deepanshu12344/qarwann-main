const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    tripName: { type: String, trim: true, maxlength: 200, default: '' },
    travelers: { type: Number, required: true, min: 1, max: 50 },
    travelStartDate: { type: Date },
    travelEndDate: { type: Date },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    newsletterOptIn: { type: Boolean, default: false },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new', index: true },
    source: { type: String, trim: true, default: 'website' },
    notifications: {
      emailSent: { type: Boolean, default: false },
      emailError: { type: String, default: '' },
      newsletterAdded: { type: Boolean, default: false },
      newsletterError: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ name: 'text', email: 'text', tripName: 'text', message: 'text' });

module.exports = mongoose.model('Enquiry', EnquirySchema);
