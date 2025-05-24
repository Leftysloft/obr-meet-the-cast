// collecting-logs.js

// Create an array to store logs
let capturedLogs = [];

// Save the original console methods to call them later
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;
const originalDebug = console.debug;

// Override console methods to capture logs dynamically
console.log = function (...args) {
  capturedLogs.push({ type: "log", message: args });
  originalLog.apply(console, args);
};

console.warn = function (...args) {
  capturedLogs.push({ type: "warn", message: args });
  originalWarn.apply(console, args);
};

console.error = function (...args) {
  capturedLogs.push({ type: "error", message: args });
  originalError.apply(console, args);
};

console.info = function (...args) {
  capturedLogs.push({ type: "info", message: args });
  originalInfo.apply(console, args);
};

console.debug = function (...args) {
  capturedLogs.push({ type: "debug", message: args });
  originalDebug.apply(console, args);
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
