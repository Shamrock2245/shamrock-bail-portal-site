# Twilio Communications

<SKILL_METADATA>
description: Patterns for robust SMS and Communication workflows using Twilio
version: 1.0.0
author: sickn33
</SKILL_METADATA>

## Patterns

### SMS Sending Pattern
Basic pattern for sending SMS messages with Twilio.
Handles the fundamentals: phone number formatting, message delivery,
and delivery status callbacks.

Key considerations:
- Phone numbers must be in E.164 format (+1234567890)
- Default rate limit: 80 messages per second (MPS)
- Messages over 160 characters are split (and cost more)
- Carrier filtering can block messages (especially to US numbers)


**When to use**: ['Sending notifications to users', 'Transactional messages (order confirmations, shipping)', 'Alerts and reminders']

```python
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import os
import re

class TwilioSMS:
    """
    SMS sending with proper error handling and validation.
    """

    def __init__(self):
        self.client = Client(
            os.environ["TWILIO_ACCOUNT_SID"],
            os.environ["TWILIO_AUTH_TOKEN"]
        )
        self.from_number = os.environ["TWILIO_PHONE_NUMBER"]

    def validate_e164(self, phone: str) -> bool:
        """Validate phone number is in E.164 format."""
        pattern = r'^\+[1-9]\d{1,14}$'
        return bool(re.match(pattern, phone))

    def send_sms(
        self,
        to: str,
        body: str,
        status_callback: str = None
    ) -> dict:
        """
        Send an SMS message.

        Args:
            to: Recipient phone number in E.164 format
            body: Message text (160 chars = 1 segment)
            status_callback: URL for delivery status webhooks

        Returns:
            Message SID and status
        """
        # Validate phone number format
        if not self.validate_e164(to):
            return {
                "success": False,
                "error": "Phone number must be in E.164 format (+1234567890)"
            }

        # Check message length (warn about segmentation)
        segment_count = (len(body) + 159) // 160
        if segment_count > 1:
            print(f"Warning: Message will be sent as {segment_count} segments")

        try:
            message = self.client.messages.create(
                to=to,
                from_=self.from_number,
                body=body,
                status_callback=status_callback
            )

            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "segments": segment_count
            }

        except TwilioRestException as e:
            return self._handle_error(e)

    def _handle_error(self, error: TwilioRestException) -> dict:
        """Standardized error handling."""
        return {
            "success": False,
            "error": str(error),
            "code": error.code
        }
```

### Twilio Verify Pattern (2FA/OTP)
Use this for phone verification instead of raw SMS.
Verify handles code generation, sending, and checking automatically.
More secure and better conversion rates than rolling your own OTP.

**When to use**: ['User registration/login', 'High-value transaction confirmation', 'Password reset flows']

### TwiML IVR Pattern
Basic structure for interactive voice response systems.
Routes calls based on keypad input or speech.

**When to use**: ['Customer support routing', 'Automated phone surveys', 'Appointment confirmation calls']

## ⚠️ Sharp Edges
- **A2P 10DLC**: You MUST register your brand and campaign if sending from local numbers to US numbers. Unregistered traffic is blocked.
- **Opt-out Management**: You legally must handle STOP/START keywords. Twilio handles this automatically for long codes, but your app logic should respect it too.
- **Geo-Permissions**: Enable countries in the Twilio console before sending international messages.
