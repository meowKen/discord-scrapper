require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

// ============================================
// CONFIGURATION - Loaded from .env file
// ============================================

// Load environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const USER_AGENT = process.env.USER_AGENT;
const ACCEPT_LANGUAGE = process.env.ACCEPT_LANGUAGE;
const DISCORD_LOCALE = process.env.DISCORD_LOCALE;
const DISCORD_TIMEZONE = process.env.DISCORD_TIMEZONE;
const X_SUPER_PROPERTIES = process.env.X_SUPER_PROPERTIES;
const DISCORD_COOKIES = process.env.DISCORD_COOKIES;
const REFERER = process.env.REFERER;
const API_BASE_URL = process.env.API_BASE_URL;
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'output';

// ============================================

// Common headers for all Discord API requests
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Host': 'discord.com',
  'User-Agent': USER_AGENT,
  'Accept': '*/*',
  'Accept-Language': ACCEPT_LANGUAGE,
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Authorization': DISCORD_TOKEN,
  'X-Super-Properties': X_SUPER_PROPERTIES,
  'X-Discord-Locale': DISCORD_LOCALE,
  'X-Discord-Timezone': DISCORD_TIMEZONE,
  'X-Debug-Options': 'bugReporterEnabled',
  'Alt-Used': 'discord.com',
  'Connection': 'keep-alive',
  'Referer': REFERER,
  'Cookie': DISCORD_COOKIES,
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'TE': 'trailers'
});

// Delay helper to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to prompt user for y/n (defaults to no) or a number
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      
      // Check if it's a number
      const num = parseInt(normalized);
      if (!isNaN(num) && num > 0) {
        resolve(num);
        return;
      }
      
      // Default to 'no' if empty, accept 'y' for yes
      resolve(normalized === 'y');
    });
  });
}

