import { getUserWithAllCycles } from "./UserService.js";
import NodeCache from 'node-cache';
import axios from 'axios';

const cache = new NodeCache({ stdTTL: 30 * 24 * 60 * 60 });
const OPEN_EXCHANGE_RATES_API_KEY = 'e7b51ca014c243e6af65b173e6834296';

// Currency list
const currencies = [
    { label: 'AED - United Arab Emirates Dirham', value: 'AED', minIncome: 2000, maxIncome: 400000 },
    { label: 'AFN - Afghan Afghani', value: 'AFN', minIncome: 5000, maxIncome: 5000000 },
    { label: 'ALL - Albanian Lek', value: 'ALL', minIncome: 20000, maxIncome: 10000000 },
    { label: 'AMD - Armenian Dram', value: 'AMD', minIncome: 50000, maxIncome: 20000000 },
    { label: 'ANG - Netherlands Antillean Guilder', value: 'ANG', minIncome: 1000, maxIncome: 200000 },
    { label: 'AOA - Angolan Kwanza', value: 'AOA', minIncome: 50000, maxIncome: 50000000 },
    { label: 'ARS - Argentine Peso', value: 'ARS', minIncome: 50000, maxIncome: 50000000 },
    { label: 'AUD - Australian Dollar', value: 'AUD', minIncome: 800, maxIncome: 150000 },
    { label: 'AWG - Aruban Florin', value: 'AWG', minIncome: 1000, maxIncome: 200000 },
    { label: 'AZN - Azerbaijani Manat', value: 'AZN', minIncome: 500, maxIncome: 100000 },
    { label: 'BAM - Bosnia-Herzegovina Convertible Mark', value: 'BAM', minIncome: 500, maxIncome: 100000 },
    { label: 'BBD - Barbadian Dollar', value: 'BBD', minIncome: 1000, maxIncome: 200000 },
    { label: 'BDT - Bangladeshi Taka', value: 'BDT', minIncome: 10000, maxIncome: 10000000 },
    { label: 'BGN - Bulgarian Lev', value: 'BGN', minIncome: 500, maxIncome: 100000 },
    { label: 'BHD - Bahraini Dinar', value: 'BHD', minIncome: 200, maxIncome: 50000 },
    { label: 'BIF - Burundian Franc', value: 'BIF', minIncome: 500000, maxIncome: 500000000 },
    { label: 'BMD - Bermudian Dollar', value: 'BMD', minIncome: 500, maxIncome: 100000 },
    { label: 'BND - Brunei Dollar', value: 'BND', minIncome: 700, maxIncome: 120000 },
    { label: 'BOB - Bolivian Boliviano', value: 'BOB', minIncome: 2000, maxIncome: 2000000 },
    { label: 'BRL - Brazilian Real', value: 'BRL', minIncome: 2000, maxIncome: 500000 },
    { label: 'BSD - Bahamian Dollar', value: 'BSD', minIncome: 500, maxIncome: 100000 },
    { label: 'BTN - Bhutanese Ngultrum', value: 'BTN', minIncome: 10000, maxIncome: 10000000 },
    { label: 'BWP - Botswanan Pula', value: 'BWP', minIncome: 2000, maxIncome: 2000000 },
    { label: 'BYN - Belarusian Ruble', value: 'BYN', minIncome: 500, maxIncome: 100000 },
    { label: 'BZD - Belize Dollar', value: 'BZD', minIncome: 1000, maxIncome: 200000 },
    { label: 'CAD - Canadian Dollar', value: 'CAD', minIncome: 700, maxIncome: 120000 },
    { label: 'CDF - Congolese Franc', value: 'CDF', minIncome: 500000, maxIncome: 500000000 },
    { label: 'CHF - Swiss Franc', value: 'CHF', minIncome: 800, maxIncome: 150000 },
    { label: 'CLP - Chilean Peso', value: 'CLP', minIncome: 200000, maxIncome: 200000000 },
    { label: 'CNY - Chinese Yuan', value: 'CNY', minIncome: 3000, maxIncome: 500000 },
    { label: 'COP - Colombian Peso', value: 'COP', minIncome: 1000000, maxIncome: 1000000000 },
    { label: 'CRC - Costa Rican Colón', value: 'CRC', minIncome: 200000, maxIncome: 200000000 },
    { label: 'CUP - Cuban Peso', value: 'CUP', minIncome: 500, maxIncome: 500000 },
    { label: 'CVE - Cape Verdean Escudo', value: 'CVE', minIncome: 20000, maxIncome: 20000000 },
    { label: 'CZK - Czech Koruna', value: 'CZK', minIncome: 10000, maxIncome: 5000000 },
    { label: 'DJF - Djiboutian Franc', value: 'DJF', minIncome: 50000, maxIncome: 50000000 },
    { label: 'DKK - Danish Krone', value: 'DKK', minIncome: 5000, maxIncome: 1000000 },
    { label: 'DOP - Dominican Peso', value: 'DOP', minIncome: 10000, maxIncome: 10000000 },
    { label: 'DZD - Algerian Dinar', value: 'DZD', minIncome: 50000, maxIncome: 50000000 },
    { label: 'EGP - Egyptian Pound', value: 'EGP', minIncome: 5000, maxIncome: 5000000 },
    { label: 'ERN - Eritrean Nakfa', value: 'ERN', minIncome: 2000, maxIncome: 2000000 },
    { label: 'ETB - Ethiopian Birr', value: 'ETB', minIncome: 5000, maxIncome: 5000000 },
    { label: 'EUR - Euro', value: 'EUR', minIncome: 500, maxIncome: 100000 },
    { label: 'FJD - Fijian Dollar', value: 'FJD', minIncome: 1000, maxIncome: 200000 },
    { label: 'FKP - Falkland Islands Pound', value: 'FKP', minIncome: 400, maxIncome: 80000 },
    { label: 'GBP - British Pound', value: 'GBP', minIncome: 400, maxIncome: 80000 },
    { label: 'GEL - Georgian Lari', value: 'GEL', minIncome: 1000, maxIncome: 200000 },
    { label: 'GHS - Ghanaian Cedi', value: 'GHS', minIncome: 1000, maxIncome: 1000000 },
    { label: 'GIP - Gibraltar Pound', value: 'GIP', minIncome: 400, maxIncome: 80000 },
    { label: 'GMD - Gambian Dalasi', value: 'GMD', minIncome: 5000, maxIncome: 5000000 },
    { label: 'GNF - Guinean Franc', value: 'GNF', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'GTQ - Guatemalan Quetzal', value: 'GTQ', minIncome: 2000, maxIncome: 2000000 },
    { label: 'GYD - Guyanaese Dollar', value: 'GYD', minIncome: 50000, maxIncome: 50000000 },
    { label: 'HKD - Hong Kong Dollar', value: 'HKD', minIncome: 4000, maxIncome: 800000 },
    { label: 'HNL - Honduran Lempira', value: 'HNL', minIncome: 5000, maxIncome: 5000000 },
    { label: 'HRK - Croatian Kuna', value: 'HRK', minIncome: 3000, maxIncome: 600000 },
    { label: 'HTG - Haitian Gourde', value: 'HTG', minIncome: 10000, maxIncome: 10000000 },
    { label: 'HUF - Hungarian Forint', value: 'HUF', minIncome: 100000, maxIncome: 100000000 },
    { label: 'IDR - Indonesian Rupiah', value: 'IDR', minIncome: 2000000, maxIncome: 2000000000 },
    { label: 'ILS - Israeli New Shekel', value: 'ILS', minIncome: 2000, maxIncome: 400000 },
    { label: 'INR - Indian Rupee', value: 'INR', minIncome: 10000, maxIncome: 10000000 },
    { label: 'IQD - Iraqi Dinar', value: 'IQD', minIncome: 500000, maxIncome: 500000000 },
    { label: 'IRR - Iranian Rial', value: 'IRR', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'ISK - Icelandic Króna', value: 'ISK', minIncome: 50000, maxIncome: 50000000 },
    { label: 'JMD - Jamaican Dollar', value: 'JMD', minIncome: 50000, maxIncome: 50000000 },
    { label: 'JOD - Jordanian Dinar', value: 'JOD', minIncome: 200, maxIncome: 50000 },
    { label: 'JPY - Japanese Yen', value: 'JPY', minIncome: 50000, maxIncome: 10000000 },
    { label: 'KES - Kenyan Shilling', value: 'KES', minIncome: 10000, maxIncome: 10000000 },
    { label: 'KGS - Kyrgystani Som', value: 'KGS', minIncome: 10000, maxIncome: 10000000 },
    { label: 'KHR - Cambodian Riel', value: 'KHR', minIncome: 500000, maxIncome: 500000000 },
    { label: 'KMF - Comorian Franc', value: 'KMF', minIncome: 100000, maxIncome: 100000000 },
    { label: 'KPW - North Korean Won', value: 'KPW', minIncome: 50000, maxIncome: 50000000 },
    { label: 'KRW - South Korean Won', value: 'KRW', minIncome: 500000, maxIncome: 100000000 },
    { label: 'KWD - Kuwaiti Dinar', value: 'KWD', minIncome: 150, maxIncome: 30000 },
    { label: 'KYD - Cayman Islands Dollar', value: 'KYD', minIncome: 500, maxIncome: 100000 },
    { label: 'KZT - Kazakhstani Tenge', value: 'KZT', minIncome: 100000, maxIncome: 100000000 },
    { label: 'LAK - Laotian Kip', value: 'LAK', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'LBP - Lebanese Pound', value: 'LBP', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'LKR - Sri Lankan Rupee', value: 'LKR', minIncome: 50000, maxIncome: 50000000 },
    { label: 'LRD - Liberian Dollar', value: 'LRD', minIncome: 10000, maxIncome: 10000000 },
    { label: 'LSL - Lesotho Loti', value: 'LSL', minIncome: 2000, maxIncome: 2000000 },
    { label: 'LYD - Libyan Dinar', value: 'LYD', minIncome: 500, maxIncome: 100000 },
    { label: 'MAD - Moroccan Dirham', value: 'MAD', minIncome: 2000, maxIncome: 2000000 },
    { label: 'MDL - Moldovan Leu', value: 'MDL', minIncome: 5000, maxIncome: 5000000 },
    { label: 'MGA - Malagasy Ariary', value: 'MGA', minIncome: 500000, maxIncome: 500000000 },
    { label: 'MKD - Macedonian Denar', value: 'MKD', minIncome: 10000, maxIncome: 10000000 },
    { label: 'MMK - Myanma Kyat', value: 'MMK', minIncome: 500000, maxIncome: 500000000 },
    { label: 'MNT - Mongolian Tugrik', value: 'MNT', minIncome: 500000, maxIncome: 500000000 },
    { label: 'MOP - Macanese Pataca', value: 'MOP', minIncome: 4000, maxIncome: 800000 },
    { label: 'MRU - Mauritanian Ouguiya', value: 'MRU', minIncome: 10000, maxIncome: 10000000 },
    { label: 'MUR - Mauritian Rupee', value: 'MUR', minIncome: 10000, maxIncome: 10000000 },
    { label: 'MVR - Maldivian Rufiyaa', value: 'MVR', minIncome: 2000, maxIncome: 2000000 },
    { label: 'MWK - Malawian Kwacha', value: 'MWK', minIncome: 500000, maxIncome: 500000000 },
    { label: 'MXN - Mexican Peso', value: 'MXN', minIncome: 5000, maxIncome: 5000000 },
    { label: 'MYR - Malaysian Ringgit', value: 'MYR', minIncome: 2000, maxIncome: 400000 },
    { label: 'MZN - Mozambican Metical', value: 'MZN', minIncome: 10000, maxIncome: 10000000 },
    { label: 'NAD - Namibian Dollar', value: 'NAD', minIncome: 2000, maxIncome: 2000000 },
    { label: 'NGN - Nigerian Naira', value: 'NGN', minIncome: 100000, maxIncome: 100000000 },
    { label: 'NIO - Nicaraguan Córdoba', value: 'NIO', minIncome: 10000, maxIncome: 10000000 },
    { label: 'NOK - Norwegian Krone', value: 'NOK', minIncome: 5000, maxIncome: 1000000 },
    { label: 'NPR - Nepalese Rupee', value: 'NPR', minIncome: 10000, maxIncome: 10000000 },
    { label: 'NZD - New Zealand Dollar', value: 'NZD', minIncome: 800, maxIncome: 150000 },
    { label: 'OMR - Omani Rial', value: 'OMR', minIncome: 200, maxIncome: 50000 },
    { label: 'PAB - Panamanian Balboa', value: 'PAB', minIncome: 500, maxIncome: 100000 },
    { label: 'PEN - Peruvian Sol', value: 'PEN', minIncome: 1000, maxIncome: 1000000 },
    { label: 'PGK - Papua New Guinean Kina', value: 'PGK', minIncome: 1000, maxIncome: 1000000 },
    { label: 'PHP - Philippine Peso', value: 'PHP', minIncome: 10000, maxIncome: 10000000 },
    { label: 'PKR - Pakistani Rupee', value: 'PKR', minIncome: 20000, maxIncome: 20000000 },
    { label: 'PLN - Polish Zloty', value: 'PLN', minIncome: 2000, maxIncome: 400000 },
    { label: 'PYG - Paraguayan Guarani', value: 'PYG', minIncome: 1000000, maxIncome: 1000000000 },
    { label: 'QAR - Qatari Rial', value: 'QAR', minIncome: 2000, maxIncome: 400000 },
    { label: 'RON - Romanian Leu', value: 'RON', minIncome: 2000, maxIncome: 400000 },
    { label: 'RSD - Serbian Dinar', value: 'RSD', minIncome: 50000, maxIncome: 50000000 },
    { label: 'RUB - Russian Ruble', value: 'RUB', minIncome: 20000, maxIncome: 20000000 },
    { label: 'RWF - Rwandan Franc', value: 'RWF', minIncome: 500000, maxIncome: 500000000 },
    { label: 'SAR - Saudi Riyal', value: 'SAR', minIncome: 2000, maxIncome: 400000 },
    { label: 'SBD - Solomon Islands Dollar', value: 'SBD', minIncome: 2000, maxIncome: 2000000 },
    { label: 'SCR - Seychellois Rupee', value: 'SCR', minIncome: 5000, maxIncome: 5000000 },
    { label: 'SDG - Sudanese Pound', value: 'SDG', minIncome: 100000, maxIncome: 100000000 },
    { label: 'SEK - Swedish Krona', value: 'SEK', minIncome: 5000, maxIncome: 1000000 },
    { label: 'SGD - Singapore Dollar', value: 'SGD', minIncome: 1000, maxIncome: 200000 },
    { label: 'SHP - Saint Helena Pound', value: 'SHP', minIncome: 400, maxIncome: 80000 },
    { label: 'SLL - Sierra Leonean Leone', value: 'SLL', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'SOS - Somali Shilling', value: 'SOS', minIncome: 500000, maxIncome: 500000000 },
    { label: 'SRD - Surinamese Dollar', value: 'SRD', minIncome: 10000, maxIncome: 10000000 },
    { label: 'SSP - South Sudanese Pound', value: 'SSP', minIncome: 100000, maxIncome: 100000000 },
    { label: 'STN - São Tomé and Príncipe Dobra', value: 'STN', minIncome: 10000, maxIncome: 10000000 },
    { label: 'SYP - Syrian Pound', value: 'SYP', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'SZL - Swazi Lilangeni', value: 'SZL', minIncome: 2000, maxIncome: 2000000 },
    { label: 'THB - Thai Baht', value: 'THB', minIncome: 10000, maxIncome: 10000000 },
    { label: 'TJS - Tajikistani Somoni', value: 'TJS', minIncome: 2000, maxIncome: 2000000 },
    { label: 'TMT - Turkmenistani Manat', value: 'TMT', minIncome: 1000, maxIncome: 1000000 },
    { label: 'TND - Tunisian Dinar', value: 'TND', minIncome: 500, maxIncome: 100000 },
    { label: 'TOP - Tongan Paʻanga', value: 'TOP', minIncome: 1000, maxIncome: 1000000 },
    { label: 'TRY - Turkish Lira', value: 'TRY', minIncome: 5000, maxIncome: 5000000 },
    { label: 'TTD - Trinidad and Tobago Dollar', value: 'TTD', minIncome: 2000, maxIncome: 2000000 },
    { label: 'TWD - New Taiwan Dollar', value: 'TWD', minIncome: 10000, maxIncome: 10000000 },
    { label: 'TZS - Tanzanian Shilling', value: 'TZS', minIncome: 500000, maxIncome: 500000000 },
    { label: 'UAH - Ukrainian Hryvnia', value: 'UAH', minIncome: 10000, maxIncome: 10000000 },
    { label: 'UGX - Ugandan Shilling', value: 'UGX', minIncome: 500000, maxIncome: 500000000 },
    { label: 'USD - United States Dollar', value: 'USD', minIncome: 500, maxIncome: 100000 },
    { label: 'UYU - Uruguayan Peso', value: 'UYU', minIncome: 10000, maxIncome: 10000000 },
    { label: 'UZS - Uzbekistan Som', value: 'UZS', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'VES - Venezuelan Bolívar', value: 'VES', minIncome: 10000, maxIncome: 10000000 },
    { label: 'VND - Vietnamese Dong', value: 'VND', minIncome: 5000000, maxIncome: 5000000000 },
    { label: 'VUV - Vanuatu Vatu', value: 'VUV', minIncome: 50000, maxIncome: 50000000 },
    { label: 'WST - Samoan Tala', value: 'WST', minIncome: 1000, maxIncome: 1000000 },
    { label: 'XAF - Central African CFA Franc', value: 'XAF', minIncome: 500000, maxIncome: 500000000 },
    { label: 'XCD - East Caribbean Dollar', value: 'XCD', minIncome: 1000, maxIncome: 1000000 },
    { label: 'XOF - West African CFA Franc', value: 'XOF', minIncome: 500000, maxIncome: 500000000 },
    { label: 'XPF - CFP Franc', value: 'XPF', minIncome: 50000, maxIncome: 50000000 },
    { label: 'YER - Yemeni Rial', value: 'YER', minIncome: 500000, maxIncome: 500000000 },
    { label: 'ZAR - South African Rand', value: 'ZAR', minIncome: 5000, maxIncome: 5000000 },
    { label: 'ZMW - Zambian Kwacha', value: 'ZMW', minIncome: 1000, maxIncome: 1000000 }
];

