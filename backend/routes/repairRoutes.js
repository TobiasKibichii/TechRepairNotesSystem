const express = require("express");
const { completeRepair } = require("../controllers/repairController");

const router = express.Router();

router.post("/complete", completeRepair);

module.exports = router;
