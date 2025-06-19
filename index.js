
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
admin.initializeApp();

// Replace with your real Cashfree production keys
const CASHFREE_CLIENT_ID = "your_client_id";
const CASHFREE_SECRET_KEY = "your_secret_key";
const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";

exports.createCashfreeOrder = functions.https.onCall(async (data, context) => {
    try {
        const { order_id, order_amount, customer_id, customer_email, customer_phone } = data;

        if (!order_id || !order_amount || !customer_id || !customer_email || !customer_phone) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }

        const orderData = {
            order_id,
            order_amount,
            order_currency: "INR",
            customer_details: {
                customer_id,
                customer_email,
                customer_phone
            }
        };

        const response = await axios.post(CASHFREE_API_URL, orderData, {
            headers: {
                "Content-Type": "application/json",
                "x-api-version": "2023-08-01",
                "x-client-id": CASHFREE_CLIENT_ID,
                "x-client-secret": CASHFREE_SECRET_KEY
            }
        });

        return response.data;
    } catch (error) {
        console.error("Cashfree order creation error:", error.response?.data || error.message);
        throw new functions.https.HttpsError("internal", "Failed to create Cashfree order");
    }
});
