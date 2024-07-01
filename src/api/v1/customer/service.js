const { ObjectId } = require("mongodb");
const User = require("../../../model/Customer");
const UserMessage = require("../../../model/CustomerMessage");


const bulkInsert = async (users) => {
    try {
        let models = []

        users.map(u => {
            models.push({
                updateMany: {
                    filter: {
                        "phone_number": u.phone_number,
                        "contact_date": u.contact_date
                    },
                    update: {
                        $set: {
                            full_name: u.full_name,
                            phone_number: u.phone_number,
                            provider_phone_number: u.provider_phone_number,
                            provider_code_phone_number: u.provider_code_phone_number,
                            contact_date: u.contact_date
                        }
                    },
                    upsert: true,
                }
            })
        })
        // console.log(models[0])
        let newUsers = await User.bulkWrite(models)
        return {
            data: newUsers,
            error: null
        }
    } catch (error) {
        console.log("Bulk insert err", error)
        return {
            error
        }
    }
};

const pushNoti = async (users) => {
    try {
        let models = []

        users.map(u => {
            models.push({
                insertOne: {
                    document: {
                        customer_id: ObjectId(u.id),
                        date: new Date(),
                        contact_date: new Date(),
                        phone_number: u.phone_number,
                    },
                },
            })
        })
        let newUsers = await UserMessage.bulkWrite(models)
        return {
            data: newUsers,
            error: null
        }
    } catch (error) {
        return {
            error
        }
    }
}

const list = async ({
    pagination,
    filter_keyword,
    filter_provider_code_phone_number,
    filter_has_push_noti,
    filter_start_date,
    filter_end_date,
    start_contact_date,
    end_contact_date,
}) => {
    try {
        const currentDate = new Date();
        // Thiết lập giá trị mặc định cho pagination nếu không được định nghĩa
        const { page_limit = 10, page_current = 1 } = pagination || {};

        const skip = (page_current - 1) * page_limit;

        // Tạo truy vấn với các điều kiện filter và phân trang
        let query = {
        };

        if (filter_keyword !== undefined && filter_keyword !== "") {
            query["$or"] = [
                {
                    "full_name": {
                        $regex: filter_keyword,
                        $options: "i"
                    }
                },
                {
                    "phone_number": {
                        $regex: filter_keyword,
                        $options: "i"
                    }
                }
            ];
        }

        if (filter_provider_code_phone_number !== undefined && filter_provider_code_phone_number !== "") {
            if (filter_provider_code_phone_number.length > 0) {
                query["$and"] = [
                    {
                        "provider_code_phone_number": {
                            "$in": filter_provider_code_phone_number,
                        }
                    }
                ];
            }
            if (start_contact_date !== undefined && start_contact_date != "") {
                let defaultStartDate = new Date(start_contact_date)
                start_contact_date = new Date(
                    defaultStartDate.getFullYear(),
                    defaultStartDate.getMonth(),
                    defaultStartDate.getDate(),
                    0, 0, 0
                )

                if (end_contact_date !== undefined && end_contact_date != "") {
                    let defaultEndDate = new Date(end_contact_date)
                    end_contact_date = new Date(
                        defaultEndDate.getFullYear(),
                        defaultEndDate.getMonth(),
                        defaultEndDate.getDate(),
                        23, 59, 59
                    )
                } else {
                    end_contact_date = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate(),
                        23, 59, 59
                    )
                }

                // Adding the date range query to the `$and` array
                query["$and"] = [
                    {
                        "contact_date": {
                            "$gte": start_contact_date,
                            "$lte": end_contact_date
                        }
                    }
                ];
            }
        }
        // Thực hiện truy vấn MongoDB để đếm tổng số bản ghi
        const total_record = await User.countDocuments(query);
        // Tính toán thông tin về phân trang
        const total_page = Math.ceil(total_record / page_limit);
        // Get current date

        if (filter_start_date !== undefined && filter_start_date != "") {
            let defaultStartDate = new Date(filter_start_date)
            filter_start_date = new Date(
                defaultStartDate.getFullYear(),
                defaultStartDate.getMonth(),
                defaultStartDate.getDate(),
                0, 0, 0
            )
        } else {
            filter_start_date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                0, 0, 0
            )
        }

        if (filter_end_date !== undefined && filter_end_date != "") {
            let defaultEndDate = new Date(filter_start_date)
            filter_end_date = new Date(
                defaultEndDate.getFullYear(),
                defaultEndDate.getMonth(),
                defaultEndDate.getDate(),
                23, 59, 59
            )
        } else {
            filter_end_date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                23, 59, 59
            )
        }

        const startDate = new Date(filter_start_date);
        const endDate = new Date(filter_end_date);

        const aggregationPipeline = [
            {
                $match: query // Your query condition
            },
            {
                $lookup: {
                    from: 'customer_messages',
                    localField: '_id',
                    foreignField: 'customer_id',
                    as: 'messages'
                }
            },
            {
                $project: {
                    _id: 1,
                    phone_number: 1,
                    full_name: 1,
                    provider_code_phone_number: 1,
                    provider_phone_number: 1,
                    has_push_noti: {
                        $anyElementTrue: {
                            $map: {
                                input: "$messages",
                                as: "message",
                                in: {
                                    $and: [
                                        { $gte: ["$$message.createdAt", startDate] },
                                        { $lte: ["$$message.createdAt", endDate] }
                                    ]
                                }
                            }
                        }
                    },
                    push_noti_count: {
                        $size: {
                            $filter: {
                                input: "$messages",
                                as: "message",
                                cond: {
                                    $and: [
                                        { $gte: ["$$message.createdAt", startDate] },
                                        { $lte: ["$$message.createdAt", endDate] }
                                    ]
                                }
                            }
                        }
                    },
                    contact_date: 1
                }
            }
        ];

        if (filter_has_push_noti !== undefined) {
            aggregationPipeline.push(
                {
                    $match: {
                        has_push_noti: filter_has_push_noti
                    }
                }
            );
        }

        aggregationPipeline.push(
            {
                $project: {
                    _id: 1,
                    phone_number: 1,
                    full_name: 1,
                    provider_code_phone_number: 1,
                    provider_phone_number: 1,
                    has_push_noti: {
                        $cond: {
                            if: { $gt: ["$push_noti_count", 0] },
                            then: true,
                            else: false
                        }
                    },
                    push_noti_count: 1,
                    contact_date: 1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: page_limit
            }
        );

        const users = await User.aggregate(aggregationPipeline);

        return {
            data: users,
            pagination: {
                page_current,
                page_limit,
                total_page,
                total_record
            },
            error: null
        };
    } catch (error) {
        console.log("list err", error)
        return {
            error
        }
    }
}

