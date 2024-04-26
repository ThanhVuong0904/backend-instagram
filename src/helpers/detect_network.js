// Hàm để xác định nhà mạng từ số điện thoại bằng regex
function detectNetwork(phoneNumber) {
    const networks = {
        Viettel: { pattern: /^(032|033|034|035|036|037|038|039|096|097|098|086)\d{7}$/, code: 'VT' },
        Vinaphone: { pattern: /^(088|091|094|081|082|083|084|085)\d{7}$/, code: 'VNPT' },
        Mobifone: { pattern: /^(089|090|093|070|079|077|076|078)\d{7}$/, code: 'MB' },
        Vietnamobile: { pattern: /^(052|056|058|092)\d{7}$/, code: 'VNMB' }
    };

    for (const [network, { pattern, code }] of Object.entries(networks)) {
        if (pattern.test(phoneNumber)) {
            return { name: network, code: code };
        }
    }

    return { name: 'Unknown', code: 'UNK' };
}

module.exports = { detectNetwork };