// collecting-logs.js

// Create an array to store logs
let capturedLogs = [];

// Save the original console.log method to call it later
const originalLog = console.log;

// Override console.log to capture logs dynamically
console.log = function (...args) {
  capturedLogs.push(args); // Store the log message in the array
  originalLog.apply(console, args); // Optionally call the original console.log as well to still log to the console
};

// Function to get the captured logs at any point
function getCapturedLogs() {
  return capturedLogs;
}

// Optional: Function to verify if specific logs are present dynamically
function verifyLogs() {
  if (capturedLogs.length > 0) {
    console.log("Logs captured:", capturedLogs);
  } else {
    console.log("No logs captured yet.");
  }
}
