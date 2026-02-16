const express = require("express");
const { exec } = require("child_process");
const router = express.Router();

router.post("/triage", (req, res) => {
  const { issueText } = req.body;
  if (!issueText) return res.status(400).json({ message: "Issue text required" });

  // Call Python script to predict category & cause
  const py = exec(`python3 triage_predict.py "${issueText.replace(/"/g, '')}"`);

  let output = "";

  py.stdout.on("data", (data) => { output += data.toString(); });
  py.stderr.on("data", (err) => console.error(err));

  py.on("close", () => {
    res.json({ triageResult: output.trim() });
  });
});

module.exports = router;