// Helper function to normalize category names
const normalizeCategory = (category) => {
    return category ? category.replace(/\s+/g, '') : '';
};

const calculatePercentUsed = (value, base) => {
    if (!base || base === 0) return "N/A";
    const percent = (value / base) * 100;
    return isNaN(percent) ? "N/A" : percent.toFixed(2) + "%";
};

const getMostCommonDescription = (txns) => {
    if (!txns?.length) return { description: "None", count: 0, percentage: 0 };
    const descriptionCount = {};
    txns.forEach(txn => {
        const desc = (txn.description || txn.purchaseDescription || "No Description").toLowerCase().trim();
        descriptionCount[desc] = (descriptionCount[desc] || 0) + 1;
    });
    let maxCount = 0;
    let commonDescription = "No Description";
    Object.entries(descriptionCount).forEach(([desc, count]) => {
        if (count > maxCount || (count === maxCount && desc < commonDescription)) {
            maxCount = count;
            commonDescription = desc;
        }
    });
    const percentage = ((maxCount / txns.length) * 100).toFixed(2);
    return { description: commonDescription, count: maxCount, percentage: parseFloat(percentage) };
};

const calculateSpendingPattern = (txns) => {
    if (!txns?.length) return "No historical data";
    const amounts = txns.map(txn => parseFloat(txn.convertedAmount || 0)).filter(n => !isNaN(n));
    if (!amounts.length) return "No valid transactions";
    const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const largeTxns = amounts.filter(amount => amount > avgAmount * 2);
    return largeTxns.length > amounts.length * 0.3 ? "Bulk Purchases" : "Regular Spending";
};

