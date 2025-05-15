# Discord Welcome Bot
### Mayu
A simple TypeScript bot (with no discord interface package) that sends a welcome embed with a user's avatar when they join a Discord guild.
## Prerequisites

* Node.js (v16+)
* A Discord bot token from the [Discord Developer Portal](https://discord.dev)
* A Discord server for the bot

## Setup

<b>Clone:</b>
```
git clone https://github.com/zytrixse/mayu
cd mayu
```
...or download and extract the files.

### Install Dependencies:
```
npm install
```

### Configure Environment:

Copy `example.env` to `.env`


### Edit .env with your values:
```dotenv
TOKEN=your_bot_token
WELCOME_CHANNEL_ID=your_channel_id
GUILD_ID=your_guild_id
WELCOME_MESSAGE=Welcome to the server, {{USERNAME}}! 🎉\n Please read the rules!
```


* TOKEN: Get from [Discord Developer Portal](https://discord.dev) (Bot > Token).
* GUILD_ID: Right-click your server, "Copy ID" (enable [Developer Mode](https://www.youtube.com/watch?v=8FNYLcjBERM)).
* WELCOME_CHANNEL_ID: Right-click the channel, "Copy ID".
* WELCOME_MESSAGE: Message with {{USERNAME}} for the user's name.

### Bot Permissions:

In the Developer Portal, enable the Server Members Intent. The bot will __**NOT**__ work without it.
Invite the bot to your server with Send Messages and Embed Links permissions.



## Running
### Compile:
```
npx tsc
```

Start:
```
node dist/mayu.js
```

## Test:
Add a new member to your server.
The bot will send an embed to the channel with the user’s avatar, e.g.:
* Title: Welcome to the Server!
* Description: Welcome to the server, TestUser! 🎉 Please read the rules!
* Thumbnail: User’s avatar or default Discord avatar.





## Troubleshooting
* Bot Not Working: Check TOKEN, GUILD_ID, and WELCOME_CHANNEL_ID in .env.
* No Embed: Ensure the bot has Send Messages and Embed Links permissions.
* Quotes in Message: Verify WELCOME_MESSAGE in .env isn’t double-quoted.
