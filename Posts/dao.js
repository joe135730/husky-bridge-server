import model from "./model.js";

// Create a new post
export const createPost = (post) => model.create(post);

// Find all posts
export const findAllPosts = () => model.find();

// Find posts by user ID (posts created by the user)
export const findPostsByUserId = (userId) => model.find({ userId });

// Find posts where user is participating (either as owner or participant)
export const findPostsByParticipant = (userId) => model.find({
    $or: [
        { userId },
        { "participants.userId": userId }
    ]
});

// Find post by ID
export const findPostById = (postId) => model.findOne({ _id: postId });

// Update post
export const updatePost = (postId, post) => 
    model.findOneAndUpdate({ _id: postId }, { $set: post }, { new: true });

// Delete post
export const deletePost = (postId) => model.deleteOne({ _id: postId });

// Mark post as completed by owner
export const markPostAsCompletedByOwner = (postId) => 
    model.findOneAndUpdate(
        { _id: postId },
        { $set: { ownerCompleted: true } },
        { new: true }
    ).then(post => {
        // If both owner and participant have marked as complete, update post status
        if (post.ownerCompleted && post.participantCompleted) {
            return model.findOneAndUpdate(
                { _id: postId },
                { $set: { status: 'Complete' } },
                { new: true }
            );
        }
        return post;
    });

// Mark post as completed by participant
export const markPostAsCompletedByParticipant = (postId, userId) => 
    model.findOneAndUpdate(
        { 
            _id: postId, 
            "participants.userId": userId,
            selectedParticipantId: userId
        },
        { 
            $set: { 
                participantCompleted: true,
                "participants.$.status": "Complete",
                "participants.$.completedAt": new Date()
            } 
        },
        { new: true }
    ).then(post => {
        // If both owner and participant have marked as complete, update post status
        if (post && post.ownerCompleted && post.participantCompleted) {
            return model.findOneAndUpdate(
                { _id: postId },
                { $set: { status: 'Complete' } },
                { new: true }
            );
        }
        return post;
    });

// Add a participant to a post (user expressing interest)
export const addParticipant = (postId, userId) =>
    model.findOneAndUpdate(
        { 
            _id: postId,
            userId: { $ne: userId }, // Can't participate in own post
            "participants.userId": { $ne: userId } // Don't add if already a participant
        },
        { 
            $push: { 
                participants: { 
                    userId, 
                    status: 'Pending',
                    completedAt: null
                } 
            } 
        },
        { new: true }
    );

// Select a participant (post owner accepting a participant)
export const selectParticipant = async (postId, participantId) => {
  try {
    // First update the selected participant to In Progress
    const post = await model.findOneAndUpdate(
      { _id: postId },
      { 
        $set: { 
          selectedParticipantId: participantId,
          status: 'In Progress',
          "participants.$[elem].status": 'In Progress'
        } 
      },
      { 
        new: true,
        arrayFilters: [{ "elem.userId": participantId }]
      }
    );
    
    if (!post) return null;

    // Then update all other participants to Not Selected
    return model.findOneAndUpdate(
      { _id: postId },
      { 
        $set: { 
          "participants.$[elem].status": 'Not Selected'
        } 
      },
      { 
        new: true,
        arrayFilters: [{ "elem.userId": { $ne: participantId } }]
      }
    );
  } catch (error) {
    console.error("Error selecting participant:", error);
    throw error;
  }
};

// Remove a post from My Posts (for not selected participants)
export const removePostFromMyPosts = async (postId, userId) => {
  try {
    return model.findOneAndUpdate(
      { 
        _id: postId,
        "participants.userId": userId
      },
      { 
        $pull: { 
          participants: { userId }
        } 
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error removing post from My Posts:", error);
    throw error;
  }
};

// Get all pending participants for a post
export const getPendingParticipants = (postId) =>
    model.findOne(
        { _id: postId },
        { participants: 1 }
    );

// Find posts with filters
export const findPostsWithFilters = (filters) => {
    const query = {};
    
    if (filters.postType) query.postType = filters.postType;
    if (filters.category) query.category = filters.category;
    if (filters.location) query.location = filters.location;
    if (filters.status) query.status = filters.status;
    
    // Date filters
    if (filters.dateRange) {
        const date = new Date();
        date.setDate(date.getDate() - filters.dateRange);
        query.createdAt = { $gte: date };
    }
    
    return model.find(query).sort({ createdAt: filters.sort === 'oldest' ? 1 : -1 });
};

// Find posts by category
export const findPostByCategory = (category) => 
    model.find({ category }).sort({ createdAt: -1 });

// Find posts by multiple categories
export const findPostsByCategories = async (categories) => {
    try {
        const postsPromises = categories.map(category => findPostByCategory(category));
        const postsResults = await Promise.all(postsPromises);
        return postsResults.flat();
    } catch (error) {
        console.error('Error fetching posts by categories:', error);
        throw error;
    }
};

// Find posts by title (case-insensitive search)
export const findPostsByTitle = (title) => {
    try {
        return model.find({ 
            title: { $regex: title, $options: 'i' } 
        }).sort({ createdAt: -1 });
    } catch (error) {
        console.error('Error fetching posts by title:', error);
        throw error;
    }
}; 