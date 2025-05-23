import * as dao from "./dao.js";
import { findUserById } from "../Users/dao.js";

export default function PostRoutes(app) {
    // Create a new post
    const createPost = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.createPost({
                ...req.body,
                userId: currentUser._id,
                status: 'Pending',
                createdAt: new Date(),
                updatedAt: new Date(),
                participants: [],
                selectedParticipantId: null,
                ownerCompleted: false,
                participantCompleted: false
            });
            res.json(post);
        } catch (error) {
            console.error("Create post error:", error);
            res.status(500).json({ message: "Error creating post" });
        }
    };
    app.post("/api/posts", createPost);

    // Get all posts
    const findAllPosts = async (req, res) => {
        try {
            const posts = await dao.findAllPosts();
            res.json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving posts" });
        }
    };
    app.get("/api/posts", findAllPosts);

    // Get posts by user ID (posts created by the user)
    const findPostsByUserId = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const posts = await dao.findPostsByUserId(currentUser._id);
            res.json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving user posts" });
        }
    };
    app.get("/api/posts/user", findPostsByUserId);

    // Get posts where user is participating (either as owner or participant)
    const findPostsByParticipant = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const posts = await dao.findPostsByParticipant(currentUser._id);
            res.json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving participating posts" });
        }
    };
    app.get("/api/posts/participating", findPostsByParticipant);

    // Get post by ID
    const findPostById = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"] || null;
            const post = await dao.findPostById(req.params.id);
            
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Add user relationship context to the response
            if (currentUser) {
                // If the user is the post owner
                if (post.userId === currentUser._id) {
                    post._doc.userRelationship = "owner";
                } 
                // If the user is the selected participant
                else if (post.selectedParticipantId === currentUser._id) {
                    post._doc.userRelationship = "selected";
                    
                    // Find the user's participant record
                    const participant = post.participants.find(p => p.userId === currentUser._id);
                    if (participant) {
                        post._doc.userParticipantStatus = participant.status;
                    }
                } 
                // If the user is a participant but not selected
                else if (post.participants.some(p => p.userId === currentUser._id)) {
                    post._doc.userRelationship = "participant";
                    
                    // Find the user's participant record
                    const participant = post.participants.find(p => p.userId === currentUser._id);
                    if (participant) {
                        post._doc.userParticipantStatus = participant.status;
                    }
                } 
                // If the user has no relationship with the post
                else {
                    post._doc.userRelationship = "none";
                }
            } else {
                post._doc.userRelationship = "none";
            }
            
            res.json(post);
        } catch (error) {
            console.error("Error retrieving post:", error);
            res.status(500).json({ message: "Error retrieving post" });
        }
    };
    app.get("/api/posts/:id", findPostById);

    // Update post
    const updatePost = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            if (post.userId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to update this post" });
            }

            const updatedPost = await dao.updatePost(req.params.id, {
                ...req.body,
                updatedAt: new Date()
            });
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error updating post" });
        }
    };
    app.put("/api/posts/:id", updatePost);

    // Delete post
    const deletePost = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Only allow post owner to delete
            if (post.userId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to delete this post" });
            }

            // Check if post has active participants
            if (post.status === 'In Progress' || post.status === 'Wait for Complete') {
                return res.status(400).json({ 
                    message: "Cannot delete post with active participants. Please complete or cancel the post first." 
                });
            }

            await dao.deletePost(req.params.id);
            res.json({ message: "Post deleted successfully" });
        } catch (error) {
            console.error("Delete post error:", error);
            res.status(500).json({ message: "Error deleting post" });
        }
    };
    app.delete("/api/posts/:id", deletePost);

    // Mark post as completed by owner
    const markPostAsCompletedByOwner = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            if (post.userId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to complete this post" });
            }

            const updatedPost = await dao.markPostAsCompletedByOwner(req.params.id);
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error completing post" });
        }
    };
    app.put("/api/posts/:id/complete-owner", markPostAsCompletedByOwner);

    // Mark post as completed by participant
    const markPostAsCompletedByParticipant = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Check if current user is the selected participant
            if (post.selectedParticipantId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to complete this post" });
            }

            const updatedPost = await dao.markPostAsCompletedByParticipant(req.params.id, currentUser._id);
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error completing post" });
        }
    };
    app.put("/api/posts/:id/complete-participant", markPostAsCompletedByParticipant);

    // Express interest in a post (add participant)
    const addParticipant = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            if (post.userId === currentUser._id) {
                return res.status(400).json({ message: "Cannot participate in your own post" });
            }

            const updatedPost = await dao.addParticipant(req.params.id, currentUser._id);
            if (!updatedPost) {
                return res.status(400).json({ message: "Already participating in this post" });
            }
            
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error expressing interest in post" });
        }
    };
    app.put("/api/posts/:id/participate", addParticipant);

    // Select a participant (post owner accepting a participant)
    const selectParticipant = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            if (post.userId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to select participants for this post" });
            }

            // Check if the participant exists in the post
            const participantId = req.params.participantId;
            const participantExists = post.participants.some(p => p.userId === participantId);
            
            if (!participantExists) {
                return res.status(404).json({ message: "Participant not found" });
            }

            const updatedPost = await dao.selectParticipant(req.params.id, participantId);
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error selecting participant" });
        }
    };
    app.put("/api/posts/:id/select/:participantId", selectParticipant);

    // Get pending participants for a post
    const getPendingParticipants = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Get user details for each participant
            const participantsWithDetails = await Promise.all(
                post.participants.map(async (participant) => {
                    const user = await findUserById(participant.userId);
                    console.log("Found user:", user); // Debug log
                    return {
                        ...participant.toObject(),
                        user: user ? {
                            _id: user._id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email
                        } : null
                    };
                })
            );

            res.json(participantsWithDetails);
        } catch (error) {
            console.error("Error retrieving participants:", error);
            res.status(500).json({ message: "Error retrieving participants" });
        }
    };
    app.get("/api/posts/:id/participants", getPendingParticipants);

    // Find posts with filters
    const findPostsWithFilters = async (req, res) => {
        try {
            const posts = await dao.findPostsWithFilters(req.query);
            res.json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving filtered posts" });
        }
    };
    app.get("/api/posts/filter", findPostsWithFilters);

    // Mark post as complete by either owner or participant
    app.put('/api/posts/:id/mark-complete', async (req, res) => {
        try {
            const postId = req.params.id;
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Check if user is either owner or selected participant
            const isOwner = post.userId === currentUser._id;
            const isParticipant = post.participants.some(p => p.userId === currentUser._id);

            if (!isOwner && !isParticipant) {
                return res.status(403).json({ message: 'Not authorized to mark this post as complete' });
            }

            const selectedParticipant = post.participants.find(p => p.userId === post.selectedParticipantId);
            if (!selectedParticipant) {
                return res.status(400).json({ message: 'No selected participant found' });
            }

            // Update completion status based on user role
            if (isOwner) {
                // Owner marking complete
                post.ownerCompleted = true;
                
                // If participant is already in Wait for Complete, mark both as Complete
                if (selectedParticipant.status === 'Wait for Complete') {
                    post.status = 'Complete';
                    selectedParticipant.status = 'Complete';
                } else {
                    // Participant is still In Progress
                    post.status = 'Wait for Complete';
                    // Keep participant status as is (In Progress)
                }
            } else if (isParticipant) {
                // Participant marking complete
                const participant = post.participants.find(p => p.userId === currentUser._id);
                if (participant) {
                    // If owner has already completed
                    if (post.ownerCompleted) {
                        post.status = 'Complete';
                        participant.status = 'Complete';
                    } else {
                        // Owner hasn't completed yet
                        post.status = 'Wait for Complete';
                        participant.status = 'Wait for Complete';
                        // Note: Owner status implicitly remains 'In Progress'
                    }
                    participant.completedAt = new Date();
                }
            }

            // Save the updated post
            const updatedPost = await dao.updatePost(postId, post);
            res.json(updatedPost);
        } catch (error) {
            console.error('Error marking post as complete:', error);
            res.status(500).json({ message: 'Error marking post as complete' });
        }
    });

    // Get posts by category
    const findPostsByCategory = async (req, res) => {
        try {
            const { category } = req.params;
            const posts = await dao.findPostByCategory(category);
            res.json(posts);
        } catch (error) {
            console.error("Find posts by category error:", error);
            res.status(500).json({ message: "Error retrieving posts by category" });
        }
    };
    app.get("/api/posts/category/:category", findPostsByCategory);

    // Find posts by multiple categories
    const findPostsByCategories = async (req, res) => {
        try {
            const { categories } = req.body;
            if (!categories || !Array.isArray(categories)) {
                return res.status(400).json({ message: "Categories must be provided as an array" });
            }
            const posts = await dao.findPostsByCategories(categories);
            res.json(posts);
        } catch (error) {
            console.error("Error retrieving posts by categories:", error);
            res.status(500).json({ message: "Error retrieving posts by categories" });
        }
    };
    app.post("/api/posts/categories", findPostsByCategories);

    const findPostsByTitle = async (req, res) => {
        try{
            const { title } = req.params;
            const posts = await dao.findPostsByTitle(title);
            res.json(posts);
        } catch (error) {
            console.error("Error retrieving posts by title:", error);
            res.status(500).json({ message: "Error retrieving posts by title" });
        }
    };
    app.get("/api/posts/title/:title", findPostsByTitle);

    // Remove a participant from a post
    const removeParticipant = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Only allow post owner to remove participants
            if (post.userId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to remove participants" });
            }

            // Remove the participant
            post.participants = post.participants.filter(
                p => p.userId !== req.params.participantId
            );

            // If this was the selected participant, clear that as well
            if (post.selectedParticipantId === req.params.participantId) {
                post.selectedParticipantId = null;
                post.status = 'Pending'; // Reset status if selected participant is removed
            }

            const updatedPost = await dao.updatePost(req.params.id, post);
            res.json(updatedPost);
        } catch (error) {
            console.error("Error removing participant:", error);
            res.status(500).json({ message: "Error removing participant" });
        }
    };
    app.delete("/api/posts/:id/participants/:participantId", removeParticipant);

    // Remove a post from My Posts (for participants who weren't selected)
    const removePostFromMyPosts = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Check if the user is a participant
            const isParticipant = post.participants.some(p => p.userId === currentUser._id);
            if (!isParticipant) {
                return res.status(403).json({ message: "Not authorized to remove this post" });
            }

            // Only allow removal if user is not the selected participant
            if (post.selectedParticipantId === currentUser._id) {
                return res.status(400).json({ 
                    message: "Cannot remove post - you are the selected participant" 
                });
            }

            const updatedPost = await dao.removePostFromMyPosts(req.params.id, currentUser._id);
            res.json(updatedPost);
        } catch (error) {
            console.error("Error removing post from My Posts:", error);
            res.status(500).json({ message: "Error removing post from My Posts" });
        }
    };
    app.put("/api/posts/:id/remove-from-my-posts", removePostFromMyPosts);

    // Cancel an active collaboration (for post owner or selected participant)
    const cancelCollaboration = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Check if user is post owner or selected participant
            const isOwner = post.userId === currentUser._id;
            const isSelectedParticipant = post.selectedParticipantId === currentUser._id;
            
            if (!isOwner && !isSelectedParticipant) {
                return res.status(403).json({ 
                    message: "Not authorized to cancel this collaboration" 
                });
            }

            // Only allow cancellation in certain post statuses
            if (post.status !== 'In Progress' && post.status !== 'Wait for Complete') {
                return res.status(400).json({ 
                    message: "Can only cancel active collaborations" 
                });
            }

            const updatedPost = await dao.cancelCollaboration(req.params.id, currentUser._id);
            res.json(updatedPost);
        } catch (error) {
            console.error("Error cancelling collaboration:", error);
            res.status(500).json({ message: "Error cancelling collaboration" });
        }
    };
    app.put("/api/posts/:id/cancel-collaboration", cancelCollaboration);

    // Remove a completed post from participant's view (without changing post status)
    const removeCompletedPost = async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            // Check if the user is a participant in a completed post
            const isParticipant = post.participants.some(p => p.userId === currentUser._id);
            if (!isParticipant) {
                return res.status(403).json({ message: "Not authorized to remove this post" });
            }

            // Only allow removal if the post is complete
            if (post.status !== 'Complete') {
                return res.status(400).json({ 
                    message: "Only completed posts can be removed this way" 
                });
            }

            const updatedPost = await dao.removeCompletedPost(req.params.id, currentUser._id);
            res.json(updatedPost);
        } catch (error) {
            console.error("Error removing completed post:", error);
            res.status(500).json({ message: "Error removing completed post" });
        }
    };
    app.put("/api/posts/:id/remove-completed-post", removeCompletedPost);
} 