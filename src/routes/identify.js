const express = require("express");
const router = express.Router();
const { identifyUser } = require("../controllers/identifyController");

router.post("/", identifyUser);

module.exports = router;
