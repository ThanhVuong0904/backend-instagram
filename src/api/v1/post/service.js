const { ObjectId } = require("mongodb");
const Post = require("../../../model/Post");
const PostReaction = require("../../../model/PostReaction");
const User = require("../../../model/User");
const Follow = require("../../../model/Follow");
const cloudinary = require("../../../utils/cloudinary");
const createError = require("http-errors");

const getPosts = async (req, next) => {
    try {
        const perPage = req.query.perPage || 10; // số lượng sản phẩm xuất hiện trên 1 page
        const page = req.query.page || 1;
        const type = req.query.type;
        const { userId } = req.payload;
        if (!perPage || !page || !type) {
            return next(createError(422, "The type field is required."));
        }
        if (type === "forYou") {
            const followed = await Follow.find({
                userId: req.payload.userId,
            }).select("followId");

            const arrayFollowId = followed.map((item) =>
                item.followId.toString()
            );

            const posts = await Post.find({
                userId: { $nin: [...arrayFollowId, userId] },
            }) // Loại các post của mình và những người đã follow
                .populate("userId", "-password")
                .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
                .limit(perPage)
                .sort({ createdAt: -1 });

            const reaction = await PostReaction.find({ userId });
            const follow = await Follow.find({ userId });
            const result = posts.map((post) => {
                const { userId: user, ...others } = post._doc;
                const isReaction = reaction.find((item) => {
                    return item.postId.toString() === post._id.toString();
                });
                const isFollow = follow.find((item) => {
                    return item.followId.toString() === user._id.toString();
                });
                const newResult = {
                    ...others,
                    user: {
                        ...user._doc,
                        isFollow: isFollow ? true : false,
                    },
                    isReaction: isReaction ? true : false,
                };
                return newResult;
            });

            const count = await Post.count({
                userId: { $nin: [...arrayFollowId, userId] },
            });
            // const post = await Post.aggregate([
            //     { $match: { userId: { $ne: ObjectId(userId) } } }, // Loại các post của mình ra
            //     {
            //         $lookup: {
            //             from: "users",
            //             localField: "userId",
            //             foreignField: "_id",
            //             as: "user",
            //         },
            //     },
            //     {
            //         $lookup: {
            //             from: "postreactions",
            //             localField: "_id",
            //             foreignField: "postId",
            //             as: "post_reaction",
            //         },
            //     },
            //     // {
            //     //     $lookup: {
            //     //         from: "follows",
            //     //         localField: "userId", //người sở hữu post này
            //     //         foreignField: "followId",
            //     //         as: "isFollow",
            //     //     },
            //     // },
            //     //FollowId: 6358dc1d3c130b065bfb4c33 (admin)
            //     //UserId: 6358fcb94b62575f7d1433ee (jennie)
            //     // => jennie following admin
            //     {
            //         $unwind: {
            //             path: "$post_reaction",
            //             preserveNullAndEmptyArrays: true,
            //         }, //Lookup return array => convert array to object
            //     },
            //     // {
            //     //     $unwind: {
            //     //         path: "$isFollow",
            //     //         preserveNullAndEmptyArrays: true,
            //     //     },
            //     // },
            //     { $unwind: "$user" },

            //     {
            //         $addFields: {
            //             isReaction: {
            //                 $cond: {
            //                     if: {
            //                         $eq: [
            //                             "$post_reaction.userId",
            //                             ObjectId(userId),
            //                         ],
            //                     },
            //                     then: true,
            //                     else: false,
            //                 },
            //             },
            //         },
            //     },
            //     // {
            //     //     $addFields: {
            //     //         isFollow: {
            //     //             $cond: {
            //     //                 if: {
            //     //                     $eq: [
            //     //                         "$isFollow.followId",
            //     //                         ObjectId(userId),
            //     //                     ],
            //     //                     //FollowId: 6358dc1d3c130b065bfb4c33 (admin)
            //     //                     //UserId: 6358fcb94b62575f7d1433ee (jennie)
            //     //                     // => jennie following admin
            //     //                 },
            //     //                 then: true,
            //     //                 else: false,
            //     //             },
            //     //         },
            //     //     },
            //     // },
            //     {
            //         $project: {
            //             _id: 1,
            //             description: 1,
            //             postAssets: 1,
            //             likesCount: 1,
            //             commentsCount: 1,
            //             shareCounts: 1,
            //             isReaction: 1,
            //             createdAt: 1,
            //             user: {
            //                 _id: 1,
            //                 username: 1,
            //                 avatar: 1,
            //                 tick: 1,
            //                 followingsCount: 1,
            //                 followersCount: 1,
            //                 // isFollow: "$isFollow",
            //             },
            //         },
            //     },
            //     { $skip: perPage * page - perPage },
            //     { $limit: Number(perPage) },
            //     { $sort: { createdAt: -1 } },
            // ]);

            // const result = post.map(async (item) => {
            //     const isFollow = await Follow.findOne({
            //         followId: item.user._id,
            //         userId,
            //         //FollowId: 6358dc1d3c130b065bfb4c33 (admin)
            //         //UserId: 6358fcb94b62575f7d1433ee (jennie)
            //         // => jennie following admin
            //     });
            //     const newResult = {
            //         ...item,
            //         user: {
            //             ...item.user,
            //             isFollow: isFollow ? true : false,
            //         },
            //     };
            //     // console.log("new", newResult);
            //     return newResult;
            // });

            // console.log("result", await result);
            return {
                data: result,
                total: count,
                totalPages: Math.ceil(count / perPage),
                currentPage: page,
                perPage,
            };
        }
        if (type === "following") {
            // Tìm những user mình đã follow
            const follow = await Follow.find({
                userId: req.payload.userId,
            }).select("followId");

            const arrayFollowId = follow.map((item) => item.followId);

            const count = await Post.find({
                userId: { $in: arrayFollowId },
            }).count();

            const posts = await Post.aggregate([
                { $match: { userId: { $in: arrayFollowId } } },
                // Find user owner post
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                //Find 2 comment of post
                // {
                //     $lookup: {
                //         from: "comments",
                //         localField: "_id",
                //         foreignField: "postId",
                //         as: "comments",
                //         pipeline: [
                //             { $limit: 2 },
                //             //find user comment of post
                //             {
                //                 $lookup: {
                //                     from: "users",
                //                     localField: "userId",
                //                     foreignField: "_id",
                //                     as: "user",
                //                 },
                //             },
                //             {
                //                 $project: {
                //                     _id: 1,
                //                     content: 1,
                //                     user: {
                //                         username: 1,
                //                         avatar: 1,
                //                     },
                //                 },
                //             },
                //             { $unwind: "$user" },
                //         ],
                //     },
                // },
                {
                    $project: {
                        userId: 0,
                        user: {
                            password: 0,
                        },
                    },
                },
                { $unwind: "$user" }, //bung ra , [{}] => {}
                { $skip: perPage * page - perPage },
                { $limit: Number(perPage) },
                { $sort: { createdAt: -1 } },
            ]);
            const reaction = await PostReaction.find({ userId });

            const result = posts.map((post) => {
                const isReaction = reaction.find((item) => {
                    return item.postId.toString() === post._id.toString();
                });
                const newResult = {
                    ...post,
                    isReaction: isReaction ? true : false,
                    user: {
                        ...post.user,
                        isFollow: true,
                    },
                };
                return newResult;
            });

            return {
                data: result,
                total: count,
                totalPages: Math.ceil(count / perPage),
                currentPage: page,
                perPage,
            };
        }
    } catch (error) {
        next(error);
    }
};