const listV2 = async ({
    pagination = {},
    filter_keyword,
    filter_provider_code_phone_number = [],
    filter_has_push_noti,
    filter_start_contact_date,
    filter_end_contact_date,
}) => {
    try {
        const currentDate = new Date();

        // Pagination setup
        const { page_limit = 10, page_current = 1 } = pagination;
        const skip = (page_current - 1) * page_limit;

        // Query construction
        let query = {};

        if (filter_keyword && filter_keyword !== "") {
            query["$or"] = [
                { "full_name": { $regex: filter_keyword, $options: "i" } },
                { "phone_number": { $regex: filter_keyword, $options: "i" } }
            ];
        }

        if (filter_provider_code_phone_number && filter_provider_code_phone_number.length > 0) {
            query["provider_code_phone_number"] = { "$in": filter_provider_code_phone_number };
        }
        let startContactDate
        let endContactDate

        if (filter_start_contact_date && filter_start_contact_date !== "") {
            startContactDate = new Date(filter_start_contact_date);
            endContactDate = filter_end_contact_date ? new Date(filter_end_contact_date) : currentDate;

            query["contact_date"] = {
                "$gte": new Date(startContactDate.setHours(0, 0, 0)),
                "$lte": new Date(endContactDate.setHours(23, 59, 59))
            };
        }

        if (filter_end_contact_date && filter_end_contact_date !== "") {
            endContactDate = new Date(filter_end_contact_date);
            startContactDate = filter_start_contact_date ? new Date(filter_start_contact_date) : currentDate;

            query["contact_date"] = {
                "$gte": new Date(startContactDate.setHours(0, 0, 0)),
                "$lte": new Date(endContactDate.setHours(23, 59, 59))
            };
        }

        if (!startContactDate) {
            startContactDate = new Date(currentDate.setHours(0, 0, 0));
        }
        if (!endContactDate) {
            endContactDate = new Date(currentDate.setHours(23, 59, 59));
        }


        // Count total records
        const total_record = await User.countDocuments(query);
        const total_page = Math.ceil(total_record / page_limit);

        // Execute aggregation pipeline
        const users = await User.find(query)
            .skip(skip)
            .limit(page_limit);

        let mapUser = {} // map id => user
        let userIds = []
        users.map(user => {
            mapUser[user._id] = user
            userIds.push(user._id)
        });
        const messages = await UserMessage.find(
            {
                customer_id: {
                    $in: userIds,
                },
                createdAt: {
                    $gte: startContactDate,
                    $lte: endContactDate
                }
            }
        )
        let mapMessageCount = {};
        // Loop through each message and count them per customer_id
        messages.forEach(message => {
            const customerId = message.customer_id;
            if (mapMessageCount[customerId]) {
                mapMessageCount[customerId] += 1;
            } else {
                mapMessageCount[customerId] = 1;
            }
        });

        users.map(user => {
            user._doc.push_noti_count = mapMessageCount[user._id] || 0
            user._doc.has_push_noti = user.push_noti_count > 0
            return user
        })
        return {
            data: users,
            pagination: { page_current, page_limit, total_page, total_record },
            error: null
        };
    } catch (error) {
        console.log("list err", error);
        return { error };
    }
};

module.exports = {
    bulkInsert,
    pushNoti,
    list,
    listV2,
};
