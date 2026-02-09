import axios from 'axios';
import { Template } from '../types';

export const whatsappService = {
  /**
   * Send a standard text message (24h Session Window Only)
   */
  async sendTextMessage(to: string, body: string) {
    try {
      const response = await axios.post('/api/communication/whatsapp/send-text', { to, body });
      console.log('[WA PROXY] Text Sent:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[WA PROXY] Text Failed:', error);
      throw error;
    }
  },

  /**
   * Send a template message (Business Initiated)
   */
  async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'en_US', components: any[] = []) {
    try {
      const response = await axios.post('/api/communication/whatsapp/send-template', {
        to,
        templateName,
        languageCode,
        components
      });
      console.log('[WA PROXY] Template Sent:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[WA PROXY] Template Failed:', error);
      throw error;
    }
  },

  /**
   * Sync Templates from Meta WABA (GET)
   */
  async fetchWabaTemplates(): Promise<Template[]> {
    try {
      const response = await axios.get('/api/communication/whatsapp/templates');
      const metaData = response.data.data || [];
      
      // Map Meta structure to App Template structure
      return metaData.map((t: any) => {
        const bodyComp = t.components.find((c: any) => c.type === 'BODY');
        const headerComp = t.components.find((c: any) => c.type === 'HEADER');
        const footerComp = t.components.find((c: any) => c.type === 'FOOTER');
        const buttonsComp = t.components.find((c: any) => c.type === 'BUTTONS');

        // Extract variables
        const content = bodyComp?.text || '';
        const variables = (content.match(/{{[0-9]+}}/g) || []).map((v: string) => v.replace(/{{|}}/g, ''));

        return {
          id: t.name,
          name: t.name,
          channel: 'whatsapp',
          category: t.category,
          status: t.status,
          content: content,
          variables: variables,
          language: t.language,
          waHeader: headerComp ? { type: headerComp.format, content: headerComp.text } : { type: 'NONE' },
          waFooter: footerComp?.text,
          waButtons: buttonsComp?.buttons?.map((b: any) => ({
             type: b.type,
             text: b.text,
             value: b.url || b.phone_number
          })) || []
        };
      });
    } catch (error: any) {
      console.error('Failed to sync templates:', error);
      return [];
    }
  },

  /**
   * Create New Template on Meta (POST)
   */
  async createWabaTemplate(template: Template) {
    // For this secure implementation, we are skipping the create logic proxy 
    // to focus on the core messaging loops.
    // In a full implementation, this would also go through the backend.
    console.warn("Template creation via API is currently restricted in Secure Mode.");
    return { success: false, mappedName: template.name };
  }
};