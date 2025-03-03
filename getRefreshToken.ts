import http from 'http';
import url from 'url';
import open from 'open';
import destroyer from 'server-destroy';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { AddressInfo } from 'net';

// Load environment variables from .env file
dotenv.config();

// Get credentials from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback';

// Validate environment variables
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: Missing required environment variables.');
  console.error('Please create a .env file with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.readonly'],
  prompt: 'consent'  // Force refresh token
});

// Create a simple server to handle the redirect
const server = http.createServer(async (req, res) => {
  try {
    // Parse the callback URL
    const parsedUrl = url.parse(req?.url || '', true);
    const queryParams = parsedUrl.query;
    
    if (queryParams.code) {
      // Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(queryParams.code as string);
      
      console.log('\n\n========== REFRESH TOKEN ==========');
      console.log(tokens.refresh_token);
      console.log('==================================\n');
      
      console.log('Copy this refresh token to your .env file as GOOGLE_REFRESH_TOKEN');
      
      // Send a success response to the browser
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Authentication Successful!</h1>
            <p>You can close this tab now.</p>
            <p>The refresh token has been displayed in your terminal.</p>
            <p>Add it to your <code>.env</code> file as:</p>
            <pre style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          </body>
        </html>
      `);
      
      // Close the server
      (server as any).destroy();
    }
  } catch (e) {
    const error = e as Error;
    console.error('Error getting tokens:', error);
    res.writeHead(500, {'Content-Type': 'text/html'});
    res.end(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Authentication Error</h1>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
    (server as any).destroy();
  }
});

// Start the server
server.listen(3000, () => {
  const address = server.address() as AddressInfo;
  console.log(`Server listening on port ${address.port}...`);
  console.log('Opening browser for authorization...');
  
  // Open the URL in browser
  open(authUrl, { wait: false }).catch(err => {
    console.error('Failed to open browser:', err);
    console.log('Please open this URL manually:', authUrl);
  });
});

// Enable server close on demand
destroyer(server);