# Gisele Chat Widget — WordPress Installation

## Option 1: Child Theme `functions.php` (Recommended)

Add to `/wp-content/themes/h-code-child/functions.php`:

```php
<?php
/**
 * Gisele AI Chat Widget for PLEIJ Salon
 * Adds the chat widget to all frontend pages.
 */

function gisele_chat_widget_script() {
    if ( is_admin() ) return; // Don't load in admin
    ?>
    <script 
        src="https://api.getagentsocial.com/assets/chat-widget/gisele-chat-widget.js"
        data-brand-color="#3b82f6"
        data-agent-name="Gisele"
        data-agent-title="PLEIJ Salon · Online"
        data-greeting="Hi! I'm Gisele, your digital stylist at PLEIJ. How can I help you today?"
        data-position="bottom-right"
        data-auto-open-delay="0"
        data-quick-replies='["Book appointment","Hours & location","Services & pricing","Stylists"]'
    ></script>
    <?php
}
add_action( 'wp_footer', 'gisele_chat_widget_script' );
```

## Option 2: Custom HTML Widget (No code changes)

1. In WordPress Admin: **Appearance → Widgets**
2. Add a **Custom HTML** widget to the **Footer** sidebar
3. Paste:

```html
<script 
    src="https://api.getagentsocial.com/assets/chat-widget/gisele-chat-widget.js"
    data-brand-color="#3b82f6"
    data-agent-name="Gisele"
    data-agent-title="PLEIJ Salon · Online"
    data-greeting="Hi! I'm Gisele, your digital stylist at PLEIJ. How can I help you today?"
    data-position="bottom-right"
></script>
```

## Option 3: WP Header/Footer Plugin

If you use a header/footer injection plugin (like "Insert Headers and Footers"):

1. Go to **Settings → Insert Headers and Footers**
2. In the **Scripts in Footer** box, paste the same `<script>` tag above
3. Save

## Configuration Options

All options are set via `data-*` attributes on the `<script>` tag:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-brand-color` | `#3b82f6` | Accent color for header, buttons, bubbles |
| `data-agent-name` | `Gisele` | Name shown in header |
| `data-agent-title` | `PLEIJ Salon · Online` | Subtitle shown in header |
| `data-avatar-url` | (built-in) | URL to avatar image (defaults to hosted Gisele portrait) |
| `data-greeting` | `Hi! I'm Gisele...` | First message when widget opens |
| `data-api-endpoint` | (built-in) | Chat API endpoint |
| `data-position` | `bottom-right` | `bottom-right` or `bottom-left` |
| `data-quick-replies` | (4 defaults) | JSON array of quick reply buttons |
| `data-auto-open-delay` | `0` | Auto-open widget after X ms (0 = disabled) |
| `data-locale` | `en-US` | Locale for time formatting |

## Programmatic Control

The widget exposes `document.giseleWidget` for custom triggers:

```javascript
// Open the widget
document.giseleWidget.open();

// Close the widget
document.giseleWidget.close();

// Minimize
document.giseleWidget.minimize();

// Send a message programmatically
document.giseleWidget.sendMessage('I want to book a haircut');
```

### Example: Auto-open after 30 seconds on booking page

```javascript
// In WordPress, add to a page-specific script:
if (window.location.pathname.includes('/book')) {
    setTimeout(function() {
        document.giseleWidget.open();
    }, 30000); // 30 seconds
}
```

## Styling Overrides

To customize beyond the `data-*` attributes, add CSS in your child theme:

```css
/* Change launcher size */
.gisele-launcher {
    width: 64px !important;
    height: 64px !important;
}

/* Change panel width */
.gisele-panel {
    width: 400px !important;
}

/* Hide "Powered by AgentSocial" */
.gisele-footer {
    display: none !important;
}

/* Custom font */
.gisele-widget {
    font-family: 'Your Brand Font', sans-serif !important;
}
```

## How It Works

1. **Widget loads** — Single `<script>` tag injects everything (CSS, HTML, JS)
2. **Gisele's B&W portrait** appears as a 56px floating circle in the bottom-right corner
3. **Click to open** — Chat panel slides in with greeting message + quick replies
4. **Messages go to** `POST /api/v1/chat` (Gemini 2.0 Flash with PLEIJ knowledge base)
5. **Fallback** — If API is unavailable, keyword-based responses handle common questions
6. **No dependencies** — Zero external libraries, pure vanilla JS, works on any website

## File Sizes

| Asset | Size | Notes |
|-------|------|-------|
| `gisele-chat-widget.js` | ~22 KB | Minified ~8 KB, gzipped ~3 KB |
| `gisele-avatar.webp` | 32.8 KB | B&W portrait, 256×256px |
| **Total first load** | ~55 KB | ~12 KB gzipped |

## Deployment Checklist

- [ ] Copy `gisele-chat-widget.js` to `api.getagentsocial.com/assets/chat-widget/`
- [ ] Copy `gisele-avatar.webp` to `api.getagentsocial.com/assets/chat-widget/`
- [ ] Set `GEMINI_API_KEY` in API `.env`
- [ ] Add `<script>` tag to PLEIJ child theme `functions.php`
- [ ] Test on staging before production
- [ ] Verify chat responses are relevant and accurate
- [ ] Check mobile responsiveness (widget goes fullscreen on <480px)
- [ ] Monitor chat API logs for errors