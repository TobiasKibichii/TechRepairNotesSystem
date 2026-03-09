// controllers/inventoryController.js

const fs = require("fs-extra");
const csv = require("csv-parser");
const axios = require("axios");
const { createObjectCsvWriter } = require("csv-writer");

const filePath = "./data/inventory_parts.csv";

/**
 * Read CSV inventory into JavaScript objects
 */
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

/**
 * Utility: build a random weekly usage array (keeps your original behaviour).
 * Replace this with real data if you have it in the CSV.
 */
function makeWeeklyUsage(len = 8) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
}

/**
 * Utility: try to extract a numeric forecast from model output text.
 * If not found, returns 0.
 */
function parseForecastFromText(outputText) {
  if (!outputText || typeof outputText !== "string") return 0;
  // try to find first number (int or float) in the string
  const m = outputText.match(/-?\d+(\.\d+)?/);
  if (m) return Number(m[0]);
  // fallback: if the whole text is a number-like string
  const n = Number(outputText.trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET /api/inventory/admin
 * Reads the CSV, creates prompts for each part, calls the Hugging Face Space /run/predict,
 * merges returned forecasts into inventory and responds with enriched data.
 */
async function getAdminInventory(req, res) {
  try {
    const inventory = await readInventory();

    if (!inventory || inventory.length === 0) {
      return res.json({
        message: "Admin inventory data loaded successfully.",
        data: [],
      });
    }

    // Build parts payload / prompts
    const partsPayload = inventory.map((item) => ({
      part_name: item.part_name,
      weekly_usage: makeWeeklyUsage(8),
    }));

    const prompts = partsPayload.map(
      (p) =>
        `Predict demand (next week) for "${p.part_name}" given weekly usage: ${p.weekly_usage.join(
          ", "
        )}. Return a simple numeric forecast (one number) or a short phrase containing the number.`
    );

    // Space endpoint (override via env var if needed)
    const spaceUrl =
      process.env.HF_SPACE_URL ||
      "https://evolving8-technotes-space.hf.space/run/predict";

    // Headers (Spaces are usually public; if private set HF_SPACE_TOKEN)
    const headers = {
      "Content-Type": "application/json",
    };
    if (process.env.HF_SPACE_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_SPACE_TOKEN}`;
    }

    // Call the Space for each prompt concurrently (with graceful failures)
    const callPromises = prompts.map((prompt, idx) =>
      (async () => {
        try {
          const resp = await axios.post(
            spaceUrl,
            { data: [prompt] },
            {
              headers,
              timeout: 60_000, // 60 seconds - adjust if your model is slow
            }
          );

          // Typical Space response: { data: [ ... ] }
          const returned = resp.data?.data?.[0];

          // returned might be a string or an array/object depending on the Space app
          // Normalize to string
          const returnedText =
            typeof returned === "string"
              ? returned
              : Array.isArray(returned)
              ? returned.join(" ")
              : returned && typeof returned === "object"
              ? JSON.stringify(returned)
              : String(returned);

          const numericForecast = parseForecastFromText(returnedText);

          return {
            part_name: partsPayload[idx].part_name,
            forecast_next_week: numericForecast,
            raw: returnedText,
            ok: true,
          };
        } catch (err) {
          // Log useful debug info (but don't log tokens)
          console.error(
            `Space call failed for part="${partsPayload[idx].part_name}":`,
            err.response?.data || err.message
          );
          return {
            part_name: partsPayload[idx].part_name,
            forecast_next_week: 0,
            raw: null,
            ok: false,
          };
        }
      })()
    );

    const settled = await Promise.allSettled(callPromises);

    // Normalize results (handle both fulfilled/rejected)
    const forecasts = settled.map((s) =>
      s.status === "fulfilled" ? s.value : { part_name: null, forecast_next_week: 0 }
    );

    // Merge forecasts with CSV data
    const enriched = inventory.map((item) => {
      const forecastData = forecasts.find((f) => f.part_name === item.part_name);
      const forecast = forecastData ? forecastData.forecast_next_week : 0;

      const stock = Number.parseInt(item.stock_quantity || "0", 10) || 0;
      const threshold =
        Number.parseInt(item.reorder_threshold || "0", 10) || 0;

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

    console.log("Enriched inventory (sample):", enriched.slice(0, 5));

    return res.json({
      message: "Admin inventory data loaded successfully.",
      data: enriched,
    });
  } catch (err) {
    console.error("Error reading admin inventory:", err.response?.data || err.message || err);
    return res.status(500).json({ error: "Failed to load inventory data" });
  }
}

/**
 * GET /api/inventory/loadStock
 * Sends raw CSV inventory.
 */
const loadStock = async (req, res) => {
  try {
    const data = await readInventory();
    res.json({ message: "Sent Inventory", data });
  } catch (err) {
    console.error("Error Reading From Inventory", err);
    res.status(500).json({ message: "Failed to load Inventory" });
  }
};

/**
 * POST /api/inventory/updateStock
 * Body: { partName: string, qty: number }  (qty is used quantity to subtract)
 */
async function updateStock(req, res) {
  try {
    const { partName, qty } = req.body;

    if (!partName || qty == null) {
      return res
        .status(400)
        .json({ error: "Missing partName or qty in request body" });
    }

    const inventory = await readInventory();

    if (!inventory || inventory.length === 0) {
      return res.status(400).json({ error: "Inventory is empty" });
    }

    // Find the part and update stock
    const updatedInventory = inventory.map((item) => {
      if (item.part_name === partName) {
        const currentStock = Number.parseInt(item.stock_quantity || "0", 10) || 0;
        const newStock = Math.max(currentStock - Number(qty), 0);
        return { ...item, stock_quantity: newStock.toString() };
      }
      return item;
    });

    // Write back to CSV
    const header = Object.keys(inventory[0]).map((key) => ({ id: key, title: key }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header,
    });

    await csvWriter.writeRecords(updatedInventory);

    res.json({ message: "Stock updated successfully", data: updatedInventory });
  } catch (err) {
    console.error("Error updating stock:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Failed to update stock" });
  }
}

module.exports = { getAdminInventory, loadStock, updateStock };
