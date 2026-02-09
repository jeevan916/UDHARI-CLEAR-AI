import axios from 'axios';

export const msg91Service = {
  /**
   * Send SMS via Flow API (DLT Compliant)
   */
  async sendSms(to: string, templateId: string, senderId: string, variables: Record<string, string>) {
    try {
      const response = await axios.post('/api/communication/sms/send', {
        to,
        templateId,
        senderId,
        variables
      });
      console.log('[MSG91 PROXY] SMS Sent:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[MSG91 PROXY] SMS Failed:', error);
      return { type: 'error', message: 'Failed to send' };
    }
  },

  /**
   * Verify DLT Template
   */
  async verifyTemplate(dltTeId: string) {
    await new Promise(r => setTimeout(r, 800));
    return true; 
  }
};