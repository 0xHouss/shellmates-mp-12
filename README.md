# Shellmeets

Shellmeets is a Discord bot designed to help manage and schedule meetings and events for the Shellmates club. It provides an intuitive interface for creating, modifying, and canceling events while handling time zone conversions and reminders.

## Features
- Schedule meetings and events with details such as title, date, description, meet, leadtime, etc...
- Manage user preferences for time zones and notification lead times.
- View scheduled events.
- Cancel scheduled meetings easily.
- Supports time zone conversion for accurate scheduling.
- Get reminders on google calendar and on discord.

## Commands
### `/schedule title! datetime! description? channel? meet? leadtime?`
Schedules a new meeting or event.
- **title!** (required): The title of the meeting.
- **datetime!** (required): The date and time of the event.
- **description?** (optional): A description of the event.
- **channel?** (optional): The channel to send notifications to.
- **meet?** (optional): The link of the google meet.
- **leadtime?** (optional): How long before the event to send a reminder.

### `!schedule title! datetime! description? leadtime? meet? channel? mentions?`
Schedules a new meeting or event.
- **title!** (required): The title of the meeting.
- **datetime!** (required): The date and time of the event.
- **description?** (optional): A description of the event.
- **leadtime?** (optional): How long before the event to send a reminder.
- **meet?** (optional): The link of the google meet.
- **channel?** (optional): The channel to send notifications to.
- **mentions?** (optional): Mention users or roles to be invited to the event.

### `/preferences set timezone? email?`
Sets user preferences.
- **timezone?** (optional): Preferred time zone.
- **email?** (optional): Email to be invited to the event in google calendar.

### `/preferences list`
See your current preferences.

### `/help`
Displays the help menu with details about commands and usage.

### `/calendar`
Displays upcoming meetings in a calendar format.
- **type?** (optional): View by `day` or `month`.

### `/cancel id!`
Cancels a scheduled meeting.
- **id!** (required): The ID of the meeting to cancel.

## Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/0xHouss/shellmates-mp-12
   cd shelmates-mp-12
   ```
2. Install dependencies:
   ```sh
   pnpm i
   ```
3. Configure the bot by setting up environment variables.
4. Run the bot:
   ```sh
   pnpm start
   ```

## Contributing
Contributions are welcome! Feel free to open issues and submit pull requests to improve the bot.

## License
This project is licensed under the MIT License.