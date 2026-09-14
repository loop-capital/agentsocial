# SpamCapture UI Mockups

## Screen Overview

### 1. Home Screen (Dashboard)
```
+--------------------------------------------------+
| SpamCapture              [Shield Icon]          |
| Community-powered protection                     |
+--------------------------------------------------+
|                                                  |
|  COMMUNITY STATS                                 |
|  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐|
|  │ Reports     │  │ Active      │  │ Protected   │|
|  │ Today: 124  │  │ Blocks: 1K  │  │ Users: 8K+  │|
|  └─────────────┘  └─────────────┘  └─────────────┘|
|                                                  |
|  QUICK ACTIONS                                   |
|  [💬 Report Text]  [📞 Report Call]  [🛡️ Block List]|
|                                                  |
|  TRENDING SPAM NUMBERS                           |
|  #1  (555) 123-4567  156 reports                 |
|  #2  (555) 987-6543   89 reports                 |
|  #3  (555) 456-7890   67 reports                 |
|                                                  |
|  [Protection Active - Your device is protected]  |
+--------------------------------------------------+
```

### 2. Report Screen (SMS/Call)
```
+--------------------------------------------------+
| <  Report SMS/MMS                                |
+--------------------------------------------------+
|  [💬] SMS/MMS                                    |
|                                                  |
|  Phone Number *                                  |
|  +1 (555)   _______                              |
|                                                  |
|  Caller ID (optional)                            |
|  Scam Likely__________                           |
|                                                  |
|  Category: [Spam] [Scam] [Phishing] [Robocall]   |
|                    [Telemarketing] [Other]       |
|                                                  |
|  Message Content (optional)                      |
|  You've won a free cruise! Call now to claim...  |
|                                                  |
|  123/1000                                        |
|                                                  |
|  🔒 Your report is anonymous. We never share     |
|     your personal information.                   |
|                                                  |
|              [ SUBMIT REPORT ]                   |
+--------------------------------------------------+
```

### 3. Block List Screen
```
+--------------------------------------------------+
| Community Block List       [Download]            |
| 1,247 numbers blocked                              |
+--------------------------------------------------+
|  [All]  [High Risk]  [Critical]                  |
|                                                  |
|  🛡️ Critical    Last: Jan 15                     |
|  (555) 123-4567                                  |
|  156 reports  •  First: Jan 10                   |
|  [robocall] [scam]                               |
|                                                  |
|  ⚠️ High Risk   Last: Jan 14                     |
|  (555) 987-6543                                  |
|  89 reports  •  First: Jan 12                    |
|  [scam] [phishing]                               |
|                                                  |
|  🛡️ Critical    Last: Jan 13                     |
|  (555) 456-7890                                  |
|  67 reports  •  First: Jan 11                    |
|  [telemarketing] [spam]                          |
|                                                  |
|  ...                                             |
+--------------------------------------------------+
```

### 4. Settings Screen
```
+--------------------------------------------------+
| Settings                                         |
+--------------------------------------------------+
|  PROTECTION                                      |
|  🛡️ Auto-blocking          [ON]                  |
|      Block calls from reported numbers           |
|                                                  |
|  🔔 Threshold                                      |
|      Minimum reports to auto-block: 5            |
|                                                  |
|  NOTIFICATIONS                                   |
|  🔔 Push Notifications     [ON]                  |
|      Get alerts about new threats              |
|                                                  |
|  PRIVACY                                         |
|  📊 Analytics              [ON]                  |
|      Help improve the app with usage data      |
|                                                  |
|  🔒 Privacy Policy                                 |
|  📄 Terms of Service                               |
|                                                  |
|  ABOUT                                           |
|  ℹ️ App Version           1.0.0                  |
|  👤 Anonymous ID          abc123...              |
|  ❓ Help & Support                                    |
|                                                  |
|              [Reset Anonymous ID]                |
|                                                  |
|  SpamCapture v1.0.0                              |
|  Made with 💙 by the community                   |
+--------------------------------------------------+
```

## Color Palette

- **Primary Blue**: #2563EB (buttons, headers, active states)
- **Success Green**: #10B981 (protection status, confirmed actions)
- **Warning Amber**: #F59E0B (medium risk, caution)
- **Danger Red**: #EF4444 (high risk, errors, critical threats)
- **Slate Gray**: #64748B (secondary text, disabled states)
- **Dark Slate**: #1E293B (primary text, icons)
- **Light Slate**: #F8FAFC (background, card backgrounds)
- **Border Gray**: #E2E8F0 (dividers, input borders)

## Typography

- **Headers**: Bold, 28pt (screen titles), 20pt (section titles)
- **Body**: Regular, 16pt (input labels), 14pt (regular text)
- **Captions**: Medium, 12pt (helper text, timestamps)
- **Numbers**: Bold, 18-24pt (stats, counts, phone numbers)
- **Buttons**: Medium, 16pt (action buttons)

## Icon Set

Using Ionicons for consistent vector icons:
- **Home**: home / home-outline
- **Report**: chatbubble-ellipses (SMS), call (Call)
- **Block List**: shield / shield-outline
- **Settings**: settings / settings-outline
- **Protection**: shield-checkmark
- **Notifications**: bell / bell-outline
- **Analytics**: analytics
- **Privacy**: lock-closed
- **Help**: help-circle
- **Logout**: log-out-outline
- **Back/Close**: close
- **Download**: download-outline
- **Chevron**: chevron-forward
- **Warning**: alert-circle
- **Success**: checkmark-circle

## Component Specifications

### Input Fields
- Height: 48px
- Padding: 12px horizontal
- Background: White
- Border: 1px solid #E2E8F0
- Border Radius: 12px
- Font Size: 16px
- Focus State: Ring #2563EB/30

### Buttons
- Height: 52px
- Border Radius: 12px
- Font Size: 16px, Font Weight: 600
- Primary: Background #2563EB, Text White
- Secondary: Background White, Text #2563EB, Border #2563EB
- Disabled: Opacity 0.6

### Cards
- Background: White
- Border Radius: 12px
- Padding: 16px
- Shadow: 0px 1px 3px rgba(0,0,0,0.1)
- Elevation: 2 (Android)

### Lists
- Item Padding: 16px vertical, 16px horizontal
- Separator: 1px solid #E2E8F0
- Avatar Size: 40x40px
- Badge Padding: 4px horizontal, 2px vertical
- Badge Radius: 10px

## Navigation Flow

```
Home Screen
├── Report Screen (SMS/Call) ← Modal
├── Block List Screen ← Tab
└── Settings Screen ← Tab
```

Report Screen can be accessed from:
- Home Screen Quick Actions
- Tab Navigator (center button)
- Deep Linking: `spamcapture://report/sms` or `spamcapture://report/call`