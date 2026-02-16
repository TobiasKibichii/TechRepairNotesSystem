const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")
const { parse } = require("json2csv")

const Note = require("../models/Note")
const Repair = require("../models/Repair")

const inventoryFile = path.join(__dirname, "../data/inventory_parts.csv")

router.put("/updateIssue", async (req, res) => {
  const {
    noteId,
    ticket: frontendTicket,
    customerName: frontendCustomerName,
    customerPhone: frontendCustomerPhone,
    device: frontendDevice,
    brand: frontendBrand,
    model: frontendModel,
    partsUsed: frontendPartsUsed = [],
    laborCost: frontendLaborCost = 0,
    finalBill: frontendFinalBill = 0,
    status: frontendStatus
  } = req.body

  console.log('😀',req.body)

  try {
    // --- Fetch existing note ---
    const existingNote = await Note.findById(noteId)
    if (!existingNote) return res.status(404).json({ message: "Note not found" })

    // --- Merge frontend values with backend fallback ---
    const device = frontendDevice || existingNote.deviceType
    const brand = frontendBrand || existingNote.brand
    const model = frontendModel || existingNote.model
    const ticket = frontendTicket || existingNote.ticket
    const customerName = frontendCustomerName || existingNote.customerName
    const customerPhone = frontendCustomerPhone || existingNote.customerPhone
    const partsUsed = frontendPartsUsed.length ? frontendPartsUsed : existingNote.partsUsed || []
    const laborCost = frontendLaborCost || existingNote.laborCost || 0
    const finalBill = frontendFinalBill || existingNote.finalBill || 0
    const status = frontendStatus || existingNote.status

    // --- Deduct inventory ---
    const inventory = []
    await new Promise((resolve, reject) => {
      fs.createReadStream(inventoryFile)
        .pipe(csv())
        .on("data", (row) => inventory.push(row))
        .on("end", resolve)
        .on("error", reject)
    })

    partsUsed.forEach((p) => {
      if (!p.isOther) {
        const item = inventory.find(
          (inv) =>
            inv.device === device &&
            inv.brand === brand &&
            inv.model === model &&
            inv.part_name === p.partName
        )
        if (item) {
          item.stock_quantity = Math.max(0, parseInt(item.stock_quantity) - (p.qty || 1))
        }
      }
    })

    if (inventory.length > 0) {
      const csvData = parse(inventory, { fields: Object.keys(inventory[0]) })
      fs.writeFileSync(inventoryFile, csvData)
    }

    // --- Update Note ---
    const noteUpdate = {
      status,
      device: device,
      brand,
      model,
      partsUsed,
      laborCost,
      finalBill
    }

    const updatedNote = await Note.findByIdAndUpdate(noteId, noteUpdate, { new: true })

    // --- Create Repair record only if status is Completed/Resolved ---
    let newRepair = null
    if ((status === "Completed" || status === "Resolved") && ticket && customerName && customerPhone && brand && model) {
      newRepair = await Repair.create({
        ticket,
        customerName,
        customerPhone,
        device,
        brand,
        model,
        partsUsed,
        laborCost,
        totalBill: finalBill,
        status: "Completed",
      })
    }

    res.json({
      message: "Issue updated successfully",
      note: updatedNote,
      repair: newRepair
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error updating issue", error: err.message })
  }
})

module.exports = router
