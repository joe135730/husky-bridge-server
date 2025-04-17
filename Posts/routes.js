import * as dao from "./dao.js";

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
                createdAt: new Date(),
                updatedAt: new Date()
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

    // Get posts by user ID
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

    // Get post by ID
    const findPostById = async (req, res) => {
        try {
            const post = await dao.findPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            res.json(post);
        } catch (error) {
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

            if (post.userId !== currentUser._id) {
                return res.status(403).json({ message: "Not authorized to delete this post" });
            }

            await dao.deletePost(req.params.id);
            res.json({ message: "Post deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting post" });
        }
    };
    app.delete("/api/posts/:id", deletePost);

    // Mark post as completed
    const markPostAsCompleted = async (req, res) => {
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

            const updatedPost = await dao.markPostAsCompleted(req.params.id);
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error completing post" });
        }
    };
    app.put("/api/posts/:id/complete", markPostAsCompleted);

    // Accept post
    const acceptPost = async (req, res) => {
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
                return res.status(400).json({ message: "Cannot accept your own post" });
            }

            const updatedPost = await dao.acceptPost(req.params.id, currentUser._id);
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: "Error accepting post" });
        }
    };
    app.put("/api/posts/:id/accept", acceptPost);

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
} 