# Discord Message Scraper

An interactive Node.js tool to extract messages from your Discord servers. This script allows you to selectively scrape messages from Discord servers you're a member of.

## ⚠️ Important Disclaimers

- **Terms of Service**: Using user tokens for automation may violate Discord's Terms of Service. Use this tool at your own risk.
- **Rate Limiting**: The script includes delays to respect Discord's rate limits, but excessive use may trigger additional restrictions.
- **Privacy**: Be mindful of privacy and data protection laws when scraping and storing messages.

## 🚀 Features

- ✅ Interactive server selection
- ✅ Smart message extraction with user control for large channels (1000+ messages)
- ✅ Fetches messages from text channels in batches of 100
- ✅ Extracts comprehensive message data:
  - Message content, timestamps, and edits
  - Author information (username, ID, bot status)
  - Attachments (images, files with URLs)
  - Embeds, reactions, and mentions
  - Reply references
- ✅ Real-time progress indicators
- ✅ Automatic rate limit protection
- ✅ Timestamped output files
- ✅ Saves progress after each server

## 📋 Prerequisites

- **Node.js** 18+ (for native `fetch` API support)
- A Discord account with access to the servers you want to scrape

## 🔧 Installation

1. Clone or download this repository:
   ```bash
   cd discord-scrap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   (The project uses `dotenv` for environment variable management)

3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Discord credentials (see Configuration section)

## 🔑 Getting Your Discord Token

To use this script, you need to extract your Discord authorization token from your browser:

### Method 1: Using Browser Developer Tools (Recommended)

1. **Open Discord** in your web browser (https://discord.com)
2. **Log in** to your account
3. **Open Developer Tools**:
   - Chrome/Firefox: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
4. **Go to the Network tab**
5. **Filter by XHR/Fetch** requests
6. **Refresh the page** or navigate to a server
7. **Click on any request** to Discord's API (e.g., messages, guilds)
8. **Find the "Authorization" header** in the request headers
9. **Copy the entire token value** (it will look like a long string)

### Method 2: Using Console (Quick but less reliable)

1. Open Discord in your browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Paste this code and press Enter:
   ```javascript
   (webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
   ```
5. Copy the returned token

### Getting Optional Headers (For better disguise)

For the most authentic requests, you can also copy these optional headers from the same Network request:

- **Cookie**: Found in request headers
- **X-Super-Properties**: Found in request headers
- **User-Agent**: Your browser's user agent string

## ⚙️ Configuration

The project uses environment variables for configuration. Create a `.env` file in the project root:

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and update the required values**:

The `.env` file is organized into two sections:

### Section 1: Private Information (REQUIRED)
These values are specific to your Discord account and must be updated:

- **`DISCORD_TOKEN`**: Your Discord authorization token (see "Getting Your Discord Token" section)
- **`DISCORD_COOKIES`**: Your session cookies from browser
- **`X_SUPER_PROPERTIES`**: Encoded client information from your browser

### Section 2: General Configuration (Optional)
These have sensible defaults but can be customized:

- `USER_AGENT`: Browser identification string
- `ACCEPT_LANGUAGE`: Language preferences
- `DISCORD_LOCALE`: Discord locale setting (e.g., en-GB, fr-FR)
- `DISCORD_TIMEZONE`: Your timezone (e.g., Europe/Paris)
- `REFERER`: Referer URL
- `API_BASE_URL`: Discord API base URL (default: https://discord.com/api/v10)
- `OUTPUT_DIR`: Output directory for saved files (default: output)

⚠️ **Important**: The `.env` file is automatically excluded from git (via `.gitignore`) to protect your private information.

## 🎯 Usage

1. **Configure your environment**: Copy `.env.example` to `.env` and update your Discord token and credentials (see Configuration section above)

2. **Run the script**:
   ```bash
   npm start
   ```

3. **Follow the interactive prompts**:
   - The script will fetch and display all your Discord servers
   - For each server, you'll be asked: `Extract messages from this server? (y/N)`
   - Type `y` to extract messages
   - Type `n` or press Enter to skip to the next server (default is No)

4. **Wait for completion**:
   - The script will fetch all channels in the selected server
   - For each text channel, it will extract messages in batches of 100
   - **For channels with 1000+ messages**: You'll be prompted with options:
     - Type `y` to extract all messages
     - Type `n` or press Enter to stop at 1000 messages
     - Enter a number (e.g., `2500`) to limit extraction to that number
   - **For channels with < 1000 messages**: All messages are extracted automatically
   - Progress will be displayed in real-time
   - Data is automatically saved after each server

## 📊 Output Format

All files are saved to the `output/` directory at the project root, which is automatically created when you run the script.

### Files Generated

1. **`output/guilds.json`**: List of all your Discord servers
   ```json
   [
     {
       "id": "123456789",
       "name": "My Server",
       "owner": true,
       "permissions": "9007199254740991",
       "features": []
     }
   ]
   ```

2. **`output/discord_data_[timestamp].json`**: Complete message data
   ```json
   [
     {
       "guild": {
         "id": "123456789",
         "name": "My Server",
         "owner": true,
         "icon": "abc123..."
       },
       "channels": [
         {
           "id": "987654321",
           "name": "general",
           "type": 0,
           "messageCount": 150,
           "messages": [
             {
               "id": "111222333",
               "author": {
                 "id": "444555666",
                 "username": "User123",
                 "discriminator": "0001",
                 "bot": false
               },
               "content": "Hello world!",
               "timestamp": "2026-02-12T10:30:00.000Z",
               "attachments": [],
               "embeds": [],
               "reactions": [],
               "mentions": [],
               "replyTo": null
             }
           ]
         }
       ]
     }
   ]
   ```

## 🔍 Discord API Endpoints Used

The script uses the following Discord API v10 endpoints:

- `GET /users/@me/guilds` - Fetches all servers you're a member of
- `GET /guilds/{guild_id}/channels` - Fetches all channels in a server
- `GET /channels/{channel_id}/messages?limit=100&before={message_id}` - Fetches messages (max 100 per request)

## ⏱️ Rate Limiting

The script includes built-in rate limiting protection:

- **500ms delay** between fetching different servers
- **1000ms delay** between fetching messages from different channels
- **1000ms delay** between message batch requests

Discord's rate limits are:
- **50 requests per second** per endpoint (global)
- Additional per-route rate limits may apply

If you encounter rate limit errors (HTTP 429), the delays may need to be increased.

## 🛠️ Troubleshooting

### "HTTP error! status: 401"
- Your token is invalid or expired
- Regenerate your token by logging out and back into Discord
- Make sure you copied the entire token string

### "HTTP error! status: 403"
- You don't have permission to access that channel
- Some channels may be restricted even if you're in the server
- The script will automatically skip these channels

### "HTTP error! status: 429"
- You're being rate limited
- Increase the delay values in the script
- Wait a few minutes before trying again

### No messages extracted
- Ensure you have read permissions in the channels
- Check that the channels contain messages
- Verify your token has the correct permissions

### Token keeps expiring
- Discord tokens expire when you log out or change your password
- You may need to refresh your token periodically
- Consider using a bot token for more stable automation (requires proper bot setup)

## 📝 Example Usage

```bash
$ npm start

=== Discord Message Scraper ===

Fetching your Discord servers...

✓ Found 3 servers:

1. My Gaming Server
   ID: 123456789
   Owner: Yes

2. Study Group
   ID: 987654321
   Owner: No

3. Memes Central
   ID: 456789123
   Owner: No

──────────────────────────────────────────────────

Now processing each server...

[1/3] 📂 Server: My Gaming Server
   Extract messages from this server? (y/N): y
   ✓ Starting extraction...

   Found 5 text channels

   [1/5] 📝 Channel: general
      Retrieved 100 messages...
      Retrieved 200 messages...
      ✓ Total: 247 messages
   [2/5] 📝 Channel: announcements
      Retrieved 15 messages...
      ✓ Total: 15 messages
   [3/5] 📝 Channel: off-topic
      Retrieved 100 messages...
      Retrieved 200 messages...
      ... (continues to 1000)
      Retrieved 1000 messages...

      📊 Found 1000+ messages in this channel
      Extract all messages? (y/N, or enter a number to limit): 1500
      📌 Limiting to 1500 messages

      Retrieved 1100 messages...
      Retrieved 1200 messages...
      Retrieved 1300 messages...
      Retrieved 1400 messages...
      Retrieved 1500 messages...
      ✓ Total: 1500 messages
   ...
   ✓ Extracted 2000 total messages from My Gaming Server
   💾 Saved to: output/discord_data_1739456789123.json

[2/3] 📂 Server: Study Group
   Extract messages from this server? (y/N): n
   ⏭️  Skipped

[3/3] 📂 Server: Memes Central
   Extract messages from this server? (y/N): y
   ...

──────────────────────────────────────────────────

=== Scraping Complete! ===
Total servers processed: 2/3
```

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

ISC License - Use at your own risk.

## ⚖️ Legal Notice

This tool is for educational and personal use only. The authors are not responsible for any misuse or any damages caused by this tool. Always respect:

- Discord's Terms of Service
- Privacy laws and regulations (GDPR, etc.)
- Other users' privacy and consent
- Server rules and moderator decisions

Use responsibly and ethically.
