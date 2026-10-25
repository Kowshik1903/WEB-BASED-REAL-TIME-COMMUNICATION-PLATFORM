const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "gif", "document", "location"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    url: {
      type: String,
      maxlength: 9 * 1024 * 1024,
      default: "",
    },
    mimeType: {
      type: String,
      maxlength: 120,
      default: "",
    },
    size: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      label: { type: String, trim: true, maxlength: 120, default: "" },
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    receiver: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
