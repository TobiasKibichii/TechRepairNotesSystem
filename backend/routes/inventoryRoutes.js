const express = require('express');
const { getAdminInventory, loadStock, updateStock } = require('../controllers/inventoryController');
const verifyJWT = require('../middleware/verifyJWT');

const router = express.Router();



router.get('/admin', getAdminInventory);
router.get('/loadStock', loadStock);
router.post('/updateStock', updateStock);

module.exports = router;
