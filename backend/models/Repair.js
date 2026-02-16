const mongoose = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(mongoose)

const repairSchema = new mongoose.Schema(
  {
    ticket: {
      type: Number,
      required: true,
      unique: true
    },
    customerName: {
      type: String,
      required: true
    },
    customerPhone: {
      type: String,
      required: true
    },
    device: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    partsUsed: [
      {
        partName: String,
        qty: { type: Number, default: 1 },
        price: Number,
        isOther: { type: Boolean, default: false },
        description: String
      }
    ],
    laborCost: {
      type: Number,
      default: 0
    },
    totalBill: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Completed"
    }
  },
  {
    timestamps: true
  }
)

// Optional: auto-increment ticket if you want separate sequence from Note
repairSchema.plugin(AutoIncrement, {
  inc_field: "repairTicket",
  id: "repairTicketNums",
  start_seq: 1000
})

module.exports = mongoose.model("Repair", repairSchema)
