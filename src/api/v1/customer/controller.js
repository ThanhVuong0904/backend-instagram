const service = require("./service");
const xlsx = require("xlsx");
const fs = require("fs");
const { detectNetwork } = require("../../../helpers/detect_network");
const moment = require("moment")

const bulkInsert = async (req, res, next) => {

    const { assets } = req.files
    if (assets.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        fs.unlinkSync(assets.tempFilePath)
        return res.status(400).json({
            message: "Invalid file type"
        })
    }
    const workBook = await xlsx.readFile(assets.tempFilePath)
    const sheetName = workBook.SheetNames[1]
    const data = xlsx.utils.sheet_to_json(workBook.Sheets[sheetName])
    let users = []
    for (let i = 0; i < data.length; i++) {
        let { PhoneNumber, FullName, ContactDate } = data[i]
        // console.log({ FullName, ContactDate })
        // Split the date string by '/'
        const parts = ContactDate.split('/');
        // Extract day, month, and year components
        let day, month, year;
        if (parts[0].length === 1) {
            // If the day has a single digit, prepend "0" to make it two digits
            day = "0" + parts[0];
        } else {
            day = parts[0];
        }
        month = parts[1]; // Month doesn't need formatting
        year = parts[2]; // Year doesn't need formatting

        // Format the date string as "DD MM YYYY"
        const formattedDate = `${day}/${month}/${year}`;
        var dateMomentObject = moment(ContactDate, "DD/MM/YYYY");
        // dateMomentObject.add(1, "days")
        var dateObject = dateMomentObject.toDate();
        const newPhoneNumber = "0" + PhoneNumber

        const { name, code } = detectNetwork(newPhoneNumber)
        users.push({
            phone_number: newPhoneNumber,
            full_name: FullName,
            provider_phone_number: name,
            provider_code_phone_number: code,
            contact_date: dateObject
        })
    }
    fs.unlinkSync(assets.tempFilePath)
    const { error } = await service.bulkInsert(users);
    if (error) {
        next(error)
    }
    return res.json({})
};

const pushNoti = async (req, res, next) => {
    const { users_noti } = req.body
    console.log({ users_noti })
    const { error } = await service.pushNoti(users_noti);
    if (error) {
        next(error)
    }
    return res.json({})
}

const list = async (req, res, next) => {
    const {
        pagination,
        filter_keyword,
        filter_provider_code_phone_number,
        filter_has_push_noti,
        start_contact_date,
        end_contact_date,
        filter_start_date,
        filter_end_date,
    } = req.body
    const { error, data, pagination: paginationRes } = await service.list(
        {
            pagination,
            filter_keyword,
            filter_provider_code_phone_number,
            filter_has_push_noti,
            filter_start_date,
            filter_end_date,
            start_contact_date,
            end_contact_date,
        })
    if (error) {
        next(error)
    }
    return res.json({ data, pagination: paginationRes })
}

module.exports = {
    bulkInsert,
    pushNoti,
    list
};
