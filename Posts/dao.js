import model from "./model.js";

// Create a new post
export const createPost = (post) => model.create(post);

// Find all posts
export const findAllPosts = () => model.find();

// Find posts by user ID
export const findPostsByUserId = (userId) => model.find({ userId });

// Find post by ID
export const findPostById = (postId) => model.findOne({ _id: postId });

// Update post
export const updatePost = (postId, post) => 
    model.findOneAndUpdate({ _id: postId }, { $set: post }, { new: true });

// Delete post
export const deletePost = (postId) => model.deleteOne({ _id: postId });

// Mark post as completed
export const markPostAsCompleted = (postId) => 
    model.findOneAndUpdate(
        { _id: postId },
        { $set: { isCompleted: true, status: 'completed' } },
        { new: true }
    );

// Accept post
export const acceptPost = (postId, acceptedByUserId) =>
    model.findOneAndUpdate(
        { _id: postId },
        { $set: { acceptedBy: acceptedByUserId, status: 'pending' } },
        { new: true }
    );

// Find posts with filters
export const findPostsWithFilters = (filters) => {
    const query = {};
    
    if (filters.postType) query.postType = filters.postType;
    if (filters.category) query.category = filters.category;
    if (filters.location) query.location = filters.location;
    if (filters.isCompleted !== undefined) query.isCompleted = filters.isCompleted;
    if (filters.status) query.status = filters.status;
    
    // Date filters
    if (filters.dateRange) {
        const date = new Date();
        date.setDate(date.getDate() - filters.dateRange);
        query.createdAt = { $gte: date };
    }
    
    return model.find(query).sort({ createdAt: filters.sort === 'oldest' ? 1 : -1 });
}; 