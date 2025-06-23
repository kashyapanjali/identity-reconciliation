const express = require("express");
const app = express();
require("dotenv").config();

app.use(express.json());

const identifyRoutes = require("./routes/identify");
app.use("/api/identify", identifyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
