const fs = require("fs-extra");
const csv = require("csv-parser");
const axios = require("axios");

const filePath = "./data/inventory_parts.csv";

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

async function getAdminInventory(req, res) {
  try {
    const inventory = await readInventory();

    // Create batch payload
    const partsPayload = inventory.map((item) => ({
      part_name: item.part_name,
      weekly_usage: Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ),
    }));

    // Send ONE request to FastAPI
    const response = await axios.post("http://localhost:8000/forecast", {
      parts: partsPayload,
    });

    const forecasts = response.data.forecasts;

    // Merge forecasts with CSV data
    const enriched = inventory.map((item) => {
      const forecastData = forecasts.find(
        (f) => f.part_name === item.part_name,
      );
      const forecast = forecastData ? forecastData.forecast_next_week : 0;

      const stock = parseInt(item.stock_quantity);
      const threshold = parseInt(item.reorder_threshold);
      const reorder_alert = stock - forecast <= threshold;

      return {
        part_name: item.part_name,
        device: item.device,
        brand: item.brand,
        model: item.model,
        stock_quantity: stock,
        reorder_threshold: threshold,
        forecast_next_week: forecast,
        reorder_alert,
      };
    });

    console.log("😂", enriched);
    res.json({
      message: "Admin inventory data loaded successfully.",
      data: enriched,
    });
  } catch (err) {
    console.error("Error reading admin inventory:", err.message);
    res.status(500).json({ error: "Failed to load inventory data" });
  }
}

const loadStock = async (req, res) => {
  try {
    const data = await readInventory();
    res.json({ message: "Sent Inventory", data });
  } catch (err) {
    console.error("Error Reading From Inventory", err);
    res.status(500).json({ message: "Failed to load Inventory" });
  }
};

async function updateStock(req, res) {
  try {
    console.log("😀uuuuuuuuuuuuuuuuuu");
    const { partName, qty } = req.body;
    console.log(req.body);
    if (!partName || qty == null) {
      return res
        .status(400)
        .json({ error: "Missing part_name or used_quantity" });
    }

    const inventory = await readInventory();

    // ✅ Find the part and update stock
    const updatedInventory = inventory.map((item) => {
      if (item.part_name === partName) {
        const currentStock = parseInt(item.stock_quantity);
        const newStock = Math.max(currentStock - qty, 0);
        return { ...item, stock_quantity: newStock.toString() };
      }
      return item;
    });

    // ✅ Write back to CSV
    const csvWriter = createCsvWriter({
      path: filePath,
      header: Object.keys(inventory[0]).map((key) => ({ id: key, title: key })),
    });

    await csvWriter.writeRecords(updatedInventory);

    res.json({ message: "Stock updated successfully", data: updatedInventory });
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
}

module.exports = { getAdminInventory, loadStock, updateStock };
