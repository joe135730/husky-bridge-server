import express from "express";
import Report from "./schema.js";
import mongoose from "mongoose";
import postSchema from "../Posts/schema.js";  
import { authenticateUser, isAdmin } from "../middleware/auth.js";

// Create the Post model directly since it seems the export might be different
const Post = mongoose.model("Post", postSchema);

const router = express.Router();

// Get all reports (admin only)
router.get("/reports", authenticateUser, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find({ status: "Pending" })
      .populate("post")
      .populate("reportedBy", "username")
      .sort({ reportedDate: -1 });

    const formattedReports = reports.map(report => ({
      _id: report.post._id,
      title: report.post.title,
      author: {
        _id: report.post.author,
        username: report.post.authorName
      },
      reportedDate: report.reportedDate,
      reportReason: report.reason,
      reportId: report._id
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific reported post (admin only)
router.get("/reports/:postId", authenticateUser, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Find the most recent report for this post
    const report = await Report.findOne({ post: postId, status: "Pending" })
      .sort({ reportedDate: -1 });
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    // Return the post data with report details
    const reportedPost = {
      _id: post._id,
      title: post.title,
      author: {
        _id: post.author,
        username: post.authorName
      },
      reportedDate: report.reportedDate,
      reportReason: report.reason,
      category: post.category,
      location: post.location,
      startDate: post.startDate,
      endDate: post.endDate,
      description: post.description
    };
    
    res.json(reportedPost);
  } catch (error) {
    console.error("Error fetching reported post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// A more lenient authentication middleware for reports
const reportAuth = (req, res, next) => {
  // Access session and check for user
  if (!req.session) {
    console.error("Session middleware not initialized");
    // Continue anyway for now to ease debugging
    req.user = { _id: "anonymous" };
    return next();
  }
  
  if (!req.session.currentUser) {
    console.error("No user in session");
    // Allow the request but mark it as anonymous
    req.user = { _id: "anonymous" };
    return next();
  }
  
  // Normal authentication flow
  req.user = req.session.currentUser;
  return next();
};

// Report a post - using more flexible auth
router.post("/posts/:postId/report", reportAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, comments } = req.body;
    
    // Create a user ID - use anonymous for unauthenticated requests
    const userId = req.user._id || "anonymous";
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Create the report
    const report = new Report({
      post: postId,
      reportedBy: userId,
      reason,
      comments,
    });
    
    await report.save();
    
    res.status(201).json({ message: "Post reported successfully" });
  } catch (error) {
    console.error("Error in report route:", error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid report data", 
        error: error.message 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid post ID format", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Error processing report", 
      error: error.message 
    });
  }
});

// Keep a reported post (mark as reviewed)
router.post("/reports/:postId/keep", authenticateUser, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Update all pending reports for this post to reviewed
    await Report.updateMany(
      { post: postId, status: "Pending" },
      { status: "Reviewed" }
    );
    
    res.json({ message: "Post kept and reports marked as reviewed" });
  } catch (error) {
    console.error("Error keeping post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a reported post
router.delete("/reports/:postId", authenticateUser, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    // Update all reports for this post to deleted
    await Report.updateMany(
      { post: postId, status: "Pending" },
      { status: "Deleted" }
    );
    
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting reported post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a test endpoint to verify authentication
router.get("/reports-auth-test", authenticateUser, async (req, res) => {
  res.status(200).json({ 
    message: "Authentication successful", 
    user: {
      id: req.user._id,
      role: req.user.role
    },
    isAdmin: req.user.role.toUpperCase() === 'ADMIN'
  });
});

export default router; 