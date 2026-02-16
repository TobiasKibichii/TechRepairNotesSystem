const fs = require("fs-extra");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const axios = require("axios");

const filePath = "./data/inventory_parts.csv";

// --- helper functions ---
async function readInventory() {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function writeInventory(data) {
  const parser = new Parser();
  const csvData = parser.parse(data);
  await fs.writeFile(filePath, csvData);
}

// --- main controller ---
async function completeRepair(req, res) {
  try {
    const { parts_used } = req.body;
    let inventory = await readInventory();

    // 1️⃣ Deduct parts from inventory
    parts_used.forEach((used) => {
      const item = inventory.find((i) => i.part_name === used.part_name);
      if (item) {
        const current = parseInt(item.stock_quantity);
        item.stock_quantity = Math.max(current - used.quantity, 0);
      }
    });

    // 2️⃣ Save updated stock
    await writeInventory(inventory);

    // 3️⃣ Prepare data for forecasting
    const forecasts = [];
    for (let used of parts_used) {
      // mock recent usage: random last 8 weeks for demo
      const usage = Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10)
      );
      usage.push(used.quantity); // add current week's usage

      const response = await axios.post("http://localhost:8001/forecast", {
        part_name: used.part_name,
        weekly_usage: usage,
      });
      forecasts.push(response.data);
    }

    res.json({
      message: "Repair completed, stock updated and forecast adjusted.",
      forecasts,
    });
  } catch (err) {
    console.error("Error updating inventory:", err.message);
    res.status(500).json({ error: "Failed to complete repair" });
  }
}

module.exports = { completeRepair };