const getMonthlySpending = (txns) => {
    const monthlySpending = {};
    txns.forEach(txn => {
        const date = new Date(txn.date || txn.transactionTimestamp);
        if (isNaN(date.getTime())) return;
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const amount = parseFloat(txn.convertedAmount || 0);
        if (!isNaN(amount)) {
            monthlySpending[monthYear] = (monthlySpending[monthYear] || 0) + amount;
        }
    });
    return monthlySpending;
};

const fetchLargeTransactionThresholds = async (userCurrency) => {
    const cacheKey = `largeTransactionThresholds_${userCurrency}`;
    const cached = cache.get(cacheKey);
    if (cached?.timestamp && Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return cached.thresholds;
    }
    const thresholds = {};
    const userRate = await getAverageRate(userCurrency);
    for (const currency of currencies) {
        const rate = await getAverageRate(currency.value);
        const convertedThreshold = (currency.maxIncome * 0.05) * (rate / userRate);
        thresholds[currency.value] = isNaN(convertedThreshold) ? 500 : convertedThreshold;
    }
    cache.set(cacheKey, { timestamp: Date.now(), thresholds });
    return thresholds;
};

const getAverageRate = async (currency) => {
    if (!currency) return 1;
    const cacheKey = `exchangeRate_${currency}_USD`;
    const cached = cache.get(cacheKey);
    if (cached?.timestamp && Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return cached.rate;
    }
    let rate = 1;
    if (currency !== 'USD') {
        try {
            const response = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${OPEN_EXCHANGE_RATES_API_KEY}`);
            const rates = response.data.rates || {};
            rate = rates[currency] || 1;
            if (!rates[currency]) {
                console.warn(`No exchange rate for ${currency}, defaulting to 1`);
            }
        } catch (error) {
            console.warn(`Failed to fetch exchange rate for ${currency}: ${error.message}, defaulting to 1`);
        }
    }
    cache.set(cacheKey, { timestamp: Date.now(), rate });
    return rate;
};

export async function deriveBehavioralInsights(userId, options = {}) {
    const { startDate, endDate } = options;

    try {
        const user = await getUserWithAllCycles(userId);
        if (!user) throw new Error(`User with ID ${userId} not found`);
        if (!user.currency) throw new Error(`User currency is not defined for user ${userId}`);

        const userCurrency = user.currency;
        const completedCycles = Array.isArray(user.cycles)
            ? user.cycles.filter(cycle => cycle?.status === 'completed' || cycle?.status === 'active')
            : [];
        const cycleCount = completedCycles.length;

        console.log("TRACK DATA 22 ", userCurrency);
        let allTxns = [];
        let totalSpentSoFar = 0;
        let totalCategorySpent = {};
        let totalMoneyAllocation = 0;
        let savingsTarget = 0;
        let allocationByCategory = {};

        for (const cycle of completedCycles) {
            if (!cycle?._id) {
                console.warn(`Skipping invalid cycle for user ${userId}: missing _id`);
                continue;
            }
            if (!Array.isArray(cycle.transactions)) {
                console.warn(`Skipping cycle ${cycle._id} for user ${userId}: transactions not an array`);
                continue;
            }

            const cycleCurrency = cycle.currency || userCurrency;
            const rate = await getAverageRate(cycleCurrency);
            const userRate = await getAverageRate(userCurrency);
            const conversionFactor = userRate !== 0 ? rate / userRate : 1;

            const spentSoFar = parseFloat(cycle.spentSoFar || '0') * conversionFactor;
            const moneyAllocation = parseFloat(cycle.totalMoneyAllocation || cycle.budget || '0') * conversionFactor;
            const cycleSavingsTarget = parseFloat(cycle.savingsTarget || '0') * conversionFactor;

            if (isNaN(spentSoFar) || isNaN(moneyAllocation) || isNaN(cycleSavingsTarget)) {
                console.warn(`Invalid financial metrics for cycle ${cycle._id}: spentSoFar=${cycle.spentSoFar}, totalMoneyAllocation=${cycle.totalMoneyAllocation}, savingsTarget=${cycle.savingsTarget}`);
                continue;
            }

            totalSpentSoFar += spentSoFar;
            totalMoneyAllocation += moneyAllocation;
            savingsTarget += cycleSavingsTarget;

            // Normalize category names for categorySpent
            Object.entries(cycle.categorySpent || {}).forEach(([cat, amount]) => {
                const normalizedCat = normalizeCategory(cat);
                const convertedAmount = parseFloat(amount || '0') * conversionFactor;
                if (!isNaN(convertedAmount) && normalizedCat) {
                    totalCategorySpent[normalizedCat] = (
                        parseFloat(totalCategorySpent[normalizedCat] || 0) + convertedAmount
                    ).toFixed(2);
                }
            });

            // Handle top-level allocated* fields
            Object.entries(cycle).forEach(([key, amount]) => {
                if (!key.startsWith('allocated')) return;
                const category = normalizeCategory(key.replace(/^allocated/, ''));
                if (!category) return;
                const convertedAmount = Number(amount || 0) * conversionFactor;
                if (!isNaN(convertedAmount)) {
                    allocationByCategory[category] = (
                        Number(allocationByCategory[category] || 0) + convertedAmount
                    ).toFixed(2);
                }
            });

            const postRecommendationTxns = cycle.transactions.filter(txn =>
                txn?.isTransactionPerformedAfterRecommendation === 'yes'
            );

            postRecommendationTxns.forEach(txn => {
                if (!txn?.category && !txn?.purchaseCategory) return;
                const normalizedCategory = normalizeCategory(txn.category || txn.purchaseCategory);
                if (!normalizedCategory) return;
                const txnPlain = txn.toObject ? txn.toObject() : { ...txn };
                allTxns.push({
                    ...txnPlain,
                    cycleId: cycle._id.toString(),
                    amount: parseFloat(txn.amount || txn.purchaseAmount || '0'),
                    category: normalizedCategory,
                    description: txn.description || txn.purchaseDescription,
                    date: txn.date || txn.transactionTimestamp,
                    currency: txn.currency || cycleCurrency,
                    rateSource: txn.rateSource || 'OpenExchangeRates'
                });
            });
        }

        totalSpentSoFar = Number(totalSpentSoFar.toFixed(2));
        totalMoneyAllocation = Number(totalMoneyAllocation.toFixed(2));
        savingsTarget = Number(savingsTarget.toFixed(2));

        if (startDate) allTxns = allTxns.filter(txn => new Date(txn.date) >= new Date(startDate));
        if (endDate) allTxns = allTxns.filter(txn => new Date(txn.date) <= new Date(endDate));

        const thresholds = await fetchLargeTransactionThresholds(userCurrency);
        const largeThreshold = thresholds[userCurrency] || 500;

        const totalSpentBase = await Promise.all(allTxns.map(async txn => {
            const amount = parseFloat(txn.amount) || 0;
            if (!txn.currency || !txn.category || isNaN(amount)) return 0;
            const rate = await getAverageRate(txn.currency);
            const userRate = await getAverageRate(userCurrency);
            const convertedAmount = userRate !== 0 ? amount * (rate / userRate) : amount;
            if (!isNaN(convertedAmount)) {
                txn.convertedAmount = convertedAmount;
                return convertedAmount;
            }
            return 0;
        })).then(amounts => Number(amounts.reduce((sum, val) => sum + val, 0).toFixed(2)));

        const totalSavingsBase = Number((totalMoneyAllocation - totalSpentSoFar).toFixed(2));

        const avgSavingsPerCycle = cycleCount > 0 ? Number((totalSavingsBase / cycleCount).toFixed(2)) : 0;
        const avgSpentPerCycle = cycleCount > 0 ? Number((totalSpentBase / cycleCount).toFixed(2)) : 0;

        const savingsAchievementRate = savingsTarget > 0
            ? calculatePercentUsed(totalSavingsBase, savingsTarget)
            : "N/A";

        const savingsProgress = totalSavingsBase > 0 ? "Positive" : totalSavingsBase < 0 ? "Negative" : "Neutral";

        const savingsPerCycle = completedCycles.map(cycle => {
            const spent = parseFloat(cycle.spentSoFar || 0);
            const allocated = parseFloat(cycle.totalMoneyAllocation || cycle.budget || 0);
            return allocated - spent;
        }).filter(n => !isNaN(n));
        const savingsTrend = savingsPerCycle.length > 1
            ? savingsPerCycle[savingsPerCycle.length - 1] > savingsPerCycle[0] ? "Increasing"
                : savingsPerCycle[savingsPerCycle.length - 1] < savingsPerCycle[0] ? "Decreasing" : "Stable"
            : totalSavingsBase < 0 ? "Decreasing" : "Stable";

        const successfulCycles = savingsPerCycle.filter(s => s > 0).length;
        const predictedSavingsProbability = cycleCount > 0
            ? ((successfulCycles / cycleCount) * 100).toFixed(2) + "%"
            : "50%";

        const amounts = allTxns.map(txn => parseFloat(txn.convertedAmount || 0)).filter(n => !isNaN(n));
        const sortedAmounts = amounts.sort((a, b) => a - b);
        const maxTxnAmount = sortedAmounts.length > 0 ? Number(sortedAmounts[sortedAmounts.length - 1].toFixed(2)) : 0;
        const minTxnAmount = sortedAmounts.length > 0 ? Number(sortedAmounts[0].toFixed(2)) : 0;
        const medianTxnAmount = sortedAmounts.length > 0 ? Number(sortedAmounts[Math.floor(sortedAmounts.length / 2)].toFixed(2)) : 0;
        const avgTxnCount = cycleCount > 0 ? Number((allTxns.length / cycleCount).toFixed(2)) : 0;

        const spendingTrend = amounts.length > 1
            ? amounts[amounts.length - 1] > amounts[0] ? "Increasing" : "Decreasing"
            : "Stable";

        const predictedSpendingNextCycle = Number(avgSpentPerCycle.toFixed(2));

        const validDates = allTxns.filter(txn => !isNaN(new Date(txn.date).getTime())).map(txn => new Date(txn.date).getDay());
        const avgTxnDay = validDates.length > 0
            ? new Date(0, 0, 1 + Math.round(validDates.reduce((sum, day) => sum + day, 0) / validDates.length))
                .toLocaleString('en-US', { weekday: 'long' })
            : "N/A";

        const categorySummaries = {};
        const uniqueCategories = [...new Set(allTxns.map(txn => txn.category))].filter(cat => cat);
        for (const cat of uniqueCategories) {
            const catTxns = allTxns.filter(txn => txn.category === cat);
            const totalSpentOriginal = Number(catTxns.reduce((sum, txn) => sum + (parseFloat(txn.amount) || 0), 0).toFixed(2));
            const totalSpentBase = Number(catTxns.reduce((sum, txn) => sum + (parseFloat(txn.convertedAmount) || 0), 0).toFixed(2));
            const currenciesUsed = [...new Set(catTxns.map(txn => txn.currency || 'N/A'))].join(', ');
            const rateSources = [...new Set(catTxns.map(txn => txn.rateSource || 'N/A'))].join(', ');
            const percentUsed = totalMoneyAllocation > 0
                ? calculatePercentUsed(totalSpentBase, totalMoneyAllocation)
                : "N/A";
            const { description: commonDescription, count: descriptionCount, percentage: descriptionPercentage } = getMostCommonDescription(catTxns);
            const spendingPattern = calculateSpendingPattern(catTxns);
            const monthlySpending = getMonthlySpending(catTxns);

            categorySummaries[cat] = {
                totalSpentOriginal,
                totalSpentBase,
                currencies: currenciesUsed,
                rateSource: rateSources,
                transactionCount: catTxns.length,
                percentUsed,
                commonDescription,
                descriptionCount,
                descriptionPercentage,
                spendingPattern,
                monthlySpending,
                largeTransactionThreshold: Number(largeThreshold.toFixed(2)),
                categorySpent: totalCategorySpent[cat] || "0.00",
                allocation: allocationByCategory[cat] || "0.00"
            };
        }

        const warnings = [];
        if (!allTxns.length) warnings.push('No post-recommendation transactions found for the specified criteria');
        if (totalSpentSoFar > totalMoneyAllocation * 0.9) {
            warnings.push('Spending exceeds 90% of total money allocation');
        }
        if (totalSavingsBase < 0) {
            warnings.push(`Negative savings detected: ${userCurrency} ${totalSavingsBase}`);
        }

        const insights = {
            cycleCount,
            userCurrency,
            spentSoFar: totalSpentSoFar.toFixed(2),
            categorySpent: totalCategorySpent,
            totalMoneyAllocation: totalMoneyAllocation.toFixed(2),
            savingsTarget: savingsTarget.toFixed(2),
            allocationByCategory,
            avgSpentPerCycle: avgSpentPerCycle.toFixed(2),
            savingsAchievementRate,
            totalSavingsBase: totalSavingsBase.toFixed(2),
            avgSavingsPerCycle: avgSavingsPerCycle.toFixed(2),
            savingsProgress,
            spendingTrend,
            savingsTrend,
            predictedSpendingNextCycle: predictedSpendingNextCycle.toFixed(2),
            predictedSavingsProbability,
            avgTxnCount: avgTxnCount.toFixed(2),
            avgTxnDay,
            maxTxnAmount: maxTxnAmount.toFixed(2),
            minTxnAmount: minTxnAmount.toFixed(2),
            medianTxnAmount: medianTxnAmount.toFixed(2),
            categorySummaries,
            warnings
        };

        console.log("INSIGHTS GENERATED:", JSON.stringify(insights, null, 2));
        return insights;
    } catch (error) {
        console.error(`Error deriving insights for user ${userId}: ${error.message}`);
        throw error;
    }
}