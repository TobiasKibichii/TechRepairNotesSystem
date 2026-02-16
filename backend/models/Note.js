const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const noteSchema = new mongoose.Schema(
  {
    // Customer details
    customerName: {
      type: String,
      required: true
    },
    customerPhone: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String
    },

    // Device info
    deviceType: {
      type: String,
      required: true
    },
    issueTitle: {
      type: String,
      required: true
    },
    issueDescription: {
      type: String,
      required: true
    },

    // Image uploads (array of URLs or file paths)
    images: [{
      type: String
    }],

    // Assignment details
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Task status tracking
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Pending'
    },

    // Optional internal notes or feedback
    comments: {
      type: String
    },

    category: {
      type: String,
      enum: ['Screen', 'Battery', 'Network', 'Software', 'Hardware', 'Power', 'Other'],
      default: 'Other'
    },

    possibleCause: { type: String }

  },
  
  {
    timestamps: true
  }
)

// Auto-increment repair ticket number
noteSchema.plugin(AutoIncrement, {
  inc_field: 'ticket',
  id: 'ticketNums',
  start_seq: 500
})

module.exports = mongoose.model('Note', noteSchema)
