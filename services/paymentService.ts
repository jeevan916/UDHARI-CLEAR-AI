
import axios from 'axios';

// LIVE PRODUCTION CREDENTIALS
const PAYMENT_CONFIG = {
  RAZORPAY_KEY: 'rzp_live_8291023812',
  SETU_CLIENT_ID: '8291-23-12-32',
  SETU_SCHEME_ID: '8821'
};

export const paymentService = {
  /**
   * Generate Razorpay Payment Link
   */
  async createRazorpayLink(amount: number, customerName: string, refId: string) {
    // Simulating the actual API call structure
    /* 
    const response = await axios.post('https://api.razorpay.com/v1/payment_links', {
       amount: amount * 100,
       currency: "INR",
       accept_partial: true,
       reference_id: refId,
       description: `Payment for ${customerName}`,
       customer: { name: customerName }
    }, { auth: { username: PAYMENT_CONFIG.RAZORPAY_KEY, password: '' } });
    */
    
    // Returning a realistic deeplink structure
    return `https://rzp.io/l/${refId.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)}`;
  },

  /**
   * Generate Setu UPI Intent Link
   */
  async createSetuLink(amount: number, customerPhone: string) {
    // Simulating Setu Deeplink generation
    return `upi://pay?pa=setu.${PAYMENT_CONFIG.SETU_SCHEME_ID}@npci&pn=ArrearsFlow&am=${amount}&tr=${Date.now()}&cu=INR`;
  }
};
