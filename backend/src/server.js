// Load environment variables from .env file
require("dotenv").config();

// Import the Express application configuration
const app = require("./app");

// Define the port from environment variable or default to 4000
const PORT = process.env.PORT || 4000;

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
