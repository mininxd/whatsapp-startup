// This code will logs any message received, best for debugging

export default async function debugLogger(sock, msg, rawText) {
  try {
    const jid = msg.key.remoteJid;
    const fromMe = msg.key.fromMe;
    const pushName = msg.pushName || "Unknown";

    // Detect message type
    const messageType = Object.keys(msg.message)[0];

    console.log("=== [DEBUG MESSAGE] ===");
    console.log("From:", jid, `(${pushName})`);
    console.log("From Me?:", fromMe);
    console.log("Message Type:", messageType);
    console.log("Text/Caption:", rawText);
    console.log("Timestamp:", msg.messageTimestamp);
    console.log("=======================");

  } catch (error) {
    console.error("[DEBUG ERROR] Failed to log message:", error.message);
  }
}