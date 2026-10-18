
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const app = require("./app");

const PORT = process.env.PORT || 5000;

console.log(
  "Gemini API key loaded:",
  Boolean(process.env.GEMINI_API_KEY)
);

// Local development server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevAccess server running on port ${PORT}`);
  });
}

module.exports = app;