const getPost = async (req, next) => {
    try {
        const { userId } = req.payload;
        const { postId } = req.params;
        const post = await Post.aggregate([
            { $match: { _id: ObjectId(postId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $lookup: {
                    from: "postreactions",
                    localField: "_id",
                    foreignField: "postId",
                    as: "post_reaction",
                },
            },
            // {
            //     $lookup: {
            //         from: "follows",
            //         localField: "userId",
            //         foreignField: "followId",
            //         as: "isFollow",
            //     },
            // },
            {
                $unwind: {
                    path: "$post_reaction",
                    preserveNullAndEmptyArrays: true,
                },
            },
            // {
            //     $unwind: {
            //         path: "$isFollow",
            //         preserveNullAndEmptyArrays: true,
            //     },
            // },
            { $unwind: "$user" },

            {
                $addFields: {
                    isReaction: {
                        $cond: {
                            if: {
                                $eq: [
                                    "$post_reaction.userId",
                                    ObjectId(userId),
                                ],
                            },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            // {
            //     $addFields: {
            //         isFollow: {
            //             $cond: {
            //                 if: {
            //                     $eq: ["$isFollow.userId", ObjectId(userId)],
            //                     $eq: ["$user._id", ObjectId(userId)], //check xem có phải là mình ko
            //                 },
            //                 then: true,
            //                 else: false,
            //             },
            //         },
            //     },
            // },

            {
                $project: {
                    _id: 1,
                    description: 1,
                    postAssets: 1,
                    likesCount: 1,
                    commentsCount: 1,
                    shareCounts: 1,
                    isReaction: 1,
                    createdAt: 1,
                    user: {
                        _id: 1,
                        username: 1,
                        avatar: 1,
                        tick: 1,
                        followingsCount: 1,
                        followersCount: 1,
                    },
                },
            },
        ]);
        const follow = await Follow.find({ userId });

        const result = post.map((item) => {
            const isFollow = follow.find((follow) => {
                return follow.followId.toString() === item.user._id.toString();
            });
            return {
                ...item,
                user: {
                    ...item.user,
                    isFollow: isFollow ? true : false,
                },
            };
        });
        return {
            data: result[0],
        };
    } catch (error) {
        next(error);
    }
};

const getPostsOfUser = async (req, next) => {
    try {
        const perPage = req.query.perPage || 10; // số lượng sản phẩm xuất hiện trên 1 page
        const page = req.query.page || 1;
        const { userId } = req.payload;
        const { username } = req.params;
        const user = await User.findOne({ username });
        const posts = await Post.find({ userId: user._id })
            .populate("userId", "username tick avatar")
            .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
            .limit(perPage)
            .sort({ createdAt: -1 });

        const count = await Post.find({ userId: user._id }).count();

        const reaction = await PostReaction.find({ userId });

        const result = posts.map((post) => {
            const { userId, ...others } = post._doc;
            const isReaction = reaction.find((item) => {
                return item.postId.toString() === post._id.toString();
            });

            const user = userId;
            const newResult = {
                ...others,
                user,
                isReaction: isReaction ? true : false,
            };
            return newResult;
        });

        return {
            data: result,
            total: count,
            totalPages: Math.ceil(count / perPage),
            currentPage: page,
            perPage,
        };
    } catch (error) {
        next(error);
    }
};

const createPost = async (req, next) => {
    try {
        const { description } = req.body;
        const { userId } = req.payload;
        const files = req.files;
        let assetUrls = [];
        for (let file of files) {
            const { url } = await cloudinary.upload(file);
            assetUrls.push(url);
        }
        const post = new Post({
            userId: userId,
            description,
            postAssets: assetUrls,
        });
        await post.save();

        const updatePostCount = { $inc: { postCount: 1 } };
        await User.findByIdAndUpdate(userId, updatePostCount);

        const newPost = await post.populate("userId", "-password");
        const { userId: user, ...others } = newPost._doc;

        return { data: { user, ...others } };
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPosts,
    getPost,
    createPost,
    getPostsOfUser,
};
