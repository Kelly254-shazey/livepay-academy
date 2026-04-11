"use strict";
/**
 * Geolocation Service
 * Detects user country from IP address and manages location data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeolocationService = void 0;
// Country to currency mapping
const COUNTRY_CURRENCY_MAP = {
    US: "USD",
    GB: "GBP",
    CA: "CAD",
    AU: "AUD",
    NZ: "NZD",
    EU: "EUR",
    DE: "EUR",
    FR: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    BE: "EUR",
    AT: "EUR",
    CH: "CHF",
    SE: "SEK",
    NO: "NOK",
    DK: "DKK",
    JP: "JPY",
    CN: "CNY",
    IN: "INR",
    NG: "NGN",
    KE: "KES",
    ZA: "ZAR",
    BR: "BRL",
    MX: "MXN",
    AR: "ARS",
    SG: "SGD",
    MY: "MYR",
    TH: "THB",
    PH: "PHP",
    ID: "IDR",
    VN: "VND",
    PK: "PKR",
    BD: "BDT",
    GH: "GHS",
    UG: "UGX",
    TN: "TND",
    EG: "EGP",
    AE: "AED",
    SA: "SAR",
    KW: "KWD",
    IL: "ILS",
    TR: "TRY",
    RU: "RUB",
    UA: "UAH",
    PL: "PLN",
    CZ: "CZK",
    HU: "HUF",
    RO: "RON",
    HR: "HRK",
    GR: "EUR",
    PT: "EUR",
    CL: "CLP",
    CO: "COP",
    PE: "PEN",
    ECU: "USD"
};
// Payment methods available in each country
const COUNTRY_PAYMENT_METHODS = {
    US: ["credit_card", "debit_card", "paypal", "bank_transfer", "digital_wallet"],
    GB: ["credit_card", "debit_card", "paypal", "bank_transfer", "digital_wallet"],
    CA: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    AU: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    NZ: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    DE: ["credit_card", "debit_card", "paypal", "bank_transfer", "digital_wallet"],
    FR: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    IT: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    ES: ["credit_card", "debit_card", "paypal", "bank_transfer"],
    NL: ["credit_card", "debit_card", "paypal", "bank_transfer", "digital_wallet"],
    CH: ["credit_card", "debit_card", "bank_transfer"],
    SG: ["credit_card", "debit_card", "paypal", "digital_wallet"],
    JP: ["credit_card", "paypal"],
    CN: ["digital_wallet"], // Alipay, WeChat Pay
    IN: ["credit_card", "debit_card", "upi", "mobile_money"],
    NG: ["credit_card", "debit_card", "mobile_money", "bank_transfer"],
    KE: ["credit_card", "mobile_money", "bank_transfer"],
    BZ: ["credit_card", "debit_card", "mobile_money", "bank_transfer"],
    ZA: ["credit_card", "debit_card", "bank_transfer"],
    BR: ["credit_card", "debit_card", "bank_transfer", "pix"],
    MX: ["credit_card", "debit_card", "bank_transfer"],
    AR: ["credit_card", "debit_card"],
    MY: ["credit_card", "debit_card", "bank_transfer"],
    TH: ["credit_card", "debit_card", "bank_transfer"],
    PH: ["credit_card", "mobile_money", "bank_transfer"],
    ID: ["credit_card", "debit_card", "mobile_money"],
    VN: ["credit_card", "debit_card", "digital_wallet"],
    PK: ["credit_card", "debit_card", "mobile_money"],
    BD: ["credit_card", "debit_card", "mobile_money"],
    GH: ["credit_card", "mobile_money", "bank_transfer"],
    AE: ["credit_card", "debit_card", "bank_transfer"],
    SA: ["credit_card", "debit_card"],
    IL: ["credit_card", "debit_card", "bank_transfer"],
    TR: ["credit_card", "debit_card", "bank_transfer"],
    PL: ["credit_card", "debit_card", "bank_transfer"],
    CZ: ["credit_card", "debit_card", "bank_transfer"],
    HU: ["credit_card", "debit_card", "bank_transfer"],
    CL: ["credit_card", "debit_card", "bank_transfer"],
    CO: ["credit_card", "debit_card", "bank_transfer"],
    PE: ["credit_card", "debit_card"],
    TN: ["credit_card", "debit_card"],
    EG: ["credit_card", "mobile_money"],
    KW: ["credit_card", "debit_card"],
    UA: ["credit_card", "debit_card", "bank_transfer"],
    RO: ["credit_card", "debit_card", "bank_transfer"],
    HR: ["credit_card", "debit_card", "bank_transfer"],
    GR: ["credit_card", "debit_card", "bank_transfer"],
    PT: ["credit_card", "debit_card", "bank_transfer"]
};
class GeolocationService {
    /**
     * Detect location from IP address
     * Uses MaxMind or IP2Location API in production
     */
    async detectLocation(ipAddress) {
        try {
            // In production, use MaxMind GeoIP2, IP2Location, or similar service
            // For now, mock implementation
            const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=country,city,regionName,lat,lon,timezone,countryCode`);
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            if (data.status !== "success") {
                return null;
            }
            const countryCode = data.countryCode;
            return {
                country: countryCode,
                countryName: data.country,
                city: data.city,
                region: data.regionName,
                latitude: data.lat,
                longitude: data.lon,
                currency: this.getCurrencyForCountry(countryCode),
                timezone: data.timezone
            };
        }
        catch (error) {
            console.error("Geolocation detection failed:", error);
            return null;
        }
    }
    /**
     * Get currency code for a country
     */
    getCurrencyForCountry(countryCode) {
        return COUNTRY_CURRENCY_MAP[countryCode] || "USD";
    }
    /**
     * Get available payment methods for a country
     */
    getPaymentMethodsForCountry(countryCode) {
        return COUNTRY_PAYMENT_METHODS[countryCode] || ["credit_card", "paypal"];
    }
    /**
     * Check if a payment method is available in a country
     */
    isPaymentMethodAvailable(countryCode, method) {
        const methods = this.getPaymentMethodsForCountry(countryCode);
        return methods.includes(method);
    }
}
exports.GeolocationService = GeolocationService;
