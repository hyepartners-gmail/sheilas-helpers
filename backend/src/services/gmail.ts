import { google } from 'googleapis';
import { DatastoreService } from './datastore';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  `${process.env.API_BASE_URL}/admin/gmail/callback`
);
export { oauth2Client }; 

export const GmailService = {
  createAuthUrl() {
    return oauth2Client.generateAuthUrl({
      scope: ['https://www.googleapis.com/auth/gmail.send'],
      access_type: 'offline',
      prompt: 'consent',
    });
  },

  async storeTokens(tokens: any) {
    await DatastoreService.saveUser({ id: 'gmailTokens', ...tokens } as any);
  },

  async loadTokens() {
    const t = await DatastoreService.getUserById('gmailTokens') as any;
    if (t) oauth2Client.setCredentials(t);
  },

  async sendEmail(recipients: string[], subject: string, body: string) {
    await this.loadTokens();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const message =
      `To: ${recipients.join(', ')}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
      body;
    const encoded = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
  },
};