async function getUserGuilds() {
  try {
    console.log('Fetching your Discord servers...\n');
    
    const response = await fetch(`${API_BASE_URL}/users/@me/guilds`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const guilds = await response.json();
    
    console.log(`✓ Found ${guilds.length} servers:\n`);
    
    guilds.forEach((guild, index) => {
      console.log(`${index + 1}. ${guild.name}`);
      console.log(`   ID: ${guild.id}`);
      console.log(`   Owner: ${guild.owner ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Save guilds list
    fs.writeFileSync(path.join(OUTPUT_DIR, 'guilds.json'), JSON.stringify(guilds, null, 2));

    return guilds;
  } catch (error) {
    console.error('Error fetching guilds:', error.message);
    return null;
  }
}

// Get all channels from a guild
async function getGuildChannels(guildId, guildName) {
  try {
    const response = await fetch(`${API_BASE_URL}/guilds/${guildId}/channels`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const channels = await response.json();
    return channels;
  } catch (error) {
    console.error(`   Error fetching channels: ${error.message}`);
    return [];
  }
}

// Get messages from a channel (fetches ALL messages in batches of 100)
async function getChannelMessages(channelId, channelName) {
  try {
    let allMessages = [];
    let lastMessageId = null;
    let userLimit = null;
    let hasPrompted = false;
    
    // Fetch messages in batches of 100
    while (true) {
      let url = `${API_BASE_URL}/channels/${channelId}/messages?limit=100`;
      if (lastMessageId) {
        url += `&before=${lastMessageId}`;
      }
      
      const response = await fetch(url, {
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.log(`      ⚠️  No permission to read messages`);
          break;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const messages = await response.json();
      
      if (messages.length === 0) {
        break;
      }

      allMessages = allMessages.concat(messages);
      lastMessageId = messages[messages.length - 1].id;

      console.log(`      Retrieved ${allMessages.length} messages...`);

      // Stop if we got less than 100 messages (no more available)
      if (messages.length < 100) {
        break;
      }

      // Check if we've reached 1000 messages and there are more available
      if (!hasPrompted && allMessages.length >= 1000) {
        hasPrompted = true;
        console.log(`\n      📊 Found 1000+ messages in this channel`);
        
        const answer = await askQuestion(`      Extract all messages? (y/N, or enter a number to limit): `);
        
        // Check the type of answer
        if (typeof answer === 'number') {
          // User specified a limit
          userLimit = answer;
          console.log(`      📌 Limiting to ${userLimit} messages\n`);
          if (allMessages.length >= userLimit) {
            allMessages = allMessages.slice(0, userLimit);
            break;
          }
        } else if (answer === true) {
          // User said yes ('y'), continue extracting all
          console.log(`      ✓ Continuing to extract all messages...\n`);
        } else {
          // User said no or pressed enter, stop at current count
          console.log(`      ⏹️  Stopping at ${allMessages.length} messages\n`);
          break;
        }
      }

      // Check if we've reached user-specified limit
      if (userLimit && allMessages.length >= userLimit) {
        allMessages = allMessages.slice(0, userLimit);
        break;
      }

      // Respect rate limits - wait between requests
      await delay(1000);
    }
    
    if (allMessages.length > 0) {
      console.log(`      ✓ Total: ${allMessages.length} messages`);
    }
    return allMessages;
  } catch (error) {
    console.error(`      Error: ${error.message}`);
    return [];
  }
}

// Main interactive function to scrape data
async function scrapeAllData() {
  console.log('=== Discord Message Scraper ===\n');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory: ${OUTPUT_DIR}\n`);
  }
  
  // Step 1: Fetch and display all servers
  const guilds = await getUserGuilds();
  
  if (!guilds || guilds.length === 0) {
    console.log('No servers found!');
    return;
  }
  
  console.log('─'.repeat(50));
  console.log('\nNow processing each server...\n');
  
  const fullData = [];
  
  // Step 2: For each server, ask if user wants to scrape it
  for (let i = 0; i < guilds.length; i++) {
    const guild = guilds[i];
    
    console.log(`\n[${ i + 1}/${guilds.length}] 📂 Server: ${guild.name}`);
    
    // Prompt user
    const shouldExtract = await askQuestion(`   Extract messages from this server? (y/N): `);
    
    if (!shouldExtract) {
      console.log('   ⏭️  Skipped\n');
      continue;
    }
    
    console.log('   ✓ Starting extraction...\n');
    
    // Get channels for this guild
    const channels = await getGuildChannels(guild.id, guild.name);
    await delay(500);
    
    const guildData = {
      guild: {
        id: guild.id,
        name: guild.name,
        owner: guild.owner,
        icon: guild.icon
      },
      channels: []
    };
    
    // For each TEXT channel, get all messages
    const textChannels = channels.filter(ch => ch.type === 0 || ch.type === 5);
    console.log(`   Found ${textChannels.length} text channels\n`);
    
    for (let j = 0; j < textChannels.length; j++) {
      const channel = textChannels[j];
      console.log(`   [${j + 1}/${textChannels.length}] 📝 Channel: ${channel.name}`);
      
      // Fetch all messages in batches of 100
      const messages = await getChannelMessages(channel.id, channel.name);
      await delay(1000);
      
      guildData.channels.push({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.id,
          author: {
            id: msg.author.id,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            bot: msg.author.bot || false
          },
          content: msg.content,
          timestamp: msg.timestamp,
          editedTimestamp: msg.edited_timestamp,
          attachments: msg.attachments.map(att => ({
            id: att.id,
            filename: att.filename,
            url: att.url,
            size: att.size
          })),
          embeds: msg.embeds,
          reactions: msg.reactions || [],
          mentions: msg.mentions.map(u => u.username),
          replyTo: msg.referenced_message?.id || null
        }))
      });
    }
    
    fullData.push(guildData);
    
    // Save progress after each guild
    const filename = `discord_data_${Date.now()}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(fullData, null, 2));
    
    const totalMessages = guildData.channels.reduce((sum, ch) => sum + ch.messageCount, 0);
    console.log(`   ✓ Extracted ${totalMessages} total messages from ${guild.name}`);
    console.log(`   💾 Saved to: ${filepath}\n`);
  }
  
  console.log('─'.repeat(50));
  console.log('\n=== Scraping Complete! ===');
  console.log(`Total servers processed: ${fullData.length}/${guilds.length}`);
  
  return fullData;
}

// Run the scraper
scrapeAllData();