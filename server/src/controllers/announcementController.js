import Announcement from "../models/Announcement.js";

// @desc    Create new announcement & Push Live
// @route   POST /api/announcements
// @access  Private/Admin
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and Message are required" });
    }

    const announcement = await Announcement.create({
      title,
      message,
      type: type || "info",
      createdBy: req.user._id,
    });

    // 🔥 LIVE PUSH LOGIC
    // server.js mein humne app.set("socketio", io) kiya tha
    const io = req.app.get("socketio");
    
    io.emit("new-announcement", {
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      createdAt: announcement.createdAt,
      _id: announcement._id
    });

    res.status(201).json({
      success: true,
      message: "Announcement broadcasted successfully",
      announcement
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest announcements
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(15);

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    await announcement.deleteOne();
    res.status(200).json({ success: true, message: "Announcement removed" });
  } catch (error) {
    next(error);
  }
};