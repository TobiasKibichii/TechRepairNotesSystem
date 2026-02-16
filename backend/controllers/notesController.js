const Note = require("../models/Note");
const User = require("../models/User");
const Notification = require("../models/Notification");
const OpenAI = require("openai");

console.log(
  "🔑 Using API Key:",
  process.env.OPENAI_API_KEY ? "Loaded ✅" : "Missing ❌",
);

// Initialize OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to categorize issue and suggest cause
const categorizeIssue = async (title, description, deviceType) => {
  const prompt = `
You are an intelligent repair triage assistant for a tech repair shop.

Your job: 
1️⃣ Classify the issue into one of these categories:
   [Screen, Battery, Network, Software, Hardware, Power, Other]

2️⃣ Suggest a possible cause in one short, technician-friendly sentence.

Guidelines:
- Screen: cracked, flickering, glitching, dim display, touch issues.
- Battery: not charging, drains fast, battery swollen, overheating.
- Network: Wi-Fi, Bluetooth, signal, or connectivity issues.
- Software: app crashes, OS errors, boot loops, slow performance.
- Hardware: buttons, speakers, ports, cameras, sensors, motherboard.
- Power: won’t turn on, shuts down, no LED, charging light absent.
- If unclear, choose "Other" but still give a possible cause.

Device: ${deviceType}
Issue title: ${title}
Description: ${description}

Respond in JSON format with two fields:
{
  "category": "<category>",
  "possibleCause": "<short cause>"
}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content);
  return response;
};

/* -------------------- GET All Notes -------------------- */
const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("assignedEmployee", "username email")
      .lean();

    if (!notes?.length) {
      return res.status(400).json({ message: "No repair requests found" });
    }

    res.json(notes);
  } catch (error) {
    console.error("❌ Error fetching notes:", error);
    res.status(500).json({ message: "Server error retrieving notes" });
  }
};

/* -------------------- CREATE New Note -------------------- */
const createNewNote = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      deviceType,
      title,
      text,
      images,
      assignedEmployee,
    } = req.body;

    if (!customerName || !customerPhone || !deviceType || !title || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Determine status
    const hasAssignedEmployee =
      assignedEmployee && assignedEmployee.trim() !== "";
    const noteStatus = hasAssignedEmployee ? "Assigned" : "Pending";

    /* ---------- 🧠 AI Smart Categorization (NON-BLOCKING) ---------- */
    let category = "Other";
    let possibleCause = "Not specified";

    try {
      const aiResult = await categorizeIssue(title, text, deviceType);
      category = aiResult?.category || category;
      possibleCause = aiResult?.possibleCause || possibleCause;
    } catch (aiError) {
      console.error("⚠️ AI categorization failed:", aiError.message);
      // Continue without AI
    }

    // Save new note
    const note = await Note.create({
      customerName,
      customerPhone,
      customerEmail,
      deviceType,
      issueTitle: title,
      issueDescription: text,
      images,
      status: noteStatus,
      category,
      possibleCause,
      assignedEmployee: hasAssignedEmployee ? assignedEmployee : null,
    });

    /* -------------------- 🔔 Notification Handling -------------------- */
    if (hasAssignedEmployee) {
      const user = await User.findById(assignedEmployee).lean();
      if (user) {
        const message = `A new repair task has been created and assigned to you: ${
          note.issueTitle || note.deviceType
        }`;

        const notification = await Notification.create({
          user: assignedEmployee,
          message,
        });

        const io = req.app.get("io");
        if (io) {
          const onlineUsers = io.onlineUsers || new Map();
          const recipientSocket = onlineUsers.get(assignedEmployee.toString());

          if (recipientSocket) {
            io.to(recipientSocket).emit("getNotification", {
              recipientId: assignedEmployee.toString(),
              message,
              noteId: note._id,
              notificationId: notification._id,
            });
          }
        }
      }
    }

    res.status(201).json({
      message: hasAssignedEmployee
        ? "Repair request created and assigned successfully"
        : "Repair request submitted successfully",
      note,
    });
  } catch (error) {
    console.error("❌ Error creating note:", error);
    res.status(500).json({ message: "Server error creating note" });
  }
};

/* -------------------- ASSIGN or UPDATE Note -------------------- */
const assignNote = async (req, res) => {
  try {
    const { id, assignedEmployee, status, comments } = req.body;
    console.log("🐘 Assign Request:", req.body);

    if (!id) return res.status(400).json({ message: "Note ID required" });

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (assignedEmployee) note.assignedEmployee = assignedEmployee;
    if (status) note.status = status;
    if (comments) note.comments = comments;

    const updatedNote = await note.save();

    // 🔔 Notify assigned employee
    if (assignedEmployee) {
      const user = await User.findById(assignedEmployee).lean();
      if (user) {
        const message = `A new repair task has been assigned to you: ${note.issueTitle || note.deviceType}`;

        const notification = await Notification.create({
          user: assignedEmployee,
          message,
        });

        const io = req.app.get("io");
        if (io) {
          const onlineUsers = io.onlineUsers || new Map();
          const recipientSocket = onlineUsers.get(assignedEmployee.toString());

          if (recipientSocket) {
            io.to(recipientSocket).emit("getNotification", {
              recipientId: assignedEmployee.toString(),
              message,
              noteId: note._id,
              notificationId: notification._id,
            });
            console.log(`📨 Sent notification to ${assignedEmployee}`);
          } else {
            console.log(`⚠️ User ${assignedEmployee} not connected`);
          }
        }
      }
    }

    res.json({
      message: "Repair task updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    console.error("❌ Error assigning note:", error);
    res.status(500).json({ message: "Server error updating note" });
  }
};

/* -------------------- DELETE Note -------------------- */
const deleteNote = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Note ID required" });

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    await note.deleteOne();
    res.json({ message: `Repair request '${note.deviceType}' deleted` });
  } catch (error) {
    console.error("❌ Error deleting note:", error);
    res.status(500).json({ message: "Server error deleting note" });
  }
};

module.exports = {
  getAllNotes,
  createNewNote,
  assignNote,
  deleteNote,
};
