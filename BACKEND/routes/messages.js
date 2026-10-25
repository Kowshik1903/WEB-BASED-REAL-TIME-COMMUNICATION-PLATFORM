const router = require("express").Router();
const Message = require("../models/message");
const User = require("../models/user");
const auth = require("../middleware/auth");

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const ATTACHMENT_TYPES = new Set(["image", "gif", "document", "location"]);
const SAFE_DOCUMENT_DATA_URL = /^data:(?:application\/(?:pdf|msword|vnd\.openxmlformats-officedocument\.(?:wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-(?:excel|powerpoint)|octet-stream)|text\/plain);/i;

function normaliseAttachments(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) {
    throw new Error(`You can send up to ${MAX_ATTACHMENTS} attachments at once.`);
  }

  let totalBytes = 0;
  return value.map((item) => {
    if (!item || typeof item !== "object" || !ATTACHMENT_TYPES.has(item.type)) {
      throw new Error("One or more attachments are invalid.");
    }

    const type = item.type;
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 180) : "";
    const mimeType = typeof item.mimeType === "string" ? item.mimeType.slice(0, 120) : "";
    const size = Number.isFinite(item.size) && item.size >= 0 ? Math.floor(item.size) : 0;

    if (type === "location") {
      const latitude = Number(item.location?.latitude);
      const longitude = Number(item.location?.longitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error("The shared location is invalid.");
      }
      return {
        type,
        name: name || "Current location",
        location: {
          latitude,
          longitude,
          label: typeof item.location?.label === "string" ? item.location.label.trim().slice(0, 120) : "",
        },
      };
    }

    const url = typeof item.url === "string" ? item.url : "";
    const isDataUrl = /^data:[a-z0-9/+.-]+(?:;[a-z0-9=.-]+)*,.*$/i.test(url);
    const isSecureUrl = /^https:\/\//i.test(url);
    const validImageData = /^data:image\//i.test(url);

    if (!url || (!isDataUrl && !(type === "gif" && isSecureUrl))) {
      throw new Error("Attachments must use an image, file, or secure GIF URL.");
    }
    if ((type === "image" || type === "gif") && isDataUrl && !validImageData) {
      throw new Error("Images and GIFs must have an image MIME type.");
    }
    if (type === "document" && isDataUrl && !SAFE_DOCUMENT_DATA_URL.test(url)) {
      throw new Error("That document type is not supported.");
    }
    if (url.length > MAX_ATTACHMENT_BYTES * 1.4 || size > MAX_ATTACHMENT_BYTES) {
      throw new Error("Each attachment must be 6 MB or smaller.");
    }

    totalBytes += Math.max(size, Math.ceil(url.length * 0.75));
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new Error("The attachments in one message are too large.");
    }

    return { type, name, url, mimeType, size };
  });
}

router.get("/:receiver", auth, async (req, res) => {
  try {
    const { receiver } = req.params;
    const sender = req.user.username;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(500);

    res.json(messages);
  } catch (err) {
    console.error("messages.get.error", err.message);
    res.status(500).json({ error: "Could not load messages" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { receiver, text, content, attachments } = req.body;
    const messageText = typeof text === "string" ? text : typeof content === "string" ? content : "";
    const cleanedText = messageText.trim();
    const cleanedAttachments = normaliseAttachments(attachments);

    if (typeof receiver !== "string" || !receiver.trim()) {
      return res.status(400).json({ error: "A message recipient is required." });
    }
    if (!cleanedText && cleanedAttachments.length === 0) {
      return res.status(400).json({ error: "Write a message or add an attachment." });
    }
    if (cleanedText.length > 2000) {
      return res.status(400).json({ error: "Messages can be up to 2,000 characters." });
    }

    const recipient = receiver.trim();
    const recipientExists = await User.exists({ username: recipient });
    if (!recipientExists) {
      return res.status(404).json({ error: "That chat recipient no longer exists." });
    }

    const message = await Message.create({
      sender: req.user.username,
      receiver: recipient,
      text: cleanedText,
      attachments: cleanedAttachments,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("messages.create.error", err.message);
    if (/attachment|location|6 MB|too large/i.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Could not save message" });
  }
});

module.exports = router;
