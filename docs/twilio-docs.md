//////this doc is for all twilio docs needed for the project

///// This is a video transcript for resolving the errors that i am receiving

0:00 Ahoy there, my name is Craig and I'm a developer educator here at Twilio, we're so glad to have you with us.
0:08 We have a thing that I wanted to deal with here, a problem that we've been seeing and I wanted to just give a little quick tip so that we can walk through a couple things.
0:15 I'm on this wonderful page here that talks about how to register your A to P 10 D ELC numbers. And what we've been seeing, um, is people have been doing excellent with this.
0:25 People have been registering their brand. So number one here, they've been providing information about who they are. That's their brand.
0:31 Then they've been registering their campaign and they've been talking about what their use case is. But number three has been a problem that we've seen.
0:37 So people will go and they'll get their campaigns all figured. But number three their number, their 10 DLC number isn't quite in their messaging service yet.
0:46 Now, you might be saying, well, what is a messaging service? And I thought maybe it's time that we take a quick look at that and a little tip to make sure that things are working just like you want so we can stop getting any sort of those errors.
0:57 Alright, so, um, let's go ahead and let's take a look here. I'm going to start or complete my registration. Now I already have a working campaign.
1:05 So what this is going to do is it's going to pop me into a new campaign because remember, I could have multiple campaigns, right?
1:11 I could have multiple use cases. Um, uh, and when I go to fill this out and what you would have seen too is you'll see here there's this messaging service and it has this create a new messaging service.
1:21 Or it has select existing messaging service. And these are our messaging services are things that I can build on Twilio outside of this and sometimes these things will get built and I'll put numbers in them and I'll control all sorts of things, but maybe you list left the set create a new messaging service
1:35 and so I'd fill this out. I would submit my campaign. It would get approved and you'll notice. That there's another check box here for this register phone numbers and what you would do is you need to add that phone number that phone number that you want to send that you bought this local number.
1:51 You need to add that to the messaging service and you can do that after you already have an approved campaign.
1:56 So I'm in here. I'm under messaging regulatory compliance. I'm going to go here under campaigns. Any other questions? And in here I have a working campaign.
2:04 I am so excited that I have this campaign that I can properly send messages across the A2P network. I'm so excited that I'm able to do that.
2:12 But what we're seeing is sometimes people get this approval and then they send a message and it's still not working.
2:17 They send a message from a phone number, a 10 DLC number and it's not working. One of the reasons why that might be happening is there's this, uh, there's this messaging service here.
2:25 Okay. So this messaging service, I'm going to click into it. Now this is my messaging service and I did correctly add my phone number to it.
2:33 So my phone number that you'll see here is this superclass number. So I bought this. I love it. I love it.
2:38 It's a local number. Seven zero and then it spells superclass and I gave this number out. So it's out there in the wild.
2:43 So it was important that I registered a campaign for what this is doing. It takes a survey. Um, and it's in here.
2:49 Now, if it were not, and if I was trying to send from this number and it wasn't in here and I'm like, wait, why isn't this happening?
2:57 Um, I could come here. I would look at my messaging service. I would make sure that all of the numbers that are in this campaign that I wanted to send were in here.
3:04 And if they weren't, what I would do, what I would do to add a message to the messaging service is a message.
3:10 I'm sorry. What I would do to add my number to that is add one of these senders. Now, the reason why they're called senders is because there's phone numbers.
3:16 You could do phone numbers, but you can also do other things like short codes or alpha senders. You can even put WhatsApp.
3:21 You can put WhatsApp numbers in there. But what we care about is this messaging service is related to the campaign.
3:27 And so every single 10 DLC number that I have that I want to be able to send across, I need to make sure that it's chosen in there.
3:34 You'll see when you go to see numbers, you can see ones that are on a side. So this number here is a local number.
3:40 It's a local number. And it's not in a messaging service, so I know that that's problematic actually. Um, so I want to take care of that.
3:47 I gotta figure out what's going on with that number. Um, uh, but, uh, so anyway, so, so we come to the center pool from this, this message, the center pool.
3:55 And, uh, the reason why messaging services exist is you might have a lot of numbers, right? And you might want to configure them.
4:02 All together. And there's a lot of cool options, uh, that are in here. And in fact, that brings me to the second tip that I want you to know about.
4:08 So when you have this messaging service and you have these numbers in here, the configuration of the messaging service takes over the configuration of each phone number.
4:18 And, uh, one of the things that where people might be seeing a problem is on incoming messages. So you might know from your, from your phone number, if you go into your phone number and, uh, I'll open that up here.
4:30 So I'm gonna open up my phone number here. Um, my phone number configuration screen, uh, if I look at it and I scroll down to here, I can see messaging.
4:38 I can say when a message comes in, it's gonna do this, uh, I'm doing a studio. So that's my, my web hook here, uh, for that.
4:45 And, uh, what happens is in the, in my, my messaging service, if I come in here and I go under this integration, um, this is very important.
4:55 But by default, when these are created, it's gonna say defer to the sender's web hook. So in this case, my web hook there is my studio flow.
5:01 I'm saying when a message comes in, I want it to go to that, that studio flow. Now, this messaging service can have a lot of numbers in it.
5:09 So what you might want to do as a user of this messaging service is you want to say every single time I send something out of this, every time I, I send something out, I want to drop the message.
5:19 I don't want, um, uh, if somebody texts into me. I don't want to, to take that message. I want to drop the message.
5:26 And the reason that you might want to do that is because you won't be billed for incoming messages. So, uh, this will say all numbers that are in this messaging service behave this way.
5:36 So what might be happening is you might have added a phone number to a messaging service that has one of these settings that says all of them here should drop the message instead of defer to a sender's webhook or they're sending to a very specific webhook.
5:51 So the webhook here is what happens when an incoming message happens. So, two things. I wanted you to make sure that you have registered your number with your messaging service and then make sure that the messaging service integration is set up like you want it to be.
6:06 And you want to also look on this page as pages in the notes. If you look at the check my registration status, you can come here and you can take a look at how to get a csv report of everything that's happening with your account.
6:18 You can see the numbers that you might be missing. So I hope that that helps you and helps you get on locked.
6:23 And I can't wait to see when you start sending on this A2P 10 DLC route. We can't wait to see what you built.

# 30034: US A2P 10DLC - Message from an Unregistered Number

Log Type: APPLICATION

Log Level: ERROR

## Description

Messages sent to US numbers will not be delivered if they are sent from numbers that are not associated with an approved A2P 10DLC Campaign. This [guide](https://support.twilio.com/hc/en-us/articles/4418081745179-How-do-I-check-that-I-have-completed-US-A2P-10DLC-registration-) will help you determine if you have completed registration for A2P 10DLC. To initiate or continue an A2P 10DLC registration, [visit your console here](https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-onboarding). Find out how to register using [this guide](https://support.twilio.com/hc/en-us/articles/1260801864489-How-do-I-register-to-use-A2P-10DLC-messaging-).

For a step-by-step walkthrough, check out [this video on resolving Error 30034](https://twil.io/resolve30034).

### Possible Causes

You are sending messages to the US using a US 10DLC number that is not associated with an approved A2P 10DLC Campaign.

### Possible Solutions

Associate your US 10DLC number with a registered A2P Campaign by adding it to the corresponding Messaging Service via the Twilio Console or API. Find out how to register using [this guide](https://support.twilio.com/hc/en-us/articles/1260801864489-How-do-I-register-to-use-A2P-10DLC-messaging-).

Alternatively, you can also use a different number that is already associated with an approved A2P Campaign to send messages in the US.


# Services resource

> \[!IMPORTANT]
>
> The Services resource is currently available as a Public Beta product. This means that some features for configuring your Messaging Service via the REST API are not yet implemented, and others may be changed before the product is declared Generally Available. Messaging Service Configuration through the [Twilio Console](https://www.twilio.com/console) is Generally Available.
>
> Public Beta products are [not covered by a Twilio SLA](https://help.twilio.com/hc/en-us/articles/115002413087-Twilio-Beta-product-support).
>
> The resources for sending Messages with a Messaging Service are Generally Available.

When sending a message with a Messaging Service, you can improve message performance by enabling the [included features](/docs/messaging/services).

Developers can associate [phone numbers](/docs/messaging/api/phonenumber-resource), [short codes](/docs/messaging/api/services-shortcode-resource), and [alpha sender IDs](/docs/messaging/api/alphasender-resource) to an instance of a Messaging Service. The Service handles all inbound and outbound behaviors for the phone numbers and shortcodes.

**Twilio Console**

You can manage your Messaging Services through the [Twilio Console when logged in.](https://www.twilio.com/console/sms/services)

## Messaging Services Resource

The Services resource represents a set of configurable behavior for sending and receiving Messages.

### Subresources

The Services resource also has PhoneNumbers, ShortCodes, and AlphaSenders subresources for managing the phone numbers, short codes, and alpha sender IDs associated with the Service.

* [PhoneNumbers](/docs/messaging/api/phonenumber-resource)
* [ShortCodes](/docs/messaging/api/services-shortcode-resource)
* [AlphaSenders](/docs/messaging/api/alphasender-resource)

### Resource URI

All URLs in this documentation use the following base URL:

```bash
https://messaging.twilio.com/v1
```

## Service Properties

```json
{"type":"object","refName":"messaging.v1.service","modelName":"messaging_v1_service","properties":{"sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^MG[0-9a-fA-F]{32}$","nullable":true,"description":"The unique string that we created to identify the Service resource."},"account_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^AC[0-9a-fA-F]{32}$","nullable":true,"description":"The SID of the [Account](/docs/iam/api/account) that created the Service resource."},"friendly_name":{"type":"string","nullable":true,"description":"The string that you assigned to describe the resource."},"date_created":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the resource was created specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format."},"date_updated":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the resource was last updated specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format."},"inbound_request_url":{"type":"string","format":"uri","nullable":true,"description":"The URL we call using `inbound_method` when a message is received by any phone number or short code in the Service. When this property is `null`, receiving inbound messages is disabled. All messages sent to the Twilio phone number or short code will not be logged and received on the Account. If the `use_inbound_webhook_on_number` field is enabled then the webhook url defined on the phone number will override the `inbound_request_url` defined for the Messaging Service."},"inbound_method":{"type":"string","format":"http-method","enum":["GET","POST"],"nullable":true,"description":"The HTTP method we use to call `inbound_request_url`. Can be `GET` or `POST`."},"fallback_url":{"type":"string","format":"uri","nullable":true,"description":"The URL that we call using `fallback_method` if an error occurs while retrieving or executing the TwiML from the Inbound Request URL. If the `use_inbound_webhook_on_number` field is enabled then the webhook url defined on the phone number will override the `fallback_url` defined for the Messaging Service."},"fallback_method":{"type":"string","format":"http-method","enum":["GET","POST"],"nullable":true,"description":"The HTTP method we use to call `fallback_url`. Can be: `GET` or `POST`."},"status_callback":{"type":"string","format":"uri","nullable":true,"description":"The URL we call to [pass status updates](/docs/sms/api/message-resource#message-status-values) about message delivery."},"sticky_sender":{"type":"boolean","nullable":true,"description":"Whether to enable [Sticky Sender](/docs/messaging/services#sticky-sender) on the Service instance."},"mms_converter":{"type":"boolean","nullable":true,"description":"Whether to enable the [MMS Converter](/docs/messaging/services#mms-converter) for messages sent through the Service instance."},"smart_encoding":{"type":"boolean","nullable":true,"description":"Whether to enable [Smart Encoding](/docs/messaging/services#smart-encoding) for messages sent through the Service instance."},"scan_message_content":{"type":"string","enum":["inherit","enable","disable"],"description":"Reserved.","refName":"service_enum_scan_message_content","modelName":"service_enum_scan_message_content"},"fallback_to_long_code":{"type":"boolean","nullable":true,"description":"[OBSOLETE] Former feature used to fallback to long code sender after certain short code message failures."},"area_code_geomatch":{"type":"boolean","nullable":true,"description":"Whether to enable [Area Code Geomatch](/docs/messaging/services#area-code-geomatch) on the Service Instance."},"synchronous_validation":{"type":"boolean","nullable":true,"description":"Reserved."},"validity_period":{"type":"integer","default":0,"description":"How long, in seconds, messages sent from the Service are valid. Can be an integer from `1` to `36,000`. Default value is `36,000`."},"url":{"type":"string","format":"uri","nullable":true,"description":"The absolute URL of the Service resource."},"links":{"type":"object","format":"uri-map","nullable":true,"description":"The absolute URLs of related resources."},"usecase":{"type":"string","nullable":true,"description":"A string that describes the scenario in which the Messaging Service will be used. Possible values are `notifications`, `marketing`, `verification`, `discussion`, `poll`, `undeclared`."},"us_app_to_person_registered":{"type":"boolean","nullable":true,"description":"Whether US A2P campaign is registered for this Service."},"use_inbound_webhook_on_number":{"type":"boolean","nullable":true,"description":"A boolean value that indicates either the webhook url configured on the phone number will be used or `inbound_request_url`/`fallback_url` url will be called when a message is received from the phone number. If this field is enabled then the webhook url defined on the phone number will override the `inbound_request_url`/`fallback_url` defined for the Messaging Service."}}}
```

## Create a Service

`POST https://messaging.twilio.com/v1/Services`

### Request body parameters

```json
{"schema":{"type":"object","title":"CreateServiceRequest","required":["FriendlyName"],"properties":{"FriendlyName":{"type":"string","description":"A descriptive string that you create to describe the resource. It can be up to 64 characters long."},"InboundRequestUrl":{"type":"string","format":"uri","description":"The URL we call using `inbound_method` when a message is received by any phone number or short code in the Service. When this property is `null`, receiving inbound messages is disabled. All messages sent to the Twilio phone number or short code will not be logged and received on the Account. If the `use_inbound_webhook_on_number` field is enabled then the webhook url defined on the phone number will override the `inbound_request_url` defined for the Messaging Service."},"InboundMethod":{"type":"string","format":"http-method","enum":["GET","POST"],"description":"The HTTP method we should use to call `inbound_request_url`. Can be `GET` or `POST` and the default is `POST`."},"FallbackUrl":{"type":"string","format":"uri","description":"The URL that we call using `fallback_method` if an error occurs while retrieving or executing the TwiML from the Inbound Request URL. If the `use_inbound_webhook_on_number` field is enabled then the webhook url defined on the phone number will override the `fallback_url` defined for the Messaging Service."},"FallbackMethod":{"type":"string","format":"http-method","enum":["GET","POST"],"description":"The HTTP method we should use to call `fallback_url`. Can be: `GET` or `POST`."},"StatusCallback":{"type":"string","format":"uri","description":"The URL we should call to [pass status updates](/docs/sms/api/message-resource#message-status-values) about message delivery."},"StickySender":{"type":"boolean","description":"Whether to enable [Sticky Sender](/docs/messaging/services#sticky-sender) on the Service instance."},"MmsConverter":{"type":"boolean","description":"Whether to enable the [MMS Converter](/docs/messaging/services#mms-converter) for messages sent through the Service instance."},"SmartEncoding":{"type":"boolean","description":"Whether to enable [Smart Encoding](/docs/messaging/services#smart-encoding) for messages sent through the Service instance."},"ScanMessageContent":{"type":"string","enum":["inherit","enable","disable"],"description":"Reserved.","refName":"service_enum_scan_message_content","modelName":"service_enum_scan_message_content"},"FallbackToLongCode":{"type":"boolean","description":"[OBSOLETE] Former feature used to fallback to long code sender after certain short code message failures."},"AreaCodeGeomatch":{"type":"boolean","description":"Whether to enable [Area Code Geomatch](/docs/messaging/services#area-code-geomatch) on the Service Instance."},"ValidityPeriod":{"type":"integer","description":"How long, in seconds, messages sent from the Service are valid. Can be an integer from `1` to `36,000`. Default value is `36,000`."},"SynchronousValidation":{"type":"boolean","description":"Reserved."},"Usecase":{"type":"string","description":"A string that describes the scenario in which the Messaging Service will be used. Possible values are `notifications`, `marketing`, `verification`, `discussion`, `poll`, `undeclared`."},"UseInboundWebhookOnNumber":{"type":"boolean","description":"A boolean value that indicates either the webhook url configured on the phone number will be used or `inbound_request_url`/`fallback_url` url will be called when a message is received from the phone number. If this field is enabled then the webhook url defined on the phone number will override the `inbound_request_url`/`fallback_url` defined for the Messaging Service."}}},"examples":{"create":{"value":{"lang":"json","value":"{\n  \"FriendlyName\": \"My Service!\",\n  \"StickySender\": true,\n  \"MmsConverter\": true,\n  \"SmartEncoding\": false,\n  \"FallbackToLongCode\": true,\n  \"InboundRequestUrl\": \"https://www.example.com\",\n  \"InboundMethod\": \"POST\",\n  \"FallbackMethod\": \"GET\",\n  \"FallbackUrl\": \"https://www.example.com\",\n  \"StatusCallback\": \"https://www.example.com\",\n  \"ScanMessageContent\": \"inherit\",\n  \"AreaCodeGeomatch\": true,\n  \"ValidityPeriod\": 600,\n  \"SynchronousValidation\": true,\n  \"Usecase\": \"marketing\",\n  \"UseInboundWebhookOnNumber\": true\n}","meta":"","code":"{\n  \"FriendlyName\": \"My Service!\",\n  \"StickySender\": true,\n  \"MmsConverter\": true,\n  \"SmartEncoding\": false,\n  \"FallbackToLongCode\": true,\n  \"InboundRequestUrl\": \"https://www.example.com\",\n  \"InboundMethod\": \"POST\",\n  \"FallbackMethod\": \"GET\",\n  \"FallbackUrl\": \"https://www.example.com\",\n  \"StatusCallback\": \"https://www.example.com\",\n  \"ScanMessageContent\": \"inherit\",\n  \"AreaCodeGeomatch\": true,\n  \"ValidityPeriod\": 600,\n  \"SynchronousValidation\": true,\n  \"Usecase\": \"marketing\",\n  \"UseInboundWebhookOnNumber\": true\n}","tokens":[["{","#C9D1D9"],"\n  ",["\"FriendlyName\"","#7EE787"],[":","#C9D1D9"]," ",["\"My Service!\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"StickySender\"","#7EE787"],[":","#C9D1D9"]," ",["true","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"MmsConverter\"","#7EE787"],[":","#C9D1D9"]," ",["true","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"SmartEncoding\"","#7EE787"],[":","#C9D1D9"]," ",["false","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"FallbackToLongCode\"","#7EE787"],[":","#C9D1D9"]," ",["true","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"InboundRequestUrl\"","#7EE787"],[":","#C9D1D9"]," ",["\"https://www.example.com\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"InboundMethod\"","#7EE787"],[":","#C9D1D9"]," ",["\"POST\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"FallbackMethod\"","#7EE787"],[":","#C9D1D9"]," ",["\"GET\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"FallbackUrl\"","#7EE787"],[":","#C9D1D9"]," ",["\"https://www.example.com\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"StatusCallback\"","#7EE787"],[":","#C9D1D9"]," ",["\"https://www.example.com\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"ScanMessageContent\"","#7EE787"],[":","#C9D1D9"]," ",["\"inherit\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"AreaCodeGeomatch\"","#7EE787"],[":","#C9D1D9"]," ",["true","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"ValidityPeriod\"","#7EE787"],[":","#C9D1D9"]," ",["600","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"SynchronousValidation\"","#7EE787"],[":","#C9D1D9"]," ",["true","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"Usecase\"","#7EE787"],[":","#C9D1D9"]," ",["\"marketing\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"UseInboundWebhookOnNumber\"","#7EE787"],[":","#C9D1D9"]," ",["true","#79C0FF"],"\n",["}","#C9D1D9"]],"annotations":[],"themeName":"github-dark","style":{"color":"#c9d1d9","background":"#0d1117"}}}},"encodingType":"application/x-www-form-urlencoded","conditionalParameterMap":{}}
```

Create a Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createService() {
  const service = await client.messaging.v1.services.create({
    friendlyName: "FriendlyName",
  });

  console.log(service.sid);
}

createService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

service = client.messaging.v1.services.create(friendly_name="FriendlyName")

print(service.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var service = await ServiceResource.CreateAsync(friendlyName: "FriendlyName");

        Console.WriteLine(service.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Service service = Service.creator("FriendlyName").create();

        System.out.println(service.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateServiceParams{}
	params.SetFriendlyName("FriendlyName")

	resp, err := client.MessagingV1.CreateService(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$service = $twilio->messaging->v1->services->create(
    "FriendlyName" // FriendlyName
);

print $service->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

service = @client
          .messaging
          .v1
          .services
          .create(friendly_name: 'FriendlyName')

puts service.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:create \
   --friendly-name FriendlyName
```

```bash
curl -X POST "https://messaging.twilio.com/v1/Services" \
--data-urlencode "FriendlyName=FriendlyName" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2015-07-30T20:12:31Z",
  "date_updated": "2015-07-30T20:12:33Z",
  "friendly_name": "FriendlyName",
  "inbound_request_url": "https://www.example.com/",
  "inbound_method": "POST",
  "fallback_url": "https://www.example.com",
  "fallback_method": "GET",
  "status_callback": "https://www.example.com",
  "sticky_sender": true,
  "smart_encoding": false,
  "mms_converter": true,
  "fallback_to_long_code": true,
  "scan_message_content": "inherit",
  "area_code_geomatch": true,
  "validity_period": 600,
  "synchronous_validation": true,
  "usecase": "marketing",
  "us_app_to_person_registered": false,
  "use_inbound_webhook_on_number": true,
  "links": {
    "phone_numbers": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/PhoneNumbers",
    "short_codes": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ShortCodes",
    "alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AlphaSenders",
    "messages": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages",
    "us_app_to_person": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p",
    "us_app_to_person_usecases": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/Usecases",
    "channel_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelSenders",
    "destination_alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/DestinationAlphaSenders"
  },
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

## Retrieve a Service

`GET https://messaging.twilio.com/v1/Services/{Sid}`

### Path parameters

```json
[{"name":"Sid","in":"path","description":"The SID of the Service resource to fetch.","schema":{"type":"string","minLength":34,"maxLength":34,"pattern":"^MG[0-9a-fA-F]{32}$"},"required":true}]
```

Fetch a Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function fetchService() {
  const service = await client.messaging.v1
    .services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .fetch();

  console.log(service.sid);
}

fetchService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

service = client.messaging.v1.services(
    "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).fetch()

print(service.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var service =
            await ServiceResource.FetchAsync(pathSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(service.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Service service = Service.fetcher("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").fetch();

        System.out.println(service.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	resp, err := client.MessagingV1.FetchService("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$service = $twilio->messaging->v1
    ->services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->fetch();

print $service->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

service = @client
          .messaging
          .v1
          .services('MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
          .fetch

puts service.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:fetch \
   --sid MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X GET "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2015-07-30T20:12:31Z",
  "date_updated": "2015-07-30T20:12:33Z",
  "friendly_name": "My Service!",
  "inbound_request_url": "https://www.example.com/",
  "inbound_method": "POST",
  "fallback_url": null,
  "fallback_method": "POST",
  "status_callback": "https://www.example.com",
  "sticky_sender": true,
  "mms_converter": true,
  "smart_encoding": false,
  "fallback_to_long_code": true,
  "area_code_geomatch": true,
  "validity_period": 600,
  "scan_message_content": "inherit",
  "synchronous_validation": true,
  "usecase": "marketing",
  "us_app_to_person_registered": false,
  "use_inbound_webhook_on_number": true,
  "links": {
    "phone_numbers": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/PhoneNumbers",
    "short_codes": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ShortCodes",
    "alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AlphaSenders",
    "messages": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages",
    "us_app_to_person": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p",
    "us_app_to_person_usecases": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/Usecases",
    "channel_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelSenders",
    "destination_alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/DestinationAlphaSenders"
  },
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

## Retrieve a list of Services

`GET https://messaging.twilio.com/v1/Services`

### Query parameters

```json
[{"name":"PageSize","in":"query","description":"How many resources to return in each list page. The default is 50, and the maximum is 1000.","schema":{"type":"integer","format":"int64","minimum":1,"maximum":1000}},{"name":"Page","in":"query","description":"The page index. This value is simply for client state.","schema":{"type":"integer","minimum":0}},{"name":"PageToken","in":"query","description":"The page token. This is provided by the API.","schema":{"type":"string"}}]
```

List multiple Services

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function listService() {
  const services = await client.messaging.v1.services.list({ limit: 20 });

  services.forEach((s) => console.log(s.sid));
}

listService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

services = client.messaging.v1.services.list(limit=20)

for record in services:
    print(record.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var services = await ServiceResource.ReadAsync(limit: 20);

        foreach (var record in services) {
            Console.WriteLine(record.Sid);
        }
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;
import com.twilio.base.ResourceSet;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        ResourceSet<Service> services = Service.reader().limit(20).read();

        for (Service record : services) {
            System.out.println(record.getSid());
        }
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.ListServiceParams{}
	params.SetLimit(20)

	resp, err := client.MessagingV1.ListService(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		for record := range resp {
			if resp[record].Sid != nil {
				fmt.Println(*resp[record].Sid)
			} else {
				fmt.Println(resp[record].Sid)
			}
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$services = $twilio->messaging->v1->services->read(20);

foreach ($services as $record) {
    print $record->sid;
}
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

services = @client
           .messaging
           .v1
           .services
           .list(limit: 20)

services.each do |record|
   puts record.sid
end
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:list
```

```bash
curl -X GET "https://messaging.twilio.com/v1/Services?PageSize=20" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "meta": {
    "page": 0,
    "page_size": 20,
    "first_page_url": "https://messaging.twilio.com/v1/Services?PageSize=20&Page=0",
    "previous_page_url": null,
    "next_page_url": null,
    "key": "services",
    "url": "https://messaging.twilio.com/v1/Services?PageSize=20&Page=0"
  },
  "services": [
    {
      "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "friendly_name": "My Service!",
      "sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "date_created": "2015-07-30T20:12:31Z",
      "date_updated": "2015-07-30T20:12:33Z",
      "sticky_sender": true,
      "mms_converter": true,
      "smart_encoding": false,
      "fallback_to_long_code": true,
      "area_code_geomatch": true,
      "validity_period": 600,
      "scan_message_content": "inherit",
      "synchronous_validation": true,
      "inbound_request_url": "https://www.example.com/",
      "inbound_method": "POST",
      "fallback_url": null,
      "fallback_method": "POST",
      "status_callback": "https://www.example.com",
      "usecase": "marketing",
      "us_app_to_person_registered": false,
      "use_inbound_webhook_on_number": false,
      "links": {
        "phone_numbers": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/PhoneNumbers",
        "short_codes": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ShortCodes",
        "alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AlphaSenders",
        "messages": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages",
        "us_app_to_person": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p",
        "us_app_to_person_usecases": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/Usecases",
        "channel_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelSenders",
        "destination_alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/DestinationAlphaSenders"
      },
      "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ]
}
```

## Update a Service

`POST https://messaging.twilio.com/v1/Services/{Sid}`

You may specify one or more of the optional parameters above to update the Service's respective properties. Parameters not specified in your request are not updated.

### Path parameters

```json
[{"name":"Sid","in":"path","description":"The SID of the Service resource to update.","schema":{"type":"string","minLength":34,"maxLength":34,"pattern":"^MG[0-9a-fA-F]{32}$"},"required":true}]
```

### Request body parameters

```json
{"schema":{"type":"object","title":"UpdateServiceRequest","properties":{"FriendlyName":{"type":"string","description":"A descriptive string that you create to describe the resource. It can be up to 64 characters long."},"InboundRequestUrl":{"type":"string","format":"uri","description":"The URL we call using `inbound_method` when a message is received by any phone number or short code in the Service. When this property is `null`, receiving inbound messages is disabled. All messages sent to the Twilio phone number or short code will not be logged and received on the Account. If the `use_inbound_webhook_on_number` field is enabled then the webhook url defined on the phone number will override the `inbound_request_url` defined for the Messaging Service."},"InboundMethod":{"type":"string","format":"http-method","enum":["GET","POST"],"description":"The HTTP method we should use to call `inbound_request_url`. Can be `GET` or `POST` and the default is `POST`."},"FallbackUrl":{"type":"string","format":"uri","description":"The URL that we call using `fallback_method` if an error occurs while retrieving or executing the TwiML from the Inbound Request URL. If the `use_inbound_webhook_on_number` field is enabled then the webhook url defined on the phone number will override the `fallback_url` defined for the Messaging Service."},"FallbackMethod":{"type":"string","format":"http-method","enum":["GET","POST"],"description":"The HTTP method we should use to call `fallback_url`. Can be: `GET` or `POST`."},"StatusCallback":{"type":"string","format":"uri","description":"The URL we should call to [pass status updates](/docs/sms/api/message-resource#message-status-values) about message delivery."},"StickySender":{"type":"boolean","description":"Whether to enable [Sticky Sender](/docs/messaging/services#sticky-sender) on the Service instance."},"MmsConverter":{"type":"boolean","description":"Whether to enable the [MMS Converter](/docs/messaging/services#mms-converter) for messages sent through the Service instance."},"SmartEncoding":{"type":"boolean","description":"Whether to enable [Smart Encoding](/docs/messaging/services#smart-encoding) for messages sent through the Service instance."},"ScanMessageContent":{"type":"string","enum":["inherit","enable","disable"],"description":"Reserved.","refName":"service_enum_scan_message_content","modelName":"service_enum_scan_message_content"},"FallbackToLongCode":{"type":"boolean","description":"[OBSOLETE] Former feature used to fallback to long code sender after certain short code message failures."},"AreaCodeGeomatch":{"type":"boolean","description":"Whether to enable [Area Code Geomatch](/docs/messaging/services#area-code-geomatch) on the Service Instance."},"ValidityPeriod":{"type":"integer","description":"How long, in seconds, messages sent from the Service are valid. Can be an integer from `1` to `36,000`. Default value is `36,000`."},"SynchronousValidation":{"type":"boolean","description":"Reserved."},"Usecase":{"type":"string","description":"A string that describes the scenario in which the Messaging Service will be used. Possible values are `notifications`, `marketing`, `verification`, `discussion`, `poll`, `undeclared`."},"UseInboundWebhookOnNumber":{"type":"boolean","description":"A boolean value that indicates either the webhook url configured on the phone number will be used or `inbound_request_url`/`fallback_url` url will be called when a message is received from the phone number. If this field is enabled then the webhook url defined on the phone number will override the `inbound_request_url`/`fallback_url` defined for the Messaging Service."}}},"examples":{"update":{"value":{"lang":"json","value":"{\n  \"StickySender\": false\n}","meta":"","code":"{\n  \"StickySender\": false\n}","tokens":[["{","#C9D1D9"],"\n  ",["\"StickySender\"","#7EE787"],[":","#C9D1D9"]," ",["false","#79C0FF"],"\n",["}","#C9D1D9"]],"annotations":[],"themeName":"github-dark","style":{"color":"#c9d1d9","background":"#0d1117"}}}},"encodingType":"application/x-www-form-urlencoded","conditionalParameterMap":{}}
```

Update a Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function updateService() {
  const service = await client.messaging.v1
    .services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .update({ friendlyName: "FriendlyName" });

  console.log(service.sid);
}

updateService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

service = client.messaging.v1.services(
    "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).update(friendly_name="FriendlyName")

print(service.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var service = await ServiceResource.UpdateAsync(
            friendlyName: "FriendlyName", pathSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(service.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Service service =
            Service.updater("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").setFriendlyName("FriendlyName").update();

        System.out.println(service.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.UpdateServiceParams{}
	params.SetFriendlyName("FriendlyName")

	resp, err := client.MessagingV1.UpdateService("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$service = $twilio->messaging->v1
    ->services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->update(["friendlyName" => "FriendlyName"]);

print $service->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

service = @client
          .messaging
          .v1
          .services('MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
          .update(friendly_name: 'FriendlyName')

puts service.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:update \
   --sid MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --friendly-name FriendlyName
```

```bash
curl -X POST "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
--data-urlencode "FriendlyName=FriendlyName" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "friendly_name": "FriendlyName",
  "sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2015-07-30T20:12:31Z",
  "date_updated": "2015-07-30T20:12:33Z",
  "sticky_sender": false,
  "mms_converter": true,
  "smart_encoding": false,
  "fallback_to_long_code": true,
  "scan_message_content": "inherit",
  "synchronous_validation": true,
  "area_code_geomatch": true,
  "validity_period": 600,
  "inbound_request_url": "https://www.example.com",
  "inbound_method": "POST",
  "fallback_url": null,
  "fallback_method": "POST",
  "status_callback": "https://www.example.com",
  "usecase": "marketing",
  "us_app_to_person_registered": false,
  "use_inbound_webhook_on_number": true,
  "links": {
    "phone_numbers": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/PhoneNumbers",
    "short_codes": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ShortCodes",
    "alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AlphaSenders",
    "messages": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages",
    "us_app_to_person": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p",
    "us_app_to_person_usecases": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/Usecases",
    "channel_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelSenders",
    "destination_alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/DestinationAlphaSenders"
  },
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

## Delete a Service

`DELETE https://messaging.twilio.com/v1/Services/{Sid}`

When a Service is deleted, all phone numbers and short codes in the Service are returned to your Account.

> \[!WARNING]
>
> If you are using a Messaging Service for A2P 10DLC, you should **not** delete the Messaging Service. Doing so deletes the A2P 10DLC Campaign, which immediately halts all US A2P 10DLC messaging. A new Campaign and Messaging Service must be created and re-registered. This process can take several days.

### Path parameters

```json
[{"name":"Sid","in":"path","description":"The SID of the Service resource to delete.","schema":{"type":"string","minLength":34,"maxLength":34,"pattern":"^MG[0-9a-fA-F]{32}$"},"required":true}]
```

Delete a Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function deleteService() {
  await client.messaging.v1
    .services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .remove();
}

deleteService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

client.messaging.v1.services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").delete()
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        await ServiceResource.DeleteAsync(pathSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Service.deleter("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").delete();
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	err := client.MessagingV1.DeleteService("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$twilio->messaging->v1
    ->services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->delete();
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

@client
  .messaging
  .v1
  .services('MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  .delete
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:remove \
   --sid MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X DELETE "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

# A2P 10DLC - BrandRegistrations resource

> \[!WARNING]
>
> This API reference page supplements the [ISV API onboarding guides](/docs/messaging/compliance/a2p-10dlc/onboarding-isv). Don't use this API resource without following the appropriate guide, or you might experience **delays in registration and unintended fees**.

A BrandRegistration resource represents an A2P 10DLC Brand. It is a "container" that holds all of the business details required by The Campaign Registry (TCR) to create an A2P 10DLC Brand.

## BrandRegistration Properties

```json
{"type":"object","refName":"messaging.v1.brand_registrations","modelName":"messaging_v1_brand_registrations","properties":{"sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BN[0-9a-fA-F]{32}$","nullable":true,"description":"The unique string to identify Brand Registration."},"account_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^AC[0-9a-fA-F]{32}$","nullable":true,"description":"The SID of the [Account](/docs/iam/api/account) that created the Brand Registration resource."},"customer_profile_bundle_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BU[0-9a-fA-F]{32}$","nullable":true,"description":"A2P Messaging Profile Bundle BundleSid."},"a2p_profile_bundle_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BU[0-9a-fA-F]{32}$","nullable":true,"description":"A2P Messaging Profile Bundle BundleSid."},"date_created":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the resource was created specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format."},"date_updated":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the resource was last updated specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format."},"brand_type":{"type":"string","nullable":true,"description":"Type of brand. One of: \"STANDARD\", \"SOLE_PROPRIETOR\". SOLE_PROPRIETOR is for the low volume, SOLE_PROPRIETOR campaign use case. There can only be one SOLE_PROPRIETOR campaign created per SOLE_PROPRIETOR brand. STANDARD is for all other campaign use cases. Multiple campaign use cases can be created per STANDARD brand."},"status":{"type":"string","enum":["PENDING","APPROVED","FAILED","IN_REVIEW","DELETION_PENDING","DELETION_FAILED","SUSPENDED"],"description":"Brand Registration status. One of \"PENDING\", \"APPROVED\", \"FAILED\", \"IN_REVIEW\", \"DELETION_PENDING\", \"DELETION_FAILED\", \"SUSPENDED\".","refName":"brand_registrations_enum_status","modelName":"brand_registrations_enum_status"},"tcr_id":{"type":"string","nullable":true,"description":"Campaign Registry (TCR) Brand ID. Assigned only after successful brand registration."},"failure_reason":{"type":"string","nullable":true,"description":"DEPRECATED. A reason why brand registration has failed. Only applicable when status is FAILED."},"errors":{"type":"array","nullable":true,"description":"A list of errors that occurred during the brand registration process."},"url":{"type":"string","format":"uri","nullable":true,"description":"The absolute URL of the Brand Registration resource."},"brand_score":{"type":"integer","nullable":true,"description":"The secondary vetting score if it was done. Otherwise, it will be the brand score if it's returned from TCR. It may be null if no score is available."},"brand_feedback":{"type":"array","nullable":true,"description":"DEPRECATED. Feedback on how to improve brand score","items":{"type":"string","enum":["TAX_ID","STOCK_SYMBOL","NONPROFIT","GOVERNMENT_ENTITY","OTHERS"],"description":"DEPRECATED. Feedback on how to improve brand score","refName":"brand_registrations_enum_brand_feedback","modelName":"brand_registrations_enum_brand_feedback"}},"identity_status":{"type":"string","enum":["SELF_DECLARED","UNVERIFIED","VERIFIED","VETTED_VERIFIED"],"description":"When a brand is registered, TCR will attempt to verify the identity of the brand based on the supplied information.","refName":"brand_registrations_enum_identity_status","modelName":"brand_registrations_enum_identity_status"},"russell_3000":{"type":"boolean","nullable":true,"description":"Publicly traded company identified in the Russell 3000 Index"},"government_entity":{"type":"boolean","nullable":true,"description":"Identified as a government entity"},"tax_exempt_status":{"type":"string","nullable":true,"description":"Nonprofit organization tax-exempt status per section 501 of the U.S. tax code."},"skip_automatic_sec_vet":{"type":"boolean","nullable":true,"description":"A flag to disable automatic secondary vetting for brands which it would otherwise be done."},"mock":{"type":"boolean","nullable":true,"description":"A boolean that specifies whether brand should be a mock or not. If true, brand will be registered as a mock brand. Defaults to false if no value is provided."},"links":{"type":"object","format":"uri-map","nullable":true}}}
```

## Create a BrandRegistration

`POST https://messaging.twilio.com/v1/a2p/BrandRegistrations`

### Request body parameters

```json
{"schema":{"type":"object","title":"CreateBrandRegistrationsRequest","required":["CustomerProfileBundleSid","A2PProfileBundleSid"],"properties":{"CustomerProfileBundleSid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BU[0-9a-fA-F]{32}$","description":"Customer Profile Bundle Sid."},"A2PProfileBundleSid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BU[0-9a-fA-F]{32}$","description":"A2P Messaging Profile Bundle Sid."},"BrandType":{"type":"string","description":"Type of brand being created. One of: \"STANDARD\", \"SOLE_PROPRIETOR\". SOLE_PROPRIETOR is for low volume, SOLE_PROPRIETOR use cases. STANDARD is for all other use cases."},"Mock":{"type":"boolean","description":"A boolean that specifies whether brand should be a mock or not. If true, brand will be registered as a mock brand. Defaults to false if no value is provided."},"SkipAutomaticSecVet":{"type":"boolean","description":"A flag to disable automatic secondary vetting for brands which it would otherwise be done."}}},"examples":{"create":{"value":{"lang":"json","value":"{\n  \"CustomerProfileBundleSid\": \"BU0000009f7e067e279523808d267e2d90\",\n  \"A2PProfileBundleSid\": \"BU1111109f7e067e279523808d267e2d85\",\n  \"BrandType\": \"STANDARD\",\n  \"SkipAutomaticSecVet\": false,\n  \"Mock\": false\n}","meta":"","code":"{\n  \"CustomerProfileBundleSid\": \"BU0000009f7e067e279523808d267e2d90\",\n  \"A2PProfileBundleSid\": \"BU1111109f7e067e279523808d267e2d85\",\n  \"BrandType\": \"STANDARD\",\n  \"SkipAutomaticSecVet\": false,\n  \"Mock\": false\n}","tokens":[["{","#C9D1D9"],"\n  ",["\"CustomerProfileBundleSid\"","#7EE787"],[":","#C9D1D9"]," ",["\"BU0000009f7e067e279523808d267e2d90\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"A2PProfileBundleSid\"","#7EE787"],[":","#C9D1D9"]," ",["\"BU1111109f7e067e279523808d267e2d85\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"BrandType\"","#7EE787"],[":","#C9D1D9"]," ",["\"STANDARD\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"SkipAutomaticSecVet\"","#7EE787"],[":","#C9D1D9"]," ",["false","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"Mock\"","#7EE787"],[":","#C9D1D9"]," ",["false","#79C0FF"],"\n",["}","#C9D1D9"]],"annotations":[],"themeName":"github-dark","style":{"color":"#c9d1d9","background":"#0d1117"}}},"createSoleProprietorBrand":{"value":{"lang":"json","value":"{\n  \"CustomerProfileBundleSid\": \"BU0000009f7e067e279523808d267e2d90\",\n  \"A2PProfileBundleSid\": \"BU1111109f7e067e279523808d267e2d85\",\n  \"BrandType\": \"STANDARD\",\n  \"SkipAutomaticSecVet\": false,\n  \"Mock\": false\n}","meta":"","code":"{\n  \"CustomerProfileBundleSid\": \"BU0000009f7e067e279523808d267e2d90\",\n  \"A2PProfileBundleSid\": \"BU1111109f7e067e279523808d267e2d85\",\n  \"BrandType\": \"STANDARD\",\n  \"SkipAutomaticSecVet\": false,\n  \"Mock\": false\n}","tokens":[["{","#C9D1D9"],"\n  ",["\"CustomerProfileBundleSid\"","#7EE787"],[":","#C9D1D9"]," ",["\"BU0000009f7e067e279523808d267e2d90\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"A2PProfileBundleSid\"","#7EE787"],[":","#C9D1D9"]," ",["\"BU1111109f7e067e279523808d267e2d85\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"BrandType\"","#7EE787"],[":","#C9D1D9"]," ",["\"STANDARD\"","#A5D6FF"],[",","#C9D1D9"],"\n  ",["\"SkipAutomaticSecVet\"","#7EE787"],[":","#C9D1D9"]," ",["false","#79C0FF"],[",","#C9D1D9"],"\n  ",["\"Mock\"","#7EE787"],[":","#C9D1D9"]," ",["false","#79C0FF"],"\n",["}","#C9D1D9"]],"annotations":[],"themeName":"github-dark","style":{"color":"#c9d1d9","background":"#0d1117"}}}},"encodingType":"application/x-www-form-urlencoded","conditionalParameterMap":{}}
```

The sample below shows how to create a BrandRegistration.

The `customer_profile_bundle_sid` is the SID associated with the Secondary Customer Profile. It starts with `BU`. You can see Secondary Customer Profile SIDs in [the Console](https://console.twilio.com/us1/account/trust-hub/overview), or you can [list CustomerProfiles via the TrustHub API](/docs/trust-hub/trusthub-rest-api/customer-profiles#read-multiple-customerprofile-resources). Be sure to use the correct Account SID and Auth Token for the request.

The `a2p_profile_bundle_sid` is the SID of the TrustProduct resource associated with the business. It also starts with `BU`. You can find the appropriate SID by using the TrustHub API to list all of an Account's [TrustProducts](/docs/trust-hub/trusthub-rest-api/trust-products#read-multiple-trustproduct-resources). Be sure to use the correct Account SID and Auth Token for the request.

Create a BrandRegistration

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createBrandRegistrations() {
  const brandRegistration = await client.messaging.v1.brandRegistrations.create(
    {
      a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    }
  );

  console.log(brandRegistration.sid);
}

createBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registration = client.messaging.v1.brand_registrations.create(
    customer_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    a2p_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
)

print(brand_registration.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistration = await BrandRegistrationResource.CreateAsync(
            customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(brandRegistration.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        BrandRegistration brandRegistration =
            BrandRegistration.creator("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(brandRegistration.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateBrandRegistrationsParams{}
	params.SetCustomerProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetA2PProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.MessagingV1.CreateBrandRegistrations(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brand_registration = $twilio->messaging->v1->brandRegistrations->create(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // CustomerProfileBundleSid
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // A2PProfileBundleSid
);

print $brand_registration->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registration = @client
                     .messaging
                     .v1
                     .brand_registrations
                     .create(
                       customer_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                       a2p_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                     )

puts brand_registration.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:create \
   --customer-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --a2p-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://messaging.twilio.com/v1/a2p/BrandRegistrations" \
--data-urlencode "CustomerProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "A2PProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BN0044409f7e067e279523808d267e2d85",
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "customer_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "a2p_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2021-01-28T10:45:51Z",
  "date_updated": "2021-01-28T10:45:51Z",
  "brand_type": "STANDARD",
  "status": "PENDING",
  "tcr_id": "BXXXXXX",
  "failure_reason": "Registration error",
  "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85",
  "brand_score": 42,
  "brand_feedback": [
    "TAX_ID",
    "NONPROFIT"
  ],
  "identity_status": "VERIFIED",
  "russell_3000": true,
  "government_entity": false,
  "tax_exempt_status": "501c3",
  "skip_automatic_sec_vet": false,
  "errors": [],
  "mock": false,
  "links": {
    "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/Vettings",
    "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/SmsOtp"
  }
}
```

The sample below shows an example of how to use the [skip\_automatic\_sec\_vet parameter](/docs/messaging/compliance/a2p-10dlc/collect-business-info#skip_automatic_sec_vet) when creating a new BrandRegistration. This is **only** for registering a Low Volume Standard Brand, 527 political organization, or political organization with a Campaign Verify token.

Create a BrandRegistration and skip secondary vetting

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createBrandRegistrations() {
  const brandRegistration = await client.messaging.v1.brandRegistrations.create(
    {
      a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      skipAutomaticSecVet: true,
    }
  );

  console.log(brandRegistration.sid);
}

createBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registration = client.messaging.v1.brand_registrations.create(
    customer_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    a2p_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    skip_automatic_sec_vet=True,
)

print(brand_registration.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistration = await BrandRegistrationResource.CreateAsync(
            customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            skipAutomaticSecVet: true);

        Console.WriteLine(brandRegistration.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        BrandRegistration brandRegistration =
            BrandRegistration.creator("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .setSkipAutomaticSecVet(true)
                .create();

        System.out.println(brandRegistration.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateBrandRegistrationsParams{}
	params.SetCustomerProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetA2PProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetSkipAutomaticSecVet(true)

	resp, err := client.MessagingV1.CreateBrandRegistrations(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brand_registration = $twilio->messaging->v1->brandRegistrations->create(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // CustomerProfileBundleSid
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // A2PProfileBundleSid
    ["skipAutomaticSecVet" => true]
);

print $brand_registration->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registration = @client
                     .messaging
                     .v1
                     .brand_registrations
                     .create(
                       customer_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                       a2p_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                       skip_automatic_sec_vet: true
                     )

puts brand_registration.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:create \
   --customer-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --a2p-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --skip-automatic-sec-vet
```

```bash
curl -X POST "https://messaging.twilio.com/v1/a2p/BrandRegistrations" \
--data-urlencode "CustomerProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "A2PProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "SkipAutomaticSecVet=true" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BN0044409f7e067e279523808d267e2d85",
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "customer_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "a2p_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2021-01-28T10:45:51Z",
  "date_updated": "2021-01-28T10:45:51Z",
  "brand_type": "STANDARD",
  "status": "PENDING",
  "tcr_id": "BXXXXXX",
  "failure_reason": "Registration error",
  "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85",
  "brand_score": 42,
  "brand_feedback": [
    "TAX_ID",
    "NONPROFIT"
  ],
  "identity_status": "VERIFIED",
  "russell_3000": true,
  "government_entity": false,
  "tax_exempt_status": "501c3",
  "skip_automatic_sec_vet": true,
  "errors": [],
  "mock": false,
  "links": {
    "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/Vettings",
    "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/SmsOtp"
  }
}
```

## Retrieve a specific BrandRegistration

`GET https://messaging.twilio.com/v1/a2p/BrandRegistrations/{Sid}`

This request returns a specific BrandRegistration. You can use this request to check the `status` of the BrandRegistration.

### Path parameters

```json
[{"name":"Sid","in":"path","description":"The SID of the Brand Registration resource to fetch.","schema":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BN[0-9a-fA-F]{32}$"},"required":true}]
```

Retrieve a BrandRegistration

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function fetchBrandRegistrations() {
  const brandRegistration = await client.messaging.v1
    .brandRegistrations("BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .fetch();

  console.log(brandRegistration.sid);
}

fetchBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registration = client.messaging.v1.brand_registrations(
    "BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
).fetch()

print(brand_registration.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistration = await BrandRegistrationResource.FetchAsync(
            pathSid: "BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(brandRegistration.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        BrandRegistration brandRegistration = BrandRegistration.fetcher("BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX").fetch();

        System.out.println(brandRegistration.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	resp, err := client.MessagingV1.FetchBrandRegistrations("BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brand_registration = $twilio->messaging->v1
    ->brandRegistrations("BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    ->fetch();

print $brand_registration->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registration = @client
                     .messaging
                     .v1
                     .brand_registrations('BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                     .fetch

puts brand_registration.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:fetch \
   --sid BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X GET "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "customer_profile_bundle_sid": "BU3344409f7e067e279523808d267e2d85",
  "a2p_profile_bundle_sid": "BU3344409f7e067e279523808d267e2d85",
  "date_created": "2021-01-27T14:18:35Z",
  "date_updated": "2021-01-27T14:18:36Z",
  "brand_type": "STANDARD",
  "status": "PENDING",
  "tcr_id": "BXXXXXX",
  "failure_reason": "Registration error",
  "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85",
  "brand_score": 42,
  "brand_feedback": [
    "TAX_ID",
    "NONPROFIT"
  ],
  "identity_status": "VERIFIED",
  "russell_3000": true,
  "government_entity": false,
  "tax_exempt_status": "501c3",
  "skip_automatic_sec_vet": false,
  "mock": false,
  "errors": [],
  "links": {
    "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/Vettings",
    "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/SmsOtp"
  }
}
```

## Retrieve a list of BrandRegistrations

`GET https://messaging.twilio.com/v1/a2p/BrandRegistrations`

This request returns a list of an Account's BrandRegistrations. If working with subaccounts, be sure to use the appropriate Account SID and Auth Token when sending this request.

### Query parameters

```json
[{"name":"PageSize","in":"query","description":"How many resources to return in each list page. The default is 50, and the maximum is 1000.","schema":{"type":"integer","format":"int64","minimum":1,"maximum":1000}},{"name":"Page","in":"query","description":"The page index. This value is simply for client state.","schema":{"type":"integer","minimum":0}},{"name":"PageToken","in":"query","description":"The page token. This is provided by the API.","schema":{"type":"string"}}]
```

Retrieve a list of BrandRegistrations for an Account

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function listBrandRegistrations() {
  const brandRegistrations = await client.messaging.v1.brandRegistrations.list({
    limit: 20,
  });

  brandRegistrations.forEach((b) => console.log(b.sid));
}

listBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registrations = client.messaging.v1.brand_registrations.list(limit=20)

for record in brand_registrations:
    print(record.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistrations = await BrandRegistrationResource.ReadAsync(limit: 20);

        foreach (var record in brandRegistrations) {
            Console.WriteLine(record.Sid);
        }
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;
import com.twilio.base.ResourceSet;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        ResourceSet<BrandRegistration> brandRegistrations = BrandRegistration.reader().limit(20).read();

        for (BrandRegistration record : brandRegistrations) {
            System.out.println(record.getSid());
        }
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.ListBrandRegistrationsParams{}
	params.SetLimit(20)

	resp, err := client.MessagingV1.ListBrandRegistrations(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		for record := range resp {
			if resp[record].Sid != nil {
				fmt.Println(*resp[record].Sid)
			} else {
				fmt.Println(resp[record].Sid)
			}
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brandRegistrations = $twilio->messaging->v1->brandRegistrations->read(20);

foreach ($brandRegistrations as $record) {
    print $record->sid;
}
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registrations = @client
                      .messaging
                      .v1
                      .brand_registrations
                      .list(limit: 20)

brand_registrations.each do |record|
   puts record.sid
end
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:list
```

```bash
curl -X GET "https://messaging.twilio.com/v1/a2p/BrandRegistrations?PageSize=20" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "meta": {
    "page": 0,
    "page_size": 50,
    "first_page_url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations?PageSize=50&Page=0",
    "previous_page_url": null,
    "next_page_url": null,
    "key": "data",
    "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations?PageSize=50&Page=0"
  },
  "data": [
    {
      "sid": "BN0044409f7e067e279523808d267e2d85",
      "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "customer_profile_bundle_sid": "BU3344409f7e067e279523808d267e2d85",
      "a2p_profile_bundle_sid": "BU3344409f7e067e279523808d267e2d85",
      "date_created": "2021-01-27T14:18:35Z",
      "date_updated": "2021-01-27T14:18:36Z",
      "brand_type": "STANDARD",
      "status": "APPROVED",
      "tcr_id": "BXXXXXX",
      "failure_reason": "Registration error",
      "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85",
      "brand_score": 42,
      "brand_feedback": [
        "TAX_ID",
        "NONPROFIT"
      ],
      "identity_status": "VERIFIED",
      "russell_3000": true,
      "tax_exempt_status": "501c3",
      "government_entity": false,
      "skip_automatic_sec_vet": false,
      "errors": [],
      "mock": false,
      "links": {
        "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/Vettings",
        "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/SmsOtp"
      }
    }
  ]
}
```

## Update a BrandRegistration

`POST https://messaging.twilio.com/v1/a2p/BrandRegistrations/{Sid}`

### Path parameters

```json
[{"name":"Sid","in":"path","description":"The SID of the Brand Registration resource to update.","schema":{"type":"string","minLength":34,"maxLength":34,"pattern":"^BN[0-9a-fA-F]{32}$"},"required":true}]
```

Update a BrandRegistration

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function updateBrandRegistrations() {
  const brandRegistration = await client.messaging.v1
    .brandRegistrations("BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .update();

  console.log(brandRegistration.sid);
}

updateBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registrations = client.messaging.v1.brand_registrations(
    "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).update()

print(brand_registrations.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistration = await BrandRegistrationResource.UpdateAsync(
            pathSid: "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(brandRegistration.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        BrandRegistration brandRegistration = BrandRegistration.updater("BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").update();

        System.out.println(brandRegistration.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	resp, err := client.MessagingV1.UpdateBrandRegistrations("BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brand_registrations = $twilio->messaging->v1
    ->brandRegistrations("BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->update();

print $brand_registrations->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registration = @client
                     .messaging
                     .v1
                     .brand_registrations('BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                     .update()

puts brand_registration.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:update \
   --sid BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X POST "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "customer_profile_bundle_sid": "BU3344409f7e067e279523808d267e2d85",
  "a2p_profile_bundle_sid": "BU3344409f7e067e279523808d267e2d85",
  "date_created": "2021-01-27T14:18:35Z",
  "date_updated": "2021-01-27T14:18:36Z",
  "brand_type": "STANDARD",
  "status": "PENDING",
  "tcr_id": "BXXXXXX",
  "failure_reason": "Registration error",
  "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "brand_score": 42,
  "brand_feedback": [
    "TAX_ID",
    "NONPROFIT"
  ],
  "identity_status": "VERIFIED",
  "russell_3000": false,
  "government_entity": false,
  "tax_exempt_status": "501c3",
  "skip_automatic_sec_vet": false,
  "errors": [],
  "mock": false,
  "links": {
    "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Vettings",
    "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/SmsOtp"
  }
}
```

# ISV A2P 10DLC Onboarding Overview

This onboarding overview is for independent software vendors (ISVs) who want to register themselves and their customers for A2P 10DLC. To learn more about US A2P 10DLC, see [the A2P 10DLC overview page](/docs/messaging/compliance/a2p-10dlc).

If you're an ISV who only sends messages on behalf of your own company, follow the [Direct Standard and Low-Volume Standard Registration Overview](/docs/messaging/compliance/a2p-10dlc/direct-standard-onboarding) instead. This guide is only for ISVs who send messages on behalf of their customers.

This overview explains how to prepare for A2P 10DLC registration by walking through the following steps:

1. **Identify your ISV architecture**: The way your Accounts and Messaging Campaigns are organized determines the specific steps you'll need to take when onboarding.
2. **Onboard via the Twilio Console or API**: You register your ISV and your customers for A2P 10DLC by creating Customer Profiles, registering Brands, and registering Campaigns via the Console or API.
   * **Creating Customer Profiles**: A Twilio Customer Profile gives you access to products that can increase consumer trust, such as A2P 10DLC. You can create a Primary Customer Profile for your ISV and Secondary Customer Profiles for your customers.
   * **Registering Brands**: A Brand represents the sender of a messaging use case, such as your customer's company. It belongs to a single Customer Profile. Each Brand comes with its own Brand registration fee and The Campaign Registry (TCR) trust score.
   * **Registering Campaigns**: A Campaign represents a single use case for sending messages. It belongs to one Brand, which can have one to many Campaigns associated with it.

## Sample ISV onboarding process

This section shows how Owl Inc, an ISV with two customers, can onboard to A2P 10DLC.

Owl Inc is the primary Account, and it has separated its two customers, Acme and Buy n Large, into subaccounts to separate billing. Each company, including Owl Inc, has its own SMS messaging use cases. Acme Corp and Buy n Large use Owl's platform to send SMS messages to their own respective users.

* Owl Inc sends two-factor authentication (2FA) messages for its customers to log in to their platform.
* Acme Corp sends support ticket status updates.
* Buy n Large sends promotional messages and appointment offers.

Owl Inc has a [Messaging Service](/docs/messaging/services) set up for each of these messaging use cases.

![Flowchart showing Owl Inc. with primary account and subaccounts for Acme Corp and Buy n Large, detailing use cases.](https://docs-resources.prod.twilio.com/5e357c0b09aa554b5faf4ee83546a4ac416aeac11186a4a94ab6f1b00ac9ba21.png)

### Determine ISV architecture type

Before onboarding to A2P 10DLC, Owl Inc needs to identify its ISV architecture type. By comparing the information above to this [table](#architecture-types), it determines it's using type #1. This type informs the specific steps it'll follow to onboard to A2P 10DLC by creating Customer Profiles, registering Brands, and registering Campaigns.

### Create Customer Profiles and register Brands

Owl Inc needs to create three separate Customer Profiles and register three separate Brands to represent its Account structure. It's also responsible for gathering registration information from Acme Corp and Buy n Large to create their Customer Profiles and Brands. Alternatively, it could build a portal with Twilio APIs for self-registration.

* Owl Inc
  * Create one Primary Customer Profile.
  * Register one Brand.
* Acme Corp
  * Create one Secondary Customer Profile.
  * Register one Brand.
* Buy n Large
  * Create one Secondary Customer Profile.
  * Register one Brand.

### Register Campaigns

Owl Inc needs to register four Campaigns to represent the messaging use cases of itself and its customers.

* One Campaign for Owl Inc's use case of sending 2FA messages to its customers.
* Three Campaigns for the use cases of Acme Corp and Buy n Large.
  * Acme Corp's use case for sending support ticket updates.
  * Buy n Large's use case for sending promotional content.
  * Buy n Large's use case for sending appointment messages.

## Step 1: Identify your ISV architecture

There are many different patterns of how Twilio Accounts, subaccounts, and Messaging Services are organized for ISVs. Before you begin onboarding to A2P 10DLC, you'll need to identify which ISV architecture type you're using from the six types that are detailed below. Your architecture type determines the specific onboarding steps you'll need to take such as creating Customer Profiles, registering Brands, and registering Campaigns.

### Architecture types

> \[!WARNING]
>
> Architecture types #3, #5, and #6 are incompatible with A2P 10DLC as of Summer 2023.
>
> In these cases, Twilio recommends restructuring to type #1 for the best long-term viability. Remember that restructuring to a subaccount architecture resets the opt-out mechanisms that Twilio manages because these settings apply at the Account level. This can be handled by having an up-to-date opt-out list before the restructure.

Identify your architecture type using the table below, then continue to that type's section to learn more about your onboarding steps. Once you've identified your onboarding steps, you can proceed to [Step 2: Onboard via API or the Console](#step-2-onboard-via-api-or-the-console).

|                                                        | [#1](#isv-architecture-1) | [#2](#isv-architecture-2) | [#3](#isv-architecture-3) | [#4](#isv-architecture-4) | [#5](#isv-architecture-5) | [#6](#isv-architecture-6) |
| ------------------------------------------------------ | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- |
| Do you use subaccounts?                                | YES                       | YES                       | YES                       | NO                        | NO                        | NO                        |
| Are subaccounts mapped to individual customers?        | YES                       | NO                        | YES                       | N/A                       | N/A                       | N/A                       |
| Do you use Messaging Services?                         | YES                       | YES                       | NO                        | YES                       | YES                       | NO                        |
| Are Messaging Services mapped to individual customers? | N/A                       | YES                       | N/A                       | YES                       | NO                        | N/A                       |

### ISV architecture #1

#### Description

* You use subaccounts and they are mapped to individual customers.
* You use Messaging Services.

Type #1 is the preferred architecture for A2P 10DLC onboarding because the messaging traffic for each customer is separated by subaccounts. This allows for easier analytics tracking and minimizes the impact of any potential noncompliant traffic from one customer on the rest of your customers.

#### Onboarding steps

* For each of your customers that have A2P 10DLC messaging use cases:
  * Create a Secondary Customer Profile under the customer's subaccount.
  * Register a Brand under the customer's subaccount.
  * Register Campaigns for each messaging use case. Each use case should map to its own Messaging Service under the same subaccount.
* If your ISV also has A2P 10DLC messaging use cases:
  * Create a Primary Customer Profile under your primary Account.
  * Register a Brand under your primary Account.
  * Register Campaigns for each messaging use case. Each use case should map to its own Messaging Service under the same Account.

### ISV architecture #2

#### Description

* You use subaccounts and they are not mapped to individual customers.
* You use Messaging Services and they are mapped to individual customers.

A risk of this type is that if one customer sends noncompliant traffic, Twilio may need to suspend the primary Account of that customer. This could include compliant customers in other subaccounts. It's also more difficult to track messaging analytics for each customer.

#### Onboarding steps

* For each of your customers that have A2P 10DLC messaging use cases:
  * Create a Secondary Customer Profile under your primary Account.
  * Register a Brand under your primary Account.
  * Register Campaigns for each messaging use case. Each use case should map to its own Messaging Service within your primary Account.
* If your ISV also has A2P 10DLC messaging use cases:
  * Create a Primary Customer Profile under your primary Account.
  * Register a Brand under your primary Account.
  * Register Campaigns for each messaging use case. Each use case should map to its own Messaging Service under the same Account.

### ISV architecture #3

#### Description

* You use subaccounts and they are mapped to individual customers.
* You do not use Messaging Services.

Type #3 is incompatible with A2P 10DLC. Twilio recommends restructuring to type #1 for the best long-term viability.

### ISV architecture #4

#### Description

* You do not use subaccounts.
* You use Messaging Services and they are mapped to individual customers.

A risk of this type is that if one customer sends noncompliant traffic, Twilio may need to suspend the primary Account of that customer which could include other compliant customers. It is also more difficult to track messaging analytics for each customer.

#### Onboarding steps

* For each of your customers that have A2P 10DLC messaging use cases:
  * Create a Secondary Customer Profile under your primary Account.
  * Register a Brand under your primary Account.
  * Register Campaigns for each messaging use case. Each use case should map to its own Messaging Service within your primary Account.
* If your ISV also has A2P 10DLC messaging use cases:
  * Create a Primary Customer Profile under your primary Account.
  * Register a Brand under your primary Account.
  * Register Campaigns for each messaging use case. Each use case should map to its own Messaging Service under the same Account.

### ISV architecture #5

* You do not use subaccounts.
* You use Messaging Services and they are not mapped to individual customers.

Type #5 is incompatible with A2P 10DLC. Twilio recommends restructuring to type #1 for the best long-term viability.

### ISV architecture #6

* You do not use subaccounts.
* You do not use Messaging Services.

Type #6 is incompatible with A2P 10DLC. Twilio recommends restructuring to type #1 for the best long-term viability.

## Step 2: Onboard via API or the Console

After you identify your ISV architecture type, create Customer Profiles, Brands, and Campaigns in the Console or with the API.

When creating Secondary Customer Profiles and registering Brands for your customer, remember to fill in the business details of that specific customer. Use that customer's details rather than your own ISV's details.

If you're registering a government, nonprofit, 527 political organization, K-12 education, or emergency messaging use case, consult these resources before continuing. Review the [Special Use Cases for A2P 10DLC Help Center article](https://help.twilio.com/articles/4402972441243-Special-Use-Cases-for-A2P-10DLC) and [Registration for Government and Nonprofit Agencies](/docs/messaging/compliance/a2p-10dlc/onboarding-for-government-and-non-profit-agencies).

> \[!NOTE]
>
> Primary Customer Profiles can only be created in the Console at this time.

### Determine your Brand type

Before creating a Customer Profile and registering a Brand, you need to determine if it's a Standard, Low-Volume Standard, or Sole Proprietor Brand.

See the [Determine your Brand type section](/docs/messaging/compliance/a2p-10dlc#determine-your-brand-type) of the US A2P 10DLC Overview to learn more about Brand types.

### Onboard with API

If you have multiple customers to register, use Twilio APIs to automate the onboarding process.

* To register a Standard or Low-Volume Standard Brand via API, follow [this guide](/docs/messaging/compliance/a2p-10dlc/onboarding-isv-api).
* To register a Sole Proprietor Brand via API, follow [this guide](/docs/messaging/compliance/a2p-10dlc/onboarding-isv-api-sole-prop-new).

### Onboard with the Console

If you prefer a more guided experience, or are only registering a few customers, you can use the Console for onboarding. To start, go to [**Twilio Console** > **Messaging** > **Regulatory Compliance** > **Onboarding**](https://console.twilio.com/us1/develop/sms/regulatory-compliance/a2p-onboarding) to begin creating Customer Profiles, registering Brands, and registering Campaigns.

Use the **Switch Customer Profile** option to move between your Primary and Secondary Customer Profiles after you create them. The Use the Primary Customer Profile only for your ISV's Brands and Campaigns, and use Secondary Customer Profiles only for your customers' Brands and Campaigns.

Your next step depends on if you're registering Standard, Low-Volume Standard, or Sole Proprietor Brands.

* To register a Standard or Low-Volume Standard Brand via the Console, follow [this guide](/docs/messaging/compliance/a2p-10dlc/direct-standard-onboarding).
* To register a Sole Proprietor Brand via the Console, follow [this guide](/docs/messaging/compliance/a2p-10dlc/direct-sole-proprietor-registration-overview).

The guides above are written for direct self-onboarding of Brands and Campaigns. The process is identical to registering your own customers. The only difference is that you need to switch to the correct Secondary Customer Profile.

## Get help with A2P 10DLC

[Get help](https://www.twilio.com/blog/twilio-professional-services-for-us-a2p-10dlc-registrations)

Need help building or registering your A2P 10DLC application? Learn more about Twilio Professional Services for A2P 10DLC.

# A2P 10DLC - Standard and Low-Volume Standard Brand Onboarding Guide for ISVs

This is a step-by-step walkthrough for Independent Software Vendors (ISVs) who want to use Twilio REST API to register a customer. This guide covers registering a [Standard Brand or Low-Volume Brand](/docs/messaging/compliance/a2p-10dlc#determine-your-brand-type) for A2P 10DLC.

Not sure if you're an ISV? Check out the [Determine your customer type section on the A2P 10DLC Overview Page](/docs/messaging/compliance/a2p-10dlc#determine-your-customer-type).

The onboarding process involves the following main steps:

* Provide Twilio with your customer's business and contact information.
* Create a Brand Registration for your customer that will be evaluated by The Campaign Registry (TCR).
* Create a Campaign/Use Case for your customer that will be evaluated by TCR.

## Before you begin

This section covers the prerequisite steps you need to complete before attempting to register your customer for A2P 10DLC via API.

### Gather customer information

Twilio and TCR need specific information about your customer's business to register for A2P 10DLC.

Visit the [A2P 10DLC - Gather Business Information page](/docs/messaging/compliance/a2p-10dlc/collect-business-info) to learn which information you need to collect from your customers.

### Update your SDK

If you plan to use one of the SDKs for this registration process, be sure you're using the [latest version](/docs/libraries).

### Create a Primary Business Profile for your parent Twilio Account

Before onboarding your customers, you must have a Primary Business Profile with a `Twilio Approved` status.

Create your Primary Business Profile in the [Trust Hub in the Console](https://console.twilio.com/us1/account/trust-hub/customer-profiles). Select `ISV Reseller or Partner` as your **Business Type**.

Make note of your Primary Business Profile SID. You need it in later steps in this guide.

### Use the correct Account SID

When making the API requests in this guide, use the **Twilio Account SID** and **Auth Token** for the Account your customer will use for A2P 10DLC messaging.

## Provide Twilio with your customer's business information

The API requests in this section use the TrustHub API to create a Secondary Customer Profile. This is a collection of contact details and business information about your customer's business, similar to the Primary Business Profile you created earlier.

In Step 1.1 below, you create a CustomerProfile resource (this is the "Secondary Customer Profile").

In Steps 1.2-1.7 below, you create additional resources that contain business information, and then you attach these resources to the CustomerProfile resource.

After attaching all required information to the CustomerProfile, you can check and submit the Secondary Customer Profile for review (Steps 1.9 and 1.10, respectively).

### 1.1. Create a Secondary Customer Profile

This step creates a CustomerProfile resource for your customer's business.

> \[!NOTE]
>
> If you've already registered customers within TrustHub for SHAKEN/STIR, Branded Calls, or CNAM, your customer may already have a Secondary Customer Profile.
>
> You can check for Secondary Customer Profiles in the Console (**Account**  > **Customer Profiles**). You can use the TrustHub REST API [list all CustomerProfile resources associated with your Account](/docs/trust-hub/trusthub-rest-api/customer-profiles#read-multiple-customerprofile-resources).

* Save the `sid` in the response to this request. This is the SID of the Secondary Customer Profile that you need in subsequent steps.
* Do not change the `policy_sid` in the API request below. This is the [Policy](/docs/trust-hub/trusthub-rest-api#policies-resource) (rule set) that defines which information is required for a CustomerProfile.
* The `friendly_name` is an internal identifier for this Customer Profile. Use a descriptive name that you understand, e.g., "Acme, Inc. Secondary Customer Profile".
* The `email` parameter is the email address that will receive updates when the CustomerProfile resource's `status` changes. **This should not be your customer's email address.** This is an email address that you (as the ISV) own, since you need to monitor this CustomerProfile resource's `status` as part of the onboarding process.
* The `status_callback` parameter is optional. This is the URL to which Twilio sends updates regarding this CustomerProfile's `status`.

Create a Secondary Customer Profile

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCustomerProfile() {
  const customerProfile = await client.trusthub.v1.customerProfiles.create({
    email: "acme-inc@example.com",
    friendlyName: "Acme, Inc. Secondary Customer Profile",
    policySid: "RNdfbf3fae0e1107f8aded0e7cead80bf5",
    statusCallback: "https://www.example.com/status-callback-endpoint",
  });

  console.log(customerProfile.sid);
}

createCustomerProfile();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profile = client.trusthub.v1.customer_profiles.create(
    policy_sid="RNdfbf3fae0e1107f8aded0e7cead80bf5",
    friendly_name="Acme, Inc. Secondary Customer Profile",
    email="acme-inc@example.com",
    status_callback="https://www.example.com/status-callback-endpoint",
)

print(customer_profile.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfiles = await CustomerProfilesResource.CreateAsync(
            policySid: "RNdfbf3fae0e1107f8aded0e7cead80bf5",
            friendlyName: "Acme, Inc. Secondary Customer Profile",
            email: "acme-inc@example.com",
            statusCallback: new Uri("https://www.example.com/status-callback-endpoint"));

        Console.WriteLine(customerProfiles.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.net.URI;
import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.CustomerProfiles;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfiles customerProfiles =
            CustomerProfiles
                .creator("Acme, Inc. Secondary Customer Profile",
                    "acme-inc@example.com",
                    "RNdfbf3fae0e1107f8aded0e7cead80bf5")
                .setStatusCallback(URI.create("https://www.example.com/status-callback-endpoint"))
                .create();

        System.out.println(customerProfiles.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateCustomerProfileParams{}
	params.SetPolicySid("RNdfbf3fae0e1107f8aded0e7cead80bf5")
	params.SetFriendlyName("Acme, Inc. Secondary Customer Profile")
	params.SetEmail("acme-inc@example.com")
	params.SetStatusCallback("https://www.example.com/status-callback-endpoint")

	resp, err := client.TrusthubV1.CreateCustomerProfile(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profile = $twilio->trusthub->v1->customerProfiles->create(
    "Acme, Inc. Secondary Customer Profile", // FriendlyName
    "acme-inc@example.com", // Email
    "RNdfbf3fae0e1107f8aded0e7cead80bf5", // PolicySid
    ["statusCallback" => "https://www.example.com/status-callback-endpoint"]
);

print $customer_profile->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profile = @client
                   .trusthub
                   .v1
                   .customer_profiles
                   .create(
                     policy_sid: 'RNdfbf3fae0e1107f8aded0e7cead80bf5',
                     friendly_name: 'Acme, Inc. Secondary Customer Profile',
                     email: 'acme-inc@example.com',
                     status_callback: 'https://www.example.com/status-callback-endpoint'
                   )

puts customer_profile.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:create \
   --policy-sid RNdfbf3fae0e1107f8aded0e7cead80bf5 \
   --friendly-name "Acme, Inc. Secondary Customer Profile" \
   --email acme-inc@example.com \
   --status-callback https://www.example.com/status-callback-endpoint
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles" \
--data-urlencode "PolicySid=RNdfbf3fae0e1107f8aded0e7cead80bf5" \
--data-urlencode "FriendlyName=Acme, Inc. Secondary Customer Profile" \
--data-urlencode "Email=acme-inc@example.com" \
--data-urlencode "StatusCallback=https://www.example.com/status-callback-endpoint" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policy_sid": "RNdfbf3fae0e1107f8aded0e7cead80bf5",
  "friendly_name": "Acme, Inc. Secondary Customer Profile",
  "status": "draft",
  "email": "acme-inc@example.com",
  "status_callback": "https://www.example.com/status-callback-endpoint",
  "valid_until": null,
  "date_created": "2019-07-30T22:29:24Z",
  "date_updated": "2019-07-31T01:09:00Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "links": {
    "customer_profiles_entity_assignments": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments",
    "customer_profiles_evaluations": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Evaluations",
    "customer_profiles_channel_endpoint_assignment": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelEndpointAssignments"
  },
  "errors": null
}
```

### 1.2. Create an EndUser resource of type customer\_profile\_business\_information

This step creates an EndUser resource containing your customer's business information.

* The `type` parameter must be `"customer_profile_business_information"`.
* The `friendly_name` is an internal name for this API resource. Use a descriptive name, e.g., "Acme, Inc. Business Information EndUser resource".
* All of the specific business information is passed in within the `attributes` parameter, as an object.
  * The `attributes` object contains the following parameters and the corresponding values that you collected from your customer earlier:
    * `business_identity`
    * `business_industry`
    * `business_name`
    * `business_regions_of_operation`
    * `business_registration_identifier`
    * `business_registration_number`
    * `business_type`
    * `social_media_profile_urls` (optional)
    * `website_url`
* Save the `sid` in the response of this API request, which starts with "IT". You need it in the next step.

Create EndUser of type customer\_profile\_business\_information

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createEndUser() {
  const endUser = await client.trusthub.v1.endUsers.create({
    attributes: {
      business_name: "Acme, Inc.",
      social_media_profile_urls:
        "https://example.com/acme-social-media-profile",
      website_url: "https://www.example.com",
      business_regions_of_operation: "USA_AND_CANADA",
      business_type: "Partnership",
      business_registration_identifier: "EIN",
      business_identity: "direct_customer",
      business_industry: "EDUCATION",
      business_registration_number: "123456789",
    },
    friendlyName: "Acme, Inc. - Business Information EndUser resource",
    type: "customer_profile_business_information",
  });

  console.log(endUser.sid);
}

createEndUser();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

end_user = client.trusthub.v1.end_users.create(
    attributes={
        "business_name": "Acme, Inc.",
        "social_media_profile_urls": "https://example.com/acme-social-media-profile",
        "website_url": "https://www.example.com",
        "business_regions_of_operation": "USA_AND_CANADA",
        "business_type": "Partnership",
        "business_registration_identifier": "EIN",
        "business_identity": "direct_customer",
        "business_industry": "EDUCATION",
        "business_registration_number": "123456789",
    },
    friendly_name="Acme, Inc. - Business Information EndUser resource",
    type="customer_profile_business_information",
)

print(end_user.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var
            endUser =
                await
                    EndUserResource
                        .CreateAsync(
                            attributes: new Dictionary<
                                string,
                                Object>() { { "business_name", "Acme, Inc." }, { "social_media_profile_urls", "https://example.com/acme-social-media-profile" }, { "website_url", "https://www.example.com" }, { "business_regions_of_operation", "USA_AND_CANADA" }, { "business_type", "Partnership" }, { "business_registration_identifier", "EIN" }, { "business_identity", "direct_customer" }, { "business_industry", "EDUCATION" }, { "business_registration_number", "123456789" } },
                            friendlyName: "Acme, Inc. - Business Information EndUser resource",
                            type: "customer_profile_business_information");

        Console.WriteLine(endUser.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.util.HashMap;
import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.EndUser;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        EndUser endUser =
            EndUser
                .creator("Acme, Inc. - Business Information EndUser resource", "customer_profile_business_information")
                .setAttributes(new HashMap<String, Object>() {
                    {
                        put("business_name", "Acme, Inc.");
                        put("social_media_profile_urls", "https://example.com/acme-social-media-profile");
                        put("website_url", "https://www.example.com");
                        put("business_regions_of_operation", "USA_AND_CANADA");
                        put("business_type", "Partnership");
                        put("business_registration_identifier", "EIN");
                        put("business_identity", "direct_customer");
                        put("business_industry", "EDUCATION");
                        put("business_registration_number", "123456789");
                    }
                })
                .create();

        System.out.println(endUser.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateEndUserParams{}
	params.SetAttributes(map[string]interface{}{
		"business_name":                    "Acme, Inc.",
		"social_media_profile_urls":        "https://example.com/acme-social-media-profile",
		"website_url":                      "https://www.example.com",
		"business_regions_of_operation":    "USA_AND_CANADA",
		"business_type":                    "Partnership",
		"business_registration_identifier": "EIN",
		"business_identity":                "direct_customer",
		"business_industry":                "EDUCATION",
		"business_registration_number":     "123456789",
	})
	params.SetFriendlyName("Acme, Inc. - Business Information EndUser resource")
	params.SetType("customer_profile_business_information")

	resp, err := client.TrusthubV1.CreateEndUser(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$end_user = $twilio->trusthub->v1->endUsers->create(
    "Acme, Inc. - Business Information EndUser resource", // FriendlyName
    "customer_profile_business_information", // Type
    [
        "attributes" => [
            "business_name" => "Acme, Inc.",
            "social_media_profile_urls" =>
                "https://example.com/acme-social-media-profile",
            "website_url" => "https://www.example.com",
            "business_regions_of_operation" => "USA_AND_CANADA",
            "business_type" => "Partnership",
            "business_registration_identifier" => "EIN",
            "business_identity" => "direct_customer",
            "business_industry" => "EDUCATION",
            "business_registration_number" => "123456789",
        ],
    ]
);

print $end_user->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

end_user = @client
           .trusthub
           .v1
           .end_users
           .create(
             attributes: {
               'business_name' => 'Acme, Inc.',
               'social_media_profile_urls' => 'https://example.com/acme-social-media-profile',
               'website_url' => 'https://www.example.com',
               'business_regions_of_operation' => 'USA_AND_CANADA',
               'business_type' => 'Partnership',
               'business_registration_identifier' => 'EIN',
               'business_identity' => 'direct_customer',
               'business_industry' => 'EDUCATION',
               'business_registration_number' => '123456789'
             },
             friendly_name: 'Acme, Inc. - Business Information EndUser resource',
             type: 'customer_profile_business_information'
           )

puts end_user.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:end-users:create \
   --attributes "{\"business_name\":\"Acme, Inc.\",\"social_media_profile_urls\":\"https://example.com/acme-social-media-profile\",\"website_url\":\"https://www.example.com\",\"business_regions_of_operation\":\"USA_AND_CANADA\",\"business_type\":\"Partnership\",\"business_registration_identifier\":\"EIN\",\"business_identity\":\"direct_customer\",\"business_industry\":\"EDUCATION\",\"business_registration_number\":\"123456789\"}" \
   --friendly-name "Acme, Inc. - Business Information EndUser resource" \
   --type customer_profile_business_information
```

```bash
ATTRIBUTES_OBJ=$(cat << EOF
{
  "business_name": "Acme, Inc.",
  "social_media_profile_urls": "https://example.com/acme-social-media-profile",
  "website_url": "https://www.example.com",
  "business_regions_of_operation": "USA_AND_CANADA",
  "business_type": "Partnership",
  "business_registration_identifier": "EIN",
  "business_identity": "direct_customer",
  "business_industry": "EDUCATION",
  "business_registration_number": "123456789"
}
EOF
)
curl -X POST "https://trusthub.twilio.com/v1/EndUsers" \
--data-urlencode "Attributes=$ATTRIBUTES_OBJ" \
--data-urlencode "FriendlyName=Acme, Inc. - Business Information EndUser resource" \
--data-urlencode "Type=customer_profile_business_information" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "date_updated": "2021-02-16T20:40:57Z",
  "sid": "ITaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "friendly_name": "Acme, Inc. - Business Information EndUser resource",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "url": "https://trusthub.twilio.com/v1/EndUsers/ITaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2021-02-16T20:40:57Z",
  "attributes": {
    "business_name": "Acme, Inc.",
    "social_media_profile_urls": "https://example.com/acme-social-media-profile",
    "website_url": "https://www.example.com",
    "business_regions_of_operation": "USA_AND_CANADA",
    "business_type": "Partnership",
    "business_registration_identifier": "EIN",
    "business_identity": "direct_customer",
    "business_industry": "EDUCATION",
    "business_registration_number": "123456789"
  },
  "type": "customer_profile_business_information"
}
```

### 1.3. Attach the EndUser to the Secondary Customer Profile

This step associates the EndUser resource with the Secondary Customer Profile from Step 1.1.

* The `sid` in the path of this request is the SID of the CustomerProfile resource from Step 1.1.
* The `object_sid` is the EndUser resource SID from Step 1.2.

Attach the EndUser resource to the Secondary Customer Profile

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCustomerProfileEntityAssignment() {
  const customerProfilesEntityAssignment = await client.trusthub.v1
    .customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .customerProfilesEntityAssignments.create({
      objectSid: "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });

  console.log(customerProfilesEntityAssignment.sid);
}

createCustomerProfileEntityAssignment();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profiles_entity_assignment = client.trusthub.v1.customer_profiles(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).customer_profiles_entity_assignments.create(
    object_sid="ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
)

print(customer_profiles_entity_assignment.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.CustomerProfiles;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfilesEntityAssignments =
            await CustomerProfilesEntityAssignmentsResource.CreateAsync(
                objectSid: "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                pathCustomerProfileSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(customerProfilesEntityAssignments.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.customerprofiles.CustomerProfilesEntityAssignments;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfilesEntityAssignments customerProfilesEntityAssignments =
            CustomerProfilesEntityAssignments
                .creator("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(customerProfilesEntityAssignments.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateCustomerProfileEntityAssignmentParams{}
	params.SetObjectSid("ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.TrusthubV1.CreateCustomerProfileEntityAssignment("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profiles_entity_assignment = $twilio->trusthub->v1
    ->customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->customerProfilesEntityAssignments->create(
        "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // ObjectSid
    );

print $customer_profiles_entity_assignment->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profiles_entity_assignment = @client
                                      .trusthub
                                      .v1
                                      .customer_profiles('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                      .customer_profiles_entity_assignments
                                      .create(
                                        object_sid: 'ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                                      )

puts customer_profiles_entity_assignment.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:entity-assignments:create \
   --customer-profile-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --object-sid ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments" \
--data-urlencode "ObjectSid=ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "customer_profile_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "object_sid": "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2019-07-31T02:34:41Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments/BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 1.4. Create an EndUser resource of type: authorized\_representative\_1

This step provides required information about an authorized representative for **your customer's business**.

* The `type` parameter has a value of `"authorized_representative_1"`.
* The `friendly_name` is an internal name for identifying this EndUser resource. Use a descriptive name, e.g., "Acme, Inc. Authorized Rep 1".
* The authorized representative's contact information is provided via the `attributes` parameter. The `attributes` object contains the following parameters and the corresponding values that you collected from your customer earlier:
  * `business_title`
  * `email`
  * `first_name`
  * `job_position`
  * `last_name`
  * `phone_number`

Create EndUser of type authorized\_representative\_1

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createEndUser() {
  const endUser = await client.trusthub.v1.endUsers.create({
    attributes: {
      job_position: "CEO",
      last_name: "Doe",
      phone_number: "+12225557890",
      first_name: "Jane",
      email: "jdoe@example.com",
      business_title: "CEO",
    },
    friendlyName: "Acme, Inc Authorized Rep 1",
    type: "authorized_representative_1",
  });

  console.log(endUser.sid);
}

createEndUser();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

end_user = client.trusthub.v1.end_users.create(
    attributes={
        "job_position": "CEO",
        "last_name": "Doe",
        "phone_number": "+12225557890",
        "first_name": "Jane",
        "email": "jdoe@example.com",
        "business_title": "CEO",
    },
    friendly_name="Acme, Inc Authorized Rep 1",
    type="authorized_representative_1",
)

print(end_user.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var endUser = await EndUserResource.CreateAsync(
            attributes: new Dictionary<
                string,
                Object>() { { "job_position", "CEO" }, { "last_name", "Doe" }, { "phone_number", "+12225557890" }, { "first_name", "Jane" }, { "email", "jdoe@example.com" }, { "business_title", "CEO" } },
            friendlyName: "Acme, Inc Authorized Rep 1",
            type: "authorized_representative_1");

        Console.WriteLine(endUser.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.util.HashMap;
import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.EndUser;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        EndUser endUser = EndUser.creator("Acme, Inc Authorized Rep 1", "authorized_representative_1")
                              .setAttributes(new HashMap<String, Object>() {
                                  {
                                      put("job_position", "CEO");
                                      put("last_name", "Doe");
                                      put("phone_number", "+12225557890");
                                      put("first_name", "Jane");
                                      put("email", "jdoe@example.com");
                                      put("business_title", "CEO");
                                  }
                              })
                              .create();

        System.out.println(endUser.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateEndUserParams{}
	params.SetAttributes(map[string]interface{}{
		"job_position":   "CEO",
		"last_name":      "Doe",
		"phone_number":   "+12225557890",
		"first_name":     "Jane",
		"email":          "jdoe@example.com",
		"business_title": "CEO",
	})
	params.SetFriendlyName("Acme, Inc Authorized Rep 1")
	params.SetType("authorized_representative_1")

	resp, err := client.TrusthubV1.CreateEndUser(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$end_user = $twilio->trusthub->v1->endUsers->create(
    "Acme, Inc Authorized Rep 1", // FriendlyName
    "authorized_representative_1", // Type
    [
        "attributes" => [
            "job_position" => "CEO",
            "last_name" => "Doe",
            "phone_number" => "+12225557890",
            "first_name" => "Jane",
            "email" => "jdoe@example.com",
            "business_title" => "CEO",
        ],
    ]
);

print $end_user->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

end_user = @client
           .trusthub
           .v1
           .end_users
           .create(
             attributes: {
               'job_position' => 'CEO',
               'last_name' => 'Doe',
               'phone_number' => '+12225557890',
               'first_name' => 'Jane',
               'email' => 'jdoe@example.com',
               'business_title' => 'CEO'
             },
             friendly_name: 'Acme, Inc Authorized Rep 1',
             type: 'authorized_representative_1'
           )

puts end_user.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:end-users:create \
   --attributes "{\"job_position\":\"CEO\",\"last_name\":\"Doe\",\"phone_number\":\"+12225557890\",\"first_name\":\"Jane\",\"email\":\"jdoe@example.com\",\"business_title\":\"CEO\"}" \
   --friendly-name "Acme, Inc Authorized Rep 1" \
   --type authorized_representative_1
```

```bash
ATTRIBUTES_OBJ=$(cat << EOF
{
  "job_position": "CEO",
  "last_name": "Doe",
  "phone_number": "+12225557890",
  "first_name": "Jane",
  "email": "jdoe@example.com",
  "business_title": "CEO"
}
EOF
)
curl -X POST "https://trusthub.twilio.com/v1/EndUsers" \
--data-urlencode "Attributes=$ATTRIBUTES_OBJ" \
--data-urlencode "FriendlyName=Acme, Inc Authorized Rep 1" \
--data-urlencode "Type=authorized_representative_1" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "date_updated": "2021-02-16T20:40:57Z",
  "sid": "ITaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "friendly_name": "Acme, Inc Authorized Rep 1",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "url": "https://trusthub.twilio.com/v1/EndUsers/ITaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2021-02-16T20:40:57Z",
  "attributes": {
    "job_position": "CEO",
    "last_name": "Doe",
    "phone_number": "+12225557890",
    "first_name": "Jane",
    "email": "jdoe@example.com",
    "business_title": "CEO"
  },
  "type": "authorized_representative_1"
}
```

You may provide a second authorized representative by repeating this request, but use `authorized_representative_2` for the `type` parameter instead. You must also complete the next step again, but with the SID associated with the `authorized_representative_2` EndUser.

### 1.5. Attach the EndUser resource to the Secondary Customer Profile

* The `sid` in the path of this request is the SID of the Secondary Customer Profile from Step 1.1.
* The `object_sid` is the EndUser resource SID from Step 1.4.

Attach the EndUser resource to the Secondary Customer Profile

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCustomerProfileEntityAssignment() {
  const customerProfilesEntityAssignment = await client.trusthub.v1
    .customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .customerProfilesEntityAssignments.create({
      objectSid: "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });

  console.log(customerProfilesEntityAssignment.sid);
}

createCustomerProfileEntityAssignment();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profiles_entity_assignment = client.trusthub.v1.customer_profiles(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).customer_profiles_entity_assignments.create(
    object_sid="ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
)

print(customer_profiles_entity_assignment.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.CustomerProfiles;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfilesEntityAssignments =
            await CustomerProfilesEntityAssignmentsResource.CreateAsync(
                objectSid: "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                pathCustomerProfileSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(customerProfilesEntityAssignments.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.customerprofiles.CustomerProfilesEntityAssignments;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfilesEntityAssignments customerProfilesEntityAssignments =
            CustomerProfilesEntityAssignments
                .creator("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(customerProfilesEntityAssignments.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateCustomerProfileEntityAssignmentParams{}
	params.SetObjectSid("ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.TrusthubV1.CreateCustomerProfileEntityAssignment("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profiles_entity_assignment = $twilio->trusthub->v1
    ->customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->customerProfilesEntityAssignments->create(
        "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // ObjectSid
    );

print $customer_profiles_entity_assignment->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profiles_entity_assignment = @client
                                      .trusthub
                                      .v1
                                      .customer_profiles('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                      .customer_profiles_entity_assignments
                                      .create(
                                        object_sid: 'ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                                      )

puts customer_profiles_entity_assignment.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:entity-assignments:create \
   --customer-profile-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --object-sid ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments" \
--data-urlencode "ObjectSid=ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "customer_profile_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "object_sid": "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2019-07-31T02:34:41Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments/BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 1.6. Create an Address resource

This API request creates an [Address resource](/docs/usage/api/address) containing your customer's mailing address.

* The `friendly_name` is an internal name. Use something descriptive, e.g., "Acme, Inc. Address".
* This request also uses the following parameters and the corresponding values that you collected from your customer earlier:
  * `city`
  * `customer_name`
  * `iso_country`
  * `postal_code`
  * `region`
  * `street`
  * `street_secondary` (optional)
* Save the `sid` in the response to this request. You need it in the next step.

Create an Address resource

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createAddress() {
  const address = await client.addresses.create({
    city: "San Francisco",
    customerName: "Acme, Inc.",
    isoCountry: "US",
    postalCode: "12345",
    region: "CA",
    street: "1234 Market St",
  });

  console.log(address.accountSid);
}

createAddress();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

address = client.addresses.create(
    customer_name="Acme, Inc.",
    street="1234 Market St",
    city="San Francisco",
    region="CA",
    postal_code="12345",
    iso_country="US",
)

print(address.account_sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var address = await AddressResource.CreateAsync(
            customerName: "Acme, Inc.",
            street: "1234 Market St",
            city: "San Francisco",
            region: "CA",
            postalCode: "12345",
            isoCountry: "US");

        Console.WriteLine(address.AccountSid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Address;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Address address =
            Address.creator("Acme, Inc.", "1234 Market St", "San Francisco", "CA", "12345", "US").create();

        System.out.println(address.getAccountSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateAddressParams{}
	params.SetCustomerName("Acme, Inc.")
	params.SetStreet("1234 Market St")
	params.SetCity("San Francisco")
	params.SetRegion("CA")
	params.SetPostalCode("12345")
	params.SetIsoCountry("US")

	resp, err := client.Api.CreateAddress(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.AccountSid != nil {
			fmt.Println(*resp.AccountSid)
		} else {
			fmt.Println(resp.AccountSid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$address = $twilio->addresses->create(
    "Acme, Inc.", // CustomerName
    "1234 Market St", // Street
    "San Francisco", // City
    "CA", // Region
    "12345", // PostalCode
    "US" // IsoCountry
);

print $address->accountSid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

address = @client
          .api
          .v2010
          .addresses
          .create(
            customer_name: 'Acme, Inc.',
            street: '1234 Market St',
            city: 'San Francisco',
            region: 'CA',
            postal_code: '12345',
            iso_country: 'US'
          )

puts address.account_sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:addresses:create \
   --customer-name "Acme, Inc." \
   --street "1234 Market St" \
   --city "San Francisco" \
   --region CA \
   --postal-code 12345 \
   --iso-country US
```

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Addresses.json" \
--data-urlencode "CustomerName=Acme, Inc." \
--data-urlencode "Street=1234 Market St" \
--data-urlencode "City=San Francisco" \
--data-urlencode "Region=CA" \
--data-urlencode "PostalCode=12345" \
--data-urlencode "IsoCountry=US" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "city": "San Francisco",
  "customer_name": "Acme, Inc.",
  "date_created": "Tue, 18 Aug 2015 17:07:30 +0000",
  "date_updated": "Tue, 18 Aug 2015 17:07:30 +0000",
  "emergency_enabled": false,
  "friendly_name": "Main Office",
  "iso_country": "US",
  "postal_code": "12345",
  "region": "CA",
  "sid": "ADaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "street": "1234 Market St",
  "street_secondary": "Suite 300",
  "validated": false,
  "verified": false,
  "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Addresses/ADaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json"
}
```

### 1.7. Create a SupportingDocument resource

This step creates a SupportingDocument resource, which is how the TrustHub API stores the Address information.

* The `friendly_name` is an internal name. Use something descriptive, e.g., "Acme, Inc. Address SupportingDocument".
* The `type` parameter must be `customer_profile_address`.
* The `attributes` parameter is an object with a property of `address_sids`. The value of this property is the Address SID from the previous step.
* Save the `sid` in the response to this API request. You need it in the next step.

Create a SupportingDocument

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createSupportingDocument() {
  const supportingDocument =
    await client.trusthub.v1.supportingDocuments.create({
      attributes: {
        address_sids: "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      },
      friendlyName: "acme",
      type: "customer_profile_address",
    });

  console.log(supportingDocument.sid);
}

createSupportingDocument();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

supporting_document = client.trusthub.v1.supporting_documents.create(
    friendly_name="acme",
    type="customer_profile_address",
    attributes={"address_sids": "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"},
)

print(supporting_document.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var supportingDocument = await SupportingDocumentResource.CreateAsync(
            friendlyName: "acme",
            type: "customer_profile_address",
            attributes: new Dictionary<string, Object>() {
                { "address_sids", "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" }
            });

        Console.WriteLine(supportingDocument.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.util.HashMap;
import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.SupportingDocument;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        SupportingDocument supportingDocument = SupportingDocument.creator("acme", "customer_profile_address")
                                                    .setAttributes(new HashMap<String, Object>() {
                                                        {
                                                            put("address_sids", "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                                                        }
                                                    })
                                                    .create();

        System.out.println(supportingDocument.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateSupportingDocumentParams{}
	params.SetFriendlyName("acme")
	params.SetType("customer_profile_address")
	params.SetAttributes(map[string]interface{}{
		"address_sids": "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	})

	resp, err := client.TrusthubV1.CreateSupportingDocument(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$supporting_document = $twilio->trusthub->v1->supportingDocuments->create(
    "acme", // FriendlyName
    "customer_profile_address", // Type
    [
        "attributes" => [
            "address_sids" => "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        ],
    ]
);

print $supporting_document->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

supporting_document = @client
                      .trusthub
                      .v1
                      .supporting_documents
                      .create(
                        friendly_name: 'acme',
                        type: 'customer_profile_address',
                        attributes: {
                          'address_sids' => 'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                        }
                      )

puts supporting_document.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:supporting-documents:create \
   --friendly-name acme \
   --type customer_profile_address \
   --attributes "{\"address_sids\":\"ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\"}"
```

```bash
ATTRIBUTES_OBJ=$(cat << EOF
{
  "address_sids": "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
EOF
)
curl -X POST "https://trusthub.twilio.com/v1/SupportingDocuments" \
--data-urlencode "FriendlyName=acme" \
--data-urlencode "Type=customer_profile_address" \
--data-urlencode "Attributes=$ATTRIBUTES_OBJ" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "status": "DRAFT",
  "date_updated": "2021-02-11T17:23:00Z",
  "friendly_name": "acme",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "url": "https://trusthub.twilio.com/v1/SupportingDocuments/RDaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2021-02-11T17:23:00Z",
  "sid": "RDaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "attributes": {
    "address_sids": "ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  },
  "type": "customer_profile_address",
  "mime_type": null
}
```

### 1.8. Attach the SupportingDocument resource to the Secondary Customer Profile

This step associates the SupportingDocument resource with your customer's Secondary Customer Profile.

* The `sid` in the path of this request is the SID of the Secondary Customer Profile from 1.1.
* The `object_sid` is the SupportingDocument resource SID from Step 7.

Attach the SupportingDocument resource to the Secondary Customer Profile

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCustomerProfileEntityAssignment() {
  const customerProfilesEntityAssignment = await client.trusthub.v1
    .customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .customerProfilesEntityAssignments.create({
      objectSid: "RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });

  console.log(customerProfilesEntityAssignment.sid);
}

createCustomerProfileEntityAssignment();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profiles_entity_assignment = client.trusthub.v1.customer_profiles(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).customer_profiles_entity_assignments.create(
    object_sid="RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
)

print(customer_profiles_entity_assignment.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.CustomerProfiles;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfilesEntityAssignments =
            await CustomerProfilesEntityAssignmentsResource.CreateAsync(
                objectSid: "RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                pathCustomerProfileSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(customerProfilesEntityAssignments.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.customerprofiles.CustomerProfilesEntityAssignments;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfilesEntityAssignments customerProfilesEntityAssignments =
            CustomerProfilesEntityAssignments
                .creator("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(customerProfilesEntityAssignments.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateCustomerProfileEntityAssignmentParams{}
	params.SetObjectSid("RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.TrusthubV1.CreateCustomerProfileEntityAssignment("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profiles_entity_assignment = $twilio->trusthub->v1
    ->customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->customerProfilesEntityAssignments->create(
        "RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // ObjectSid
    );

print $customer_profiles_entity_assignment->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profiles_entity_assignment = @client
                                      .trusthub
                                      .v1
                                      .customer_profiles('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                      .customer_profiles_entity_assignments
                                      .create(
                                        object_sid: 'RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                                      )

puts customer_profiles_entity_assignment.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:entity-assignments:create \
   --customer-profile-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --object-sid RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments" \
--data-urlencode "ObjectSid=RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "customer_profile_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "object_sid": "RDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2019-07-31T02:34:41Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments/BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 1.9. Assign the Secondary Customer Profile to the Primary Customer Profile

This step associates the created Secondary Customer Profile resource with your Primary Customer Profile.

* The `sid` in the path of this request is the SID of the Secondary Customer Profile from step 1.1.
* The `object_sid` is the SID of the Primary Customer Profile.

Assign a Primary Customer Profile

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCustomerProfileEntityAssignment() {
  const customerProfilesEntityAssignment = await client.trusthub.v1
    .customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .customerProfilesEntityAssignments.create({
      objectSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

  console.log(customerProfilesEntityAssignment.sid);
}

createCustomerProfileEntityAssignment();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profiles_entity_assignment = client.trusthub.v1.customer_profiles(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).customer_profiles_entity_assignments.create(
    object_sid="BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
)

print(customer_profiles_entity_assignment.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.CustomerProfiles;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfilesEntityAssignments =
            await CustomerProfilesEntityAssignmentsResource.CreateAsync(
                objectSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                pathCustomerProfileSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(customerProfilesEntityAssignments.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.customerprofiles.CustomerProfilesEntityAssignments;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfilesEntityAssignments customerProfilesEntityAssignments =
            CustomerProfilesEntityAssignments
                .creator("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                .create();

        System.out.println(customerProfilesEntityAssignments.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateCustomerProfileEntityAssignmentParams{}
	params.SetObjectSid("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	resp, err := client.TrusthubV1.CreateCustomerProfileEntityAssignment("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profiles_entity_assignment = $twilio->trusthub->v1
    ->customerProfiles("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->customerProfilesEntityAssignments->create(
        "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" // ObjectSid
    );

print $customer_profiles_entity_assignment->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profiles_entity_assignment = @client
                                      .trusthub
                                      .v1
                                      .customer_profiles('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                      .customer_profiles_entity_assignments
                                      .create(
                                        object_sid: 'BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                                      )

puts customer_profiles_entity_assignment.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:entity-assignments:create \
   --customer-profile-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --object-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments" \
--data-urlencode "ObjectSid=BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "customer_profile_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "object_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2019-07-31T02:34:41Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments/BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 1.10. Evaluate the Secondary Customer Profile

This API request runs an automated evaluation on the Secondary Customer Profile. The response from Twilio indicates whether or not all required information (as per the [Policy](/docs/trust-hub/trusthub-rest-api#policies-resource)) is present in the Secondary Customer Profile.

If there are no errors, the response contains a `status` of `compliant`. Otherwise, the `status` is `noncompliant` and the `results` property contains information about invalid or missing information.

* The `customer_profile_sid` is the SID of the Secondary Customer Profile.
* The `policy_sid` is `RNdfbf3fae0e1107f8aded0e7cead80bf5`.

Evaluate the Secondary Customer Profile

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createCustomerProfileEvaluation() {
  const customerProfilesEvaluation = await client.trusthub.v1
    .customerProfiles("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .customerProfilesEvaluations.create({
      policySid: "RNdfbf3fae0e1107f8aded0e7cead80bf5",
    });

  console.log(customerProfilesEvaluation.sid);
}

createCustomerProfileEvaluation();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profiles_evaluation = client.trusthub.v1.customer_profiles(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
).customer_profiles_evaluations.create(
    policy_sid="RNdfbf3fae0e1107f8aded0e7cead80bf5"
)

print(customer_profiles_evaluation.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.CustomerProfiles;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfilesEvaluations = await CustomerProfilesEvaluationsResource.CreateAsync(
            policySid: "RNdfbf3fae0e1107f8aded0e7cead80bf5",
            pathCustomerProfileSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(customerProfilesEvaluations.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.customerprofiles.CustomerProfilesEvaluations;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfilesEvaluations customerProfilesEvaluations =
            CustomerProfilesEvaluations
                .creator("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "RNdfbf3fae0e1107f8aded0e7cead80bf5")
                .create();

        System.out.println(customerProfilesEvaluations.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateCustomerProfileEvaluationParams{}
	params.SetPolicySid("RNdfbf3fae0e1107f8aded0e7cead80bf5")

	resp, err := client.TrusthubV1.CreateCustomerProfileEvaluation("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profiles_evaluation = $twilio->trusthub->v1
    ->customerProfiles("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    ->customerProfilesEvaluations->create(
        "RNdfbf3fae0e1107f8aded0e7cead80bf5" // PolicySid
    );

print $customer_profiles_evaluation->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profiles_evaluation = @client
                               .trusthub
                               .v1
                               .customer_profiles('BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                               .customer_profiles_evaluations
                               .create(
                                 policy_sid: 'RNdfbf3fae0e1107f8aded0e7cead80bf5'
                               )

puts customer_profiles_evaluation.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:evaluations:create \
   --customer-profile-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --policy-sid RNdfbf3fae0e1107f8aded0e7cead80bf5
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles/BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Evaluations" \
--data-urlencode "PolicySid=RNdfbf3fae0e1107f8aded0e7cead80bf5" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "ELaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policy_sid": "RNdfbf3fae0e1107f8aded0e7cead80bf5",
  "customer_profile_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "status": "noncompliant",
  "date_created": "2020-04-28T18:14:01Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Evaluations/ELaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "results": [
    {
      "friendly_name": "Business",
      "object_type": "business",
      "passed": false,
      "failure_reason": "A Business End-User is missing. Please add one to the regulatory bundle.",
      "error_code": 22214,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Business Name",
          "object_field": "business_name",
          "failure_reason": "The Business Name is missing. Please enter in a Business Name on the Business information.",
          "error_code": 22215
        },
        {
          "friendly_name": "Business Registration Number",
          "object_field": "business_registration_number",
          "failure_reason": "The Business Registration Number is missing. Please enter in a Business Registration Number on the Business information.",
          "error_code": 22215
        },
        {
          "friendly_name": "First Name",
          "object_field": "first_name",
          "failure_reason": "The First Name is missing. Please enter in a First Name on the Business information.",
          "error_code": 22215
        },
        {
          "friendly_name": "Last Name",
          "object_field": "last_name",
          "failure_reason": "The Last Name is missing. Please enter in a Last Name on the Business information.",
          "error_code": 22215
        }
      ],
      "requirement_friendly_name": "Business",
      "requirement_name": "business_info"
    },
    {
      "friendly_name": "Excerpt from the commercial register (Extrait K-bis) showing name of Authorized Representative",
      "object_type": "commercial_registrar_excerpt",
      "passed": false,
      "failure_reason": "An Excerpt from the commercial register (Extrait K-bis) showing name of Authorized Representative is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Business Name",
          "object_field": "business_name",
          "failure_reason": "The Business Name is missing. Or, it does not match the Business Name you entered within Business information. Please enter in the Business Name shown on the Excerpt from the commercial register (Extrait K-bis) showing name of Authorized Representative or make sure both Business Name fields use the same exact inputs.",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Business Name",
      "requirement_name": "business_name_info"
    },
    {
      "friendly_name": "Excerpt from the commercial register showing French address",
      "object_type": "commercial_registrar_excerpt",
      "passed": false,
      "failure_reason": "An Excerpt from the commercial register showing French address is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Address sid(s)",
          "object_field": "address_sids",
          "failure_reason": "The Address is missing. Please enter in the address shown on the Excerpt from the commercial register showing French address.",
          "error_code": 22219
        }
      ],
      "requirement_friendly_name": "Business Address (Proof of Address)",
      "requirement_name": "business_address_proof_info"
    },
    {
      "friendly_name": "Excerpt from the commercial register (Extrait K-bis)",
      "object_type": "commercial_registrar_excerpt",
      "passed": false,
      "failure_reason": "An Excerpt from the commercial register (Extrait K-bis) is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Document Number",
          "object_field": "document_number",
          "failure_reason": "The Document Number is missing. Please enter in the Document Number shown on the Excerpt from the commercial register (Extrait K-bis).",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Business Registration Number",
      "requirement_name": "business_reg_no_info"
    },
    {
      "friendly_name": "Government-issued ID",
      "object_type": "government_issued_document",
      "passed": false,
      "failure_reason": "A Government-issued ID is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "First Name",
          "object_field": "first_name",
          "failure_reason": "The First Name is missing. Or, it does not match the First Name you entered within Business information. Please enter in the First Name shown on the Government-issued ID or make sure both First Name fields use the same exact inputs.",
          "error_code": 22217
        },
        {
          "friendly_name": "Last Name",
          "object_field": "last_name",
          "failure_reason": "The Last Name is missing. Or, it does not match the Last Name you entered within Business information. Please enter in the Last Name shown on the Government-issued ID or make sure both Last Name fields use the same exact inputs.",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Name of Authorized Representative",
      "requirement_name": "name_of_auth_rep_info"
    },
    {
      "friendly_name": "Executed Copy of Power of Attorney",
      "object_type": "power_of_attorney",
      "passed": false,
      "failure_reason": "An Executed Copy of Power of Attorney is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [],
      "requirement_friendly_name": "Power of Attorney",
      "requirement_name": "power_of_attorney_info"
    },
    {
      "friendly_name": "Government-issued ID",
      "object_type": "government_issued_document",
      "passed": false,
      "failure_reason": "A Government-issued ID is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "First Name",
          "object_field": "first_name",
          "failure_reason": "The First Name is missing on the Governnment-Issued ID.",
          "error_code": 22217
        },
        {
          "friendly_name": "Last Name",
          "object_field": "last_name",
          "failure_reason": "The Last Name is missing on the Government-issued ID",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Name of Person granted the Power of Attorney",
      "requirement_name": "name_in_power_of_attorney_info"
    }
  ]
}
```

### 1.11. Submit the Secondary Customer Profile for review

This API request submits the Secondary Customer Profile for review.

* The `sid` is the SID of the Secondary Customer Profile.
* The `status` must be `pending_review`.

After submitting, you can proceed to the next step. The Secondary Customer Profile does not need to have an `approved` status in order to continue.

Submit the secondary customer profile for review

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function updateCustomerProfile() {
  const customerProfile = await client.trusthub.v1
    .customerProfiles("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .update({ status: "pending-review" });

  console.log(customerProfile.sid);
}

updateCustomerProfile();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

customer_profile = client.trusthub.v1.customer_profiles(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
).update(status="pending-review")

print(customer_profile.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var customerProfiles = await CustomerProfilesResource.UpdateAsync(
            status: CustomerProfilesResource.StatusEnum.PendingReview,
            pathSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(customerProfiles.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.CustomerProfiles;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        CustomerProfiles customerProfiles = CustomerProfiles.updater("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                                                .setStatus(CustomerProfiles.Status.PENDING_REVIEW)
                                                .update();

        System.out.println(customerProfiles.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.UpdateCustomerProfileParams{}
	params.SetStatus("pending-review")

	resp, err := client.TrusthubV1.UpdateCustomerProfile("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$customer_profile = $twilio->trusthub->v1
    ->customerProfiles("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    ->update(["status" => "pending-review"]);

print $customer_profile->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

customer_profile = @client
                   .trusthub
                   .v1
                   .customer_profiles('BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                   .update(status: 'pending-review')

puts customer_profile.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:customer-profiles:update \
   --sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --status pending-review
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/CustomerProfiles/BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "Status=pending-review" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policy_sid": "RNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "friendly_name": "friendly_name",
  "status": "pending-review",
  "email": "notification@email.com",
  "status_callback": "http://www.example.com",
  "valid_until": null,
  "date_created": "2019-07-30T22:29:24Z",
  "date_updated": "2019-07-31T01:09:00Z",
  "url": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "links": {
    "customer_profiles_entity_assignments": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments",
    "customer_profiles_evaluations": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Evaluations",
    "customer_profiles_channel_endpoint_assignment": "https://trusthub.twilio.com/v1/CustomerProfiles/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelEndpointAssignments"
  },
  "errors": null
}
```

## 2. Create and submit a TrustProduct

This section of the onboarding guide covers creating and submitting a TrustProduct resource via the TrustHub API. This TrustProduct is a "container" for some additional business information that TCR requires.

In Step 2.1 below, you create the TrustProduct resource. Next, you provide the additional business information in an EndUser resource (Step 2.2) and then attach the EndUser resource to the TrustProduct in Step 2.3. In Step 2.4, you attach the CustomerProfile resource to the TrustProduct resource. Finally, you check and submit the TrustProduct for review in Steps 2.5 and 2.6.

### 2.1. Create a TrustProduct resource

This step creates a TrustProduct resource, which is a "container" for some additional business information that TCR requires.

* The `friendly_name` is an internal name. Use something descriptive, e.g., "Acme, Inc. A2P Trust Product".
* The `email` is the email address to which Twilio sends updates when the TrustProduct's `status` changes. This should be your (the ISV's) email address, **not the customer's**. You need to monitor this email address for changes in the TrustProduct's `status`.
* The `policy_sid` must be `RNb0d4771c2c98518d916a3d4cd70a8f8b`
* The `status_callback` is the URL to which Twilio sends status updates about the TrustProduct. This is optional, but recommended.
* Save the `sid` returned by this request. You need it in later steps.

Create an empty A2P Trust Bundle

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createTrustProduct() {
  const trustProduct = await client.trusthub.v1.trustProducts.create({
    email: "ceo@example.com",
    friendlyName: "Acme, Inc. A2P Trust Product",
    policySid: "RNb0d4771c2c98518d916a3d4cd70a8f8b",
  });

  console.log(trustProduct.sid);
}

createTrustProduct();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

trust_product = client.trusthub.v1.trust_products.create(
    friendly_name="Acme, Inc. A2P Trust Product",
    policy_sid="RNb0d4771c2c98518d916a3d4cd70a8f8b",
    email="ceo@example.com",
)

print(trust_product.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var trustProducts = await TrustProductsResource.CreateAsync(
            friendlyName: "Acme, Inc. A2P Trust Product",
            policySid: "RNb0d4771c2c98518d916a3d4cd70a8f8b",
            email: "ceo@example.com");

        Console.WriteLine(trustProducts.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.TrustProducts;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        TrustProducts trustProducts =
            TrustProducts
                .creator("Acme, Inc. A2P Trust Product", "ceo@example.com", "RNb0d4771c2c98518d916a3d4cd70a8f8b")
                .create();

        System.out.println(trustProducts.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateTrustProductParams{}
	params.SetFriendlyName("Acme, Inc. A2P Trust Product")
	params.SetPolicySid("RNb0d4771c2c98518d916a3d4cd70a8f8b")
	params.SetEmail("ceo@example.com")

	resp, err := client.TrusthubV1.CreateTrustProduct(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$trust_product = $twilio->trusthub->v1->trustProducts->create(
    "Acme, Inc. A2P Trust Product", // FriendlyName
    "ceo@example.com", // Email
    "RNb0d4771c2c98518d916a3d4cd70a8f8b" // PolicySid
);

print $trust_product->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

trust_product = @client
                .trusthub
                .v1
                .trust_products
                .create(
                  friendly_name: 'Acme, Inc. A2P Trust Product',
                  policy_sid: 'RNb0d4771c2c98518d916a3d4cd70a8f8b',
                  email: 'ceo@example.com'
                )

puts trust_product.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:trust-products:create \
   --friendly-name "Acme, Inc. A2P Trust Product" \
   --policy-sid RNb0d4771c2c98518d916a3d4cd70a8f8b \
   --email ceo@example.com
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/TrustProducts" \
--data-urlencode "FriendlyName=Acme, Inc. A2P Trust Product" \
--data-urlencode "PolicySid=RNb0d4771c2c98518d916a3d4cd70a8f8b" \
--data-urlencode "Email=ceo@example.com" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policy_sid": "RNb0d4771c2c98518d916a3d4cd70a8f8b",
  "friendly_name": "Acme, Inc. A2P Trust Product",
  "status": "draft",
  "email": "ceo@example.com",
  "status_callback": "http://www.example.com",
  "valid_until": null,
  "date_created": "2019-07-30T22:29:24Z",
  "date_updated": "2019-07-31T01:09:00Z",
  "url": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "links": {
    "trust_products_entity_assignments": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments",
    "trust_products_evaluations": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Evaluations",
    "trust_products_channel_endpoint_assignment": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelEndpointAssignments"
  },
  "errors": null
}
```

### 2.2. Create an EndUser resource of type us\_a2p\_messaging\_profile\_information

This step creates an EndUser resource that contains the additional information required by TCR.

* The `type` parameter must be `us_a2p_messaging_profile_information`.
* The `FriendlyName` is an internal name. Use something descriptive, e.g., "Acme, Inc. Messaging Profile EndUser".
* All of the specific business information is passed in within the `attributes` parameter, as an object.
  * The `attributes` object contains the following parameters and the corresponding values that you collected from your customer earlier:
    * `company_type`
    * `stock_exchange` (if applicable)
    * `stock_ticker` (if applicable)
  * If the `company_type` is anything other than `public`, omit the `stock_ticker` and `stock_exchange` properties.
* The `brand_contact_email` needs to be provided as part of brand registration where a 2FA email will be sent for the brand contact to verify for public, for profit brands.

> \[!NOTE]
>
> When you create a new public, for-profit Brand Registration resource, it kicks off the 2FA that is part of the Authentication+ process.
>
> If you have a Public Profit brand that was registered before October 17, 2024, it's important to ensure it's compliant by January 30, 2025. Brands that don't meet compliance will see their associated campaigns suspended.
> For more information, see [Authentication+ for Public Brand A2P 10DLC Registrations](https://help.twilio.com/articles/29499398652059-Authentication-for-Public-Brand-A2P-10DLC-Registrations).

The example below shows a request for creating this EndUser resource for a public company.

Create an EndUser resource of type us\_a2p\_messaging\_profile\_information for a public company

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createEndUser() {
  const endUser = await client.trusthub.v1.endUsers.create({
    attributes: {
      company_type: "public",
      stock_exchange: "NYSE",
      stock_ticker: "ACME",
    },
    friendlyName: "Acme, Inc. Messaging Profile EndUser",
    type: "us_a2p_messaging_profile_information",
  });

  console.log(endUser.sid);
}

createEndUser();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

end_user = client.trusthub.v1.end_users.create(
    attributes={
        "company_type": "public",
        "stock_exchange": "NYSE",
        "stock_ticker": "ACME",
    },
    friendly_name="Acme, Inc. Messaging Profile EndUser",
    type="us_a2p_messaging_profile_information",
)

print(end_user.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var endUser = await EndUserResource.CreateAsync(
            attributes: new Dictionary<
                string,
                Object>() { { "company_type", "public" }, { "stock_exchange", "NYSE" }, { "stock_ticker", "ACME" } },
            friendlyName: "Acme, Inc. Messaging Profile EndUser",
            type: "us_a2p_messaging_profile_information");

        Console.WriteLine(endUser.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.util.HashMap;
import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.EndUser;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        EndUser endUser =
            EndUser.creator("Acme, Inc. Messaging Profile EndUser", "us_a2p_messaging_profile_information")
                .setAttributes(new HashMap<String, Object>() {
                    {
                        put("company_type", "public");
                        put("stock_exchange", "NYSE");
                        put("stock_ticker", "ACME");
                    }
                })
                .create();

        System.out.println(endUser.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateEndUserParams{}
	params.SetAttributes(map[string]interface{}{
		"company_type":   "public",
		"stock_exchange": "NYSE",
		"stock_ticker":   "ACME",
	})
	params.SetFriendlyName("Acme, Inc. Messaging Profile EndUser")
	params.SetType("us_a2p_messaging_profile_information")

	resp, err := client.TrusthubV1.CreateEndUser(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$end_user = $twilio->trusthub->v1->endUsers->create(
    "Acme, Inc. Messaging Profile EndUser", // FriendlyName
    "us_a2p_messaging_profile_information", // Type
    [
        "attributes" => [
            "company_type" => "public",
            "stock_exchange" => "NYSE",
            "stock_ticker" => "ACME",
        ],
    ]
);

print $end_user->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

end_user = @client
           .trusthub
           .v1
           .end_users
           .create(
             attributes: {
               'company_type' => 'public',
               'stock_exchange' => 'NYSE',
               'stock_ticker' => 'ACME'
             },
             friendly_name: 'Acme, Inc. Messaging Profile EndUser',
             type: 'us_a2p_messaging_profile_information'
           )

puts end_user.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:end-users:create \
   --attributes "{\"company_type\":\"public\",\"stock_exchange\":\"NYSE\",\"stock_ticker\":\"ACME\"}" \
   --friendly-name "Acme, Inc. Messaging Profile EndUser" \
   --type us_a2p_messaging_profile_information
```

```bash
ATTRIBUTES_OBJ=$(cat << EOF
{
  "company_type": "public",
  "stock_exchange": "NYSE",
  "stock_ticker": "ACME"
}
EOF
)
curl -X POST "https://trusthub.twilio.com/v1/EndUsers" \
--data-urlencode "Attributes=$ATTRIBUTES_OBJ" \
--data-urlencode "FriendlyName=Acme, Inc. Messaging Profile EndUser" \
--data-urlencode "Type=us_a2p_messaging_profile_information" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "date_updated": "2021-02-16T20:40:57Z",
  "sid": "ITaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "friendly_name": "Acme, Inc. Messaging Profile EndUser",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "url": "https://trusthub.twilio.com/v1/EndUsers/ITaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2021-02-16T20:40:57Z",
  "attributes": {
    "company_type": "public",
    "stock_exchange": "NYSE",
    "stock_ticker": "ACME"
  },
  "type": "us_a2p_messaging_profile_information"
}
```

### 2.3. Attach the EndUser to the TrustProduct

This step attaches the EndUser resource to the TrustProduct resource.

* The `sid` in the path of this request is the SID of the TrustProduct.
* The `object_sid` is the EndUser resource SID from the previous step.

Attach the EndUser to the TrustProduct

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createTrustProductEntityAssignment() {
  const trustProductsEntityAssignment = await client.trusthub.v1
    .trustProducts("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .trustProductsEntityAssignments.create({
      objectSid: "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });

  console.log(trustProductsEntityAssignment.sid);
}

createTrustProductEntityAssignment();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

trust_products_entity_assignment = client.trusthub.v1.trust_products(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).trust_products_entity_assignments.create(
    object_sid="ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
)

print(trust_products_entity_assignment.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.TrustProducts;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var trustProductsEntityAssignments =
            await TrustProductsEntityAssignmentsResource.CreateAsync(
                objectSid: "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                pathTrustProductSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(trustProductsEntityAssignments.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.trustproducts.TrustProductsEntityAssignments;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        TrustProductsEntityAssignments trustProductsEntityAssignments =
            TrustProductsEntityAssignments
                .creator("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(trustProductsEntityAssignments.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateTrustProductEntityAssignmentParams{}
	params.SetObjectSid("ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.TrusthubV1.CreateTrustProductEntityAssignment("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$trust_products_entity_assignment = $twilio->trusthub->v1
    ->trustProducts("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->trustProductsEntityAssignments->create(
        "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // ObjectSid
    );

print $trust_products_entity_assignment->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

trust_products_entity_assignment = @client
                                   .trusthub
                                   .v1
                                   .trust_products('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                   .trust_products_entity_assignments
                                   .create(
                                     object_sid: 'ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                                   )

puts trust_products_entity_assignment.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:trust-products:entity-assignments:create \
   --trust-product-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --object-sid ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments" \
--data-urlencode "ObjectSid=ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "trust_product_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "object_sid": "ITXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2019-07-31T02:34:41Z",
  "url": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments/BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 2.4. Attach the Secondary Customer Profile to the TrustProduct

This step attaches the CustomerProfile resource to the TrustProduct.

* The `sid` in the path of this request is the SID of the TrustProduct.
* The `object_sid` is the SID of the Secondary Customer Profile from Step 1.1.

Attach Secondary Customer Profile to the TrustProduct

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createTrustProductEntityAssignment() {
  const trustProductsEntityAssignment = await client.trusthub.v1
    .trustProducts("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .trustProductsEntityAssignments.create({
      objectSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });

  console.log(trustProductsEntityAssignment.sid);
}

createTrustProductEntityAssignment();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

trust_products_entity_assignment = client.trusthub.v1.trust_products(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).trust_products_entity_assignments.create(
    object_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
)

print(trust_products_entity_assignment.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.TrustProducts;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var trustProductsEntityAssignments =
            await TrustProductsEntityAssignmentsResource.CreateAsync(
                objectSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                pathTrustProductSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(trustProductsEntityAssignments.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.trustproducts.TrustProductsEntityAssignments;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        TrustProductsEntityAssignments trustProductsEntityAssignments =
            TrustProductsEntityAssignments
                .creator("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(trustProductsEntityAssignments.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateTrustProductEntityAssignmentParams{}
	params.SetObjectSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.TrusthubV1.CreateTrustProductEntityAssignment("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$trust_products_entity_assignment = $twilio->trusthub->v1
    ->trustProducts("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->trustProductsEntityAssignments->create(
        "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // ObjectSid
    );

print $trust_products_entity_assignment->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

trust_products_entity_assignment = @client
                                   .trusthub
                                   .v1
                                   .trust_products('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                                   .trust_products_entity_assignments
                                   .create(
                                     object_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                                   )

puts trust_products_entity_assignment.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:trust-products:entity-assignments:create \
   --trust-product-sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --object-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments" \
--data-urlencode "ObjectSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "trust_product_sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "object_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2019-07-31T02:34:41Z",
  "url": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments/BVaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 2.5. Evaluate the TrustProduct

This API request runs an automated evaluation on the TrustProduct. The response from Twilio indicates whether or not all required information (as per the Policy) is present in the TrustProduct.

If there are no errors, the response contains a `status` of `compliant`. Otherwise, the `status` is `noncompliant` and the `results` property contains information about invalid or missing information.

* The`trust_product_sid` is the SID of the TrustProduct.
* The `policy_sid` must be `RNb0d4771c2c98518d916a3d4cd70a8f8b`.

Evaluate the TrustProduct

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createTrustProductEvaluation() {
  const trustProductsEvaluation = await client.trusthub.v1
    .trustProducts("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .trustProductsEvaluations.create({
      policySid: "RNb0d4771c2c98518d916a3d4cd70a8f8b",
    });

  console.log(trustProductsEvaluation.sid);
}

createTrustProductEvaluation();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

trust_products_evaluation = client.trusthub.v1.trust_products(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
).trust_products_evaluations.create(
    policy_sid="RNb0d4771c2c98518d916a3d4cd70a8f8b"
)

print(trust_products_evaluation.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1.TrustProducts;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var trustProductsEvaluations = await TrustProductsEvaluationsResource.CreateAsync(
            policySid: "RNb0d4771c2c98518d916a3d4cd70a8f8b",
            pathTrustProductSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(trustProductsEvaluations.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.trustproducts.TrustProductsEvaluations;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        TrustProductsEvaluations trustProductsEvaluations =
            TrustProductsEvaluations.creator("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "RNb0d4771c2c98518d916a3d4cd70a8f8b")
                .create();

        System.out.println(trustProductsEvaluations.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.CreateTrustProductEvaluationParams{}
	params.SetPolicySid("RNb0d4771c2c98518d916a3d4cd70a8f8b")

	resp, err := client.TrusthubV1.CreateTrustProductEvaluation("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$trust_products_evaluation = $twilio->trusthub->v1
    ->trustProducts("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    ->trustProductsEvaluations->create(
        "RNb0d4771c2c98518d916a3d4cd70a8f8b" // PolicySid
    );

print $trust_products_evaluation->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

trust_products_evaluation = @client
                            .trusthub
                            .v1
                            .trust_products('BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                            .trust_products_evaluations
                            .create(policy_sid: 'RNb0d4771c2c98518d916a3d4cd70a8f8b')

puts trust_products_evaluation.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:trust-products:evaluations:create \
   --trust-product-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --policy-sid RNb0d4771c2c98518d916a3d4cd70a8f8b
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/TrustProducts/BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Evaluations" \
--data-urlencode "PolicySid=RNb0d4771c2c98518d916a3d4cd70a8f8b" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "ELaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policy_sid": "RNb0d4771c2c98518d916a3d4cd70a8f8b",
  "trust_product_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "status": "noncompliant",
  "date_created": "2020-04-28T18:14:01Z",
  "url": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Evaluations/ELaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "results": [
    {
      "friendly_name": "Business",
      "object_type": "business",
      "passed": false,
      "failure_reason": "A Business End-User is missing. Please add one to the regulatory bundle.",
      "error_code": 22214,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Business Name",
          "object_field": "business_name",
          "failure_reason": "The Business Name is missing. Please enter in a Business Name on the Business information.",
          "error_code": 22215
        },
        {
          "friendly_name": "Business Registration Number",
          "object_field": "business_registration_number",
          "failure_reason": "The Business Registration Number is missing. Please enter in a Business Registration Number on the Business information.",
          "error_code": 22215
        },
        {
          "friendly_name": "First Name",
          "object_field": "first_name",
          "failure_reason": "The First Name is missing. Please enter in a First Name on the Business information.",
          "error_code": 22215
        },
        {
          "friendly_name": "Last Name",
          "object_field": "last_name",
          "failure_reason": "The Last Name is missing. Please enter in a Last Name on the Business information.",
          "error_code": 22215
        }
      ],
      "requirement_friendly_name": "Business",
      "requirement_name": "business_info"
    },
    {
      "friendly_name": "Excerpt from the commercial register (Extrait K-bis) showing name of Authorized Representative",
      "object_type": "commercial_registrar_excerpt",
      "passed": false,
      "failure_reason": "An Excerpt from the commercial register (Extrait K-bis) showing name of Authorized Representative is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Business Name",
          "object_field": "business_name",
          "failure_reason": "The Business Name is missing. Or, it does not match the Business Name you entered within Business information. Please enter in the Business Name shown on the Excerpt from the commercial register (Extrait K-bis) showing name of Authorized Representative or make sure both Business Name fields use the same exact inputs.",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Business Name",
      "requirement_name": "business_name_info"
    },
    {
      "friendly_name": "Excerpt from the commercial register showing French address",
      "object_type": "commercial_registrar_excerpt",
      "passed": false,
      "failure_reason": "An Excerpt from the commercial register showing French address is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Address sid(s)",
          "object_field": "address_sids",
          "failure_reason": "The Address is missing. Please enter in the address shown on the Excerpt from the commercial register showing French address.",
          "error_code": 22219
        }
      ],
      "requirement_friendly_name": "Business Address (Proof of Address)",
      "requirement_name": "business_address_proof_info"
    },
    {
      "friendly_name": "Excerpt from the commercial register (Extrait K-bis)",
      "object_type": "commercial_registrar_excerpt",
      "passed": false,
      "failure_reason": "An Excerpt from the commercial register (Extrait K-bis) is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "Document Number",
          "object_field": "document_number",
          "failure_reason": "The Document Number is missing. Please enter in the Document Number shown on the Excerpt from the commercial register (Extrait K-bis).",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Business Registration Number",
      "requirement_name": "business_reg_no_info"
    },
    {
      "friendly_name": "Government-issued ID",
      "object_type": "government_issued_document",
      "passed": false,
      "failure_reason": "A Government-issued ID is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "First Name",
          "object_field": "first_name",
          "failure_reason": "The First Name is missing. Or, it does not match the First Name you entered within Business information. Please enter in the First Name shown on the Government-issued ID or make sure both First Name fields use the same exact inputs.",
          "error_code": 22217
        },
        {
          "friendly_name": "Last Name",
          "object_field": "last_name",
          "failure_reason": "The Last Name is missing. Or, it does not match the Last Name you entered within Business information. Please enter in the Last Name shown on the Government-issued ID or make sure both Last Name fields use the same exact inputs.",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Name of Authorized Representative",
      "requirement_name": "name_of_auth_rep_info"
    },
    {
      "friendly_name": "Executed Copy of Power of Attorney",
      "object_type": "power_of_attorney",
      "passed": false,
      "failure_reason": "An Executed Copy of Power of Attorney is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [],
      "requirement_friendly_name": "Power of Attorney",
      "requirement_name": "power_of_attorney_info"
    },
    {
      "friendly_name": "Government-issued ID",
      "object_type": "government_issued_document",
      "passed": false,
      "failure_reason": "A Government-issued ID is missing. Please add one to the regulatory bundle.",
      "error_code": 22216,
      "valid": [],
      "invalid": [
        {
          "friendly_name": "First Name",
          "object_field": "first_name",
          "failure_reason": "The First Name is missing on the Governnment-Issued ID.",
          "error_code": 22217
        },
        {
          "friendly_name": "Last Name",
          "object_field": "last_name",
          "failure_reason": "The Last Name is missing on the Government-issued ID",
          "error_code": 22217
        }
      ],
      "requirement_friendly_name": "Name of Person granted the Power of Attorney",
      "requirement_name": "name_in_power_of_attorney_info"
    }
  ]
}
```

Address any errors before continuing to the next step.

### 2.6. Submit the TrustProduct for review

This API request submits the TrustProduct for review.

* The `sid` is the SID of the TrustProduct.
* The `status` must be `pending_review`.

Submit the TrustProduct for review

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function updateTrustProduct() {
  const trustProduct = await client.trusthub.v1
    .trustProducts("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .update({ status: "pending-review" });

  console.log(trustProduct.sid);
}

updateTrustProduct();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

trust_product = client.trusthub.v1.trust_products(
    "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).update(status="pending-review")

print(trust_product.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Trusthub.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var trustProducts = await TrustProductsResource.UpdateAsync(
            status: TrustProductsResource.StatusEnum.PendingReview,
            pathSid: "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(trustProducts.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.trusthub.v1.TrustProducts;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        TrustProducts trustProducts = TrustProducts.updater("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                                          .setStatus(TrustProducts.Status.PENDING_REVIEW)
                                          .update();

        System.out.println(trustProducts.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	trusthub "github.com/twilio/twilio-go/rest/trusthub/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &trusthub.UpdateTrustProductParams{}
	params.SetStatus("pending-review")

	resp, err := client.TrusthubV1.UpdateTrustProduct("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$trust_product = $twilio->trusthub->v1
    ->trustProducts("BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->update(["status" => "pending-review"]);

print $trust_product->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

trust_product = @client
                .trusthub
                .v1
                .trust_products('BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                .update(status: 'pending-review')

puts trust_product.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:trusthub:v1:trust-products:update \
   --sid BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --status pending-review
```

```bash
curl -X POST "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
--data-urlencode "Status=pending-review" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "policy_sid": "RNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "friendly_name": "friendly_name",
  "status": "pending-review",
  "email": "notification@email.com",
  "status_callback": "http://www.example.com",
  "valid_until": null,
  "date_created": "2019-07-30T22:29:24Z",
  "date_updated": "2019-07-31T01:09:00Z",
  "url": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "links": {
    "trust_products_entity_assignments": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/EntityAssignments",
    "trust_products_evaluations": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Evaluations",
    "trust_products_channel_endpoint_assignment": "https://trusthub.twilio.com/v1/TrustProducts/BUaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelEndpointAssignments"
  },
  "errors": null
}
```

Continue to the next step. You don't need to wait for this TrustProduct's `status` to be `approved`.

## 3. Create a BrandRegistration

> \[!WARNING]
>
> Please rate limit all API requests for Brand and Campaign registration to one request per second.

This API request creates a BrandRegistration resource, which represents your customer's Brand. Creating the BrandRegistration resource submits all of the Brand-related information for vetting by TCR.

> \[!WARNING]
>
> This API request incurs fees on your Twilio Account. Learn more about A2P 10DLC registration fees in the [What pricing and fees are associated with the A2P 10DLC service? Help Center article](https://help.twilio.com/articles/1260803965530).

* The `customer_profile_bundle_sid` is the SID of your customer's Secondary Customer Profile.
* The `a2p_profile_bundle_sid` is the SID of the TrustProduct created in Step 2.1.
* `skip_automatic_sec_vet` is an optional Boolean. You should omit this parameter unless you know the Brand should skip secondary vetting. Read the [A2P 10DLC - Gather Business Information page](/docs/messaging/compliance/a2p-10dlc/collect-business-info#skip_automatic_sec_vet) for more details.

Create a BrandRegistration resource

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createBrandRegistrations() {
  const brandRegistration = await client.messaging.v1.brandRegistrations.create(
    {
      a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    }
  );

  console.log(brandRegistration.sid);
}

createBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registration = client.messaging.v1.brand_registrations.create(
    customer_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    a2p_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
)

print(brand_registration.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistration = await BrandRegistrationResource.CreateAsync(
            customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(brandRegistration.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        BrandRegistration brandRegistration =
            BrandRegistration.creator("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .create();

        System.out.println(brandRegistration.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateBrandRegistrationsParams{}
	params.SetCustomerProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetA2PProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.MessagingV1.CreateBrandRegistrations(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brand_registration = $twilio->messaging->v1->brandRegistrations->create(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // CustomerProfileBundleSid
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // A2PProfileBundleSid
);

print $brand_registration->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registration = @client
                     .messaging
                     .v1
                     .brand_registrations
                     .create(
                       customer_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                       a2p_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                     )

puts brand_registration.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:create \
   --customer-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --a2p-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://messaging.twilio.com/v1/a2p/BrandRegistrations" \
--data-urlencode "CustomerProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "A2PProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BN0044409f7e067e279523808d267e2d85",
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "customer_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "a2p_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2021-01-28T10:45:51Z",
  "date_updated": "2021-01-28T10:45:51Z",
  "brand_type": "STANDARD",
  "status": "PENDING",
  "tcr_id": "BXXXXXX",
  "failure_reason": "Registration error",
  "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85",
  "brand_score": 42,
  "brand_feedback": [
    "TAX_ID",
    "NONPROFIT"
  ],
  "identity_status": "VERIFIED",
  "russell_3000": true,
  "government_entity": false,
  "tax_exempt_status": "501c3",
  "skip_automatic_sec_vet": false,
  "errors": [],
  "mock": false,
  "links": {
    "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/Vettings",
    "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/SmsOtp"
  }
}
```

The example below shows how to skip secondary vetting for the Brand. (Only for Low-Volume Standard Brands and 527 Political organizations)

Create a BrandRegistration resource - Skip secondary vetting

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createBrandRegistrations() {
  const brandRegistration = await client.messaging.v1.brandRegistrations.create(
    {
      a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      skipAutomaticSecVet: true,
    }
  );

  console.log(brandRegistration.sid);
}

createBrandRegistrations();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

brand_registration = client.messaging.v1.brand_registrations.create(
    skip_automatic_sec_vet=True,
    customer_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    a2p_profile_bundle_sid="BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
)

print(brand_registration.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var brandRegistration = await BrandRegistrationResource.CreateAsync(
            skipAutomaticSecVet: true,
            customerProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            a2PProfileBundleSid: "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(brandRegistration.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.BrandRegistration;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        BrandRegistration brandRegistration =
            BrandRegistration.creator("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                .setSkipAutomaticSecVet(true)
                .create();

        System.out.println(brandRegistration.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateBrandRegistrationsParams{}
	params.SetSkipAutomaticSecVet(true)
	params.SetCustomerProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetA2PProfileBundleSid("BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.MessagingV1.CreateBrandRegistrations(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$brand_registration = $twilio->messaging->v1->brandRegistrations->create(
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // CustomerProfileBundleSid
    "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // A2PProfileBundleSid
    ["skipAutomaticSecVet" => true]
);

print $brand_registration->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

brand_registration = @client
                     .messaging
                     .v1
                     .brand_registrations
                     .create(
                       skip_automatic_sec_vet: true,
                       customer_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                       a2p_profile_bundle_sid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                     )

puts brand_registration.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:a2p:brand-registrations:create \
   --skip-automatic-sec-vet \
   --customer-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --a2p-profile-bundle-sid BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X POST "https://messaging.twilio.com/v1/a2p/BrandRegistrations" \
--data-urlencode "SkipAutomaticSecVet=true" \
--data-urlencode "CustomerProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "A2PProfileBundleSid=BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "BN0044409f7e067e279523808d267e2d85",
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "customer_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "a2p_profile_bundle_sid": "BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "date_created": "2021-01-28T10:45:51Z",
  "date_updated": "2021-01-28T10:45:51Z",
  "brand_type": "STANDARD",
  "status": "PENDING",
  "tcr_id": "BXXXXXX",
  "failure_reason": "Registration error",
  "url": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85",
  "brand_score": 42,
  "brand_feedback": [
    "TAX_ID",
    "NONPROFIT"
  ],
  "identity_status": "VERIFIED",
  "russell_3000": true,
  "government_entity": false,
  "tax_exempt_status": "501c3",
  "skip_automatic_sec_vet": true,
  "errors": [],
  "mock": false,
  "links": {
    "brand_vettings": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/Vettings",
    "brand_registration_otps": "https://messaging.twilio.com/v1/a2p/BrandRegistrations/BN0044409f7e067e279523808d267e2d85/SmsOtp"
  }
}
```

Save the `sid` from the response. You need this in a later step.

> \[!NOTE]
>
> Sometimes, Brand vetting by TCR can take several days.
>
> If the [BrandRegistration resources](/docs/messaging/api/brand-registration-resource#fetch-a-specific-brandregistration-resource)'s `status` is `IN_REVIEW` for more than two days, [contact Support](https://help.twilio.com/).

## 4. Create a Messaging Service

Your customer needs a [Messaging Service](/docs/messaging/services) through which it handles its A2P 10DLC messaging.

This section covers the creation of a new Messaging Service. You should create a new Messaging Service for A2P 10DLC rather than reuse an existing one.

Create a new Messaging Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createService() {
  const service = await client.messaging.v1.services.create({
    fallbackUrl: "https://www.example.com/fallback",
    friendlyName: "Acme, Inc.'s A2P 10DLC Messaging Service",
    inboundRequestUrl: "https://www.example.com/inbound-messages-webhook",
  });

  console.log(service.sid);
}

createService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

service = client.messaging.v1.services.create(
    friendly_name="Acme, Inc.'s A2P 10DLC Messaging Service",
    inbound_request_url="https://www.example.com/inbound-messages-webhook",
    fallback_url="https://www.example.com/fallback",
)

print(service.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var service = await ServiceResource.CreateAsync(
            friendlyName: "Acme, Inc.'s A2P 10DLC Messaging Service",
            inboundRequestUrl: new Uri("https://www.example.com/inbound-messages-webhook"),
            fallbackUrl: new Uri("https://www.example.com/fallback"));

        Console.WriteLine(service.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.net.URI;
import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Service service = Service.creator("Acme, Inc.'s A2P 10DLC Messaging Service")
                              .setInboundRequestUrl(URI.create("https://www.example.com/inbound-messages-webhook"))
                              .setFallbackUrl(URI.create("https://www.example.com/fallback"))
                              .create();

        System.out.println(service.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateServiceParams{}
	params.SetFriendlyName("Acme, Inc.'s A2P 10DLC Messaging Service")
	params.SetInboundRequestUrl("https://www.example.com/inbound-messages-webhook")
	params.SetFallbackUrl("https://www.example.com/fallback")

	resp, err := client.MessagingV1.CreateService(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$service = $twilio->messaging->v1->services->create(
    "Acme, Inc.'s A2P 10DLC Messaging Service", // FriendlyName
    [
        "inboundRequestUrl" =>
            "https://www.example.com/inbound-messages-webhook",
        "fallbackUrl" => "https://www.example.com/fallback",
    ]
);

print $service->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

service = @client
          .messaging
          .v1
          .services
          .create(
            friendly_name: 'Acme, Inc.\'s A2P 10DLC Messaging Service',
            inbound_request_url: 'https://www.example.com/inbound-messages-webhook',
            fallback_url: 'https://www.example.com/fallback'
          )

puts service.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:create \
   --friendly-name "Acme, Inc.'s A2P 10DLC Messaging Service" \
   --inbound-request-url https://www.example.com/inbound-messages-webhook \
   --fallback-url https://www.example.com/fallback
```

```bash
curl -X POST "https://messaging.twilio.com/v1/Services" \
--data-urlencode "FriendlyName=Acme, Inc.'s A2P 10DLC Messaging Service" \
--data-urlencode "InboundRequestUrl=https://www.example.com/inbound-messages-webhook" \
--data-urlencode "FallbackUrl=https://www.example.com/fallback" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2015-07-30T20:12:31Z",
  "date_updated": "2015-07-30T20:12:33Z",
  "friendly_name": "Acme, Inc.'s A2P 10DLC Messaging Service",
  "inbound_request_url": "https://www.example.com/inbound-messages-webhook",
  "inbound_method": "POST",
  "fallback_url": "https://www.example.com/fallback",
  "fallback_method": "GET",
  "status_callback": "https://www.example.com",
  "sticky_sender": true,
  "smart_encoding": false,
  "mms_converter": true,
  "fallback_to_long_code": true,
  "scan_message_content": "inherit",
  "area_code_geomatch": true,
  "validity_period": 600,
  "synchronous_validation": true,
  "usecase": "marketing",
  "us_app_to_person_registered": false,
  "use_inbound_webhook_on_number": true,
  "links": {
    "phone_numbers": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/PhoneNumbers",
    "short_codes": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ShortCodes",
    "alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AlphaSenders",
    "messages": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages",
    "us_app_to_person": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p",
    "us_app_to_person_usecases": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/Usecases",
    "channel_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelSenders",
    "destination_alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/DestinationAlphaSenders"
  },
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

Save the SID returned by this request; you need it in a later step. You can also find Messaging Service SIDs in the Console or by using the [Read multiple Service resources API request](/docs/messaging/api/service-resource#read-multiple-service-resources).

This request creates an unconfigured Messaging Service. Read the [Messaging Service docs](/docs/messaging/services) to learn more about how to configure a Messaging Service.

> \[!CAUTION]
>
> Do not continue to the next step until the BrandRegistration's `status` is `APPROVED`.

## 5. Create an A2P Campaign

This section covers the creation of a UsAppToPerson resource, which contains the information about the business' messaging Campaign and Use Case.

> \[!CAUTION]
>
> Do not complete this section until the BrandRegistration's `status` is `APPROVED`.

### 5.1 Fetch possible A2P Campaign Use Cases

Once a BrandRegistration's `status` is approved, you can find out which Use Cases are available for your customer. The API request below returns all of the possible A2P Use Cases that your customer's Brand can use for an A2P Campaign.

* The `messaging_service_sid` is the SID of the Messaging Service from Step 4 above.
* The `brand_registration_sid` is the SID of the BrandRegistration resource you created in Step 3.

Fetch possible A2P Campaign Use cases

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function fetchUsAppToPersonUsecase() {
  const usAppToPersonUsecase = await client.messaging.v1
    .services("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .usAppToPersonUsecases.fetch({
      brandRegistrationSid: "BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });

  console.log(usAppToPersonUsecase.usAppToPersonUsecases);
}

fetchUsAppToPersonUsecase();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

us_app_to_person_usecase = client.messaging.v1.services(
    "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
).us_app_to_person_usecases.fetch(
    brand_registration_sid="BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
)

print(us_app_to_person_usecase.us_app_to_person_usecases)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1.Service;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var usAppToPersonUsecase = await UsAppToPersonUsecaseResource.FetchAsync(
            pathMessagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            brandRegistrationSid: "BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

        Console.WriteLine(usAppToPersonUsecase.UsAppToPersonUsecases);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.service.UsAppToPersonUsecase;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        UsAppToPersonUsecase usAppToPersonUsecase = UsAppToPersonUsecase.fetcher("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                                                        .setBrandRegistrationSid("BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
                                                        .fetch();

        System.out.println(usAppToPersonUsecase.getUsAppToPersonUsecases());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.FetchUsAppToPersonUsecaseParams{}
	params.SetBrandRegistrationSid("BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")

	resp, err := client.MessagingV1.FetchUsAppToPersonUsecase("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.UsAppToPersonUsecases != nil {
			for _, item := range *resp.UsAppToPersonUsecases {
				fmt.Println(item)
			}
		} else {
			fmt.Println(resp.UsAppToPersonUsecases)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$us_app_to_person_usecase = $twilio->messaging->v1
    ->services("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    ->usAppToPersonUsecases->fetch([
        "brandRegistrationSid" => "BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    ]);

print $us_app_to_person_usecase->usAppToPersonUsecases;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

us_app_to_person_usecase = @client
                           .messaging
                           .v1
                           .services('MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
                           .us_app_to_person_usecases
                           .fetch(
                             brand_registration_sid: 'BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                           )

puts us_app_to_person_usecase.us_app_to_person_usecases
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:compliance:usa2p:usecases:list \
   --messaging-service-sid MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --brand-registration-sid BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

```bash
curl -X GET "https://messaging.twilio.com/v1/Services/MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Compliance/Usa2p/Usecases?BrandRegistrationSid=BNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "us_app_to_person_usecases": [
    {
      "code": "2FA",
      "name": "Two-Factor authentication (2FA)",
      "description": "Two-Factor authentication, one-time use password, password reset",
      "post_approval_required": false
    },
    {
      "code": "ACCOUNT_NOTIFICATION",
      "name": "Account Notification",
      "description": "All reminders, alerts, and notifications. (Examples include: flight delayed, hotel booked, appointment reminders.)",
      "post_approval_required": false
    },
    {
      "code": "AGENTS_FRANCHISES",
      "name": "Agents and Franchises",
      "description": "For brands that have multiple agents, franchises or offices in the same brand vertical, but require individual localised numbers per agent/location/office.",
      "post_approval_required": true
    },
    {
      "code": "CHARITY",
      "name": "Charity",
      "description": "Includes:  5013C Charity\nDoes not include: Religious organizations",
      "post_approval_required": false
    },
    {
      "code": "PROXY",
      "name": "Proxy",
      "description": "Peer-to-peer app-based group messaging with proxy/pooled numbers (For example: GroupMe)\nSupporting personalized services and non-exposure of personal numbers for enterprise or A2P communications. (Examples include: Uber and AirBnb.)",
      "post_approval_required": true
    },
    {
      "code": "CUSTOMER_CARE",
      "name": "Customer Care",
      "description": "All customer care messaging, including account management and support",
      "post_approval_required": false
    },
    {
      "code": "DELIVERY_NOTIFICATION",
      "name": "Delivery Notification",
      "description": "Information about the status of the delivery of a product or service",
      "post_approval_required": false
    },
    {
      "code": "EMERGENCY",
      "name": "Emergency",
      "description": "Notification services designed to support public safety / health during natural disasters, armed conflicts, pandemics and other national or regional emergencies",
      "post_approval_required": true
    },
    {
      "code": "FRAUD_ALERT",
      "name": "Fraud Alert Messaging",
      "description": "Fraud alert notification",
      "post_approval_required": false
    },
    {
      "code": "HIGHER_EDUCATION",
      "name": "Higher Education",
      "description": "For campaigns created on behalf of Colleges or Universities and will also include School Districts etc that fall outside of any \"free to the consumer\" messaging model",
      "post_approval_required": false
    },
    {
      "code": "K12_EDUCATION",
      "name": "K-12 Education",
      "description": "Campaigns created for messaging platforms that support schools from grades K-12 and distance learning centers. This is not for Post-Secondary schools.",
      "post_approval_required": true
    },
    {
      "code": "LOW_VOLUME",
      "name": "Low Volume Mixed",
      "description": "Low throughput, any combination of use-cases. Examples include:  test, demo accounts",
      "post_approval_required": false
    },
    {
      "code": "MARKETING",
      "name": "Marketing",
      "description": "Any communication with marketing and/or promotional content",
      "post_approval_required": false
    },
    {
      "code": "MIXED",
      "name": "Mixed",
      "description": "Mixed messaging reserved for specific consumer service industry",
      "post_approval_required": false
    },
    {
      "code": "POLITICAL",
      "name": "Political",
      "description": "Part of organized effort to influence decision making of specific group. All campaigns to be verified",
      "post_approval_required": false
    },
    {
      "code": "POLLING_VOTING",
      "name": "Polling and voting",
      "description": "Polling and voting",
      "post_approval_required": false
    },
    {
      "code": "PUBLIC_SERVICE_ANNOUNCEMENT",
      "name": "Public Service Announcement",
      "description": "An informational message that is meant to raise the audience awareness about an important issue",
      "post_approval_required": false
    },
    {
      "code": "SECURITY_ALERT",
      "name": "Security Alert",
      "description": "A notification that the security of a system, either software or hardware, has been compromised in some way and there is an action you need to take",
      "post_approval_required": false
    },
    {
      "code": "SOCIAL",
      "name": "Social",
      "description": "Communication within or between closed communities (For example: influencers alerts)",
      "post_approval_required": true
    },
    {
      "code": "SWEEPSTAKE",
      "name": "Sweepstake",
      "description": "Sweepstake",
      "post_approval_required": true
    }
  ]
}
```

Choose the Use Case that best aligns with your customer's business needs. This is used in the next step.

### 5.2 Create A2P Campaign

This step creates the UsAppToPerson resource. When you create this resource, you provide details about your customer's Campaign, such as how message recipients opt in and out, ask for help, and what the messages typically contain.

> \[!WARNING]
>
> Do not complete this step until the BrandRegistration's `status` is `APPROVED`.

The example below shows a sample request for businesses that are using Twilio's [default opt-out behavior](https://help.twilio.com/articles/223134027-Twilio-support-for-opt-out-keywords-SMS-STOP-filtering) or [Advanced Opt-out feature](/docs/messaging/tutorials/advanced-opt-out).

Businesses managing their own opt-out, opt-in, and help keywords need to provide additional information when registering a Campaign. Check out the [UsAppToPerson resource doc](/docs/messaging/api/usapptoperson-resource#create-a-usapptoperson-resource) for an example.

For more details on the format and contents of each parameter, visit the [A2P 10DLC - Gather Business Information page](/docs/messaging/compliance/a2p-10dlc/collect-business-info#campaign-details).

Create an A2P Campaign

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createUsAppToPerson() {
  const usAppToPerson = await client.messaging.v1
    .services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .usAppToPerson.create({
      brandRegistrationSid: "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      description: "Send marketing messages about sales and offers",
      hasEmbeddedLinks: true,
      hasEmbeddedPhone: true,
      messageFlow:
        "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
      messageSamples: ["Message Sample 1", "Message Sample 2"],
      usAppToPersonUsecase: "MARKETING",
    });

  console.log(usAppToPerson.sid);
}

createUsAppToPerson();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

us_app_to_person = client.messaging.v1.services(
    "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).us_app_to_person.create(
    description="Send marketing messages about sales and offers",
    us_app_to_person_usecase="MARKETING",
    has_embedded_links=True,
    has_embedded_phone=True,
    message_samples=["Message Sample 1", "Message Sample 2"],
    message_flow="End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
    brand_registration_sid="BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
)

print(us_app_to_person.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1.Service;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var usAppToPerson = await UsAppToPersonResource.CreateAsync(
            description: "Send marketing messages about sales and offers",
            usAppToPersonUsecase: "MARKETING",
            hasEmbeddedLinks: true,
            hasEmbeddedPhone: true,
            messageSamples: new List<string> { "Message Sample 1", "Message Sample 2" },
            messageFlow: "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
            brandRegistrationSid: "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            pathMessagingServiceSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(usAppToPerson.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.util.Arrays;
import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.service.UsAppToPerson;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        UsAppToPerson usAppToPerson =
            UsAppToPerson
                .creator("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "Send marketing messages about sales and offers",
                    "End users opt in by visiting www.example.com, creating a new user account, consenting to receive "
                    + "marketing messages via text, and providing a valid mobile phone number.",
                    Arrays.asList("Message Sample 1", "Message Sample 2"),
                    "MARKETING",
                    true,
                    true)
                .create();

        System.out.println(usAppToPerson.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateUsAppToPersonParams{}
	params.SetDescription("Send marketing messages about sales and offers")
	params.SetUsAppToPersonUsecase("MARKETING")
	params.SetHasEmbeddedLinks(true)
	params.SetHasEmbeddedPhone(true)
	params.SetMessageSamples([]string{
		"Message Sample 1",
		"Message Sample 2",
	})
	params.SetMessageFlow("End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.")
	params.SetBrandRegistrationSid("BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	resp, err := client.MessagingV1.CreateUsAppToPerson("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$us_app_to_person = $twilio->messaging->v1
    ->services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->usAppToPerson->create(
        "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // BrandRegistrationSid
        "Send marketing messages about sales and offers", // Description
        "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.", // MessageFlow
        ["Message Sample 1", "Message Sample 2"], // MessageSamples
        "MARKETING", // UsAppToPersonUsecase
        true, // HasEmbeddedLinks
        true // HasEmbeddedPhone
    );

print $us_app_to_person->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

us_app_to_person = @client
                   .messaging
                   .v1
                   .services('MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                   .us_app_to_person
                   .create(
                     description: 'Send marketing messages about sales and offers',
                     us_app_to_person_usecase: 'MARKETING',
                     has_embedded_links: true,
                     has_embedded_phone: true,
                     message_samples: [
                       'Message Sample 1',
                       'Message Sample 2'
                     ],
                     message_flow: 'End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.',
                     brand_registration_sid: 'BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                   )

puts us_app_to_person.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:compliance:usa2p:create \
   --messaging-service-sid MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --description "Send marketing messages about sales and offers" \
   --us-app-to-person-usecase MARKETING \
   --has-embedded-links \
   --has-embedded-phone \
   --message-samples "Message Sample 1" "Message Sample 2" \
   --message-flow "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number." \
   --brand-registration-sid BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X POST "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p" \
--data-urlencode "Description=Send marketing messages about sales and offers" \
--data-urlencode "UsAppToPersonUsecase=MARKETING" \
--data-urlencode "HasEmbeddedLinks=true" \
--data-urlencode "HasEmbeddedPhone=true" \
--data-urlencode "MessageSamples=Message Sample 1" \
--data-urlencode "MessageSamples=Message Sample 2" \
--data-urlencode "MessageFlow=End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number." \
--data-urlencode "BrandRegistrationSid=BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "QE2c6890da8086d771620e9b13fadeba0b",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "brand_registration_sid": "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "messaging_service_sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "description": "Send marketing messages about sales and offers",
  "message_samples": [
    "Message Sample 1",
    "Message Sample 2"
  ],
  "us_app_to_person_usecase": "MARKETING",
  "has_embedded_links": true,
  "has_embedded_phone": true,
  "subscriber_opt_in": false,
  "age_gated": false,
  "direct_lending": false,
  "campaign_status": "PENDING",
  "campaign_id": "CFOOBAR",
  "is_externally_registered": false,
  "rate_limits": {
    "att": {
      "mps": 600,
      "msg_class": "A"
    },
    "tmobile": {
      "brand_tier": "TOP"
    }
  },
  "message_flow": "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
  "opt_in_message": "Acme Corporation: You are now opted-in. For help, reply HELP. To opt-out, reply STOP",
  "opt_out_message": "You have successfully been unsubscribed from Acme Corporation. You will not receive any more messages from this number.",
  "help_message": "Acme Corporation: Please visit www.example.com to get support. To opt-out, reply STOP.",
  "opt_in_keywords": [
    "START"
  ],
  "opt_out_keywords": [
    "STOP"
  ],
  "help_keywords": [
    "HELP"
  ],
  "date_created": "2021-02-18T14:48:52Z",
  "date_updated": "2021-02-18T14:48:52Z",
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/QE2c6890da8086d771620e9b13fadeba0b",
  "mock": false,
  "errors": []
}
```

### 5.3 Including privacy policy and terms & conditions URLs

You can optionally include URLs to your customer's privacy policy and terms & conditions when creating an A2P Campaign. We recommend using these field for all campaign registrations to ensure a quicker campaign vetting.
To use these fields, include the `X-Twilio-Api-Version` header set to `v1.2` in your API request.

When you include the `X-Twilio-Api-Version: v1.2` header:

* The response includes `privacy_policy_url` and `terms_and_conditions_url` fields
* The API accepts two additional optional parameters with or without the header: `PrivacyPolicyUrl` and `TermsAndConditionsUrl`
  The example below shows how to create a Campaign using the `X-Twilio-Api-Version: v1.2` header and the additional fields.

Create an A2P Campaign with Privacy Policy and Terms URLs

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createUsAppToPerson() {
  const usAppToPerson = await client.messaging.v1
    .services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .usAppToPerson.create({
      brandRegistrationSid: "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      description: "Send marketing messages about sales and offers",
      hasEmbeddedLinks: true,
      hasEmbeddedPhone: true,
      messageFlow:
        "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
      messageSamples: ["Message Sample 1", "Message Sample 2"],
      usAppToPersonUsecase: "MARKETING",
    });

  console.log(usAppToPerson.sid);
}

createUsAppToPerson();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

us_app_to_person = client.messaging.v1.services(
    "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
).us_app_to_person.create(
    description="Send marketing messages about sales and offers",
    us_app_to_person_usecase="MARKETING",
    has_embedded_links=True,
    has_embedded_phone=True,
    message_samples=["Message Sample 1", "Message Sample 2"],
    message_flow="End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
    brand_registration_sid="BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
)

print(us_app_to_person.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1.Service;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var usAppToPerson = await UsAppToPersonResource.CreateAsync(
            description: "Send marketing messages about sales and offers",
            usAppToPersonUsecase: "MARKETING",
            hasEmbeddedLinks: true,
            hasEmbeddedPhone: true,
            messageSamples: new List<string> { "Message Sample 1", "Message Sample 2" },
            messageFlow: "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
            brandRegistrationSid: "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            pathMessagingServiceSid: "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(usAppToPerson.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.util.Arrays;
import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.service.UsAppToPerson;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        UsAppToPerson usAppToPerson =
            UsAppToPerson
                .creator("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "Send marketing messages about sales and offers",
                    "End users opt in by visiting www.example.com, creating a new user account, consenting to receive "
                    + "marketing messages via text, and providing a valid mobile phone number.",
                    Arrays.asList("Message Sample 1", "Message Sample 2"),
                    "MARKETING",
                    true,
                    true)
                .create();

        System.out.println(usAppToPerson.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateUsAppToPersonParams{}
	params.SetDescription("Send marketing messages about sales and offers")
	params.SetUsAppToPersonUsecase("MARKETING")
	params.SetHasEmbeddedLinks(true)
	params.SetHasEmbeddedPhone(true)
	params.SetMessageSamples([]string{
		"Message Sample 1",
		"Message Sample 2",
	})
	params.SetMessageFlow("End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.")
	params.SetBrandRegistrationSid("BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	resp, err := client.MessagingV1.CreateUsAppToPerson("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$us_app_to_person = $twilio->messaging->v1
    ->services("MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->usAppToPerson->create(
        "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // BrandRegistrationSid
        "Send marketing messages about sales and offers", // Description
        "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.", // MessageFlow
        ["Message Sample 1", "Message Sample 2"], // MessageSamples
        "MARKETING", // UsAppToPersonUsecase
        true, // HasEmbeddedLinks
        true // HasEmbeddedPhone
    );

print $us_app_to_person->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

us_app_to_person = @client
                   .messaging
                   .v1
                   .services('MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                   .us_app_to_person
                   .create(
                     description: 'Send marketing messages about sales and offers',
                     us_app_to_person_usecase: 'MARKETING',
                     has_embedded_links: true,
                     has_embedded_phone: true,
                     message_samples: [
                       'Message Sample 1',
                       'Message Sample 2'
                     ],
                     message_flow: 'End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.',
                     brand_registration_sid: 'BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                   )

puts us_app_to_person.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:compliance:usa2p:create \
   --messaging-service-sid MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
   --description "Send marketing messages about sales and offers" \
   --us-app-to-person-usecase MARKETING \
   --has-embedded-links \
   --has-embedded-phone \
   --message-samples "Message Sample 1" "Message Sample 2" \
   --message-flow "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number." \
   --brand-registration-sid BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X POST "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p" \
--data-urlencode "Description=Send marketing messages about sales and offers" \
--data-urlencode "UsAppToPersonUsecase=MARKETING" \
--data-urlencode "HasEmbeddedLinks=true" \
--data-urlencode "HasEmbeddedPhone=true" \
--data-urlencode "MessageSamples=Message Sample 1" \
--data-urlencode "MessageSamples=Message Sample 2" \
--data-urlencode "MessageFlow=End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number." \
--data-urlencode "BrandRegistrationSid=BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "sid": "QE2c6890da8086d771620e9b13fadeba0b",
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "brand_registration_sid": "BNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "messaging_service_sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "description": "Send marketing messages about sales and offers",
  "message_samples": [
    "Message Sample 1",
    "Message Sample 2"
  ],
  "us_app_to_person_usecase": "MARKETING",
  "has_embedded_links": true,
  "has_embedded_phone": true,
  "subscriber_opt_in": false,
  "age_gated": false,
  "direct_lending": false,
  "campaign_status": "PENDING",
  "campaign_id": "CFOOBAR",
  "is_externally_registered": false,
  "rate_limits": {
    "att": {
      "mps": 600,
      "msg_class": "A"
    },
    "tmobile": {
      "brand_tier": "TOP"
    }
  },
  "message_flow": "End users opt in by visiting www.example.com, creating a new user account, consenting to receive marketing messages via text, and providing a valid mobile phone number.",
  "opt_in_message": "Acme Corporation: You are now opted-in. For help, reply HELP. To opt-out, reply STOP",
  "opt_out_message": "You have successfully been unsubscribed from Acme Corporation. You will not receive any more messages from this number.",
  "help_message": "Acme Corporation: Please visit www.example.com to get support. To opt-out, reply STOP.",
  "opt_in_keywords": [
    "START"
  ],
  "opt_out_keywords": [
    "STOP"
  ],
  "help_keywords": [
    "HELP"
  ],
  "date_created": "2021-02-18T14:48:52Z",
  "date_updated": "2021-02-18T14:48:52Z",
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/QE2c6890da8086d771620e9b13fadeba0b",
  "mock": false,
  "errors": []
}
```

> \[!NOTE]
>
> You can create up to five Campaigns per Brand, unless a clear and valid business reason is provided for exceeding this limit.

## 6. Add a phone number to the A2P 10DLC Messaging Service

Before your customer can begin sending A2P 10DLC messages, a 10DLC number must be added to the Messaging Service. Read the [Messaging Service PhoneNumber resource doc](/docs/messaging/api/phonenumber-resource#create-a-phonenumber-resource-add-a-phone-number-to-a-messaging-service) for more information.

## Additional resources

[Fetch a Campaign](/docs/messaging/api/usapptoperson-resource#fetch-a-usapptoperson-resource) - Use this API request to check a Campaign's registration status.

[Subscribe to a Campaign's status using Event Streams](/docs/messaging/compliance/a2p-10dlc/event-streams-setup) - Set up your own endpoint and subscribe to Brand, Campaign, and 10DLC Phone Number status updates from Twilio.

[Delete a UsAppToPerson resource](/docs/messaging/api/usapptoperson-resource#delete-a-usapptoperson-resource) - This API request deletes a Campaign and removes it from a Messaging Service.

[Troubleshooting A2P 10DLC Registrations](/docs/messaging/compliance/a2p-10dlc/troubleshooting-a2p-brands) - Learn how to understand registration failures and how to fix them.

[A2P 10DLC Campaign Approval Best Practices](https://help.twilio.com/hc/en-us/articles/11847054539547-A2P-10DLC-Campaign-Approval-Best-Practices) - Ensure your Campaigns meet all requirements.

[Trust Hub API Docs](/docs/trust-hub) - Read the API documentation for CustomerProfiles, EndUsers, TrustProducts, and SupportingDocuments.

# Troubleshooting A2P 10DLC Registrations

To join the US 10DLC ecosystem, you need to register a **Brand** for your business and an A2P messaging **Campaign** for that Brand. This process can fail at both the Brand and Campaign approval stages. Brand registrations may fail if the business information is incomplete, formatted incorrectly, or doesn't match existing records. Campaigns may fail if the Campaign purpose, use-case, workflow, opt-in, and opt-out methods are incomplete or inadequate, or if Twilio's Campaign Registry policies find the Campaign's content to be in violation.

After registering a Campaign for A2P, the [A2P ecosystem partners](https://www.twilio.com/en-us/blog/next-chapter-a2p-messaging-at-twilio) must register each **phone number** in the linked Messaging Service. This starts after Campaign approval but may not be immediate. Delays or failures can occur.

This document links to specific guides that explore:

* Troubleshooting and fixing errors for Sole Proprietor Brand submissions
* Troubleshooting and fixing errors for Standard and Low-Volume Standard Brand submissions
* Troubleshooting and fixing errors with Campaign submissions (for all types of Brands)
* Troubleshooting issues with registering phone numbers for successful Campaigns

> \[!NOTE]
>
> The three types of Brands (and associated Campaigns) for which a business can register are **Standard**, **Low-Volume Standard**, and **Sole Proprietor.** See [Determine your customer type](/docs/messaging/compliance/a2p-10dlc#determine-your-customer-type) for a comparison of the three brand types, as well as the difference between Direct and ISV customers. In general, the registration and error reasons for Sole Proprietor Brands can differ from those for Standard and Low-Volume Standard Brands.

## Troubleshoot and fix Sole Proprietor Brand registration failures

Review [this guide](/docs/messaging/compliance/a2p-10dlc/troubleshooting-a2p-brands/troubleshooting-sole-proprietor-brand-registration-failures) for help with Sole Proprietor Brand registration failures. This includes errors in registering **Business Profiles**. Sole Proprietor Brands need different troubleshooting due to unique validations and review steps.

## Troubleshoot and fix Standard and Low Volume Standard Brand registration failures

Review [this guide](/docs/messaging/compliance/a2p-10dlc/troubleshooting-a2p-brands/troubleshooting-and-rectifying-a2p-standardlvs-brands) for help with Standard and Low-Volume Standard Brand registration failures. This includes errors when registering the **Business Profiles**.

## Troubleshoot and fix A2P Campaign submission failures

You can now **edit** a FAILED Campaign via the Console, and it is also available via API in [private beta](mailto:10dlc-onboarding@twilio.com). While you can **delete and recreate** failed Campaigns, this process is more cumbersome and should only be undertaken in certain scenarios. See [this guide](/docs/messaging/compliance/a2p-10dlc/troubleshooting-a2p-brands/troubleshooting-and-rectifying-a2p-campaigns-1) for example scenarios and the process for fixing failed Campaign submissions for all Brand types.

## Troubleshoot Campaign phone number registration issues

After you successfully register a Campaign for A2P, the [A2P ecosystem partners](https://www.twilio.com/en-us/blog/next-chapter-a2p-messaging-at-twilio) must also register each **phone number** in the Messaging Service linked to that Campaign. This process starts once they approve the Campaign, but it is not instant and can face delays or failures. See [this guide](/docs/messaging/compliance/a2p-10dlc/troubleshooting-a2p-brands/troubleshooting-a2p-phone-number-registration-issues) to learn how to check the status of all such phone numbers and what to do if one or more fails registration.

# Twilio Messaging Channels

Twilio supports sending and receiving messages through multiple messaging channel. To serve your various messaging needs these currently include:

* SMS
* MMS
* Rich Communication Services (RCS)
* WhatsApp
* Facebook Messenger

## Support in Twilio products

Messaging channels are supported in various Twilio products to enable your diverse use cases from one-directional communication to stateful conversations in both single channel and omni-channel settings.

These products allow you to work with messaging channels using no-code/low-code and fully programmable messaging solution approaches.

The following table indicates which messaging channels are supported by which Twilio products *(GA = Generally Available)*.

| **Twilio Product**                            | **SMS/MMS** | **WhatsApp** | **Facebook Messenger** | **RCS**       |
| --------------------------------------------- | ----------- | ------------ | ---------------------- | ------------- |
| **[Programmable Messaging](/docs/messaging)** | GA          | GA           | Public Beta            | GA            |
| **[Conversations](/docs/conversations)**      | GA          | GA           | Public Beta            | Not supported |
| **[Flex](/docs/flex)**                        | GA          | GA           | Public Beta            | Not supported |
| **[Verify](/docs/verify)**                    | GA          | GA           | Not supported          | GA            |

As you work towards a rich and consistent messaging user experience across these messaging channels, consider using the [Twilio Content Template Builder](/docs/content) as a framework for message template generation and management.

## Understand channel addresses

Working with messages in all these messaging channels requires identifying senders (`from`) and receivers (`to`) by means of channel-specific addresses. The following table explains the channel address conventions Twilio uses for each of the messaging channels.

Adhering to these conventions is critical when you create and handle messages with Twilio products such as the [Programmable Messaging REST API](/docs/messaging/api).

| **Channel**            | **Channel Address**                                                                                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SMS/MMS**            | An SMS/MMS-capable phone number. *Format:* Phone number in [E.164 format](/docs/glossary/what-e164) *Example:* `+15558675310`                                                                                                |
| **RCS**                | An RCS Sender with a branded display name and profile shown to message recipients. *Format:* `rcs:{unique_id}` *Example*: `rcs:brand_name_n9c2bvqq_agent`                                                                    |
| **WhatsApp**           | A WhatsApp-enabled phone number prefixed by the channel name. *Format:* `whatsapp:{phone_number}` where `{phone_number}` is the phone number in [E.164 format](/docs/glossary/what-e164) *Example:* `whatsapp:+15558675310`  |
| **Facebook Messenger** | Your valid Facebook Page Id prefixed by the channel name, or a Messenger User Id prefixed by the channel name. *Format:* `messenger:{messenger_page_id}` or `messenger:{messenger_user_id}` *Example:* `messenger:XYZXYZXYZ` |

## Getting started with the Messaging Channels

### SMS/MMS

To get started using the SMS/MMS messaging channel follow a [Programmable Messaging Quickstart](/docs/messaging/quickstart) in the programming language of your choice.

### RCS

To get started using the RCS messaging channel, follow the [Programmable Messaging RCS Onboarding Guide](/docs/rcs/onboarding).

### WhatsApp

To start using the WhatsApp Business Platform messaging channel, [learn more about the onboarding process](/docs/whatsapp#whatsapp-sender-registration) or [get started now with the WhatsApp sandbox](/docs/whatsapp/sandbox).

### Facebook Messenger

To start using the Facebook Messenger messaging channel with your Twilio account, follow the information in the [Facebook Messenger](/docs/messaging/channels/facebook-messenger) page.

# RCS Business Messaging

[Rich Communication Services (RCS)](/docs/rcs) is a modern messaging protocol that enhances traditional SMS and MMS by enabling branded, interactive messages. It streamlines communication by supporting features like a branded profile, read receipts, and rich content, all within a device's default messaging app. RCS is compatible with Android and iOS 18 devices.

Twilio allows you to integrate RCS messaging directly into your existing communication strategies. You can send RCS messages using the same Twilio products and APIs you're already familiar with. This requires no significant code changes. Twilio's RCS capabilities use the same infrastructure that powers [Programmable Messaging](/docs/messaging), so you can rely on Twilio's scalability, global reach, reliability, compliance, and analytics.

![Android device showing an RCS message with a branded sender and dynamic content.](https://docs-resources.prod.twilio.com/16ed0af0b10fb38745aa7c3f92684e0c0539272b65c055ac40c29563d3358b46.png)

## Features

RCS Business Messaging has multiple features that set it apart from traditional SMS and MMS, enriching interactions between businesses and their customers.

* **Branded communication**: Send messages with your business's brand name and logo.
* **Independent of phone numbers**: In contrast to SMS, MMS, and P2P (person-to-person) RCS, RCS Business Messaging uses a branded sender profile rather than a traditional phone number to send messages.
* **Rich interactions**: Add message features such as suggested replies, call-to-action (CTA) buttons, dynamic carousels, and location sharing.
* **Enhanced media**: Send large media files, such as high-quality photos, videos, and GIFs.
* **Longer messages**: RCS supports longer messages without segmentation.
* **Delivery and read receipts**: Know when your messages are delivered and read by customers.

## Get started

Choose an onboarding guide for step-by-step instructions to start using RCS messaging with Twilio:

* [Programmable Messaging RCS Onboarding Guide](/docs/rcs/onboarding)
* [Verify RCS Onboarding Guide](/docs/verify/rcs)

## Learn more

* [Rich Communication Services (RCS) product hub](https://www.twilio.com/messaging/channels/rcs)
* [What is RCS Messaging?](https://www.twilio.com/blog/what-is-rcs-messaging)
* [What Apple's support for RCS means for business messaging](https://www.twilio.com/blog/what-apples-support-for-rcs-means-for-business-messaging)
* [Verify will start delivering OTPs via RCS to improve performance](https://www.twilio.com/changelog/verify-will-start-delivering-otps-via-rcs-to-improve-performance)

# Get started with branded RCS messaging

Unlike [Short Message Service (SMS)][sms], [Multimedia Messaging Service (MMS)][mms], or [Rich Communication Services (RCS)][rcs] between users, RCS business messaging doesn't send messages through a phone number. An RCS Sender, or RCS agent, sends RCS messages.

Messages sent from different RCS Senders display in separate conversation threads, similar to SMS or MMS messages sent from different phone numbers.

In this tutorial, you'll set up and configure [branded RCS messages][]:

1. [Create an RCS Sender][] and send test messages
2. [Register your RCS Sender][compliance]
3. [Update Messaging Service configuration][]

To learn more about RCS, see [RCS Business Messaging][].

## Limitations

* Only certain [countries](/docs/rcs/regional) support RCS messaging.
* You can't create or onboard RCS Senders programmatically at scale.

## Prerequisites

Complete these tasks before configuring RCS:

1. [Sign up for Twilio][].
2. Upgrade to a [paid Twilio account][].
3. [Set up Messaging Services][] with a phone number for SMS or MMS.
   * [Not all phone numbers can receive RCS messages][].
   * Messaging Services send messages using SMS or MMS when RCS messages fail or carriers don't support them.

## Set up RCS messaging

Follow these steps to set up and configure RCS messaging with Twilio.

To complete the setup process, allow four to six weeks or longer if you plan to launch in multiple regions.

### Create an RCS sender

1. Log in to the [Twilio Console][tw-console].
2. Go to **Explore Products** > **Programmable Communications** > **RCS**.\
   The [**RCS Senders** page][rcs-senders] displays.
3. Click **Create RCS Sender**.
4. Type the name of your sender in the **Sender display name** box.
   > \[!NOTE]
   >
   > When creating multiple RCS Senders for the same brand (for example, "Owl Homes"),
   > use unique display names for each Sender so users can tell them apart in
   > their Messaging app. (for example, "Owl Homes Support" and "Owl Homes Promotion").
   > Carriers typically don't approve RCS Senders with the same display name and logo.
5. Review the terms and conditions. If you accept them, select **I acknowledge and agree to the foregoing terms and conditions**.
6. Click **Continue**. The **Create Sender: Public details** page displays.
7. Provide the following data. Twilio RCS requires values for all of these fields. Carriers in some countries have [Special Considerations][] regarding a Sender's public display.

   | Field                | Description                                                     | Requirements                                                                                                                                                                   | Devices      |
   | -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
   | Display name         | Name shown to users                                             | Unique per RCS Sender                                                                                                                                                          | iOS, Android |
   | Description          | Brief summary of sender including how users interact with it    | Doesn't support HTML, JSON, Unix commands, or escaped characters.                                                                                                              | iOS, Android |
   | Logo image           | Brand logo in conversations                                     | JPEG, JPG, or PNG image, 224 x 224 pixels, max size 50kB, accessible from a public URL                                                                                         | iOS, Android |
   | Banner image         | Banner at top of conversation                                   | JPEG, JPG, or PNG image, 1140 x 448 pixels, max size 200 kB, accessible from a public URL                                                                                      | Android      |
   | Accent color         | Color of certain elements displayed                             | Can match brand colors. Use a [minimum contrast ratio of 4.5 to 1][contrast] compared to white. Type a [HTML color code][hexcolor] or click the color icon and choose a color. | Android      |
   | Contact details      | One or more labeled phone numbers, email addresses, or websites | Requires at least one phone number or email address. Format phone numbers as [E.164][e164].                                                                                    | iOS, Android |
   | Privacy policy URL   | Link to brand privacy policy                                    | May need to be accessible in country's official language.                                                                                                                      | iOS, Android |
   | Terms of service URL | Link to brand terms of service                                  | May need to be accessible in country's official language.                                                                                                                      | iOS, Android |
8. Click **Next**. The **Create Sender: Try it out** page displays along with a banner that states **You have successfully update the sender.**

### Try out the RCS sender

1. Click **Add device to test this sender**.
   * If you don't want to configure your Sender for incoming messages, click **Done**.
2. Type your phone number in [E.164][e164] format in the box.
3. Click **Invite**.
4. The **RBM Tester Management** Sender sends a test RCS message to your phone.
5. To accept the invite, tap **Make me a tester** on your phone.
   Your phone displays this message:

   > You have been confirmed as a tester of the RBM agent: \<Display Name>.
6. The modal changes to **Send test message** and displays the following message:

   > **The owner of \<PHONE\_NUMBER> has accepted the tester invitation for this sender. The invite was sent to their SMS inbox.**

   Select the checkbox next to this message.
7. To send another test RCS message, type a message in the **Your message** box.
8. Click **Send**.
9. Check your phone again. It should receive a message from the **Display name** you provided with the text of the message you wrote.
10. The **Send test message** modal refreshes and provides you a chance to send another message.
    * To send another message, write a message into the box then click **Send**.
    * To stop sending test messages, click **Cancel**. The modal closes.
11. If you don't want to add another test device, click **Done**. The page displays a congratulation page and offer next steps.
    * To submit your compliance page, click **Go to Compliance Registration tab** and skip to [**Register for compliance**][compliance].
    * To view your sender, click **View Sender**.

### Configure incoming message handling

To configure your app to accept inbound messages, complete the following procedure.

1. Click the **Configuration** tab.
2. On this tab, provide the following details:

   | Field                                  | Description                                                                                             | Values                                  |
   | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
   | **Webhook URL for incoming messages**  | App endpoint that receives incoming messages.                                                           | Valid URL following [RFC 1808][rfc1808] |
   | **Webhook method**                     | HTTP method used to reach the incoming webhook URL.                                                     | `POST`, `PUT`                           |
   | **Fallback URL for incoming messages** | App endpoint targeted when the incoming messages URL can't be reached or a runtime exception triggered. | Valid URL following [RFC 1808][rfc1808] |
   | **Webhook method**                     | HTTP method used to reach the fallback webhook URL.                                                     | `POST`, `PUT`                           |
   | **Status callback URL**                | App endpoint that displays the delivery status.                                                         | Valid URL following [RFC 1808][rfc1808] |
   | **Webhook method**                     | HTTP method used to reach the status callback URL.                                                      | `POST`, `PUT`                           |
   | **Assigned Messaging Service**         | Messaging service that your app uses.                                                                   |                                         |
3. To finish creating the RCS Sender, click **Save configuration**.
   * To continue to edit and refine the RCS Sender, click **View Sender**.
   * To explore RCS, send RCS messages to phone numbers added as test devices, click the **Test** tab.
   * Before you may message phone numbers *not* added to your Sender as a test device, carriers must approve the RCS Sender. To submit your RCS Sender for approval, click [**Compliance registration** tab][compliance].

### Register your RCS Sender

If you haven't added the required data on the **Public details** page, the Twilio Console displays the following message and blocks further actions:

> **Your sender cannot be sent for approval**. Complete all required sender profile fields here to continue

Compliance registration requires data about your business. The details depend on where you register your RCS sender.

## Non-US company

* Authorized representative contact details
* Descriptions of your opt-in and opt-out policies
* Opt-in policy images hosted on a publicly accessible URL.
* Description of your use case
* Video that shows the use case in action hosted on a publicly accessible URL

## US company

* Authorized representative contact details
* Descriptions of your opt-in and opt-out policies
* Opt-in policy images hosted on a publicly accessible URL.
* Description of your use case
* Video that shows the use case in action hosted on a publicly accessible URL
* US Business Registration ID
  * US companies provide your Employer Identification Number (EIN).
  * Non-US companies provide your Foreign Tax Identification Number (FTIN).
* Stock exchange and stock symbol for publicly traded companies
* Business address
* Brand contact mobile phone number
* Website traffic details
* Current SMS phone number and traffic details
* Sample messages and campaign details

When you have this data at hand, start the following procedures:

#### Select recipient countries

1. Click **Add countries**. The **Add countries** modal displays.
2. From the **Select destination countries for your RCS Sender** dropdown menu, select the countries in which you want to register your RCS sender.

   #### View the list of available countries

   * Austria
   * Belgium
   * Czech Republic
   * Denmark
   * Finland/Aland Islands
   * France
   * Germany
   * Ireland
   * Italy
   * Mexico
   * Netherlands
   * Norway
   * Poland
   * Portugal
   * Romania
   * Slovakia
   * Sweden
   * United Kingdom
   * United States

   If you choose **United States**, the modal adds information on the additional annual and submission fees involved with registering an RCS sender in the US. Twilio doesn't charge these fees. They come from the companies that verify your brand and submit your compliance registration.

   * To continue, click **I understand and agree to pay the above US RCS onboarding fees.**
3. If you approve of the list, click **Save countries**. The **Add countries** modal closes. A banner displays **You have successfully updated the sender.**
4. The **RCS sender compliance** page displays the list of countries that you chose.
   * The first row lists all non-US countries or **Global requirement** if you didn't select any non-US countries.
     * The Registration name column displays **Google Registration** with the **What will I need?** link to an explanation of required data. If you click that link, the **What will you need to complete Google RCS registration?** panel appears and explains what data you need to provide. To close this panel, click ✖.
     * All of these countries display in the **Country** column.
     * The **Status** column displays **Not Started**.
     * The **Price** column displays the price associated with registration in US dollars (USD).
     * The **Actions** column displays a **Start** button and a trash can button so you can remove selected countries.
   * The second row displays the US in its own row.
     * The Registration name column displays **US Registration** with the **What will I need?** link to an explanation of required data. If you click that link, the **What will I need to complete US RCS registration?** panel appears and explains what data you need to provide. To close this panel, click ✖.

#### Register an RCS Sender with Google

If you didn't choose any country other than the US, you still must complete this section.

1. Click **Start** for the Google registration. The **Basic information** page appears.
2. Type a human-readable label in the **General RCS registration friendly name**. This value can't exceed 64 characters.
3. Click **Next**. The **All countries are required to submit Google RCS registration.** page appears. It includes the same content as the **What will you need to complete Google RCS registration?** panel.
4. Click **Start**. The **Authorized representative** page appears.
5. Type responses about the individual your company wants to register as its representative into the following fields.

   | Field                | Expected value                                                                             |
   | -------------------- | ------------------------------------------------------------------------------------------ |
   | First name           | The given name of your representative                                                      |
   | Last name            | The surname of your representative                                                         |
   | Email                | An RFC 5322 compliant email address of your representative                                 |
   | Business title       | The position your representative holds at your organization.                               |
   | Business website URL | The publicly available URL of your organization that holds some tie to your business name. |
6. Click **Next**. The **Describe your your opt-in and opt-out policies for this sender** page appears.
7. Type responses about how you get consumer consent for your RCS messaging.

   | Field                     | Character limit | Expected value                                                                                                                                                          | Example                                                                                                                                     |
   | ------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
   | Agent access instructions | 1,000           | A description of how reviewers of this registration can test the RCS sender.                                                                                            | *We offer a website where reviewers can invite and add phone numbers.*                                                                      |
   | Opt-in description        | 1,000           | A description of how consumers opt-in to receiving messages.                                                                                                            | *Consumers get offered the option to sign up at checkout.*                                                                                  |
   | Opt-in policy image URL   |                 | A publicly available URL that provides either a screenshot of the opt-in page, a web page where the consumer opts in, or a document that explains how consumers opt-in. | *https://example.com/userprefs*                                                                                                             |
   | Opt-out description       |                 | The message sent to a consumer from this sender when they opt out.                                                                                                      | *You've successfully unsubscribed from Acme, Inc. texts. You will no longer receive messages from this number. Reply START to resubscribe.* |
8. Click **Next**. The **Describe your messaging use case** page appears.
9. Type responses to carrier-required data about both you and your messages.

   | Field                                            | Character limit | Expected value                                                                                                                                                                                      |
   | ------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | What triggers messages to be sent to recipients? | 1,000           | Description of actions that trigger messages to consumers including timing of the first message sent to the consumer, consistent timing of messages, and the type of actions that trigger messages. |
   | Use case description                             | 1,000           | Description of how the RCS sender interacts with consumers, including primary, common interactions and the secondary, possible interactions.                                                        |
   | Use case video URL                               |                 | A publicly available URL to a video that shows your core sender functionality and opt-out capabilities. This is for review purposes only.                                                           |
10. Click **Next**. The **Notification settings** page appears.
11. Type responses about who and how you get updates on your RCS sender registration status.

    | Field               | Necessity | Expected value                                                                                                                      |
    | ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
    | Notification email  | Required  | An RFC 5322 compliant email address. The email address you provided as part of your **Public details**. You can change the address. |
    | Status callback URL | Optional  | A publicly available URL that serves as an endpoint for a webhook.                                                                  |
12. Click **Next**. The **Review and submit** page appears.
13. Check the values you provided.
    * If they appear correct, click **Submit registration**. The **Thanks for completing your Google RCS registration!** page appears. Click **Finish**.
    * If they need correction, click **Back** until the relevant page displays and make your changes.
14. Your next steps depend on needing to get RCS sender approval for US recipients.
    * If you also need to get RCS sender approval with the US, continue to the next section.
    * If you don't need to get RCS sender approval with the US, continue to [Await RCS sender approval][].

#### Register an RCS Sender with the US

If you didn't choose any country other than the US, you still must complete the [previous section][register-google].

1. Click **Start** for the **US registration**.
2. Type a human-readable label in the **US RCS registration friendly name**. This value can't exceed 64 characters.
3. Click **Next**. The **United States carriers require additional details to register your sender.** page appears. It includes the same content as the **What will I need to complete US RCS registration?** panel.
4. Click **Start**. The **Business information** page appears.
5. Type responses about your company into the following fields.

   | Field                                 | Expected value                                                                                                                                                        |
   | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Legal business name                   | US entities: The Legal Company Name as stated on your IRS CP 575 EIN Confirmation Letter.<br />Non-US entities: The name as registered with your local tax authority. |
   | Company type                          | The type of business that matches your business: Government, Nonprofit corporation, Private corporation, Private corporation, or Sole Proprietorship.                 |
   | Business registration issuing country | Leave this as **United States**.                                                                                                                                      |
   | Business registration number          | The US EIN or FTIN under which your business was registered.                                                                                                          |
   | Business industry                     | The industry that most closely matches that of the business.                                                                                                          |
   | Brand contact phone number            | A single phone number written in the [E.164][e164] format.                                                                                                            |

   #### View the list of industries

   * Agriculture
   * Communication
   * Construction
   * Education
   * Energy
   * Entertainment
   * Financial
   * Gambling
   * Government
   * Healthcare
   * Hospitality
   * Human resources
   * Insurance
   * Legal
   * Manufacturing
   * Nonprofit
   * Political
   * Postal
   * Professional
   * Real estate
   * Retail
   * Technology
   * Transportation
6. Click **Next**. The **Business address** page appears.
7. Type your legal address associated with your business registration number into the field.
   * As you start typing, address options start displaying. Choose from the list or continue typing until you find your address.
8. Click **Next**. The **Details about your RCS use case traffic.** page appears.
9. Type responses to the current and expected website traffic related to SMS, shortcode, and RCS messaging. All fields require a value, even if you don't use shortcodes at present. If that's the case, write `NONE`.

   | Field                                                               | Expected value                                                                                                        |
   | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
   | Monthly organic website traffic                                     | The monthly visits to the website associated with your use case expressed as an integer.                              |
   | Does this use case have existing short code traffic?                | Yes or No                                                                                                             |
   | Provide the existing short code associated with this use case       | A comma-seperated list of shortcodes associated with your use case.                                                   |
   | Estimated monthly traffic volume for the existing short code number | The monthly visits to the website from the existing shortcodes associated with your use case expressed as an integer. |
   | Expected monthly RCS sender traffic volume                          | The expected monthly visits to the website from the RCS associated with your use case expressed as an integer.        |
10. Click **Next**. The **Details about your RCS campaign.** page appears.
11. Type responses that describe your RCS campaign and how it handles opt-in, opt-out, and other informative messages.

    | Field                               | Character limit | Expected value                                                                                                                  | Example                                                                                                                                                          |
    | ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Campaign description                | 1,000           | A clear and comprehensive overview of the campaign's objectives and interactions the consumer would experience after opting in. | *This campaign will send updates on scheduled moves, confirmations, real-time alerts, responses to inquiries, and special offers on moving or storage services.* |
    | Message flow and opt-in description | 1,000           | The step-by-step procedure that explains how consumers opt-in to messaging for this RCS sender.                                 | *Consumer visits a page on our website. They complete a form. They check a box declaring they consent to these RCS messages. They click submit.*                 |
    | Help sample message                 |                 | An example of a message returned when the consumer sends a `HELP` command.                                                      | *We're sorry that you're having difficulties. To check your balance, press `1`. To pause your next shipment, press `2`. To have a rep call you, press `3`.*      |
    | Stop sample message                 |                 | An example of a message returned when the consumer sends a `STOP` command.                                                      | *You have been removed from our messages. Send `START` to restart messages.*                                                                                     |
    | Message service type                |                 | The single reason that you started this message campaign.                                                                       | See list that follows this table.                                                                                                                                |

    #### View the list of message service types

    * Account notification
    * Age gated content
    * Business operations
    * Conversational messaging
    * Delivery notification
    * Donation pledge
    * Education
    * Emergency alerts
    * Fraud alerts
    * Loan arrangement
    * Machine to machine
    * On behalf of carrier
    * Platform free trial
    * Political
    * Promotional marketing
    * Public service announcements
    * Security alerts
    * Social media
    * Sole proprietorship
    * Sweepstakes and contest
    * Two-factor authentication
    * Voting and polling
12. Click the **I acknowledge that my privacy policy clearly states we do not share text messaging consent information with third parties.** box.
13. Click the **I acknowledge that my Terms of Service include the following:** box.
14. Review the [CTIA handbook guidelines][ctia], then click the **I acknowledge that I have reviewed the [CTIA handbook guidelines][ctia] and this RCS Sender is in compliance with its requirements.** box.
15. Click **Next**. The **Notification settings** page appears.
16. Type responses about who and how you get updates on your RCS sender registration status.

    | Field               | Necessity | Expected value                                                                                                                      |
    | ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
    | Notification email  | Required  | An RFC 5322 compliant email address. The email address you provided as part of your **Public details**. You can change the address. |
    | Status callback URL | Optional  | A publicly available URL that serves as an endpoint for a webhook.                                                                  |
17. Click **Next**. The **Use case and campaign details** page appears.
18. Check the values you provided.
    * If they appear correct, click **Submit registration**. The **Thanks for completing your Google RCS registration!** page appears. Click **Finish**.
    * If they need correction, click **Back** until the relevant page displays and make your changes.

#### Await RCS sender approval

Monitor your RCS Sender approval status.

* During the approval process, the RCS Sender displays an icon in the **Pending Review** column of the Senders table.
* Approval timelines vary by carrier.
* At any point you can reply to the initial support ticket to get an update.
* When one carrier goes live or received approval in a given country, you can start using this RCS Sender in production.

### Update Messaging Service configuration

1. Add the RCS Sender to a Messaging Service.

   Once at least one carrier has approved, configure the RCS Sender for production use:

   1. Go to the [Messaging Services page in the Twilio Console][tc-msg-svc].
   2. Choose from two options:
      * Go to the RCS Sender's **Configuration** tab and assign it to a Messaging Service.
      * Go to your Messaging Service's **Sender Pool** tab and add the RCS Sender.

   You can associate only one RCS Sender with each Messaging Service.
2. Set up **Advanced Opt-Out** handling for the RCS Sender:
   1. Go to the [Messaging Services page in the Twilio Console][tc-msg-svc].
   2. Click your Messaging Service and select **Opt-Out Management** from the sidebar.
   3. Configure opt-out keywords and responses in the local language of your target regions.
   4. Click **Enable Advanced Opt-Out**.

To learn more about Advanced Opt-Out, see [Customizing Users' Opt-in and Opt-out Experience with Advanced Opt-Out][].

## Send and receive branded RCS messages

To learn how to send and receive branded RCS messages using the [Messages resource][], see [Send and receive branded RCS messages][].

You can also use Twilio Studio to send and receive RCS messages. To learn how to connect a Flow for inbound messaging and use the Studio API for outbound messaging, see [Use RCS messaging with Studio][].

## Stop using RCS

To stop using RCS, you can either send messages through a different messaging service or remove the RCS Sender from the Messaging Service.

### Remove RCS Sender from Messaging Service

To remove the RCS Sender from the Messaging Services:

1. Log in to the [Twilio Console][tw-console].
2. Go to **Messaging** > [**Services**][].
3. Select the Messaging Service associated with the RCS Sender.
4. Click **Sender Pool** in the sidebar.
5. Click **Remove**. This deletes the RCS Sender from the Messaging Service.

### Remove Messaging Service from RCS Sender

To remove the Messaging Service from the RCS Sender:

1. Log in to the [Twilio Console][tw-console].
2. Go to **Explore Products** > **Programmable Communications** > **RCS** > **Senders**.\
   The [**RCS Senders** page][rcs-senders] displays.
3. Click on the RCS Sender to change.
4. Click the **Configuration** tab.
5. Set the Messaging Service to `None`.
6. Click **Save Configuration**.

[**Services**]: https://console.twilio.com/us1/develop/sms/services

[Await RCS sender approval]: #await-rcs-sender-approval

[branded RCS messages]: /docs/rcs/send-an-rcs-message

[compliance]: #register-your-rcs-sender

[contrast]: https://webaim.org/resources/contrastchecker/

[countries]: /docs/rcs/regional

[Create an RCS Sender]: #create-an-rcs-sender

[ctia]: https://api.ctia.org/wp-content/uploads/2024/01/CTIA-Short-Code-Monitoring-Handbook-v1.9-FINAL.pdf

[Customizing Users' Opt-in and Opt-out Experience with Advanced Opt-Out]: /docs/messaging/tutorials/advanced-opt-out

[e164]: /docs/glossary/what-e164

[hexcolor]: https://www.color-hex.com/

[Messages resource]: /docs/messaging/api/message-resource

[mms]: /docs/glossary/what-is-mms

[Not all phone numbers can receive RCS messages]: https://help.twilio.com/articles/29603387805979

[paid Twilio account]: https://help.twilio.com/articles/223183208

[RCS Business Messaging]: /docs/rcs

[rcs-senders]: https://console.twilio.com/us1/develop/rcs/senders

[rcs]: /docs/rcs

[register-google]: #register-rcs-with-google

[rfc1808]: https://datatracker.ietf.org/doc/html/rfc1808

[Send and receive branded RCS messages]: /docs/rcs/send-an-rcs-message

[Set up Messaging Services]: /docs/messaging/tutorials/send-messages-with-messaging-services

[Sign up for Twilio]: https://www.twilio.com/try-twilio

[sms]: /docs/glossary/what-is-an-sms-short-message-service

[Special Considerations]: /docs/rcs/regional#special-considerations

[Submit compliance for carrier approval]: #submit-compliance-for-carrier-approval

[tc-msg-svc]: https://console.twilio.com/us1/develop/sms/services

[tw-console]: https://console.twilio.com

[Twilio Support]: https://help.twilio.com

[Update Messaging Service configuration]: #update-messaging-service-configuration

[Use RCS messaging with Studio]: /docs/studio/tutorials/use-rcs-with-studio

# Send and receive RCS messages

On this page, you'll learn how to send RCS messages. All RCS messages are branded and originate from a verified sender by default.

For information about RCS features, see [RCS Business Messaging](/docs/rcs).

## Complete the prerequisites

Before you send an RCS message, [complete the RCS setup](/docs/rcs/onboarding).

## Send an RCS message with automatic fallback to SMS or MMS

You can send RCS messages using code that makes `HTTP POST` requests to the [Message resource](/docs/messaging/api/message-resource) in the Twilio REST API.

When an RCS sender is in a Messaging Service's Sender Pool, Programmable Messaging defaults to RCS as the first-attempt channel. Programmable Messaging proactively checks whether the recipient's device supports RCS. Messages that can't be delivered over RCS automatically fall back to SMS or MMS, using other senders in the Messaging Service's Sender Pool.

To send an RCS message, follow the steps to [send an SMS message](/docs/messaging/tutorials/how-to-send-sms-messages#send-an-sms-message). Set the `MessagingServiceSid` or `From` field to the Messaging Service SID assigned to the RCS Sender. To find a Messaging Service's SID, check the **Sid** column on the [Messaging Services page in the Twilio Console](https://console.twilio.com/us1/develop/sms/services).

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    body: "My first RCS message. Hello, world.",
    messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    to: "+155XXXXXXXX",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    messaging_service_sid="MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    body="My first RCS message. Hello, world.",
    to="+155XXXXXXXX",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            body: "My first RCS message. Hello, world.",
            to: new Twilio.Types.PhoneNumber("+155XXXXXXXX"));

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("+155XXXXXXXX"),
                                  "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                                  "My first RCS message. Hello, world.")
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateMessageParams{}
	params.SetMessagingServiceSid("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetBody("My first RCS message. Hello, world.")
	params.SetTo("+155XXXXXXXX")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "+155XXXXXXXX", // To
    [
        "messagingServiceSid" => "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "body" => "My first RCS message. Hello, world.",
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            messaging_service_sid: 'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            body: 'My first RCS message. Hello, world.',
            to: '+155XXXXXXXX'
          )

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --messaging-service-sid MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --body "My first RCS message. Hello, world." \
   --to +155XXXXXXXX
```

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "MessagingServiceSid=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "Body=My first RCS message. Hello, world." \
--data-urlencode "To=+155XXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

## Send an RCS message without automatic fallback to SMS or MMS

You can also send RCS messages without relying on Twilio's automatic fallback. You'll need to implement your own fallback orchestration logic to retry failed RCS attempts on another channel.

### Using a Messaging Service

To turn off fallback when you send an RCS message through a Messaging Service, add the `rcs:` prefix to the recipient phone number in the `To` field.

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    body: "My first RCS message. Hello, world.",
    messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    to: "rcs:+155XXXXXXXX",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    messaging_service_sid="MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    body="My first RCS message. Hello, world.",
    to="rcs:+155XXXXXXXX",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            body: "My first RCS message. Hello, world.",
            to: new Twilio.Types.PhoneNumber("rcs:+155XXXXXXXX"));

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("rcs:+155XXXXXXXX"),
                                  "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                                  "My first RCS message. Hello, world.")
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateMessageParams{}
	params.SetMessagingServiceSid("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetBody("My first RCS message. Hello, world.")
	params.SetTo("rcs:+155XXXXXXXX")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "rcs:+155XXXXXXXX", // To
    [
        "messagingServiceSid" => "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "body" => "My first RCS message. Hello, world.",
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            messaging_service_sid: 'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            body: 'My first RCS message. Hello, world.',
            to: 'rcs:+155XXXXXXXX'
          )

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --messaging-service-sid MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --body "My first RCS message. Hello, world." \
   --to rcs:+155XXXXXXXX
```

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "MessagingServiceSid=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "Body=My first RCS message. Hello, world." \
--data-urlencode "To=rcs:+155XXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

### Without a Messaging Service

To turn off fallback when you send an RCS message without using a Messaging Service, set the RCS Sender ID in the `From` field and the recipient phone number in the `To` field.

You can find the RCS Sender ID at the top of the RCS Sender's Settings page in the Twilio Console.

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    body: "My first RCS message. Hello, world.",
    from: "rcs:brand_xyz123_agent",
    to: "rcs:+155XXXXXXXX",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    from_="rcs:brand_xyz123_agent",
    body="My first RCS message. Hello, world.",
    to="rcs:+155XXXXXXXX",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            from: new Twilio.Types.PhoneNumber("rcs:brand_xyz123_agent"),
            body: "My first RCS message. Hello, world.",
            to: new Twilio.Types.PhoneNumber("rcs:+155XXXXXXXX"));

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("rcs:+155XXXXXXXX"),
                                  new com.twilio.type.PhoneNumber("rcs:brand_xyz123_agent"),
                                  "My first RCS message. Hello, world.")
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateMessageParams{}
	params.SetFrom("rcs:brand_xyz123_agent")
	params.SetBody("My first RCS message. Hello, world.")
	params.SetTo("rcs:+155XXXXXXXX")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "rcs:+155XXXXXXXX", // To
    [
        "from" => "rcs:brand_xyz123_agent",
        "body" => "My first RCS message. Hello, world.",
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            from: 'rcs:brand_xyz123_agent',
            body: 'My first RCS message. Hello, world.',
            to: 'rcs:+155XXXXXXXX'
          )

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --from rcs:brand_xyz123_agent \
   --body "My first RCS message. Hello, world." \
   --to rcs:+155XXXXXXXX
```

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "From=rcs:brand_xyz123_agent" \
--data-urlencode "Body=My first RCS message. Hello, world." \
--data-urlencode "To=rcs:+155XXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

See [RCS Messaging Best Practices and FAQ](https://help.twilio.com/articles/29076535334043-RCS-Messaging-Best-Practices-and-FAQ) for information on RCS error codes and using RCS without Twilio's fallback.

### Send an RCS message that contains media

To send messages containing [RCS-supported media formats and sizes](/docs/messaging/guides/accepted-mime-types), include the media URL in the RCS API call as shown in the following example. Twilio will fetch the media from the URL provided.

The media URL must be publicly accessible. Twilio cannot fetch media from hidden URLs or URLs that require authentication.

Twilio automatically attempts delivery over RCS. Unsupported media formats may fall back to MMS. Devices that aren't RCS-capable receive the message by MMS in [MMS-supported regions](https://help.twilio.com/articles/12557401622811), and [Picture SMS](https://help.twilio.com/articles/360032795214-Getting-Started-with-MMS-Converter-) elsewhere.

Twilio supports combining text and media in a single request for image and video files. The text and media RCS message is automatically packaged as an RCS Rich Card by Twilio for delivery, ensuring you are not billed for two separate messages. When you use a Rich Card, Twilio processes and bills text and media in a single RCS request.

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    mediaUrl: [
      "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg",
    ],
    messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    to: "+155XXXXXXXX",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    messaging_service_sid="MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    media_url=[
        "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg"
    ],
    to="+155XXXXXXXX",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;
using System.Collections.Generic;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            mediaUrl: new List<Uri> { new Uri(
                "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg") },
            to: new Twilio.Types.PhoneNumber("+155XXXXXXXX"));

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.net.URI;
import com.twilio.type.PhoneNumber;
import java.util.Arrays;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message =
            Message
                .creator(new com.twilio.type.PhoneNumber("+155XXXXXXXX"),
                    "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    Arrays.asList(URI.create("https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg")))
                .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateMessageParams{}
	params.SetMessagingServiceSid("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetMediaUrl([]string{
		"https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg",
	})
	params.SetTo("+155XXXXXXXX")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "+155XXXXXXXX", // To
    [
        "messagingServiceSid" => "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "mediaUrl" => [
            "https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg",
        ],
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            messaging_service_sid: 'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            media_url: [
              'https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg'
            ],
            to: '+155XXXXXXXX'
          )

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --messaging-service-sid MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --media-url https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg \
   --to +155XXXXXXXX
```

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "MessagingServiceSid=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "MediaUrl=https://c1.staticflickr.com/3/2899/14341091933_1e92e62d12_b.jpg" \
--data-urlencode "To=+155XXXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

### Send an RCS message that contains rich content

You can create rich content using [Content Templates](/docs/content) and send that content through RCS. RCS supports the following rich content types:

|                    | **Rich content support**                     |
| ------------------ | -------------------------------------------- |
| **RCS Feature**    | **Content Type**                             |
| Rich Card          | [`twilio/card`](/docs/content/twiliocard)    |
| Chip List          | [`twilio/card`](/docs/content/twiliocard)    |
| Basic Text         | [`twilio/text`](/docs/content/twilio-text)   |
| Media              | [`twilio/media`](/docs/content/twilio-media) |
| Rich Card Carousel | [`twilio/carousel`](/docs/content/carousel)  |
| Webviews           | [`twilio/card`](/docs/content/twiliocard)    |

For devices that aren't RCS-capable, you can define customized fallback to SMS and MMS in applicable regions by defining multiple types in a Content Template.

To send rich content through RCS:

1. Define your rich content in the [API](/docs/content/create-and-send-your-first-content-api-template) or the [Twilio Console](/docs/content/create-templates-with-the-content-template-builder).
2. In the API response or in the Twilio Console, find the unique Content SID starting with `HX` that identifies your rich content.
3. Add the `ContentSid` and content variables to the [Send an RCS message with automatic fallback to SMS or MMS](#send-an-rcs-message-with-automatic-fallback-to-sms-or-mms) code as shown in the following example.

   To learn more about content variables, see [Using Variables](/docs/content/create-templates-with-the-content-template-builder#using-variables).

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    contentSid: "HXXXXXXXXXXXXX",
    contentVariables: JSON.stringify({ 1: "Name" }),
    messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    to: "+1555XXXXXXX",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client
import json

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    messaging_service_sid="MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    content_sid="HXXXXXXXXXXXXX",
    content_variables=json.dumps({"1": "Name"}),
    to="+1555XXXXXXX",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            messagingServiceSid: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            contentSid: "HXXXXXXXXXXXXX",
            contentVariables: JsonConvert.SerializeObject(
                new Dictionary<string, Object>() { { "1", "Name" } }, Formatting.Indented),
            to: new Twilio.Types.PhoneNumber("+1555XXXXXXX"));

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import java.util.HashMap;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import org.json.JSONObject;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("+1555XXXXXXX"),
                                  "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                                  "HXXXXXXXXXXXXX")
                              .setContentVariables(new JSONObject(new HashMap<String, Object>() {
                                  {
                                      put("1", "Name");
                                  }
                              }).toString())
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"encoding/json"
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	ContentVariables, ContentVariablesError := json.Marshal(map[string]interface{}{
		"1": "Name",
	})

	if ContentVariablesError != nil {
		fmt.Println(ContentVariablesError)
		os.Exit(1)
	}

	params := &api.CreateMessageParams{}
	params.SetMessagingServiceSid("MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
	params.SetContentSid("HXXXXXXXXXXXXX")
	params.SetContentVariables(string(ContentVariables))
	params.SetTo("+1555XXXXXXX")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "+1555XXXXXXX", // To
    [
        "messagingServiceSid" => "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "contentSid" => "HXXXXXXXXXXXXX",
        "contentVariables" => json_encode([
            "1" => "Name",
        ]),
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            messaging_service_sid: 'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            content_sid: 'HXXXXXXXXXXXXX',
            content_variables: {
                '1' => 'Name'
              }.to_json,
            to: '+1555XXXXXXX'
          )

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --messaging-service-sid MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
   --content-sid HXXXXXXXXXXXXX \
   --content-variables {\"1\":\"Name\"} \
   --to +1555XXXXXXX
```

```bash
CONTENT_VARIABLES_OBJ=$(cat << EOF
{
  "1": "Name"
}
EOF
)
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "MessagingServiceSid=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
--data-urlencode "ContentSid=HXXXXXXXXXXXXX" \
--data-urlencode "ContentVariables=$CONTENT_VARIABLES_OBJ" \
--data-urlencode "To=+1555XXXXXXX" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

## Receive an RCS message

When users send messages to an RCS Sender, messages are shown on the [Programmable Messaging Logs page in the Twilio Console](https://console.twilio.com/us1/monitor/logs/sms). You can also [configure a Messaging Service](/docs/messaging/services#incoming-messages-handling) to send a webhook when it receives an incoming message.

## Let customers initiate a chat with an RCS Sender

Your customers can start a chat with an RCS Sender from a deep link URL. You can embed the URL as a button, link, or QR code in an email, app, or website based on your requirements. A fallback phone number is used if users cannot send or receive RCS messages.

**Deep link URL Format**

```text
sms:+1555XXXXXXX?service_id=brand_xyz123_agent%40rbm.goog&body=Hello%20World
```

| **Parameter**        | **Description**                 | **Necessity** |
| -------------------- | ------------------------------- | ------------- |
| `+1555XXXXXXX`       | Fallback number                 | Required      |
| `brand_xyz123_agent` | RCS Sender ID, excluding `rcs:` | Required      |
| `Hello%20World`      | URL-encoded pre-filled message  | Optional      |

The RCS Sender ID can be found at the top the RCS Sender's Settings page.

You can also use the [Google SMS link creator](https://developers.google.com/business-communications/rcs-business-messaging/guides/build/deeplinks#sms_link_creator) to generate the deep link and QR code.

## Monitor and analyze traffic for RCS messages that you send

After you send RCS messages, you can monitor and analyze your RCS traffic by using [Programmable Messaging Logs in the Twilio Console](https://console.twilio.com/us1/monitor/logs/sms) and [Messaging Insights](/docs/messaging/features/messaging-insights). If you don't see a log for your message, you can view errors on the [Error Logs page in the Twilio Console](https://console.twilio.com/us1/monitor/logs/debugger/errors).

If Twilio successfully sent the message with RCS, the `From` field contains `rcs:<SenderId>`. You can view this field in the [Programmable Messaging Logs in the Twilio Console](https://console.twilio.com/us1/monitor/logs/sms), [outbound message status callbacks](/docs/usage/webhooks/messaging-webhooks#outbound-message-status-callback), and [Fetch a Message resource](/docs/messaging/api/message-resource#fetch-a-message-resource) request results.

In many regions, RCS tracks `delivered` and `read` statuses more reliably than SMS. If you need to A/B test the two channels, consider using other metrics, such as clicks or conversions.

# Programmable Messaging RCS Regional Availability

You can send RCS messages in multiple regions using Twilio Programmable Messaging. This document outlines the supported regions and highlights requirements and considerations unique to each region.

## Supported regions

You can send RCS messages using Twilio's Programmable Messaging API to at least one major carrier in the following regions:

**North America (NAMER)**

* [United States](#united-states)

**Europe, the Middle East, and Africa (EMEA)**

* Austria
* Belgium
* Canada
* Czech Republic
* Denmark
* Finland
* France
* [Germany](#germany)
* Ireland
* Italy
* Netherlands
* Norway
* Poland
* [Portugal](#portugal)
* Romania
* Slovakia
* Spain
* Sweden
* [United Kingdom](#uk)

**Latin America (LATAM)**

* [Brazil](#brazil)
* [Mexico](#mexico)

**Asia-Pacific (APAC)**

* Singapore

## Special considerations

### Brazil

* RCS messaging in Brazil requires creating a RCS Sender specifically for use in Brazil. Brazil RCS Senders cannot be used to send messages in other countries. This cannot be done in the Twilio Console and requires manual steps.
* To get started in Brazil, submit [this form](https://airtable.com/appZAZ6mJFh1o042D/pagLPMzOFNFRtTOlm/form).
* RCS Senders in Brazil may experience up to 60 minutes of downtime annually during a maintenance window. Twilio will provide a 30-day advance notice for this. During this period, all messages will default to SMS delivery instead of RCS.
* RCS Sender branded profile information, except for display name, can be changed without downtime.

### Germany

* Only one sender is allowed per name and per use case. If you need multiple senders, each must have a distinct name (e.g., Owl and Owl Inc.). Multiple senders cannot be used for the same use case (e.g., authentication).
* RCS Senders approved by German carriers must have their website, terms of service, and privacy policy links in German or easily translatable to German.
* During the onboarding process, you will be required to download, fill out and Docusign a Brand Verification Letter for carriers.

### Mexico

* RCS Senders in Mexico must have all of their information in Spanish, including the description.

### Singapore

* RCS Senders must follow the same SSIR Singapore registration process as A2P SMS sender IDs, explained in the [Overview of SMS Sender ID Registry](https://www.sgnic.sg/smsregistry/overview).

### Portugal

* RCS Senders must be approved by carriers in Spain before they can be approved by carriers for Portugal. Twilio will automatically submit Senders in Spain when selecting Portugal.

### United Kingdom \[#uk]

* To be approved on the UK Carriers, an RCS Sender may not contain international phone numbers within the branded profile information. Only UK phone numbers with a country code of +44 are permitted. Phone numbers are not required and may be requested to be removed manually after submission.

### United States

While all brands are able to submit RCS Senders for carrier approval, carriers currently prioritize:

* Notable brands, including Fortune 1000 companies or highly recognizable names
* High-quality experiences featuring rich content and conversational interactions
* Established messaging volume (100,000+ messages per month) or the migration of existing SMS/MMS traffic to RCS (this applies per brand for ISVs)

Brands that do not meet these criteria may face longer approval times as the ecosystem scales.

# Verify RCS Upgrade

## What is RCS

RCS is an enhancement of the SMS channel, delivering messages over Wi-Fi and cellular to the default SMS messaging app on Android, [Messages by Google](https://play.google.com/store/apps/details?id=com.google.android.apps.messaging\&hl=en_US\&gl=US). RCS messages are more secure, because they are [encrypted](https://developers.google.com/business-communications/rcs-business-messaging/support/data-security#message_storage_and_encryption) between Twilio and Google's servers and between Google's servers and the end-user's device. They can also have lower delivery latency. RCS functionality is limited to compatible devices and is initially available in a select number of countries, with plans to expand over time.

## Verify's support for RCS

Twilio Verify will automatically upgrade delivery of your OTP messages via RCS instead of SMS whenever possible; and if we determine that it exhibits the same or better performance, as measured by Verification Success Rate and Messaging Cost Per Successful Verification.

## Message recipient experience

Your end-user receives the RCS message from Verify on the default SMS messaging app on Android, [Messages by Google.](https://play.google.com/store/apps/details?id=com.google.android.apps.messaging\&hl=en_US\&gl=US) They do not need to know in advance that they are receiving an RCS instead of an SMS message, because it appears in the same app and looks similar.

![Google Messages showing ACME verification code 123456 with copy option.](https://docs-resources.prod.twilio.com/ada9a4737fb8896028c022a4b191a1525a1b66992112c239d58af1d63b74aed8.jpg)

## **Billing**

Delivered messages over RCS will continue to be billed to you as SMS messages. Your total messaging bill could be lower as a result of the upgrade for two reasons:

1. Unlike SMS, RCS messages will not be billed if they are sent, but not delivered.
2. SMS has a [message character limit](/docs/verify/developer-best-practices#limit-sms-messages-to-one-message-segment-to-avoid-extra-cost) that can sometimes cause OTP messages to be split into 2+ message segments, each of which is billed as their own SMS message. RCS has a much larger character limit, such that OTP messages will not be split.

## FAQs

**Can I opt-out of this RCS upgrade?**

If you do not want Verify to automatically upgrade your messages to RCS, complete this [opt-out form](https://forms.gle/ZSAom3zwLNzjj7cWA). There is not a way to specify RCS or not when sending an individual message.

**How do I know if an RCS upgrade was attempted?**

There are two ways to check if an RCS message is sent: by checking the Verify Console Log or using the [Verification Attempts API](/docs/verify/api/attempts). The response body of a [Create Verification](/docs/verify/api/verification) request will remain unchanged after this upgrade. Both RCS and SMS messages are included in a single Verification Attempt, identified by the same Attempt SID.

**How do I know if an RCS message was successfully delivered?**

In the Verify Console Logs, for a given Verification Attempt, the last message delivery attempt will be displayed. For example, if an RCS message was sent and delivered, then the Outcome would show "Code sent via RCS" and Delivery Status would show "Delivered". However, if there was a failover to SMS, then the Outcome would show "Code sent via SMS".

![Verification details showing code sent via RCS, status approved, sent to +573045261847.](https://docs-resources.prod.twilio.com/bb94c9cd4b55b74b3a68635ea0b364b6c83506f36bfb5a3d90d05fbf2caf7ea2.png)

![Verify logs with RCS channel filter selected, showing approved verifications.](https://docs-resources.prod.twilio.com/90a8b36921dda8763b78cbcf8b9a8929cc46af4f27d89a00c1009067d01ee5d1.png)

**How does Verify measure performance when optimizing between use of RCS and SMS?**

Verify measures two key performance metrics:

Verification Success Rate: Of the [Verifications](/docs/verify/api/verification) created by calling the Verify API, the percentage that ended in `status=approved`. Per-Message (Attempt) Conversion Rate is not the same as this, because a single Verification session can contain multiple message attempts. However, the two metrics are correlated.

Messaging Cost Per Successful Verification: Sum of the prices billed to the Twilio customer for all billed SMS and RBM messages for all Verifications (regardless of Verification status) DIVIDED by the total number of Successful Verifications (Verification `status=approved`).

# SDKs

## Server-side SDKs

Server-side SDKs make it easy for you to use Twilio's REST APIs, generate TwiML, and perform other common server-side programming tasks. These SDKs are available in a variety of popular programming languages.

* [C# / .NET](https://github.com/twilio/twilio-csharp)
* [Java](https://github.com/twilio/twilio-java)
* [Node.js](https://github.com/twilio/twilio-node)
* [PHP](https://github.com/twilio/twilio-php)
* [Python](https://github.com/twilio/twilio-python)
* [Ruby](https://github.com/twilio/twilio-ruby)
* [Go](https://github.com/twilio/twilio-go)

## OpenAPI Specification

Twilio's OpenAPI specification empowers you with a broad set of developer tooling, ranging from Postman collections to API mocking to automatic client generation in over 40 programming languages.

* [Twilio OpenAPI Specification](https://github.com/twilio/twilio-oai)
* [Postman Collections](/docs/openapi/using-twilio-postman-collections/)
* [Mock API Generation](/docs/openapi/mock-api-generation-with-twilio-openapi-spec/)
* [Rust Client Generation](/docs/openapi/generating-a-rust-client-for-twilios-api/)

## JavaScript SDKs

Twilio's JavaScript SDKs are used in the browser to create video conversations, make VoIP phone calls, or implement real-time omnichannel chat. Get started with the SDK you need.

* [Voice](/docs/voice/sdks/javascript/)
* [Conversations](/docs/conversations/javascript/changelog/)
* [Video](/docs/video/javascript/)
* [TaskRouter](/docs/taskrouter/js-sdk/)
* [Sync](/docs/sync/javascript/changelog/)

## iOS SDKs

Our iOS SDKs enable native apps to create video conversations, make VoIP phone calls, and embed real-time omnichannel chat. Get started with the SDK you need.

* [Voice](/docs/voice/sdks/ios/)
* [Conversations](/docs/conversations/ios/changelog/)
* [Video](/docs/video/ios/)
* [Sync](/docs/sync/ios/changelog/)

## Android SDKs

Android SDKs enable you to create video conversations, make phone calls, and embed real-time omnichannel chat in your native Android apps. Get started with the SDK you need.

* [Voice](/docs/voice/sdks/android/)
* [Conversations](/docs/conversations/android/changelog/)
* [Video](/docs/video/android/)
* [Sync](/docs/sync/quickstart/android/)

## React Native SDK

Twilio's Voice SDK for React Native allows you to add voice-over-IP (VoIP) calling into your React Native apps.

* [Voice](/docs/voice/sdks/react-native)

## Flex SDKs

The Flex SDKs allow you to change the look, feel, and functionality of your Flex Contact Center using Javascript and React.

* [The Flex UI](/docs/flex/developer/ui/)
* [Installing and using Flex WebChat](/docs/flex/developer/messaging/webchat/setup/)


# Best Practices for Scaling with Messaging Services

When you're ready to scale messaging for your application, you should keep a few best practices and key questions in mind as you build and work with Twilio.

This guide presents common use cases and location-specific complexities that can affect your messaging application. Knowing how, where, and to whom you plan to send messages will help you avoid some common pitfalls while scaling.

## Use a Messaging Service to send messages

Perhaps you built out your messaging application's proof-of-concept by sending messages from a single long code phone number. However, as you scale, your application may require different types of senders, such as short codes, Alpha Sender ID, WhatsApp senders, and phone numbers. You will also want to use features such [Advanced Opt-Out](https://help.twilio.com/hc/en-us/articles/360034798533-Getting-Started-with-Advanced-Opt-Out-for-Messaging-Services) for compliance management, and [Smart Encoding](/docs/messaging/services/smart-encoding-char-list) to catch those segment-gobbling Unicode symbols.

Intrigued? Check out the full list of [Messaging Service features](/docs/messaging/services).

You can think of a Messaging Service as a container to hold all of your sender IDs and to manage the configuration affecting the delivery of your messages. For example, you could put your short code and local numbers in one Messaging Service sender pool and configure them to point to the same webhook URL to respond to incoming messages. You could also define the same set of opt-out *(Stop)* words per country for all of the senders in your sender pool using the Messaging Service [Advanced Opt-Out](https://help.twilio.com/hc/en-us/articles/360034798533-Getting-Started-with-Advanced-Opt-Out-for-Messaging-Services) feature.

When sending messages from a Messaging Service, you can set the From parameter to your Messaging Service SID, instead of a specific phone number. This not only provides intelligent routing for the senders in your Sender Pool, but also gives you access to the various Messaging Service Features, like Advanced Opt-Out, Sticky Sender, Shortcode Reroute, Smart Encoding and more.

Send a Message with a Messaging Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    body: "Do you know what time it is? It must be party time!",
    messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
    to: "+15558675310",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    to="+15558675310",
    messaging_service_sid="MG9752274e9e519418a7406176694466fa",
    body="Do you know what time it is? It must be party time!",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            to: new Twilio.Types.PhoneNumber("+15558675310"),
            messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
            body: "Do you know what time it is? It must be party time!");

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("+15558675310"),
                                  "MG9752274e9e519418a7406176694466fa",
                                  "Do you know what time it is? It must be party time!")
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateMessageParams{}
	params.SetTo("+15558675310")
	params.SetMessagingServiceSid("MG9752274e9e519418a7406176694466fa")
	params.SetBody("Do you know what time it is? It must be party time!")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "+15558675310", // To
    [
        "messagingServiceSid" => "MG9752274e9e519418a7406176694466fa",
        "body" => "Do you know what time it is? It must be party time!",
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            to: '+15558675310',
            messaging_service_sid: 'MG9752274e9e519418a7406176694466fa',
            body: 'Do you know what time it is? It must be party time!'
          )

puts message.body
```

```bash
EXCLAMATION_MARK='!'
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --to +15558675310 \
   --messaging-service-sid MG9752274e9e519418a7406176694466fa \
   --body "Do you know what time it is? It must be party time$EXCLAMATION_MARK"
```

```bash
EXCLAMATION_MARK='!'
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "To=+15558675310" \
--data-urlencode "MessagingServiceSid=MG9752274e9e519418a7406176694466fa" \
--data-urlencode "Body=Do you know what time it is? It must be party time$EXCLAMATION_MARK" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "api_version": "2010-04-01",
  "body": "Do you know what time it is? It must be party time!",
  "date_created": "Thu, 24 Aug 2023 05:01:45 +0000",
  "date_sent": "Thu, 24 Aug 2023 05:01:45 +0000",
  "date_updated": "Thu, 24 Aug 2023 05:01:45 +0000",
  "direction": "outbound-api",
  "error_code": null,
  "error_message": null,
  "from": "+14155552345",
  "num_media": "0",
  "num_segments": "1",
  "price": null,
  "price_unit": null,
  "messaging_service_sid": "MG9752274e9e519418a7406176694466fa",
  "sid": "SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "queued",
  "subresource_uris": {
    "media": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Media.json"
  },
  "to": "+15558675310",
  "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json"
}
```

## Figure out which senders work best for your use case

> \[!WARNING]
>
> If your messaging use case is [Two-Factor Authentication (2FA)](/docs/glossary/what-is-two-factor-authentication-2fa) codes, you'll want to use [Authy](/docs/authy) or [Verify](/docs/verify), rather than Programmable Messaging.

Depending on what you build with Twilio Programmable Messaging, you may use different types of message senders as the primary way that customers interact with your application. There are different sender types to choose from:

* Local and international long code numbers
* Short code numbers
* Toll-free numbers
* Alphanumeric sender IDs
* WhatsApp senders

The answers to the following questions will determine what kind(s) of senders you should select and include in your Messaging Service's Sender Pool.

### 1) Are you sending one-way or two-way messages?

Consider your use case: *do you need your recipients to be able to reply to your messages?* If so, that is called "two-way messaging."

More modern messaging channels like WhatsApp always support two-way messaging. With SMS, however, two-way messaging is not always supported; you'll need to make sure that you use the correct number type (if available), or consider an alternative such as WhatsApp.

Check out our [two-way SMS FAQ](https://help.twilio.com/hc/en-us/articles/235288367-Receiving-Two-Way-SMS-and-MMS-Messages-with-Twilio) for more information, or [read about WhatsApp](https://help.twilio.com/hc/en-us/articles/360007721954-Getting-Started-with-Twilio-for-WhatsApp).

If you only need to send one-way messages to your recipients, you generally have more options for sender types. However, you still should consider the countries to which you are sending and your use case - read on for details.

### 2) Where are you sending messages?

> \[!NOTE]
>
> Regulations vary by country, so make sure to check out [country-specific guidelines](https://www.twilio.com/en-us/guidelines/sms) for the countries in which you plan to send SMS.

Not all sender types work in every country, so you should determine in advance where you want to send messages:

#### If you're sending in the US and Canada

In the United States and Canada, you can send messages from a few types of numbers.

* US/Canada 10DLC long code phone numbers
* Short code phone numbers
* US/Canada Toll-Free numbers
* WhatsApp-enabled numbers

Canadian mobile carriers forbid sending application-to-person (A2P) messaging using long code phone numbers, but US Toll-Free numbers can be used for sending A2P traffic on most Canadian carriers. For a comparison of number types for the US and Canada, [see here](https://help.twilio.com/hc/en-us/articles/360038173654-Comparison-of-SMS-messaging-in-the-US-and-Canada-for-long-codes-short-codes-and-toll-free-phone-numbers).

#### If you're sending outside the US and Canada

Outside of the United States and Canada, your possible sender types include:

* Alphanumeric Sender IDs
* Long code phone numbers
* Short code phone numbers
* Toll-free numbers
* WhatsApp-enabled numbers

Only US/Canadian Toll-Free numbers can send A2P SMS. When sending messages to non-US countries, carriers treat US Toll-Free numbers just like any other non-local long code phone number.

#### Consider in-country phone numbers for messaging globally

In some countries, using a local, familiar phone number can improve the read rate of your messages. Using a local number or short code is also required in order to receive incoming replies - see [Receiving Two-Way SMS and MMS Messages with Twilio](https://help.twilio.com/hc/en-us/articles/235288367-Receiving-Two-Way-SMS-and-MMS-Messages-with-Twilio) for details. Depending on your use case and the relevant country regulations, you may want to add in-country numbers to your Messaging Service for each country you want to send SMS to.

### 3) What kind of content are you sending?

When selecting senders for your Messaging Service, also consider the flow of content that you'll send to your customers. Message content affects which sender types are available for you to include in your Messaging Service.

There are two main types of messaging to consider:

#### One-way messaging

Common examples of one-way messaging include marketing messages, delivery alerts and other informational messages.

If you plan to send one-way traffic through your application, you will need to choose your sender type based on what is available and permitted by [local regulations](https://www.twilio.com/en-us/guidelines/sms) for your specific use case in the countries you plan to send messages to. For example, France prohibits the use of local long code numbers for anything except for [pure person-to-person (P2P)](https://help.twilio.com/hc/en-us/articles/223133807-What-is-P2P-and-A2P-messaging-) conversation traffic, so most organizations will need to use an Alphanumeric Sender ID or a short code to send messages to France.

Depending on availability and per-country regulations, you may use one or more of the following sender types in your Messaging Service's Sender Pool:

* Short Codes
* Alphanumeric Sender IDs
* Non-local long code numbers
* In-country local long code phone numbers (where permitted by regulations)
* WhatsApp senders

#### Two-way messaging

Common examples of [two-way messaging](https://help.twilio.com/hc/en-us/articles/235288367-Receiving-Two-Way-SMS-and-MMS-Messages-with-Twilio) are chat bots, virtual assistants, and appointment reminders.

For two-way, back-and-forth messaging, you should include one or more of the following in your Messaging Service's Sender Pool:

* In-country local long code phone numbers
* Short codes
* WhatsApp

## Determine your messaging throughput needs

Message throughput is measured in Messages Segments per Second, but typically abbreviated as MPS. Your throughput needs affects which types and how many senders you should add to your Messaging Service's Sender Pool.

MPS varies by country and by sender type. For US long codes, the MPS you get [depends on the outcome of your A2P 10DLC registration](https://help.twilio.com/hc/en-us/articles/1260803225669-Message-throughput-MPS-and-Trust-Scores-for-A2P-10DLC-in-the-US). For US Toll-Free, the default MPS is 3, but this can be increased. Outside of the US, it's typically 10 (ten) messages per second. For details, see [Understanding Twilio Rate Limits and Message Queues](https://help.twilio.com/hc/en-us/articles/115002943027-Understanding-Twilio-Rate-Limits-and-Message-Queues).

### MPS Considerations for the US and Canada

Using multiple long code or Toll-Free numbers to increase your message throughput to the US or Canada is strongly discouraged as it will result in carrier filtering.

**For the US**, you can get a short code number, which can send messages at 100 MPS or more. Or you can use a single Toll-Free number and talk to Sales about upgrading the number for high-throughput of 25+ MPS.

**For Canada**, short codes (offering 100+ MPS) and TF are the only permitted ways to send A2P traffic. Using long codes to send A2P messaging traffic will result in increased carrier filtering.

### MPS Considerations for the rest of the world

Your options for increasing MPS depend on your traffic type (one-way vs. two-way and A2P vs. P2P, discussed above) and the type of sender(s) you've decided to use.

**Alphanumeric Sender ID:** by default, Alphanumeric Sender ID offers 10 MPS and its use is country specific. To increase MPS on an Alphanumeric Sender ID, talk to Sales or submit a Support request. Include your expected message volume to the country or countries to which you will send messages.

**Long code numbers:** by default, long code numbers sending to non-US/Canada countries offer 10 MPS. The MPS on an individual number cannot be increased, but you can add more numbers.

Twilio has built a highly available, distributed queue, so you don't have to worry about these limits. Your application can send Twilio's Programmable Messaging API requests as quickly as you'd like. We'll queue your messages for you and send them out at the appropriate rate for your senders. This keeps your application in compliance, but this can delay the delivery of your messages.

To find out more details, read [this article about Twilio Rate Limits and Message Queues](https://help.twilio.com/hc/en-us/articles/115002943027-Understanding-Twilio-Rate-Limits-and-Message-Queues).

## Use a short code or toll-free number for higher throughput

> \[!WARNING]
>
> We caution against adding more long code phone numbers to your Messaging Service's Sender Pool to distribute the load, a practice known as "snowshoeing." Instead, consider upgrading to a sender type with higher throughput, such as a [toll-free number or short code](https://www.twilio.com/blog/higher-throughput-toll-free-sms-generally-available), if available in your area.

**If you're sending to a country where Twilio offers short code numbers:** As of Q4 2022, Twilio offers [short code numbers](https://www.twilio.com/en-us/guidelines/short-code) in 14 countries, including the US, Canada, UK, Mexico, and Brazil. Apply for a short code to take advantage of a higher throughput rate, typically starting at 100 messages per second, and robust delivery. Short codes have the advantage of carrier pre-approval; this means that your use case has been reviewed by carriers, greatly reducing filtering risk.

Short codes can only be used to send domestic traffic (e.g., Canadian short codes can only send SMS in Canada.). In addition to using short codes, you should add other numbers or Alpha Sender ID if you plan to send SMS to countries where short codes are not offered, or where a short code does not make sense for your expected message volume.

In the US and Canada, some [smaller mobile carriers may not support short code messages](https://help.twilio.com/hc/en-us/articles/223182088-What-carriers-are-supported-on-Twilio-short-codes-?_ga=2.168829737.90227006.1597681198-70084276.1582139191). To achieve the highest levels of deliverability, you should add a few long codes to your messaging service. In the US and Canada, the **Short Code Reroute feature** will send from a long code phone number when a short code is not supported.

**If you're sending to a country where Twilio does not offer short code numbers:** Consult the [SMS Guidelines](https://www.twilio.com/en-us/guidelines/sms) for the country in question, and add appropriate numbers to your Messaging Service depending on your use case. For example, for 1-way messaging to many countries in the world, you can add US/Canada numbers to your Messaging Service, or enable Alphanumeric Sender ID.

## Alphanumeric Sender IDs and Throughput

If you are using an [alphanumeric sender ID](/docs/glossary/what-alphanumeric-sender-id), it will take precedence over the other phone numbers in your Messaging Service sender pool, *even if it has queued messages*. Message delivery does not fall back from alphanumeric sender IDs to the long code phone numbers in your sender pool.

If you are planning to use an alphanumeric sender ID in a supported country, make sure that you get the right MPS rate for it. You can request higher throughput on your alphanumeric sender ID through Support.

## Time to get scaling

When you're ready to scale with Twilio Programmable Messaging, we highly recommend moving your application to a Messaging Service, if you have not already done so. That way, you'll have access to all of the built-in features that help you send messages globally and at high-volume, all while managing a single sender pool.

The fastest way to scale your messaging application is to identify your use case and messaging needs from the start. Knowing where you'll be sending messages, what type of content you'll send to customers, and how quickly you need those messages to be sent will point you to the right sender types to include in your Messaging Service.

Also check out:

* [Twilio Messaging Services](/docs/messaging/services)
* [Country-specific Guidelines](https://www.twilio.com/en-us/guidelines)
* [Understanding Rate Limits and Message Queues](https://help.twilio.com/hc/en-us/articles/115002943027-Understanding-Twilio-Rate-Limits-and-Message-Queues)
* [How does Carrier Filtering Work?](https://help.twilio.com/hc/en-us/articles/223181848-How-Does-Carrier-Filtering-Work-)

# Build to scale: queueing and latency on Twilio

Delivering messages at scale is a top-of-mind consideration when building applications for high-traffic events, such as Black Friday sales in the U.S.. Therefore, we've created a guide of *best practices* that you can follow to ensure your applications with Twilio scale.

## Example: Black Friday sales

Imagine you have a list of 1,000 products that go on sale at 11:00 AM the morning of [Black Friday](https://en.wikipedia.org/wiki/Black_Friday_\(shopping\)). Now, you have one million eager end users who want to be notified of your Black Friday deals as soon as they're live. You're planning to send out a blast of promotional [SMS](/docs/glossary/what-is-an-sms-short-message-service) messages to that entire group at 10:00 AM Black Friday morning to let them know the deals will be live in an hour.

You also know the best products run out within a few minutes. To protect against automated bots and to ensure that your potential audience has an equitable experience, you need to incorporate an [OTP](/docs/glossary/totp) code verification step as part of the checkout flow. In this case, you require *two* messages to safely and securely facilitate the sale.

Based on your use case, on Black Friday, you have two separate use cases for Twilio Messaging: one for promotional messages sent an hour before the sales go live and one for OTP verification messages during checkout. For each of these use cases, we recommend creating a [Messaging Service](/docs/messaging/services) with a dedicated Sender Pool and [Validity Period](https://www.twilio.com/en-us/blog/take-more-control-of-outbound-messages-using-validity-period-html) setting.

* **Message 1,** **Promotional -** The end user gets a marketing link in a message just before your Black Friday sales go live. The link takes them to an application where they have to login or signup.
* **Message 2, OTP -** Upon signup, the end user must enter a one-time-passcode (OTP) pin for logging in. This message has to arrive immediately, so that the user can purchase before the items run out! For this example, let's conservatively assume that 2% of your audience clicks the link and eventually, 0.1% buy.

## Using Messaging Services

You can think of a Twilio Messaging Service as a bundling of both senders (in this case, phone numbers) *and* settings for a specific messaging use case. When you need to consider messaging at scale, a Messaging Service handles intelligent routing and features like opt-out management for you, across multiple senders. So instead of configuring multiple individual numbers, you can create a Messaging Service and add as many senders to the sender pool as you need. The configuration will apply to all of the numbers in your sender pool.

> \[!NOTE]
>
> Whenever you are using multiple Senders to service a single use case (as in this example), you should be aware that this practice is governed by various local regulations, depending on the country into which you are messaging. Twilio strongly encourages you to be aware of and adhere to these guidelines. [On this page](https://www.twilio.com/en-us/guidelines/sms) you can find current guidelines for sms use in many countries outside the U.S. Among U.S. carriers, the practice of using multiple senders for the same message as a way to circumvent regulations is known as "snowshoeing"; [here's is Twilio's policy](https://www.twilio.com/en-us/legal/messaging-policy) regarding this. [Here](/docs/messaging/compliance/toll-free/console-onboarding) you can find guidelines and registration steps for the use of **Toll Free numbers** for sms messaging within the U.S. Finally, the use of **10DLC** numbers to send sms messages within the U.S. is governed by new regulations you should definitely be aware of before choosing a scaling solution with large numbers of 10DLC numbers in the U.S.; see [this overview document](/docs/messaging/compliance/a2p-10dlc).

### What happens when you make a message request to a Messaging Service?

When you send a [Message](/docs/messaging/api/message-resource) with a Messaging Service, the Service queues the API Request before sending it to the specific Sender, then onto the Carrier for eventual delivery to the end user. Instead of a `from` phone number, you will enter a Messaging Service SID in your API request to Twilio.

![Flowchart showing message request process from sender to handset with status indicators.](https://docs-resources.prod.twilio.com/3e947636f0e4477d93ff312dca2bd0d60c59d899d0bd0227c8624c14ed32f42f.png)

### A different Messaging Service for each use case

Recall that in our Black Friday example, we plan to send two types of Messages: one promotional, pre-sale message and one OTP verification message.

In this case, you'll want to create two different Messaging Services, one for each use case. Each Messaging Service will have a separate Sender Pool (or group of numbers)

![Diagram showing API requests to messaging services for promotional and OTP messages.](https://docs-resources.prod.twilio.com/0afc6eafde579a424a0e1a944324be57c7a2012451e59cf387d5281e8e63ea01.png)

## How to build for scale with Twilio Messaging Services

Once you have defined your use cases, you can plan for your anticipated messaging traffic and ensure that the messages are delivered in the necessary timeframe.

### 1. Forecast your traffic and delivery timeline requirements

For each messaging service, we recommend defining both how many messages you'll need to send (traffic) and the delivery timeframe. For example, in our Black Friday example, the Promotional and OTP use cases have different levels of traffic and time-sensitivity, so we want to queue up our messages differently.

1. **Promotional**: Let's say you need to send 1,000,000 messages to your audience through the special day. You may queue up a million message requests on your Twilio Promotional Messaging Service.
2. **OTP**: Let's say 2% customers clicking on the link to sign up or to login and purchase items at exactly 5 PM when sales go live. OTP messages need to be delivered urgently, let's assume within 180 seconds.

> \[!NOTE]
>
> As noted above, there are new and significant regulations governing the use of **10DLC numbers** for A2P sms messaging to numbers **in the United States** (see our [overview documentation here](/docs/messaging/compliance/a2p-10dlc)). These regulations require the registration of an A2P-compliant Brand, and then at least one compliant Campaign associated with the Messaging Service that contains the pool of 10DLC numbers to be used. Compliance is judged by 3rd-party organizations within the A2P ecosystem, and registration entails one-time and recurring fees.
>
> The present document on Message scaling does not assume the use of 10DLC (as opposed to Toll-free or short-code) senders, nor does it assume messaging to numbers in the U.S. However, if you are considering using 10DLC senders to US numbers, it would be worth considering alternatives in order to avoid the complexities of the new US A2P regulations. For example, if OTP (or any other form of 2-Factor Authentication) is your *only* use case for SMS messaging with 10DLC numbers in the U.S., you would probably be better served by Twilio's [Verify](/docs/verify) service, with which you do not need to worry about A2P registration or any other aspect of sender provisioning.
>
> In this document, however, we are assuming a customer with multiple use cases, only one of which is OTP/2FA (with Marketing being the other). In that situation, if your messaging was to US end-users *and* if you had compelling reasons for using 10DLC senders rather than Toll-Free or short code, you would need to complete A2P Brand registration as well as Campaign registration in order to service your non-2FA use cases anyway, so the additional regulatory burden of including a 2FA use case would only be marginal.

### 2. Calculate the queue buildup and MPS rate for your application

Calculating your MPS (Messages Per Second) rate is crucial for building for scale. This will determine how big your queue will get and the rate at which messages will be sent.

Twilio queues your messages for 10 hours (36000 seconds) by default, so we will use this for the example calculations.

To calculate your MPS, divide the number of messages to be sent over the queue length. This will give you the required MPS limit to send out your messages. That means we would need to plan for the right Senders in your Messaging Service Sender Pool to be able to send messages at 2x your MPS.

To be safe, Twilio suggests that customers apply a 100% buffer to this MPS requirement, in the event that Telco carriers have capacity issues.

1. **Promotional**: To calculate our MPS, we divide our 1M promotional messages by 36,000 seconds, about 30 Messages need to be sent per second. In the name of safety, we'll have our the senders in our Messaging Service's Sender Pool send messages at a rate of 60 MPS.
2. **OTP**: Say you apply a 180-second validity period for 20,000 messages, with that buffer factor of 2x. That would require a 220 MPS limit requirement.

(We'll cover how to meet your various MPS limit requirements by provisioning your Senders in a later step.)

### 3. Set up Messaging Services for each of your use cases

After you've determine the key factors affecting your messaging for your use case(s), you can create Messaging Services for each one.

1. **Promotional**: Leave the Validity period to the default (10 hours/36000 seconds).
2. **OTP:** Set the Validity period to be a short duration, say 2 minutes (120 seconds).

You can create and manage your Messaging Service in the [Services section](https://www.twilio.com/console/sms/services) of the Twilio Console or using the REST API using the [Service Resource](/docs/messaging/api/service-resource).

Create a Messaging Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createService() {
  const service = await client.messaging.v1.services.create({
    friendlyName: "My OTP Messaging Service",
    validityPeriod: 120,
  });

  console.log(service.sid);
}

createService();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

service = client.messaging.v1.services.create(
    friendly_name="My OTP Messaging Service", validity_period=120
)

print(service.sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Messaging.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var service = await ServiceResource.CreateAsync(
            friendlyName: "My OTP Messaging Service", validityPeriod: 120);

        Console.WriteLine(service.Sid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.messaging.v1.Service;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Service service = Service.creator("My OTP Messaging Service").setValidityPeriod(120).create();

        System.out.println(service.getSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	messaging "github.com/twilio/twilio-go/rest/messaging/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &messaging.CreateServiceParams{}
	params.SetFriendlyName("My OTP Messaging Service")
	params.SetValidityPeriod(120)

	resp, err := client.MessagingV1.CreateService(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Sid != nil {
			fmt.Println(*resp.Sid)
		} else {
			fmt.Println(resp.Sid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$service = $twilio->messaging->v1->services->create(
    "My OTP Messaging Service", // FriendlyName
    ["validityPeriod" => 120]
);

print $service->sid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

service = @client
          .messaging
          .v1
          .services
          .create(
            friendly_name: 'My OTP Messaging Service',
            validity_period: 120
          )

puts service.sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:messaging:v1:services:create \
   --friendly-name "My OTP Messaging Service" \
   --validity-period 120
```

```bash
curl -X POST "https://messaging.twilio.com/v1/Services" \
--data-urlencode "FriendlyName=My OTP Messaging Service" \
--data-urlencode "ValidityPeriod=120" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "date_created": "2015-07-30T20:12:31Z",
  "date_updated": "2015-07-30T20:12:33Z",
  "friendly_name": "My OTP Messaging Service",
  "inbound_request_url": "https://www.example.com/",
  "inbound_method": "POST",
  "fallback_url": "https://www.example.com",
  "fallback_method": "GET",
  "status_callback": "https://www.example.com",
  "sticky_sender": true,
  "smart_encoding": false,
  "mms_converter": true,
  "fallback_to_long_code": true,
  "scan_message_content": "inherit",
  "area_code_geomatch": true,
  "validity_period": 120,
  "synchronous_validation": true,
  "usecase": "marketing",
  "us_app_to_person_registered": false,
  "use_inbound_webhook_on_number": true,
  "links": {
    "phone_numbers": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/PhoneNumbers",
    "short_codes": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ShortCodes",
    "alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AlphaSenders",
    "messages": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages",
    "us_app_to_person": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p",
    "us_app_to_person_usecases": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Compliance/Usa2p/Usecases",
    "channel_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/ChannelSenders",
    "destination_alpha_senders": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/DestinationAlphaSenders"
  },
  "url": "https://messaging.twilio.com/v1/Services/MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 4. Provision Senders into your Messaging Service Sender Pools

In a previous step, you calculated your MPS requirements and added a buffer to make sure your messages were sent in the appropriate window of time for your two use cases. To meet these requirements, you'll want to add different Senders to your Messaging Services' Sender Pools.

To adhere to carrier requirements, each Sender (phone number) on Twilio has specific MPS limits. These limits vary by both Sender type and location. For example, [Short Codes](/docs/glossary/what-is-a-short-code) have a 100 MPS limit. A [Long Code](/docs/glossary/what-long-code-phone-number) in the US has 1 MPS, but a Long Code in the UK could have 10 MPS.

### 5. Time your message campaigns

Now that you have Messaging Services with the appropriate configurations and Sender Pool, you can set up your messages to be delivered on time with the Twilio Programmable Messaging API.

1. **Promotional:** Queue them up in the morning so your messages have plenty of time to get delivered.
2. **OTP:** Set up your application to automatically send OTP messages as needed.

Send a Message with a Messaging Service

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function createMessage() {
  const message = await client.messages.create({
    body: "Our biggest sale of the year starts in one hour! Make sure you're already signed-up and logged in.",
    messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
    to: "+14155552345",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

message = client.messages.create(
    to="+14155552345",
    messaging_service_sid="MG9752274e9e519418a7406176694466fa",
    body="Our biggest sale of the year starts in one hour! Make sure you're already signed-up and logged in.",
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var message = await MessageResource.CreateAsync(
            to: new Twilio.Types.PhoneNumber("+14155552345"),
            messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
            body: "Our biggest sale of the year starts in one hour! Make sure you're already signed-up and logged in.");

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("+14155552345"),
                                  "MG9752274e9e519418a7406176694466fa",
                                  "Our biggest sale of the year starts in one hour! Make sure you're already signed-up "
                                  + "and logged in.")
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &api.CreateMessageParams{}
	params.SetTo("+14155552345")
	params.SetMessagingServiceSid("MG9752274e9e519418a7406176694466fa")
	params.SetBody("Our biggest sale of the year starts in one hour! Make sure you're already signed-up and logged in.")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$message = $twilio->messages->create(
    "+14155552345", // To
    [
        "messagingServiceSid" => "MG9752274e9e519418a7406176694466fa",
        "body" =>
            "Our biggest sale of the year starts in one hour! Make sure you're already signed-up and logged in.",
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

message = @client
          .api
          .v2010
          .messages
          .create(
            to: '+14155552345',
            messaging_service_sid: 'MG9752274e9e519418a7406176694466fa',
            body: 'Our biggest sale of the year starts in one hour! Make sure you\'re already signed-up and logged in.'
          )

puts message.body
```

```bash
EXCLAMATION_MARK='!'
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --to +14155552345 \
   --messaging-service-sid MG9752274e9e519418a7406176694466fa \
   --body "Our biggest sale of the year starts in one hour$EXCLAMATION_MARK Make sure you're already signed-up and logged in."
```

```bash
EXCLAMATION_MARK='!'
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "To=+14155552345" \
--data-urlencode "MessagingServiceSid=MG9752274e9e519418a7406176694466fa" \
--data-urlencode "Body=Our biggest sale of the year starts in one hour$EXCLAMATION_MARK Make sure you're already signed-up and logged in." \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "api_version": "2010-04-01",
  "body": "Our biggest sale of the year starts in one hour! Make sure you're already signed-up and logged in.",
  "date_created": "Thu, 24 Aug 2023 05:01:45 +0000",
  "date_sent": "Thu, 24 Aug 2023 05:01:45 +0000",
  "date_updated": "Thu, 24 Aug 2023 05:01:45 +0000",
  "direction": "outbound-api",
  "error_code": null,
  "error_message": null,
  "from": "+14155552345",
  "num_media": "0",
  "num_segments": "1",
  "price": null,
  "price_unit": null,
  "messaging_service_sid": "MG9752274e9e519418a7406176694466fa",
  "sid": "SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "queued",
  "subresource_uris": {
    "media": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Media.json"
  },
  "to": "+14155552345",
  "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json"
}
```

### 6. Monitor your Messaging Capacity via the Latency Report on Messaging Insights

> \[!WARNING]
>
> Latency is calculated as the *time on Twilio Platform* (the time taken by Twilio from receiving an API request to sending the Message to carriers). It does not represent any downstream carrier-related latency because Twilio does not have full visibility into handset delivery.

You can keep an eye on your messaging application using Twilio's [Messaging Insights in the Twilio Console](https://www.twilio.com/console/sms/insights/delivery). (Check out our doc on [Exploring Messaging Insights](/docs/messaging/features/messaging-insights).)

![Graphs showing outgoing and incoming message statistics with error rates and status percentages from Jan 1 to Jan 7.](https://docs-resources.prod.twilio.com/7d7c128f3d1b5aca27bb22d0823b0a963b830e18058b78c937f4d98db09457fa.png)

Within Messaging Insights, the **Latency Insights report** will highlight if there are latency issues with any of your Senders, Messaging Services, or Twilio sub-accounts, in near real-time. The **Messaging Insights Delivery & Errors** report will help you determine the health of delivery rates and identify if there are certain errors you should troubleshoot.

View the Latency Report to see how quickly your messages are being processed by the Twilio platform. If there are issues contributing to increased latency of your messages on Twilio's platform, they will show up in the charts dedicated to **Sender**, **Messaging Service** and **Account-level queueing**.

![Twilio messaging latency dashboard showing 46 min max latency, 1k messages queued, 10k overflow errors.](https://docs-resources.prod.twilio.com/7e77b0783bafa2f6b601f0b3931653a581cfb91fe5559a27c4f29ef613f45f12.png)

When any of these entities--Senders, Messaging Services, or Account-level issues--cause too much latency and large queues, you can see the send rate limits by hovering over the column of interest and clicking the **View Limits** button. Twilio also provides guidance of what to do next within the modals that appear upon clicking.

![Graph showing message delays due to sender 98567 exceeding send rate limit with 604,000 queued and 210,000 sent.](https://docs-resources.prod.twilio.com/1b743d81748d9c5bee9d3eafa6072e8657180fdbd59ea3c9104e91b4de37547f.png)

You can use the dashboards in Messaging Insights to monitor your messaging throughout the day, as the sales roll in from your smart pre-Black Friday planning.

### 7. Handling large emergency use cases

Say your billing systems go down and you need to notify all your customers that sales will be delayed for a while. Your normal account limits may not suffice in such large situations. Reach out to Twilio and we may be able to help by adjusting the limits applied to your account, senders, or messaging services.

## Handy reference guides for calculating queueing and sender needs

Here's a quick reference on how you could calculate your queueing / sender needs as described above.

### Promotional Use Case Messaging Service

* Messages to Send: 1000000 [message segments](https://www.twilio.com/blog/what-the-heck-is-a-segment-html)
* Validity period (default) 36000 seconds
* Approximate MPS needed: 70 messages/second
* Applied Buffer factor: 200%
* Total MPS to plan for: 140 messages/second

| Promotional Sender Pool Type | Why?                       | Quantity | MPS Capacity | Total MPS Capacity✝ |
| ---------------------------- | -------------------------- | -------- | ------------ | ------------------- |
| Short Code                   | High Capacity (but pricey) | 1        | 100          | 100                 |
| UK Long Code                 | For UK fallback            | 2        | 10           | 20                  |
| US Long Code                 | For US fallback            | 10       | 1            | 10                  |
| Canada Long Code             | For Canada Fallback        | 10       | 1            | 10                  |
| Total                        |                            | 23       |              | 140                 |

✝ Total MPS Capacity = Quantity \* MPS Capacity

### OTP Use Case Messaging Service

* Assumed Click Conversion to Login: 2%
* Number of OTP messages: 20,000 message segments
* Validity Period: 180 seconds
* Approximate MPS needed: 110
* Buffer applied 200%
* Total MPS to plan for: 220

| OTP Sender Pool Type | Why?                       | Quantity | MPS Capacity | Total MPS Capacity✝ |
| -------------------- | -------------------------- | -------- | ------------ | ------------------- |
| Short Code           | High Capacity (but pricey) | 1        | 100          | 100                 |
| Toll Free            | Medium Capacity, Cheap     | 2        | 25           | 50                  |
| UK Long Code         | For UK fallback            | 4        | 10           | 40                  |
| US Long Code         | For US fallback            | 10       | 1            | 10                  |
| Canada Long Code     | For Canada fallback        | 2        | 10           | 20                  |
| Total                |                            | 19       |              | 220                 |

✝ Total MPS Capacity = Quantity \* MPS Capacity

### 8. Gracefully handle errors

Customers sending large volumes of messages may encounter errors such as Queue Overflow, in order to track these errors programmatically use [Twilio's Debugger](/docs/usage/troubleshooting/debugging-event-webhooks) by setting a webhook for these types of errors. If you, for example, get a [30001](/docs/api/errors/30001) error you can slow down your application by implementing backoff and retries.

## Where to Next?

This guide walked you through how to set up two Messaging Services for a time-sensitive, high-volume event using Twilio Messages. As you can scale, you can implement the steps and strategies in this guide across multiple Twilio Accounts, each containing one or more Messaging Services as you build different applications. Let's build something amazing.

* [Explore Messaging Insights](/docs/messaging/features/messaging-insights)
* [Messaging Service Features](/docs/messaging/services)
* [How to Send Messages with Messaging Services](/docs/messaging/tutorials/send-messages-with-messaging-services)

# Alphanumeric Sender IDs in Messaging Services

## Feature Overview

[Alphanumeric Sender IDs](/docs/glossary/what-alphanumeric-sender-id) are used for branded one-way messaging. You can add an Alphanumeric Sender ID to the Sender Pool of your Messaging Service to enable this feature.

See [this overview document](/docs/messaging/services#alphanumeric-sender) on the benefits and features of using **Messaging Services** vs specifying individual phone number Senders for Messaging.

With Alphanumeric Senders, you can send your messages to customers from a customized, branded sender that you have added to your Messaging Service. Instead of using an [E.164](/docs/glossary/what-e164)-formatted Twilio phone number or Short Code for the From value, you can use a custom string such as your own business or organization name. Alphanumeric Sender IDs may be used at no additional cost when sending an SMS to [countries that support this feature](https://help.twilio.com/hc/en-us/articles/223133767-International-support-for-Alphanumeric-Sender-ID).

> \[!NOTE]
>
> NOTE: Support for sending messages from an Alphanumeric Sender depends on your destination (`To`) phone number and is not available everywhere. This feature is not available in the United States or Canada. See [this article for the full list of countries that support this feature](https://help.twilio.com/hc/en-us/articles/223133767-International-support-for-Alphanumeric-Sender-ID).

If you add an Alphanumeric Sender to your Twilio Messaging Service, Twilio will select the Alphanumeric Sender ID automatically when you send a message to a supported country, unless you also have a [short code number](https://help.twilio.com/hc/en-us/articles/223182068-What-is-a-Messaging-Short-Code-) in that same country.

## Benefits of messaging with Alphanumeric Sender ID

**Higher message deliverability**: In many countries, regulatory bodies are increasingly filtering illegitimate A2P SMS use cases to curb unwanted messaging. For every Alphanumeric Sender ID request, Twilio completes a rigorous due-diligence and registration process with the telecommunication carrier(s) in that country. Once this process is completed, Twilio handles fluctuating telecom logic, regulations, and carrier-specific rules to ensure your A2P messages reach their destination.\
**Improved brand recognition**: Because recipients see your name with every SMS sent, using a recognizable Alphanumeric Sender ID reinforces your branding.

**Increased open rates**: As cases of spam and fraud increase, being able to identify the sender is a key factor in whether recipients decide whether to open a message. If the sender is an international or unfamiliar number, the chance of the message being opened is next to none. With Alphanumeric Sender IDs, recipients immediately recognize the sender and know the message is legitimate. As a result, they are up to 80% more likely to open the message.\
**Alternative to 10DLC A2P messaging:** Alphanumeric Sender IDs can help circumvent the common challenges to A2P messaging as a high-throughput and low carrier filtering option. However, Alphanumeric Sender IDs are not available in the US or Canada.

* In most supported countries, customers can instantly provision an Alphanumeric Sender ID. These Alphanumeric Sender IDs are known as "dynamic."
* Some countries require pre-registration, which means the customer has to provide information and sometimes additional documents, resulting in additional vetting time before the Alphanumeric Sender ID can be used. These Alphanumeric Sender IDs are known as "pre-registered."

## Which countries support Alphanumeric Sender IDs?

You can find out which countries do and do not support Alphanumeric Sender IDs [on this page](https://help.twilio.com/hc/en-us/articles/223133767-International-support-for-Alphanumeric-Sender-ID). The document also indicates, for each country, whether an Alphanumeric Sender ID can be provisioned 'dynamically' or instantly, or whether **pre-registration** is required. In the latter cases, the link labeled "[Yes - Pre-Registration Required](https://console.twilio.com/us1/develop/sms/senders/sender-id/new)" will take you to a form in the **Twilio Console** allowing you to initiate the pre-registration process for that country, including submission of any required documents. The country name itself will be a link taking you to the general SMS guidelines for that country.

## Limitations of Alphanumeric Sender IDs

As previously mentioned, Alphanumeric Sender IDs are not supported in some countries and some supported countries require pre-registration. Beyond this, be aware of the following further limitations:

* Alphanumeric Sender IDs are only supported for paid Twilio accounts; not for free trial accounts.
* Alphanumeric Sender IDs are only available for one-way outbound messages; recipients cannot reply directly to messages sent with Alphanumeric Senders (However, you can provide contact information in your message if you want recipients to respond).
* Some use cases are generally prohibited for Alphanumeric Sender messaging, just as they are using any other sender type (e.g., gambling, dating sites, adult content, spam, phishing, and any content that violates the law or infringes on intellectual property).
* In some countries, additional use cases are prohibited, which are noted in the [SMS Guidelines.](/en-us/guidelines/sms)

## Opt-In/Opt-Out Requirements

Users must specifically **opt in** to receive your messages and know how to **opt out** before you send your first message.

Note: Twilio's SMS **STOP** keyword does not work to automatically stop Alphanumeric Sender ID messaging. You must provide other instructions, such as writing a Support team, calling a Support phone line, or texting another phone number or code to allow users to opt out.

## Formatting Requirements

Alphanumeric Sender IDs can contain up to 11 characters, including upper- and lower-case letters, digits 0-9, and certain special characters. Find the detailed formatting requirements for Alphanumeric Sender IDs in [this Knowledge Base article](https://help.twilio.com/hc/en-us/articles/223133867-Using-Alphanumeric-Sender-ID-with-Messaging-Services).

> \[!NOTE]
>
> Note: In addition to the maximum length of 11 characters, some carriers may impose **minimum** length restrictions on Alphanumeric Sender IDs. This can result in your Alphanumeric Sender ID being modified or replaced by a generic sender ID, i.e. "unknown".

## How to add an Alphanumeric Sender ID

Before adding a specific Alphanumeric Sender ID, you must first validate that the feature is enabled in your account. To do so:

1. Access the [Programmable Messaging page in Console](https://www.twilio.com/console/sms/dashboard).
2. Click **Settings**.
3. From the **General Messaging Settings** page, Verify that "Alphanumeric Sender ID" is set to Enabled.

![General Messaging Settings with Alphanumeric Sender ID status enabled.](https://docs-resources.prod.twilio.com/9d84bb49e42afadbcd1cfb3505d539182b608e424e83e71149d49166aa20bae6.png)

Once you've verified that the status of this feature is Enabled (as shown above), to add a specific new Alphanumeric Sender to a Messaging Service:

1. Go to your [Messaging Services in the Twilio Console](https://www.twilio.com/console/sms/services).
2. Select the service you wish to add an Alpha Sender to.
3. Under the **Senders** section, click the **Add Senders IDs** button.
4. From the **Add Senders IDs** drop-down, select **Alpha Sender** and enter the alphanumeric sender ID that you want to add to the Sender Pool.

# Twilio Health Score for Messaging

## Overview

Your Twilio Health Score for Messaging provides a comprehensive overview of your messaging performance, and guides you on how to optimize deliverability and engagement. You can use your Twilio Health Score to:

* Quickly determine if your performance is on track compared to messaging industry benchmarks.
* Prioritize where to take action across five subscores (Sent Rate, Compliance, Fraud, Latency, and Engagement) and the issues most impacting your traffic ("Top Issues").
* View personalized recommendations, including the potential impact of improvements and relevant Twilio products that can enhance your traffic.
* Set actionable goals, track performance over time, and more easily justify resources investments.
* Learn about best practices for optimizing your end customers experience, monitoring compliance and fraud risk, optimizing latency, and more.

The Twilio Health Score for Messaging benchmarks and calculations are defined by analyzing all of Twilio's messaging traffic, which provides you with a comparison to the messaging industry. For example, if your overall score category is **Good**, this indicates your messaging deliverability is good relative to all of Twilio's messaging traffic.

Your total score is the sum of the five subscores and has a maximum score of 100. Twilio calculates the five subscores by analyzing errors and issues in your messaging traffic, using thresholds for acceptable issue rates based on best practices and Twilio data. For example, the Sent Rate subscore recognizes that some errors, like occasional error code 30005 when a device is off, are normal. In contrast, the Compliance subscore applies a stricter error rate threshold to set a higher bar for performance. Your score also provides comparison to industry-best-practice benchmarks that can help you optimize elements beyond deliverability. For example, ensuring OTP traffic latency is \< 10 seconds, or reducing your compliance risk and promoting message recipient trust by keeping opt out rates below 1%.

For each subscore, the "Top Issues" section shows you the issues with the biggest negative impact to your messaging health. Prioritize taking action on these so you can improve your Score and messaging traffic performance!

The score refreshes daily, and shows a 7-day-aggregated view of your traffic. You can filter your Twilio Health Score by account or subaccount.

![GIF showing the overall score, subscore breakdown, and top issues.](https://docs-resources.prod.twilio.com/29697a297061ab1f11072e3ea273932a31318845fec762a9c80f1c6f05866453.gif)

## Personalized Recommendations

Along with your score, you can view Personalized Recommendations that analyze your messaging data and identify key opportunities for improving deliverability. The feature provides tailored insights, estimates the potential impact of suggested changes, and highlights relevant Twilio products that can enhance your messaging performance. Recommendations are refreshed weekly alongside your Twilio Health Score for Messaing and are accessible through the Messaging Insights dashboard.

## Weekly Email Notification

Sign up to receive a weekly email notification of your socre so you can see how your messaging traffic is performing. The email provides your most recent score and a link to [Twilio Console Messaging Insights](https://console.twilio.com/us1/monitor/insights/sms), where you can view your score details.

If you have subaccounts, you can sign up at the parent account level and receive a weekly email. This email will show your main account score and highlight subaccounts with the most significant score changes. You can also receive individual emails for specific subaccounts.

You can find the Twilio Health Score for Messaing notification settings by navigating to **Twilio Console** > **Monitor** > **Insights** > **Messages** > **Overview** > **Manage Notifications**.

![Messaging Health Score with option to manage notifications.](https://docs-resources.prod.twilio.com/40e2f53b622f0d4ab2d653628113c243890b8faf4a5d153f6b35baba6b422605.png)

## Sent Rate

Sent rate measures the error rate for certain configuration and formatting errors, such as invalid destinations, unreachable handsets, missing message body, and mismatch between your From Number and Twilio account. Sent rate compares your rate for these errors against other senders on Twilio, giving you a benchmark to understand how your data quality and messaging setup stack up.

Monitor your sent rate to find opportunities to reduce avoidable errors and improve overall message deliverability.

The following error codes impact the Sent Rate subscore:

#### Click to expand the list of error codes

**Invalid numbers and addresses**

* [14101](/docs/api/errors/14101): Invalid `To` attribute.
* [21211](/docs/api/errors/21211): Invalid `To` phone number.
* [21212](/docs/api/errors/21212): Invalid `From` number.
* [21608](/docs/api/errors/21608): The `To` phone number provided is not yet verified for this account.
* [21612](/docs/api/errors/21612): Message cannot be sent with the current combination of `To` and/or `From` parameters.
* [21614](/docs/api/errors/21614): `To` number is not a valid mobile number.
* [21401](/docs/api/errors/21401): Invalid phone number.
* [21606](/docs/api/errors/21606): The `From` phone number provided is not a valid message-capable Twilio phone number for this destination/account.
* [30011](/docs/api/errors/30011): MMS not supported by the receiving phone number in this region.
* [30042](/docs/api/errors/30042): The Sender ID is blocked as generic or it contains special characters.
* [63024](/docs/api/errors/63024): Invalid message recipient.

**Unreachable or blocked destinations**

* [30003](/docs/api/errors/30003): Unreachable destination handset.
* [30004](/docs/api/errors/30004): Message blocked.
* [30005](/docs/api/errors/30005): Unknown destination handset.
* [30006](/docs/api/errors/30006): Landline or unreachable carrier.
* [30008](/docs/api/errors/30008): Unknown error.
* [60005](/docs/api/errors/60005): Downstream carrier error.
* [63036](/docs/api/errors/63036): The specified phone number cannot be reached by Rich Business Messaging (RBM) at this time.

**Invalid or missing parameters**

* [14103](/docs/api/errors/14103): Invalid body.
* [20422](/docs/api/errors/20422): Invalid parameter.
* [21602](/docs/api/errors/21602): Message body is required.
* [21603](/docs/api/errors/21603): A `From` or `MessagingServiceSid` parameter is required to send a message.
* [21609](/docs/api/errors/21609): Invalid `StatusCallback`.
* [21617](/docs/api/errors/21617): The concatenated message body exceeds the 1600 character limit.
* [21619](/docs/api/errors/21619): A message body, media URL, or content SID is required.
* [21621](/docs/api/errors/21621): The `From` number has not been enabled for MMS.
* [21910](/docs/api/errors/21910): Invalid `From` and `To` pair. `From` and `To` should be of the same channel.
* [21624](/docs/api/errors/21624): Invalid validity period value.
* [21627](/docs/api/errors/21627): Max price must be a valid float.
* [21654](/docs/api/errors/21654): `ContentSid` required.
* [21658](/docs/api/errors/21658): Parameter exceeded character limit.
* [21701](/docs/api/errors/21701): The Messaging Service does not exist.
* [21703](/docs/api/errors/21703): The Messaging Service does not have a phone number available to send a message.
* [21704](/docs/api/errors/21704): The Messaging Service contains no phone numbers.
* [35111](/docs/api/errors/35111): `SendAt` timestamp is missing.
* [35114](/docs/api/errors/35114): Scheduling does not support this timestamp.
* [35118](/docs/api/errors/35118): `MessagingServiceSid` is required to schedule a message.
* [63001](/docs/api/errors/63001): Channel could not authenticate the request. Please see channel-specific error message for more information.
* [63002](/docs/api/errors/63002): Channel could not find the `From` address.
* [63003](/docs/api/errors/63003): Channel could not find `To` address.
* [63007](/docs/api/errors/63007): Twilio could not find a channel with the specified `From` address.
* [63031](/docs/api/errors/63031): Channel's message cannot have the same `From` and `To`.

**Content and media errors**

* [11200](/docs/api/errors/11200): HTTP retrieval failure.
* [11205](/docs/api/errors/11205): HTTP connection failure.
* [11210](/docs/api/errors/11210): HTTP bad host name.
* [11215](/docs/api/errors/11215): HTTP too many redirects.
* [11220](/docs/api/errors/11220): SSL/TLS handshake error.
* [11237](/docs/api/errors/11237): Certificate invalid—could not find path to certificate.
* [12300](/docs/api/errors/12300): Invalid `Content-Type`.
* [11751](/docs/api/errors/11751): Media message—media exceeds messaging provider size limit.
* [21620](/docs/api/errors/21620): Invalid media URL(s).
* [30019](/docs/api/errors/30019): Content size exceeds carrier limit.
* [63019](/docs/api/errors/63019): Media failed to download.
* [63034](/docs/api/errors/63034): Media exceeds size limit.

**Channel and template issues**

* [19023](/docs/api/errors/19023): Invalid channel type.
* [30015](/docs/api/errors/30015): Non-supported channel type is used.
* [63005](/docs/api/errors/63005): Channel did not accept given content. Please see channel-specific error message for more information.
* [63009](/docs/api/errors/63009): Channel provider returned an internal service error (HTTP 5xx). Please see channel-specific error message for more information.
* [63012](/docs/api/errors/63012): Channel provider returned an internal service error.
* [63015](/docs/api/errors/63015): Channel Sandbox can only send messages to phone numbers that have joined the Sandbox.
* [63016](/docs/api/errors/63016): Failed to send a free-form message because you are outside the allowed window. If you are using WhatsApp, please use a Message Template.
* [63021](/docs/api/errors/63021): Channel invalid content error.
* [63027](/docs/api/errors/63027): Template does not exist for a language and locale.
* [63028](/docs/api/errors/63028): Number of parameters provided does not match the expected number of parameters.
* [63030](/docs/api/errors/63030): Unsupported parameter for type of channel's message.
* [63032](/docs/api/errors/63032): We cannot send this message to this user because of a WhatsApp limitation.
* [63040](/docs/api/errors/63040): Template rejected.
* [63041](/docs/api/errors/63041): Template paused.
* [63042](/docs/api/errors/63042): Template disabled.

**Internal and provider errors**

* [20410](/docs/api/errors/20410): Gone.
* [20500](/docs/api/errors/20500): Internal server error.
* [30410](/docs/api/errors/30410): Provider timeout error.
* [63010](/docs/api/errors/63010): Twilio's platform encountered an internal error processing this message.

Any error not listed here and not covered in the other four subscores will also be counted in Sent Rate.

## Compliance

Compliance evaluates adherence of your messaging traffic to regulatory, carrier, and platform-specific policies and guidelines. It includes error codes related to spam, registration issues, policy violations, and account restrictions, as well as performance metrics like opt-out rate. Monitor and address compliance-related errors and metrics to improve your Compliance subscore and maintain messaging reliability.

Twilio may reach out to you about compliance issues even if you have a high Compliance subscore.

The following errors and metrics impact the Compliance subscore:

#### Click to expand the list of error codes

**Spam, reputation, and content issues**

* [30007](/docs/api/errors/30007): Message filtered.

**Registration and verification issues**

* [30018](/docs/api/errors/30018): Destination carrier requires sender ID pre-registration.
* [30024](/docs/api/errors/30024): Numeric Sender ID not provisioned on carrier.
* [30032](/docs/api/errors/30032): Toll-Free number has not been verified.
* [30034](/docs/api/errors/30034): US A2P 10DLC—message from an unregistered number.
* [30035](/docs/api/errors/30035): US A2P 10DLC—message from a number still being configured.
* [30040](/docs/api/errors/30040): Destination carrier requires Sender ID pre-registration.
* [30445](/docs/api/errors/30445): Toll-Free verification rejection—invalid information.
* [63035](/docs/api/errors/63035): This operation is blocked because the Rich Business Messaging (RBM) agent has not launched and the recipient has not been invited and accepted the invitation to become a tester.

**Account and permission issues**

* [21408](/docs/api/errors/21408): Permission to send an SMS or MMS has not been enabled for the region indicated by the `To` number.
* [30002](/docs/api/errors/30002): Account suspended.
* [30037](/docs/api/errors/30037): Outbound messaging disabled.
* [63013](/docs/api/errors/63013): Channel policy violation.
* [63051](/docs/api/errors/63051): WhatsApp Business Account is locked.
* [90010](/docs/api/errors/90010): Account is not active.

**Rate limits and message caps**

* [30022](/docs/api/errors/30022): US A2P 10DLC—rate limits exceeded.
* [30023](/docs/api/errors/30023): US A2P 10DLC—daily message cap reached.
* [30027](/docs/api/errors/30027): US A2P 10DLC—T-Mobile daily message limit reached.

**Campaign and policy violations**

* [21610](/docs/api/errors/21610): Attempt to send to unsubscribed recipient.
* [30033](/docs/api/errors/30033): US A2P 10DLC—campaign suspended.

#### Click to expand the list of performance metrics

* Opt-Out Rate: Percentage of successful outbound messages that received an opt-out response (e.g., "STOP"). A rate under 1% is considered healthy; over 3% may lead to carrier filtering. By default, Twilio automatically handles opt-out keywords like STOP, START, and HELP. To customize keywords or user responses, consider enabling [Advanced Opt-Out](https://help.twilio.com/articles/360034798533-Getting-Started-with-Advanced-Opt-Out-for-Messaging-Services) for Messaging Services, which gives you full control over opt-in/out behavior and messaging

## Fraud

A high score is good. It means your messages are free from signs of fraud.

Fraud score measures the rate at which Twilio has identified potential fraudulent messages being sent to your destinations, relative to your total traffic. Monitor and address this error to increase your Fraud subscore, protect your organization, and promote trust and safety of your message recipients.

Twilio may reach out to you about fraud issues even if you have a high Fraud subscore.

The following error codes impact the Fraud subscore:

#### Click to expand the list of error codes

**Undeliverable messages**

* [30453](/docs/api/errors/30453): Message couldn't be delivered.

**Excluded error code**

* [30450](/docs/api/errors/30450): Message prevented from being sent out because of SMS Pumping Protection (explicitly excluded from Fraud Score).

## Latency

Latency measures how efficiently your messages are processed within Twilio and handed off to carriers. This includes errors (e.g., queuing, rate limits, congestion) as well as performance metrics that assess the percentage of your messages meeting best-practice latency benchmarks across different message categories (e.g., OTP, customer care, marketing).

Twilio categorizes your messages using various signals, including [Traffic Shaping Message Intent](https://www.twilio.com/docs/messaging/features/traffic-shaping), [10DLC A2P campaign use cases](https://help.twilio.com/articles/1260801844470-List-of-Campaign-Types-and-Use-Case-Types-for-A2P-10DLC-registration), usage of [Verify](https://www.twilio.com/docs/verify), and the [Messaging Feedback Resource](https://www.twilio.com/docs/messaging/guides/send-message-feedback-to-twilio).

These categorizations reflect the message's purpose and can affect its delivery priority and how it's handled by carriers.

You can improve latency by:

* Using high-priority sender types (e.g., short codes for OTPs).
* Segmenting your traffic by use case or intent ([learn more](https://www.twilio.com/docs/messaging/guides/scaling-queueing-latency)).
* Optimizing message content and routing logic.
* Leveraging tools like [Multi-Tenancy](https://www.twilio.com/docs/messaging/features/multi-tenancy) and [Traffic Shaping](https://www.twilio.com/docs/messaging/features/traffic-shaping) for smarter throughput allocation.

The following error codes impact the Latency subscore:

#### Click to expand the list of error codes

**Message limits and queuing issues**

* [20429](/docs/api/errors/20429): Too many requests.
* [21611](/docs/api/errors/21611): This `From` number has exceeded the maximum number of queued messages.
* [30001](/docs/api/errors/30001): Queue overflow.
* [63038](/docs/api/errors/63038): Account exceeded the daily messages limit.

**Rate limits and network congestion**

* [30017](/docs/api/errors/30017): Carrier network congestion.
* [63018](/docs/api/errors/63018): Rate limit exceeded for channel.

**Expired validity period**

* [30036](/docs/api/errors/30036): Validity period expired.

#### Click to expand the list performance metrics

* Critical & Time-Sensitive messages: This is the percentage of high-priority messages — like OTPs, fraud alerts, and conversations — that meet the best-practice latency benchmark for this category (under 10 seconds).
  * Traffic Shaping [`MessageIntent`](/docs/messaging/features/traffic-shaping) includes:
    * `otp`
    * `notifications` (account notifications, two-way conversational messaging)
    * `fraud`
    * `security`
  * [10DLC A2P campaign use case](https://help.twilio.com/articles/1260801844470-List-of-Campaign-Types-and-Use-Case-Types-for-A2P-10DLC-registration) includes:
    * `2FA`
    * `ACCOUNT_NOTIFICATION`
    * `PROXY` (conversational)
    * `FRAUD_ALERT`
    * `EMERGENCY`
    * `SECURITY_ALERT`
  * [Verify](/docs/verify)
  * [Message Feedback Resource used](/docs/messaging/guides/send-message-feedback-to-twilio).
* Notification & Customer Care messages: This is the percentage of messages, such as delivery notifications and support updates, that meet the best-practice latency benchmark for this category (under 10 minutes).
  * Traffic Shaping [`MessageIntent`](/docs/messaging/features/traffic-shaping) includes:
    * `customercare`
    * `delivery`
    * `education`
    * `events`
  * [10DLC A2P campaign use case](https://help.twilio.com/articles/1260801844470-List-of-Campaign-Types-and-Use-Case-Types-for-A2P-10DLC-registration) includes:
    * `CUSTOMER_CARE`
    * `DELIVERY_NOTIFICATION`
    * `HIGHER_EDUCATION`
    * `K12_EDUCATION`
    * `PUBLIC_SERVICE_ANNOUNCEMENT`
* Marketing & Announcements messages: This is the percentage of promotional or announcement messages that meet the best-practice latency benchmark for this category (under 2 hours).
  * Traffic Shaping [`MessageIntent`](/docs/messaging/features/traffic-shaping) is one of:
    * Polling and voting (non-political)
    * Public service announcement (non-emergency)
    * General and campaign marketing
  * [10DLC A2P campaign use case](/docs/messaging/features/traffic-shaping) is one of:
    * `POLITICAL`
    * `POLLING_VOTING`
    * `MARKETING`
    * `AGENTS_FRANCHISES`
    * `CHARITY`
    * `LOW_VOLUME`
    * `MIXED`
    * `SOCIAL`
    * `STARTER`
    * `SWEEPSTAKE`
* Unknown Category messages: This is the percentage of uncategorized messages as those sent via toll-free or short codes without an assigned [10DLC A2P campaign use case](/docs/messaging/features/traffic-shaping) or [`MessageIntent`](/docs/messaging/features/traffic-shaping) that meet the best-practice latency benchmark. Since the category is unknown and could include some Critical & Time-Sensitive messages, we use a 10-second benchmark.

## Engagement

Engagement evaluates the performance of message delivery in terms of user interaction and engagement. It encompasses error codes for expired certificates, unverified domains, and link shortening failures, as well as performance metrics like shortened link click rate and OTP conversion rate. By monitoring and addressing engagement-related errors, you can increase your Engagement subscore.

The following error codes impact the Engagement subscore:

#### Click to expand the list of error codes

**Certificate and domain issues**

* [30101](/docs/api/errors/30101): Domain is unverified.
* [30102](/docs/api/errors/30102): TLS certificate for your domain has expired.
* [30107](/docs/api/errors/30107): Domain private certificate has not been uploaded.

**Link shortening failures**

* [30103](/docs/api/errors/30103): Links not shortened due to application failure.

#### Click to expand the list of performance metrics

* Shortened Link Click Rate: The percentage of Twilio-shortened links clicked out of all messages using Twilio Link Shortening or categorized as Marketing & Announcements. To track link clicks, enable and configure Twilio [Link Shortening](https://www.twilio.com/docs/messaging/features/link-shortening).
* OTP Conversion Rate: This is the percentage of OTP/2FA messages that result in successful user verification. To track this metric, use Twilio's [Verify API](https://www.twilio.com/docs/verify/api) or [Messaging Feedback Resource](https://www.twilio.com/docs/messaging/api/message-feedback-resource).

# Messaging Insights

Twilio's **Messaging Insights** enable you to analyze your application's messaging activities, identify and debug issues, optimize delivery, monitor fraud protection, and find areas to boost engagement with your end-users.

Messaging Insights consist of:

* A collection of real-time dashboards ranging from messaging delivery and errors to responses and OTP (one-time password) conversions.
* Insights into the performance of Messaging Intelligence-based real-time messaging solutions like [SMS Pumping Protection](/docs/messaging/features/sms-pumping-protection-programmable-messaging).

## Visualize your Messaging data with dashboards

You can find the [Messaging Insights dashboards](/docs/messaging/features/messaging-insights/dashboards) in the Twilio Console under [Monitor > Insights > Messaging](https://www.twilio.com/console/sms/insights/delivery/). Use them to answer questions such as:

* What are the delivery rates for my messages, both incoming and outgoing?
* What caused delivery rates to drop during a certain time period?
* What are my opt-out rates?
* How many of my OTP messages are converting successfully?
* What is the volume and distribution of my scheduled messages for the coming week?
* What is the click through rate of my messages using shortened links?

Messaging Insights dashboards give you specific insight into the aspects of message delivery and engagement:

| Dashboard                                                                                                 | Description                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **[Overview](/docs/messaging/features/messaging-insights/dashboards#overview-dashboard)**                 | Displays a high-level view of your outgoing and incoming messages.                                                   |
| **[Delivery & Error](/docs/messaging/features/messaging-insights/dashboards#delivery--errors-dashboard)** | Displays three deep dives into factors that affect deliverability to help you identify what is causing an issue.     |
| **[Responses](/docs/messaging/features/messaging-insights/dashboards#responses-dashboard)**               | Includes different ways to visualize and filter the inbound messages that you're receiving back from your end-users. |
| **[OTP Conversion](/docs/messaging/features/messaging-insights/dashboards#otp-conversion-dashboard)**     | Aggregates and visualizes the information that you have sent to Twilio about successful OTP messages.                |
| **[Scheduled](/docs/messaging/features/messaging-insights/dashboards#scheduled-dashboard)**               | Displays metrics relating to the volume of your upcoming scheduled messages.                                         |
| **[Link Shortening](/docs/messaging/features/messaging-insights/dashboards#link-shortening-dashboard)**   | Visualizes success metrics such as deliverability and click through rate for messages using shortened links.         |

## Use Messaging Intelligence to enhance your insights

Twilio's Messaging Intelligence comprises a suite of real-time messaging solutions leveraging AI/ML algorithms to enhance customer value beyond the use of logs and the [Messaging Insights dashboards](/docs/messaging/features/messaging-insights/dashboards) discussed above.

Currently, the following Messaging Intelligence insights are supported:

| Messaging Intelligence Insights                                                                                          | Description                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[SMS Pumping Protection Insights](/docs/messaging/features/messaging-insights/sms-pumping-protection-insights)**<br /> | Monitors the efficacy of and estimated cost savings from using [SMS Pumping Protection](/docs/messaging/features/sms-pumping-protection-programmable-messaging). |

## Intelligent Discovery AI Assistant

The [Intelligent Discovery AI Assistant](/docs/messaging/features/intelligent-discovery-ai-assistant) is an AI-driven tool designed to help users interact with Twilio's messaging data using natural language. It assists in troubleshooting messaging-related issues, such as deliverability errors, by analyzing data and providing actionable recommendations. The Assistant supports both technical and non-technical users, offering features like identifying message delivery problems, providing country-specific and phone number-specific insights, and offering advanced recommendations. Users can also seamlessly connect with a live Twilio support agent if needed. The Assistant is accessible via the Messaging Insights Console and aims to streamline the troubleshooting process, reduce support tickets, and maintain customer trust.

## Deliverability Score

The [Messaging Deliverability Score](/docs/messaging/features/twilio-health-score-for-messaging) provides a high-level overview of the performance of your Twilio messaging traffic, helping you monitor the health of your messaging services. This score is composed of five subscores:

* Sent Rate
* Compliance
* Fraud
* Latency
* Engagement

Each of these subscores is calculated by analyzing outbound messaging traffic for errors and metrics such as scale and click-through rate. The score is refreshed weekly and can be filtered at the account or subaccount level. For detailed insights and issue resolution, you can use the Messaging Insights dashboards or the Intelligent Discovery Assistant.

## Recommendations

The [Intelligent Discovery Assistant for Twilio Messaging](/docs/messaging/features/intelligent-discovery-ai-assistant) offers personalized recommendations to optimize your messaging traffic by analyzing specific parameters of your data. It identifies issues such as high opt-out rates or spam complaints and provides tailored solutions to address these problems.

## Intelligent Alerts

[Intelligent Alerts for Twilio Messaging](/docs/messaging/features/intelligent-alerts) proactively monitors the health of your messaging traffic by analyzing changes in error code volumes using a combination of rules and machine learning models. This system dynamically configures thresholds based on historical data and real-time signals, identifying anomalies and notifying you of issues via email. You can manage notifications through the Twilio Console and review aggregated anomalies, categorized by impact, on the Intelligent Alerts summary page. The system also offers real-time analysis, adaptive thresholds, and a detailed breakdown of each alert, including possible causes and solutions.

## Where to next?

Now that you have an overview of what Twilio's Messaging Insights entail, you can:

* Read the [guide explaining the Messaging Insights real-time dashboards](/docs/messaging/features/messaging-insights/dashboards) and explore their use in the Twilio Console under [Monitor > Insights > Messaging](https://www.twilio.com/console/sms/insights/delivery/).
* Check out the Messaging Intelligence insights Twilio Console page under the [Monitor > Insights > Intelligence](https://console.twilio.com/us1/monitor/insights/intelligent-alerts?q=tabKey%3Dsms-pumping).

You can also learn more about Twilio's [Messaging Services](/docs/messaging/services) and factors that can affect [global messaging](/docs/messaging/guides/sending-international-sms-guide).

# Messaging Insights Dashboards

**Messaging Insights** real-time dashboards enable you to:

* Visualize and analyze your application's messaging activities.
* Identify and debug issues.
* Optimize delivery.
* Find areas to boost engagement with your end-users.

This guide walks you through the basic functionality of the dashboards along with common usage examples. You can find the dashboards in the Twilio Console by navigating to [Monitor > Insights > Messaging](https://www.twilio.com/console/sms/insights/delivery/).

## Drill down into your data with filters

You can use filters to narrow down your data across different dimensions throughout all of the Messaging Insights dashboards. These filters include:

* Time range
* Channel
* Carrier
* Country
* Delivery Status
* Messaging Service
* Error Code
* Sub-account
* Twilio number
* Used Scheduling

Use these filters to narrow down the range of messages to the ones you care about for a given task.

![Messaging Insights Filters.](https://docs-resources.prod.twilio.com/5d3a3b6643686f11e4039b7833f80da1f222ba8ab2d856d139eb5391bee028a0.png)

## Overview dashboard

The [Overview dashboard][] helps you analyze delivery health in your messaging application with this view of incoming versus outgoing messages. Use case, carrier filtering, and geography all affect message deliverability, so we recommend regular monitoring this dashboard to establish a baseline.

Access the following new products on the Communications Insights Overview page:

* **[Intelligent Discovery AI Assistant]**: Provides Generative AI assistance with Twilio's messaging data using natural language.
* **[Deliverability Score]**: Provides a high-level overview of the performance of your Twilio messaging traffic.
* **[Intelligent Alerts]**: Monitors the health of your messaging traffic through analysis of changes in error code volumes.

![Messaging Insights Overview Report.](https://docs-resources.prod.twilio.com/8051deaa5889085997f5955ef5cbc46cab419cd28d24c95a0594301072737ce1.jpg)

[Overview dashboard]: https://console.twilio.com/us1/monitor/insights/sms?frameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1

[Intelligent Discovery AI Assistant]: /docs/messaging/features/intelligent-discovery-ai-assistant

[Deliverability Score]: /docs/messaging/features/deliverability-score

[Intelligent Alerts]: /docs/messaging/features/intelligent-alerts

In this dashboard, the following tiles give you a high-level understanding of delivery rates:

Outgoing Messages

* **Status OK**: Counts messages with Delivery Status of "Delivered", "Delivery Unknown", and "Sent" as *Status OK*
* **Messages with Errors**: Counts messages of "Undelivered" or "Failed" as *Messages with Errors*

Incoming Messages

* **Received**: Incoming Messages that are successfully received and passed to your incoming webhook URL
* **Failed**: Incoming Messages that were not successfully received and passed to your incoming webhook URL

## Delivery & Errors dashboard

The [Delivery & Errors dashboard][] provides three views to identify patterns in delivery status, error code, and message rates of undelivered or failed messages. Once you identify patterns that affect message deliverability, you can find the most prevalent error codes. To see what's happening at a granular level, look at individual messages and go straight to the related [API Error or Warning documentation](/docs/api/errors).

![Messaging Insights Delivery & Errors Report.](https://docs-resources.prod.twilio.com/e108cdaf9f852d34782682440ecb46112dac181aafd15d05b97e0fb17bb3a980.jpg)

For example, you could visit the **Delivery & Errors** dashboard to identify the following patterns:

* A carrier incident causing a rise in undelivered messages
* A Twilio number being filtered
* Country-specific issues
* A misconfigured [Messaging Service](/docs/messaging/services)

The three views break down your deliverability data into different buckets, allowing you to find patterns in delivery status, error codes, and total messaging volume:

* **Delivery Status tab**: Monitor delivery status over time and identify issues by carriers, countries, subaccounts, Messaging Services, and phone numbers. Look for spikes to indicate changes.
* **Status Code**: Drill into error codes to quickly understand which ones are commonly appearing. You can click on the legend to go straight to the relevant documentation.
* **Total Messages**: See how many messages you sent, divided into different categories.

Selecting one of the three breakdown views changes the view of the data in the six charts below. Additionally, you can filter all of the charts by time range, carrier, and the to/from country.

[Delivery & Errors dashboard]: https://console.twilio.com/us1/monitor/insights/sms?frameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1&currentFrameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1%26__override_layout__%3Dembed%26q%3DKGFjdGl2ZUluc2lnaHRzVmlldzpkZWxpdmVyeSk%253D%26bifrost%3Dtrue

### Example: Triaging a spike in failed messages

![Under Delivery & Errors report, select failed messages, narrow the time window, filter by error code, follow the link to the relevant documentation for a given error code.](https://docs-resources.prod.twilio.com/d19787e3c1efd01bd2134de1d916bdec1f90522c249f6d1648f89bf638160266.gif)

Say that you notice a rise in the number of failed outgoing messages. Let's use the **Delivery & Errors** dashboard to debug.

1. **Triage** the spike by narrowing down to the time window that has the most instances of failed messages. Under the **Delivery Status** tab, select only the *Failed* delivery status.
2. **Drill down** to find the most common error codes on the **Status Code** tab.
3. **Fix**: Use the linked documentation to learn possible solutions, and view the list of messages to get a comprehensive view of the messages that are failing with that specific error code. For example, if you identified [Error 21614](/docs/api/errors/21614) as the most common error code within the pool of failed messages, the linked documentation explains possible solutions for handling invalid `to` phone numbers.

## Responses dashboard

The [Responses dashboard][] gives you a picture of how your end-users engage with your messages. Catch spikes in rates of opt-outs or "help" messages to find places where your users are disengaging or need more information.

![Messaging Insights Responses Report displaying pie chart of data.](https://docs-resources.prod.twilio.com/9249e4e5bdb6beb0fa691cc074b39b73927205023c387111f4b8470f3298e574.jpg)

The **Responses** dashboard displays all of the different responses that you receive from your end-users:

* **Other**: Most Twilio users want to optimize for increased "other" responses. These are messages that contain actual responses from your end-users, signaling engagement.
* **Opt-Out**: These are responses from users who choose not to receive further messages from you. (See the documentation on [Advanced Opt-Out](/docs/messaging/tutorials/advanced-opt-out).)
* **Help**: These are responses from users which match your defined "help" keywords.
* **Opt-in**: These are responses from end-users matching your defined "opt-in" keywords.

![Use the Responses report in Messaging Insights to see responses broken out by type and focus on opt-outs, help, and opt-in messages.](https://docs-resources.prod.twilio.com/7fb74161ad133be0beb2e0bf529dc55baa9b17a9c01fe6968efab3eef432d07c.gif)

[Responses dashboard]: https://console.twilio.com/us1/monitor/insights/sms?frameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1&currentFrameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1%26__override_layout__%3Dembed%26q%3DKGFjdGl2ZUluc2lnaHRzVmlldzpyZXNwb25zZSk%253D%26bifrost%3Dtrue

### Example: A spike in opt-out responses

If you notice a sharp increase in the number of opt-out responses in the **Responses** dashboard of Messaging Insights, hover over the chart to see the trend for a given day. From there, you can view the message list for these opt-out responses and determine if the spike is related to the content of messages that you sent during that time frame.

## OTP Conversion dashboard

The [OTP Conversion dashboard][] helps you see the effect of your funnel when someone uses [Two Factor Authentication](/docs/glossary/what-is-two-factor-authentication-2fa) (2FA) with the Feedback API.

Many Twilio customers send verification code messages using Twilio. Other terms for these messages include One-Time Passcode (OTP), 2FA, MFA, Verification Code, Pin Code, etc. with a 4-6 digit passcode that a user uses to authenticate.

![Messaging Insights OTP Conversion report.](https://docs-resources.prod.twilio.com/c260c2504be3f81831c64fcd4b4088370b16898de3e5c19101474dd7bbcb9187.jpg)

In the **OTP Conversion** dashboard, you can get a high-level view of your OTP delivery with the following tiles:

* **OTP Messages Attempted**: A message request to Twilio with the `provide_feedback` field set to True
* **OTP Messages with Status OK**: A message request to Twilio with the `provide_feedback` field set to true that has a delivery status of "OK"
* **OTP Conversion**: A "Confirmed" outcome that has been provided for a Message is considered a conversion event.

[OTP Conversion dashboard]: https://console.twilio.com/us1/monitor/insights/sms?frameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1&currentFrameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1%26__override_layout__%3Dembed%26q%3DKGFjdGl2ZUluc2lnaHRzVmlldzpwYXNzY29kZS1jb252ZXJzaW9uKQ%253D%253D%26bifrost%3Dtrue

### How Twilio improves message deliverability

You can add the `provideFeedback` parameter on an [API request to create a message](/docs/messaging/api/message-resource). When your end-user correctly inputs the OTP and authenticates, you [send message feedback to Twilio](/docs/messaging/guides/send-message-feedback-to-twilio). Your messages are delivered more consistently if you use the [Feedback resource](/docs/messaging/api/message-feedback-resource) to send Twilio a confirmation when you know one of your end-users has successfully received your message.

This feedback on message delivery provides more accurate and complete information than what is often provided by carriers. Twilio uses AI-based routing systems to monitor the conversion signal that we receive and improve our messaging traffic. If our systems detect a drop in OTP conversion rates, for example, Twilio quickly changes the routing accordingly.

> \[!NOTE]
>
> You must be using [Twilio's Feedback API](/docs/messaging/guides/send-message-feedback-to-twilio) to activate the OTP Conversion dashboard.
>
> We recommend using the `provideFeedback` parameter on *only* OTP messages to ensure a clean set of OTP-related data in the OTP Conversion dashboard.

### Example: Calculate cost-per-conversion

Let's say that you have used the `provideFeedback` parameter and submitted feedback information via the Feedback Resource. In the **OTP Conversion** dashboard, Twilio aggregates all of the data streams to show you:

* how many OTP messages you have attempted sending via Twilio ("OTP Messages Sent")
* how many messages had no delivery issues ("OTP Messages with Status OK")
* how many messages converted ("OTP Conversions")
* the number of countries in which you are sending OTP messages

First, calculate the cost of total messages attempted ("OTP Messages Sent"). Dividing this number by the number of total successful conversions ("OTP Messages with Status OK") yields the average cost per conversion. Knowing this metric indicates whether your systems are using user authentication in a cost-effective way.

Additionally, you can visualize your per-country data in the *OTP Message Volume* chart. Clicking on any of the countries listed filters down to that specific country so that you can track delivery and conversion on a per-country basis.

## Scheduled dashboard

The [Scheduled dashboard][] shows metrics related to the volume of messages that are scheduled to be sent using [Message Scheduling](/docs/messaging/features/message-scheduling). You can use it to view the amount of upcoming scheduled messages by day or hour so you can make informed decisions about your future throughput.

![Messaging Insights Scheduled dashboard.](https://docs-resources.prod.twilio.com/59476087b66187c32a698892f3dc4473336d70b2104f157f1db2103f5b094beb.png)

The **Total scheduled messages** tile shows you how many messages are currently scheduled and the amount of schedulable messages remaining on your account.

The **Scheduled Messages** graph visually displays the volume and distribution of scheduled messages over the selected date and duration ranges.

[Scheduled dashboard]: https://console.twilio.com/us1/monitor/insights/sms?frameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1&currentFrameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1%26__override_layout__%3Dembed%26q%3DKGFjdGl2ZUluc2lnaHRzVmlldzpzY2VoZHVsZWQp%26bifrost%3Dtrue

## Link Shortening dashboard

The [Link Shortening dashboard][] shows success metrics for messages sent using [Link Shortening](/docs/messaging/features/link-shortening), a feature that shortens long links within message bodies. You can use the information provided such as deliverability and click-through rates to assess the effectiveness of messages sent using shortened links.

![Messaging Insights Link Shortening dashboard.](https://docs-resources.prod.twilio.com/d16c7d996a641ee844f0ad034c8531aa9296e4c3a4d344e38d5c73a57e30b24f.png)

The **Messages with Shortened Links** tile shows you how many messages you sent with Link Shortening enabled, how many links were resolved (clicked), and the overall click-through rate (CTR) percentage.

The **Shortened Link Click Tracking** graph displays the lifecycle view of messages sent with and without Link Shortening so you can compare their deliverability rates.

The **Click-through rate over time** graph shows the number of messages delivered with Link Shortening and how many of those links were clicked.

[Link Shortening dashboard]: https://console.twilio.com/us1/monitor/insights/sms?frameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1&currentFrameUrl=%2Fconsole%2Fsms%2Finsights%2Fdelivery%3Fx-target-region%3Dus1%26__override_layout__%3Dembed%26q%3DKGFjdGl2ZUluc2lnaHRzVmlldzpsaW5rLXNob3J0ZW5pbmcp%26bifrost%3Dtrue

## Where to next?

Visit [Messaging Insights in the Console](https://www.twilio.com/console/sms/insights/delivery/) to explore the different dashboards and learn more about the factors influencing your message delivery rates.

# SMS Pumping Protection Insights

[SMS Pumping Protection](/docs/messaging/features/sms-pumping-protection-programmable-messaging) uses automatic fraud detection to block messages flagged as being suspicious for SMS pumping fraud from being sent.
It works by analyzing your current and historical SMS traffic for unusual patterns. When there are unexpected fluctuations in your SMS traffic for a specific location, or system-known malicious activity, this feature will automatically block messages to phone numbers associated with the suspected fraud.

**SMS Pumping Protection Insights** provides you with data visualizations and filtering capabilities to:

* Monitor estimated cost savings from SMS Pumping Protection.
* Analyze trends in messages scanned by SMS Pumping Protection.
* Understand the geographic breakdown of your SMS Pumping Protection.

SMS Pumping Protection Insights can be found in the Console by navigating to **[Monitor > Insights > Intelligence](https://console.twilio.com/us1/monitor/insights/intelligent-alerts?q=tabKey%3Dsms-pumping)**.
The Messaging Intelligence Console page contains:

* The **SMS Pumping** tab with the SMS Pumping Protection Insights dashboard.
* Controls to filter your dashboard data.

![SMS Pumping Protection Insights dashboard showing 65,313 blocked attempts and cost savings details.](https://docs-resources.prod.twilio.com/fdb9d134ab243199d2b44203befb270df220f85881d592a1b72ab7dd3ce8fc05.png)

### Enable SMS Pumping Protection

Before you can benefit from the information provided by SMS Pumping Protection Insights, you must ensure that SMS Pumping Protection is enabled for your account.

If you navigate to [SMS Pumping Protection Insights in Console](https://console.twilio.com/us1/monitor/insights/intelligent-alerts?q=tabKey%3Dsms-pumping) and see the banner titled **Access Needed. Activate SMS Pumping Protection to secure your messaging from fraudulent activities**, your SMS Pumping Protection is disabled.

* Press the **Enable SMS Pumping Protection** button to [enable SMS Pumping Protection](/docs/messaging/features/sms-pumping-protection-programmable-messaging#enable-sms-pumping-protection).
* Press the **Learn more about this feature** button to gain a better understanding of what SMS Pumping Protection is and why it is important to use.

![SMS Pumping Protection Insights showing 65,313 blocked attempts and $11,400 estimated cost savings.](https://docs-resources.prod.twilio.com/230d67284975aafc79e0f91ecb93a0815a9438a9946ded73dd0f6b284c5afb41.png)

### Filter SMS Pumping Protection Insights

You can filter the data displayed in your SMS Pumping Protection Insights dashboard in two ways:

* By **Time Range**
* Using one or more **Filter by** criteria applied as **Global Filters**. **Filter by** criteria supported for SMS Pumping Protection Insights are:
  * **From Country**
  * **To Country**
  * **Subaccount**

![Messaging Intelligence dashboard with filters for time range and country.](https://docs-resources.prod.twilio.com/3278dfeabd14fa74ae693ad2ca66b20bc6d2d40df8b614e7de2830fccb68fa82.png)

### Monitor cost savings from SMS Pumping Protection

The top section of your SMS Pumping Protection Insights dashboard focuses on providing you key indicators of the performance and cost savings achieved by using SMS Pumping Protection.

This dashboard section contains the following message volume information:

* Total blocked SMS pumping attempts
* Number of messages successfully sent after scanning
* Total number of messages sent

In order to monitor the financial impact of using SMS Pumping Protection this section displays your:

* Estimated total cost savings (USD)
* Estimated savings rate (%)
* SMS pumping spend prevented
* SMS pumping prevention cost
* Total charge

You can press the **info** icon next to these dashboard items to see additional information.
Press the **Export CSV** button to download the data displayed in this section for further analysis.

![Monitor SMS Pumping Protection cost savings.](https://docs-resources.prod.twilio.com/9fbc34aca849bdf3e67ec3e40338645c48d46f6b4b86c4856412a95e0fcc05f7.png)

### Analyze trends in messages scanned by SMS Pumping Protection

The **Messages scanned by SMS Pumping Protection** section of the SMS Pumping Insights dashboard visualizes the time trend of the volume of your **Messages sent** and **Messages blocked** in a stacked bar chart.

The chart legend contains checkboxes to dynamically change which data to display, use the:

* **Show all messages scanned** checkbox to see all data.
* **Sent** checkbox to toggle the display of **Messages sent** in the chart on and off.
* **Blocked** checkbox to toggle the display of **Messages blocked** in the chart on and off.

You can use the **Chart View/Table View** button group to change the data display mode.

Press the **Export** button to download the data displayed in the chart for further analysis.

![Bar chart showing SMS messages scanned, sent, and blocked from Aug 1 to Aug 31, 2023.](https://docs-resources.prod.twilio.com/adda4347ccfe0d14eb74657cdf181f377f28a1b6f33969dd550e639eb8dc8d19.png)

### Understand the geographic breakdown of your SMS Pumping Protection

The **SMS Pumping protection by origin countries** section of the SMS Pumping Insights dashboard allows you to visualize
the volume distribution of blocked SMS pumping traffic in a world map so that you can analyze the geographic origins of fraud activities.

Using the dropdown menu you can change which metric is represented by the bubbles overlayed on the world map by selecting one of the following two options:

* **Total blocked SMS Pumping attempts**.
* **Estimated total cost savings** from SMS Pumping Protection.

The bubbles' sizes are scaled proportionally in accordance with your chosen metric. You can hover over a bubble to see a tooltip with the corresponding country name and value for the metric.

Depending on your chosen metric, you can check the right-hand sidebar to see a list of your:

* **Top countries with SMS pumping**.
* **Top country cost savings**.

You can use the **Chart View/Table View** button group to change the data display mode.

Press the **Export** button to download the data displayed in the geomap for further analysis.

![World map showing SMS pumping protection by origin countries with top 10 listed, including the US and Russia.](https://docs-resources.prod.twilio.com/27dce2cec3912266bf7cec2b32fde15467d6ccb2d66295eb50576bd78aab51ba.gif)

## What's next

Review the other data visualization and analytics capabilities offered by [Messaging Insights](/docs/messaging/features/messaging-insights).

To get a better understanding of SMS Pumping Protection:

* Check out our [SMS Pumping Protection for Programmable Messaging](/docs/messaging/features/sms-pumping-protection-programmable-messaging) feature documentation.
* Read our guide to [Preventing Fraud in Programmable Messaging](/docs/messaging/guides/preventing-messaging-fraud).

# Multi-Tenancy

> \[!IMPORTANT]
>
> Multi-Tenancy is currently in **Public Beta**. [Learn more about beta product support](https://help.twilio.com/hc/en-us/articles/115002413087-Twilio-Beta-product-support).

Multi-Tenancy is a Programmable Messaging product within the [Traffic Optimization Engine](https://www.twilio.com/en-us/blog/signal-2023-product-announcements) that allows Twilio customers to fine-tune messaging throughput and allocate their total capacity by subaccount.

Multi-Tenancy allows you to prevent specific subaccounts and/or senders from using all of the parent Account's available throughput when other subaccounts and/or senders also need throughput. Multi-Tenancy allows you to skip manual configuration of throughput on each subaccount to achieve fair distribution. Instead, Twilio algorithmically determines capacity distribution in accordance with your parent Account's configuration for each destination country's sender type and channel combinations.

With Multi-Tenancy enabled, Twilio algorithmically distributes a minimum share of throughput to each subaccount in a fair manner at the moment it's needed. When the subaccount's messages have finished processing, Twilio dynamically redistributes the newly-available throughput across the remaining queues that contain messages waiting to leave the Twilio platform.

Multi-Tenancy applies to SMS and MMS messaging traffic from any of your senders (short code, toll-free, alphanumeric senders, and ten-digit long code phone numbers) except for US and Canada A2P 10DLC traffic.

## Configuration options

Multi-Tenancy is available in three forms, and is applied to all traffic sent towards the same destination country. For each destination country, Twilio can apply one of the following Multi-Tenancy options to your Account: [None](#no-multi-tenancy), [Even](#even-multi-tenancy), or [Weighted](#weighted-multi-tenancy).

Multi-Tenancy is interoperable with [Traffic Shaping](/docs/messaging/features/traffic-shaping). You can use both products to allocate throughput both at the subaccount level with Multi-Tenancy, and at the message level with Traffic Shaping ([Service Level](/docs/messaging/features/traffic-shaping#service-levels), use case, and sender type).

### No Multi-Tenancy

If no Multi-Tenancy is applied to your traffic, throughput may not be distributed across all of the subaccounts in a way where each sender receives a guaranteed share of throughput.\
The animation below shows a visualization of **no** Multi-Tenancy. Messages from three different subaccounts enter a single queue, and leave the queue at the parent Account's maximum throughput (in this example, 100 MPS).

![Flowchart showing US-ATT SMS queue with tiers and subaccounts weighted distribution.](https://docs-resources.prod.twilio.com/8d68355ebae33d0e7f7c6ac145d8c9312235cb8ab55d2a575dcdd48d46a2ed7a.gif)

### Even Multi-Tenancy

With Even Multi-Tenancy, all subaccounts currently sending messages towards the same destination country receive an **equal** **share** of the total throughput available on your parent Account for that destination.

The animation below shows a visualization of **Even** Multi-Tenancy. There are three subaccount queues, all with an equal share of the parent Account's maximum throughput. Since the parent Account's maximum throughput is 100 MPS, each of the three subaccounts has 33.33 MPS available. Whenever one subaccount's queue is empty, that subaccount's 33.33 MPS throughput is shared evenly between the other non-empty subaccount queues.

![Even Multi-Tenancy visualization.](https://docs-resources.prod.twilio.com/f2573e3ce61142bc65ee2b57f6b908864b850e1f22526ad37f3cf29dcc9c0e2e.gif)

### Weighted Multi-Tenancy

With Weighted Multi-Tenancy, all subaccounts currently sending messages towards the same destination country receive a **weighted share** of the total throughput available on the parent Account for that destination country.

You can define weights on the subaccounts that send the greatest volume of traffic, which will ensure they receive a minimum share of throughput proportional to its weight at all times.

The animation below shows a visualization of a **Weighted** Multi-Tenancy configuration. One subaccount (Subaccount 3) in Tier 1 is assigned 80% of the parent Account's throughput. In this example, the parent Account has 100 MPS total throughput, so Subaccount 3 has 80 MPS. The remaining 20% of throughput is split between the two other subaccounts (Subaccount 1 and 2) in Tier 2, providing 10 MPS for each subaccount. When a subaccount's queue is empty, the allocated throughput is evenly shared dynamically amongst the remaining subaccount queues in the same Tier.

![Weighted Multi-Tenancy visualization.](https://docs-resources.prod.twilio.com/700ae302956a1da059b9c2f3d55decd0165fa4f3bef9201f90855e878549e11a.gif)

## Get started

Multi-Tenancy is now available in Public Beta to all Programmable Messaging customers. Talk to your Account owner or [Support](https://help.twilio.com/) for pricing details.

### Prerequisites

Before you can use Multi-Tenancy on your Twilio Account(s), you must be onboarded to Market Throughput. For more information, read the [Market Throughput product guide](/docs/messaging/guides/market-throughput-overview).

### Onboarding

Onboarding to Multi-Tenancy is performed by the Twilio Support team in a few steps.

1. **Reach out to Twilio:** Talk to your Twilio Account owner (if applicable), or open a Support ticket asking for a demo and/or onboarding support for Multi-Tenancy.
2. **Forecast:** Work with your Twilio Account owner or Support representative to determine which Multi-Tenancy option ([even](#even-multi-tenancy), [weighted](#weighted-multi-tenancy), or [none](#no-multi-tenancy),) you would like to apply to each destination country and sender type where it can be configured. This information is used to calculate the optimal allocation of throughput for your Twilio parent Account(s).
3. **Review:** Twilio Support reviews your requested Multi-Tenancy configurations.
4. **Configuration and migration:** Once your request is ready for onboarding, Twilio Support configures Multi-Tenancy on your parent Account(s) with the settings calculated from Step 2, and migrates your existing traffic during off-peak hours.

For Multi-Tenancy, you don't need to make any change to your existing Twilio integration.

# Personalized Recommendations for Twilio Messaging

## Overview

Personalized Recommendations for Twilio Messaging provide actionable insights to help you optimize your messaging traffic, improve deliverability, and maintain compliance. Recommendations are now available in two primary experiences:

* The Recommendations Widget on the Messaging Insights Overview page, alongside your [Health Score for Messaging](/docs/messaging/features/twilio-health-score-for-messaging)
* The [Intelligent Discovery Assistant for Twilio Messaging](/docs/messaging/features/intelligent-discovery-ai-assistant)

By analyzing your messaging data, Recommendations can identify issues such as high opt-out rates or spam complaints and offer potential solutions.

After reading this document, you will be able to:

* Understand how Recommendations analyzes your messaging data.
* View and interpret recommendations in the Messaging Insights overview and the Intelligent Discovery Assistant.
* Implement suggested actions to improve your messaging deliverability.

### What data is being analyzed?

Personalized Recommendations analyze various parameters of your messaging traffic, including:

* Traffic patterns and account-level signals used to generate your [Health Score for Messaging](/docs/messaging/features/twilio-health-score-for-messaging)
* Opt-out rates for the past seven days and other time periods
* Spam complaints for the past seven days and other time periods

## Example recommendations

### Solution recommendation for opt-out rate

When interacting with the Intelligent Discovery Assistant regarding outbound messages failing with error code `30007` and your parameters match a personalized recommendation for high opt-out rate, you will receive the following response:

![Chat where user asks about error code 30007; assistant says it's due to opt-outs and gives tips on resolving the error.](https://docs-resources.prod.twilio.com/43572f18a9e47b4e9102192367e1730950e1e9dcc5e6d1bc559dd04c87fbd485.png)

Here are some actions you can take:

1. Ensure you have permission first.
   * Only send messages to mobile users who have provided consent (opted-in) to receive messages from you.
2. Have a clear introduction.
   * Ensure that your messages clearly identify who is sending the message.
3. Maintain your contact list.
   * If you are sending messages to users repeatedly over a long period of time, check in with your recipients at least once every 18 months to ensure they still want to receive messages from you. The mobile number you are sending messages to may have changed owners, or the recipient may not remember giving consent to receive messages from you.
4. Actively manage your contact list
   * Process the daily deactivation file. Once a customer deactivates their phone number, you no longer have consent to send to that number.
5. Revisit your consent processes.
   * Spikes in opt-outs can be an indicator that there is something that needs to be corrected in your consent or opt-out mechanisms.

### Solution recommendation for spam complaints

When interacting with the Intelligent Discovery Assistant regarding outbound messages failing with error code `30007` and your parameters match a personalized recommendation for high spam complaints, you will receive the following response:

![Assistant alert showing 128 spam complaints (11%) with recommendations to review consent list and message content.](https://docs-resources.prod.twilio.com/e60a19dda156653ce665ebbb5f62dab4addce207cbbcb6cb70aa56900a417fdd.png)

Here are some actions you can take:

1. Validate that your messages are compliant.
   * Ensure that you are not sending content that is illegal, harmful, unwanted, inappropriate, including content that is false or inaccurate, is hateful or encourages hatred or violence against individuals or groups, or could endanger public safety.
2. Adhere to country-specific SMS guidelines.
   * Twilio provides SMS guidelines for different countries. It's crucial to check and follow these guidelines to ensure compliance with local regulations and best practices.
3. Avoid spam triggers.
   * Be mindful of the content in your messages. Avoid using spam trigger words, excessive use of caps, or exclamation marks that might flag your messages as spam.
4. Ensure you have permission first.
   * Your recipients must have explicitly opted in to receive messages from you. Provide them with a straightforward and clear way to opt-out of future communications.
5. Personalize and segment your messages.
   * Tailor your messages to the interests and preferences of your audience. Use segmentation to ensure that the right messages reach the right people at the right time.
6. Revisit your consent processes.
   * Spikes in spam complaints can be an indicator that there is something that needs to be corrected in your consent or opt-out mechanisms.

## Providing feedback on recommendations

Each recommendation includes built-in feedback controls so that you can help improve future recommendations.

### Thumbs up and thumbs down

Every recommendation includes thumbs up and thumbs down buttons:

* Click the thumbs up button to indicate that a recommendation was helpful or relevant.
* Click the thumbs down button if the recommendation was not helpful or did not apply to your use case.

When you click thumbs down, a feedback modal appears, allowing you to provide additional information about why the recommendation was not useful. Twilio uses your feedback to continuously improve the accuracy and relevance of future recommendations.

### Dismissing a recommendation

To dismiss a recommendation in the Recommendations widget, click the x button in the corner of the recommendation. The recommendation will be hidden for at least seven days.

## AI Nutrition Facts for Recommendations

[Twilio's AI Nutrition Facts](https://nutrition-facts.ai/) provide an overview of the AI feature you're using, so you can better understand how the AI is working with your data. Recommendations' AI qualities are outlined in the following Nutrition Facts label. The AI Nutrition Facts for Recommendations apply to both the Public Beta and Private Beta offerings. For more information and the glossary regarding the AI Nutrition Facts Label, refer to [Twilio's AI Nutrition Facts page](https://nutrition-facts.ai/).

![Recommendations Nutritional Label showing AI qualities.](https://docs-resources.prod.twilio.com/fefa2db2aea6a9a53aff08335035b1351ebbe3d641cc6ab5eee7f8c39bbb5dd2.png)

## Next steps and additional resources

Here are some possible next steps and additional resources to help you get started:

* [Twilio Programmable Messaging API Documentation](/docs/messaging/api)
* [Contact Twilio Support](https://help.twilio.com)

# SMS Pumping Protection for Programmable Messaging

SMS Pumping Protection uses automatic fraud detection to block messages flagged as being suspicious for [SMS pumping fraud](/docs/glossary/what-is-sms-pumping-fraud) from being sent. It works by analyzing your current and historical SMS traffic for unusual patterns. When unexpected fluctuations in your SMS traffic for a specific location, or system-known malicious activity, are detected this feature will automatically block messages to phone numbers associated with the suspected fraud.

> \[!WARNING]
>
> It is important to note that no provider side solution can guarantee 100% protection against sophisticated attackers. Customer participation in fraud prevention is essential. More information on steps you can take to prevent fraud can be found [here](/docs/messaging/guides/preventing-messaging-fraud).

> \[!NOTE]
>
> For pricing information on SMS Pumping Protection for Programmable Messaging:
>
> 1. Navigate to the [SMS Pricing](https://www.twilio.com/en-us/sms/pricing/) page.
> 2. Select the country you are interested in.
> 3. Check the Features section of the page.
>
> Note that, for the United States and Canada, SMS Pumping Protection for Programmable Messaging is provided at no additional cost, therefore you may not find a line item in the Features section of their SMS Pricing pages.
>
> Alternatively, you can [contact Sales](https://www.twilio.com/en-us/help/sales) for pricing information.

> \[!NOTE]
>
> If you're using Programmable Messaging to send one-time passcode (OTP) verifications, consider migrating to [Verify](/docs/verify) which includes [Fraud Guard](/docs/verify/preventing-toll-fraud/sms-fraud-guard) with customizable protection levels at no extra charge.

## Enable SMS Pumping Protection

You can find the **SMS Pumping Protection** settings by navigating to the [Twilio Console > Messaging > Settings > General](https://console.twilio.com/us1/develop/sms/settings/general) page. From there, select **Enabled** to activate SMS Pumping Protection on your account.

![SMS Pumping Protection settings with Enabled option selected.](https://docs-resources.prod.twilio.com/cbc8a01f7dac1ae740fd801cb5621b2c5a1f5d6633373f36dae5a38aad5993f6.png)

Once the feature is enabled on your account, no further actions are needed on your part. Your protection will begin immediately.

## Fraud detection process

This feature works by detecting [SMS pumping fraud](/docs/glossary/what-is-sms-pumping-fraud). SMS pumping fraud happens when fraudsters take advantage of a phone number input field to receive a one-time passcode, an app download link, or anything else via SMS. The messages are sent to a range of numbers controlled by a specific [mobile network operator](https://en.wikipedia.org/wiki/Mobile_network_operator) (MNO) and the fraudsters get a share of the generated revenue.

Twilio uses a baseline of expected message data to find outliers in behavior based traffic patterns. We combine behavioral data with known explicit fraud schemes to filter out bad behavior.

Our model is always changing and uses multiple parameters to determine fraud. Examples of things we may temporarily block could include:

* Messages to a specific region, country or locale we know is engaging in SMS pumping
* Messages in a country your account has never sent SMS to previously
* Messages with parameters and characteristics that would suggest non-human behavior

### AI Nutrition Facts

Twilio's AI Nutrition Facts provide an overview of the AI feature you're using, so you can better understand how AI is working with your data. The qualities of SMS Pumping Protection are outlined in the following Nutrition Facts label. For more information, including the glossary regarding the AI Nutrition Facts label, refer to [Twilio's AI Nutrition Facts page](https://nutrition-facts.ai/).

```json
{"name":"SMS Pumping Protection for Programmable Messaging","description":"SMS Pumping Protection detects and prevents SMS pumping abuse in real time to protect customers from artificially inflated traffic using first-of-its-kind technology and Twilio's Proprietary Customer AI engine.","modelType":"Predictive","optional":true,"baseModel":"Twilio Proprietary Model and Prophet","aiPrivacyLevel":2,"trustLayer":{"baseModelCustomerData":{"value":true,"comments":["Customer messaging traffic metadata is used for model training."]},"vendorModelCustomerData":{"value":null,"comments":null},"trainingDataAnonymized":{"value":true,"comments":null},"dataDeletion":{"value":true,"comments":null},"auditing":{"value":false,"comments":null},"dataStorage":"30 days","compliance":{"loggingAndAuditTrails":{"value":true,"comments":["Standard service logging is applied and logs are stored for future review."]},"guardrails":{"value":null,"comments":null}},"inputOutputConsistency":{"value":true,"comments":null}},"linksAndResources":"SMS Pumping Insights available to provide transparency to customers around how the product works."}
```

## Preventing false positives

Like any fraud prevention feature, there's a small chance our models may flag legitimate users as suspicious. We're constantly monitoring our results and adapting the fraud detection model to keep false positives extremely low.

### Global Safe List

You can use the [Global Safe List API](/docs/usage/global-safe-list) to maintain a list of phone numbers that will never be blocked by Programmable Messaging SMS Pumping Protection, [Verify Fraud Guard](/docs/verify/preventing-toll-fraud/sms-fraud-guard), [Verify Geo Permissions](/docs/verify/preventing-toll-fraud/verify-geo-permissions) or any other internal fraud & risk check solution.
By adding safe and verified phone numbers such as known customers, partners, or approved contacts to the Global Safe List, you ensure timely delivery of critical communications to these message recipients.

### RiskCheck parameter

When you [create a Message](/docs/messaging/api/message-resource#create-a-message-resource) with the [Programmable Messaging API](/docs/messaging/api), you can use the `RiskCheck` parameter to adjust the level of risk protection for individual outbound messages. Using the `RiskCheck` parameter, you can determine whether to apply SMS Pumping Protection to a specific message giving you more flexibility when sending messages for multiple use cases with different risk profiles using the same phone number.

For example, you may want to send messages for two different use cases using the same phone number:

1. SMS messages with one-time passcode (OTP)/two-factor authentication (2FA) content
2. Marketing SMS messages

Account- or phone number-level risk protection settings are not granular enough if you want to treat these two use cases differently for purposes of SMS Pumping Protection. However, to achieve this goal you can:

1. Set the `RiskCheck` parameter to `enable` (default value) when creating an OTP/2FA message to take advantage of the built-in SMS Pumping Protection.
2. Set the `RiskCheck` parameter to `disable` when creating a marketing message which does not need SMS Pumping Protection.

### Other actions

You can also take these actions if you suspect false positives:

* Fall back to a different messaging method like WhatsApp or Facebook Messenger
* Create a separate subaccount for your legitimate users which has SMS Pumping Protection disabled
* Reach out to your Solutions Architect or contact Twilio Support through the [Console](https://console.twilio.com/) or [Help Center](https://help.twilio.com)

## Monitoring

[Error 30450](/docs/api/errors/30450) will show in the Twilio error logs when an SMS delivery is blocked by SMS Pumping Protection.

You can use the [Messaging Intelligence **SMS Pumping Protection Insights** dashboard](/docs/messaging/features/messaging-insights/sms-pumping-protection-insights) to answer questions such as:

* What are the projected monthly savings from using the SMS Pumping Protection for Programmable Messaging feature?
* What is the volume of sent messages that were blocked by SMS Pumping Protection?
* How do SMS pumping fraud activities break down by geography?

# Traffic Optimization Engine

> \[!IMPORTANT]
>
> Traffic Optimization Engine is in Public Beta. The information in this document could change. We might add or update features before the product becomes Generally Available. Beta products don't have a Service Level Agreement (SLA). Learn more about [beta product support](https://help.twilio.com/articles/115002413087-Twilio-Beta-product-support).

## Overview

[Traffic Optimization Engine (TOE)](https://www.twilio.com/en-us/blog/signal-2023-product-announcements) is Twilio's delivery optimization solution for Messaging customers to send high-velocity, high-volume messages anywhere in the world. TOE dynamically allocates Messages Per Second (MPS) capacity across sender types, channels, and destination countries.

TOE is a premium Messaging add-on that is ideal for delivering large volumes of messages at faster speeds and lower latency.

## TOE core products and features

The Traffic Optimization Engine includes several products that work together, or individually, to provide granular control over your messaging deliverability, throughput allocation, and prioritization of their messaging solution at scale. All TOE products are interoperable with the Programmable Messaging API.

The TOE product suite includes:

* **Market Throughput:** Aggregates messaging MPS at the account level for better control and utilization of higher levels of throughput capacity in each destination country.
* **Multi-Tenancy:** Dynamically assigns equal or proportional messaging throughput across all of your subaccounts to ensure a fair distribution of throughput across all of your messages.
* **Traffic Shaping:** Enables throughput allocation by use case, which creates dynamic traffic lanes for messages of different priority levels.
* **Messaging Insights:** Provides real-time, out-of-the-box analytics and reporting on messaging deliverability, capacity allocation, and queuing so you have more granular insights into the performance of your global messaging traffic.

### Market Throughput

In this context, the term "market" refers to a country such as the United States. Within a country or market, there are carrier networks or destinations. With Market Throughput, all of the traffic produced across all of your phone numbers is serviced at rate limits configured for each destination you send towards. For example, in the United States, Market Throughput may optimize your messages across Verizon, AT\&T, and any other destinations you send toward.

Market Throughput offers several advantages over [sender throughput](https://help.twilio.com/articles/115002943027-Understanding-Twilio-Rate-Limits-and-Message-Queues) and [Account Based Throughput](/docs/messaging/guides/account-based-throughput-overview), including:

* Messaging capacity is set at the parent account level per country, allowing you to achieve high throughput on as many numbers as you need.
* Traffic is separated by destination carrier, which eliminates the risk of congestion in one network from affecting traffic going to other networks.
* Support for very high levels of messaging MPS that are otherwise inaccessible using other throughput products.

Enablement of Market Throughput is required for access to increased throughput capacity and other TOE products, including Multi-Tenancy and Traffic Shaping. To learn more, visit the [Market Throughput Overview](/docs/messaging/guides/market-throughput-overview#onboarding-and-maintenance) guide.

### Multi-Tenancy

Multi-Tenancy allows you to prevent specific subaccounts and/or senders from using all of the parent Account's available throughput, when competing subaccounts and/or senders also need throughput. Multi-Tenancy allows you to skip manual configuration of throughput on each subaccount to achieve fair distribution. Instead, Twilio algorithmically determines capacity distribution in accordance with your parent Account's configuration for each destination country's sender type and channel combinations.

With Multi-Tenancy enabled, Twilio algorithmically distributes a minimum share of throughput to each subaccount in a fair manner at the moment it's needed. When the subaccount's messages have finished processing, Twilio dynamically redistributes the newly-available throughput across the remaining queues that contain messages waiting to leave the Twilio platform.

Multi-Tenancy applies to SMS and MMS messaging traffic from any of your senders (short code, toll-free, alphanumeric senders, and ten-digit long code phone numbers) except for US and Canada A2P 10DLC traffic.

To enable Multi-Tenancy, you will need to onboard Market Throughput as a prerequisite. Learn more about [Multi-Tenancy](/docs/messaging/features/multi-tenancy).

### Traffic Shaping

Traffic Shaping allows high-volume Twilio customers to fine-tune messaging throughput by allocating capacity by messaging use case. It provides three different Service Levels, which you can think of as three separate queues, where each queue contains messages of the same priority. Each Service Level queue can be assigned a different throughput allocation, based on the relative priority of the messages within that Service Level. You decide the speed at which messages are sent from each Service Level queue by allocating a percentage of your Account's total throughput to each Service Level that you plan to use.

When combined with Market Throughput, Traffic Shaping provides more fine-tuned, flexible controls for prioritizing your messages based on Service Level and use case, while ensuring your most important messages get a greater share of throughput. With Traffic Shaping, you can:

* **Distribute your total throughput capacity based on use case:** Messages that need to be delivered more quickly are mapped to Service Levels receiving a higher share of throughput. A use case is a configurable parameter that can be set on each message, and indicates the corresponding Service Level for that message. Messages without a use case specified will automatically be assigned to the lowest Service Level.
* **Eliminate congestion at the sender level:** Message deliverability in one Service Level does not interfere with performance in another level, even when the messages are sent from the same number.

To enable Traffic Shaping, you will need to onboard Market Throughput as a prerequisite. Learn more about [Traffic Shaping](/docs/messaging/features/traffic-shaping).

### Messaging Insights

Messaging Insights provides analytics and reporting on metrics for messaging deliverability, queueing, and latency. With real-time dashboards, you can use Messaging Insights to:

* Visualize and analyze your application's messaging activities.
* Identify and debug issues.
* Optimize delivery.
* Find areas to boost engagement with your end-users.

To enable specialized Insights dashboards related to TOE, you will need to onboard Market Throughput as a prerequisite. Learn more about [Messaging Insights](/docs/messaging/features/messaging-insights).

## TOE onboarding and maintenance

### Traffic Optimization Engine Pro (TOE Pro)

Throughput upgrades on TOE are available to all Twilio Messaging customers, through subscription of Traffic Optimization Engine Pro(TOE Pro). Available today in Public Beta, TOE Pro is a premium Messaging add-on subscription that enables your account for continuous access to increased MPS on Market Throughput in any country. For more information on TOE Pro pricing and availability by country, refer to the [Twilio Pricing](https://www.twilio.com/en-us/pricing) page or [contact Sales](https://www.twilio.com/en-us/help/sales).

In the United States and Canada, increased MPS on TOE Pro is available for short code and toll-free messages sent as Programmable SMS/MMS. Outside of the United States and Canada, increased MPS TOE is available in every country for all Programmable SMS/MMS sender types including: alphanumeric, long code, short code, and toll-free.

### Onboarding options

If you need more throughput on short code or toll free messages sent to the United States, you can turn on TOE Pro on the [Subscriptions page](https://console.twilio.com/us1/billing/manage-billing/subscriptions) in the Twilio Console. If you can't turn on TOE Pro in the Twilio Console, contact [Twilio Support](https://help.twilio.com).

**Whether you onboard directly in Console or through Twilio Support, you will not need to make any changes to your existing Twilio integration in order to turn on the increased throughput included in your TOE Pro subscription. After onboarding is completed, you can start sending more traffic right away.**

## Get started with TOE

### TOE Pro Self-serve onboarding in the Twilio Console

You can onboard to TOE Pro by creating a subscription in a few steps:

1. Log in to the Twilio Console, and go to [**Admin > Account billing**](https://console.twilio.com/us1/billing/manage-billing/billing-overview).
2. On the **Billing Overview** page, in the navigation menu, click [**Subscriptions**](https://console.twilio.com/us1/billing/manage-billing/subscriptions), then click **Subscribe Now** on the MPS option you want to configure.\
   The page contains all TOE Pro options available to your your account for increased MPS on short code and toll-free messages sent to the United States.
3. On the **Order Summary** page, review the subscription terms. Click **Pay and Subscribe** to accept the terms and create a new subscription for your throughput upgrade.
   TOE Pro is now active on your account, and you can start using the increased throughput on your messages.

### TOE Pro onboarding with Twilio Support

If you have a Twilio account owner, then Twilio Support can help you set up TOE Pro on your account in a few steps:

1. **Forecast:** Work with your Twilio account owner to determine your estimated volumes per country. This forecast is used to calculate the MPS recommended for each sender type and channel, where applicable.
2. **Review:** Your Twilio account owner submits an onboarding ticket to the Twilio Support team, who review and approve the MPS to be configured on your parent account. Your Twilio account owner also reaches out to you to initiate billing for TOE Pro with an order form.
3. **Configuration and Activation:** After approval, Twilio Support configures the MPS values on your account and activates TOE Pro. Your Twilio account owner sends you a confirmation that TOE Pro onboarding is complete.

### What's next?

Now that you have an overview of Traffic Optimization Engine, you can learn more about:

* [How Market Throughput works](/docs/messaging/guides/market-throughput-overview#onboarding-and-maintenance) and compares to legacy throughput offerings like [Account Based Throughput](/docs/messaging/guides/account-based-throughput-overview)
* Tips and strategies for using [Multi-Tenancy](/docs/messaging/features/multi-tenancy) or [Traffic Shaping](/docs/messaging/features/traffic-shaping) on your account, after you onboard to TOE Pro and enable Market Throughput
* Customized onboarding options for TOE Pro beyond throughput upgrades. For more information, [contact Twilio Support](https://help.twilio.com/).

# Compliance Toolkit for Programmable Messaging

> \[!IMPORTANT]
>
> Programmable Messaging customers can activate the Public Beta of the Compliance Toolkit from the [Twilio Console](https://console.twilio.com/us1/develop/sms/settings/general).
>
> This feature supports **SMS** messages terminating in the **United States** written in **English** and **Spanish** languages only.
>
> Compliance Toolkit is available as a Public Beta release and the information contained in this document is subject to change. Some features are not yet implemented and others may be changed before the product is declared as Generally Available. Public Beta products are not covered by the Twilio Support Terms or the Twilio Service Level Agreement.
>
> To learn how Twilio supports products in public beta, see [Twilio Beta Product Support](https://help.twilio.com/hc/en-us/articles/115002413087-Twilio-Beta-product-support).

> \[!WARNING]
>
> Compliance Toolkit shouldn't be used in workflows subject to HIPAA regulations.

> \[!NOTE]
>
> To learn about Compliance Toolkit pricing for Programmable Messaging, see the [SMS Pricing](https://www.twilio.com/en-us/sms/pricing/us) page or [contact Sales](https://www.twilio.com/en-us/help/sales).

Compliance Toolkit helps you mitigate your compliance exposure by using artificial intelligence and machine learning to proactively detect possible regulatory violations and prevent or reschedule their transmission.

## Get started with Compliance Toolkit

To activate Compliance Toolkit, go to your account settings in the Twilio Console.

1. Log in to the [Twilio Console](https://console.twilio.com/us1/develop/sms/settings/general)
2. Go to **Messaging** > **Settings** > [**General**][tk-settings].
3. Select **Enabled**. The Compliance Toolkit modal displays.
4. Review the text of this modal, then acknowledge that you have read the [Twilio Compliance Toolkit: AI/ML and Product Terms Addendum][aiml-tos].
5. Click **Done** then **Save**.
   Once activated, the toolkit runs on your existing messaging flows. This requires no further action on your part.

[tk-settings]: https://console.twilio.com/us1/develop/sms/settings/general?_gl=1*jsvxjg*_gcl_au*MTIwMjgwODQyNC4xNzUxMDI5NzU1*_ga*MTE2MzA3MTQ3Ni4xNjUxNDc5MzMz*_ga_RRP8K4M4F3*czE3NTI4NDY3OTYkbzExOTEkZzEkdDE3NTI4NDgzNjMkajYwJGwwJGgw

[aiml-tos]: https://www.twilio.com/en-us/legal/ai-terms/twilio-compliance-toolkit

## Compliance checks

To identify and resolve possible violations of the following regulations, Twilio passes all US outbound SMS traffic through Compliance Toolkit.

### Quiet Hours enforcement

#### Quiet Hours check

When Twilio tries to send a message, Compliance Toolkit checks if it falls within Quiet Hours. The US Federal Communications Commission defines these hours under the [Telephone Consumer Protection Act](https://www.fcc.gov/tags/telephone-consumer-protection-act-tcpa)(TCPA) as 9:00 PM to 8:00 AM in the recipient's local time zone in the US. Twilio infers the time zone using the recipient's phone number area code.

> \[!NOTE]
>
> To improve accuracy, you can provide the most known ZIP codes of the your recipients with the [Contact API][]. When available, Compliance Toolkit uses the ZIP codes as entered in the [Contacts API](/docs/messaging/features/contact-api) to enforce Quiet Hours.

[Contacts API]: /docs/messaging/features/contact-api

#### Message classification

If the message falls within Quiet Hours, Compliance Toolkit classifies the message using AI/ML model as essential or non-essential. This classification is based on the message content and context.

If you want to override the defaults and bypass Compliance Toolkit's classification model and set specific messages as essential, use the `MessageIntent` parameter.

#### Examples of non-essential messages

* Marketing and promotional campaigns like discounts, loyalty points, and flash sales
* Charity or events-related broadcasts

#### Examples of essential messages

* Fraud alerts or suspicious activity notifications
* Shipping and delivery updates
* Customer support messages
* Emergency announcements
* School alerts to parents and students
* Receipts or confirmations requested through SMS
* Replies to recent inbound messages
* Opt-in and unsubscribe confirmations

#### Delivery behavior

If Compliance Toolkit classifies a message as non-essential and it falls within Quiet Hours, it will not be sent immediately. Instead, by default the message is automatically rescheduled to be delivered after Quiet Hours, and the message metadata in the following ways:

* The delivery status changes to `scheduled`.
* It adds a `ScheduledAt` timestamp in the Message Logs that states when it plans to deliver the message.

You can track the scheduled status with existing webhooks, logs and Messaging Insights experience.

This feature delivers messages while respecting both compliance requirements and recipient experience.

You can set your preference for Quiet Hours message handling as one of two options:

* **Reschedule** (default): The default behavior that reschedules the message with a new delivery time.
* **Block**: This blocks the non-essential message sent during Quiet Hours and returns a [30610](/docs/api/errors/30610) error code.

### State Specific Quiet Hours enforcement

In addition to TCPA requirements, Compliance Toolkit enforces state-specific quiet hours in the following states. This ensures that non-essential messages are not delivered to recipients during the following time windows.

Compliance Toolkit applies these Quiet hours based on the recipient's location. It determines this from either from the area code of the phone number (default) or from the location provided with the [Contact API][]. Non-essential messages that fall into these restricted windows get rescheduled and delivered once Quiet Hours end.

> \[!WARNING]
>
> The following US states have additional Quiet Hour requirements like non-essential messages prohibited or different Quiet Hour windows on weekends. Compliance Toolkit doesn't enforce any restrictions or requirements outside what's in this table. When using any Twilio Services, customers should check with counsel for any additional requirements and ensure compliance.

| State(s)                                                                                                        | Quiet Hours Enforced (Local Time)                                     |
| :-------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| Alabama<br />Florida<br />Louisiana<br />Maryland<br />Mississippi<br />Oklahoma<br />Tennessee<br />Washington | 8:00 PM – 8:00 AM                                                     |
| Connecticut<br />Nevada                                                                                         | 8:00 PM – 9:00 AM                                                     |
| Texas                                                                                                           | 9:00 PM – 9:00 AM (Monday–Saturday)<br />9:00 PM – 12:00 PM (Sundays) |

### Monitoring & Insights

### Opt out check

To identify users who have opted out of receiving your messages, Twilio checks against its opt-out database.

By sending a reply to your messages with one of the following keywords, these previous subscribers opted out.

* `STOP`
* `UNSUBSCRIBE`
* `END`
* `QUIT`
* `STOPALL`
* `REVOKE`
* `OPTOUT`
* `CANCEL`

If the associated recipient replied to a message with the appropriate opt-out command after the recorded opt-in date, Twilio blocks the message and returns [error 21610][e21610]. To learn more about opt out, see [Twilio support for opt-out keywords][optout-kw].

Twilio also checks the recipient's consent status using the [Consent Management API][]. If a recipient opted out, Twilio blocks your message to that specific user and returns [error 21610][e21610].

### Reassigned number check

Compliance Toolkit verifies that the intended recipient's phone number belongs to the original subscriber who consented to communications. This verification happens through tracking and updating customer's consent against the US FCC's reassigned phone number database. If the a carrier reassigned this phone number to a different consumer after the date of the on-record consent, Twilio blocks the message and returns [error 21610][e21610].

After the first reassigned number check on a particular phone number, this feature checks that number for new messages every 30 days.

[e21610]: /docs/api/errors/21610

[optout-kw]: https://help.twilio.com/articles/223134027

### Consent management

To bulk update and manage user consent preferences for SMS messaging, use the Twilio [Consent Management API][]. It stores and updates consent statuses for your users with data on how and when Twilio collected consent.

The Consent Management API lets you upsert multiple consent records in a single request. To synchronize large volumes of user consent preferences between two or more data sources, use this API.

To opt-in a user again, update the recipient's consent status to `opt-in`. This overrides the `STOP` keyword and allows you to send messages to this user again.

[Consent Management API]: /docs/messaging/features/consent-api

#### Supported consent preferences

With this API, you can manage the following user consent statuses:

| Consent status | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `opt in`       | The user has provided valid consent to receive SMS messages.                                 |
| `opt out`      | The user has revoked consent or replied with STOP-like keywords.                             |
| `re-opt in`    | Handled as opt-in. The user has opted in again after a prior opt-out. Overrides STOP keyword |

To block or allow messages, Twilio checks this consent status in the Consent Management API records and keyword-based signals.

## Tune your Compliance Toolkit setup

To meet your specific messaging needs, Twilio Compliance Toolkit provides customization options through three API resources.

1. [Contact API][] can set the known ZIP code for each end user. By using the recipient's location instead of their phone number's area code, this improves Quiet Hours accuracy.
2. [Consent Management API][] allows you to set each subscriber's opt-in or opt-out status. Twilio uses these up-to-date, verified preferences to block or permit messages.
3. [Twilio Programmable Messaging API](/docs/messaging/api/message-resource).
   * The `riskCheck` parameter lets you set which messages the Compliance Toolkit evaluates. When set to `disable`, Compliance Toolkit doesn't evaluate that message. You also don't incur associated charges.
   * The `messageIntent` parameter lets you set the use case of the message.
     * If you set the `messageIntent` as an essential use case value like `otp` and `notifications` using this parameter, Twilio exempts it from Quiet Hours checks and delivers it.
     * If you set the `messageIntent` as non-essential use case value like `marketing` using this parameter, Twilio reschedules its delivery after Quiet Hours.

[Contact API]: /docs/messaging/features/contact-api

The following table lists which use cases you can configure for the `messageIntent` parameter and the Quiet Hours Mapping assigned for that use case.

| Use case                                                | `MessageIntent` parameter value | Quiet Hours Mapping |
| ------------------------------------------------------- | ------------------------------- | ------------------- |
| Two-factor auth (2FA) and one-time passcodes (OTP)      | `otp`                           | Essential           |
| Account notifications, two-way conversational messaging | `notifications`                 | Essential           |
| Fraud alerts                                            | `fraud`                         | Essential           |
| Security alerts, emergency                              | `security`                      | Essential           |
| Customer care                                           | `customercare`                  | Essential           |
| Delivery notifications                                  | `delivery`                      | Essential           |
| Education                                               | `education`                     | Non-Essential       |
| Event marketing                                         | `events`                        | Non-Essential       |
| Polling and voting (non-political)                      | `polling`                       | Non-Essential       |
| Public service announcement (non-emergency)             | `announcements`                 | Non-Essential       |
| General and campaign marketing                          | `marketing`                     | Non-Essential       |

## Monitoring

When Compliance Toolkit blocks an SMS delivery due to Opt-Out or Reassigned Phone Number identification, Twilio returns an [error 21610][e21610]. This message displays in the Twilio error logs and the API response.

When Compliance Toolkit detects a marketing message being sent during Quiet Hours, it doesn't deliver it. It sets the delivery status to `scheduled` and the `ScheduledAt` timestamp for after the end of Quiet Hours, up to 4 hours later.

When you opt to block, rather than reschedule these messages, Compliance Toolkit returns [error 30610](/docs/api/errors/30610) is displayed in the Twilio error logs and the API response.

To analyze aggregate trends and drill into Compliance Toolkit outcomes, use **Messaging Logs and Insights** in the Twilio Console.

To view all non-essential messages detected during quiet hours and automatically re-scheduled by Compliance Toolkit, filter by:  **"Used Scheduling" = Yes**.

[e21610]: /docs/api/errors/21610

## FAQs

### Can I use Compliance Toolkit only for specific messages or subaccounts?

Yes. From the Twilio Console, you can activate Compliance Toolkit only for specific subaccounts.
To invoke Compliance Toolkit per message, use the `riskCheck` parameter in the Twilio Programmable Messaging API. This controls when Compliance Toolkit gets applied.

### How does this differ from Twilio's Message Scheduling feature?

Twilio Message Scheduling within the Engagement Suite activates users so they can schedule messages for delivery at a future date and time. Twilio Message Scheduling doesn't analyze the message type nor prevent flagged messages from being sent during Quiet Hours.

### How does Compliance Toolkit determine a recipient's timezone for Quiet Hours?

By default, Compliance Toolkit infers the timezone from one of two data points:

* User phone number area code
* Latest known ZIP code provided from the [Twilio Contacts API](messaging/features/contact-api).

## AI Nutrition Facts

[Twilio AI Nutrition Facts](https://nutrition-facts.ai/) provide an overview of this AI feature. This overview helps you better understand how AI works with your data. The following Nutrition Facts label outlines the qualities of Compliance Toolkit.

```json
{"name":"Compliance Toolkit for Programmable Messaging","description":"Compliance Toolkit is a product available to Twilio Messaging customers that uses Artificial Intelligence to help manage their obligations with respect to certain local regulatory or compliance requirements.","modelType":"Machine Learning","optional":true,"baseModel":"Logisitic Regression","aiPrivacyLevel":3,"trustLayer":{"baseModelCustomerData":{"value":true,"comments":["Customer messaging traffic metadata is used for model training."]},"vendorModelCustomerData":{"value":false,"comments":null},"trainingDataAnonymized":{"value":true,"comments":null},"dataDeletion":{"value":true,"comments":null},"auditing":{"value":true,"comments":null},"dataStorage":"30 days","compliance":{"loggingAndAuditTrails":{"value":true,"comments":["Standard service logging is applied and logs are stored for future review."]},"guardrails":{"value":true,"comments":null}},"inputOutputConsistency":{"value":true,"comments":null}},"linksAndResources":""}
```

# Twilio API requests

Learn how to authenticate your requests, what content type to use for API requests, and how the Twilio APIs handle webhooks. You'll also see examples of how to make requests to the Twilio APIs.

## Ways to make requests to the Twilio APIs

There are several ways you can make an HTTP request to the Twilio API.

* Make a raw HTTP request either in your code (for example, by using a module like [got in NodeJS](https://www.npmjs.com/package/got)) or with a tool like [Postman](https://www.postman.com/).
* Use a [Twilio SDK](/docs/libraries) for your preferred programming language.
* Use the [Twilio CLI](/docs/twilio-cli/general-usage) if you prefer working in the terminal.

## Authentication

> \[!NOTE]
>
> Always store your credentials in environment variables before sharing any code or deploying to production. Learn more about [setting environment variables](https://www.twilio.com/blog/how-to-set-environment-variables.html).

To authenticate requests to the Twilio APIs, Twilio supports [HTTP Basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication). You can use the following credentials:

| Username    | Password       | Best practice                                                                                                                                            |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API Key     | API Key Secret | This is the recommended way to authenticate with the Twilio APIs. When a key is compromised or no longer used, revoke it to prevent unauthorized access. |
| Account SID | AuthToken      | Limit your use to local testing.                                                                                                                         |

> \[!NOTE]
>
> Twilio API credentials are region-specific resources. If your account uses [Twilio Regions](/docs/global-infrastructure/understanding-twilio-regions), see [Manage Regional API credentials](/docs/global-infrastructure/manage-regional-api-credentials).

### Using API keys (recommended)

An API key is a unique identifier that allows a client to access your Twilio account and create, read, update, or delete resources through the Twilio APIs. You can create multiple API keys for different purposes, such as for different developers or subsystems within your application. If a key is compromised or no longer used, you can revoke it to prevent unauthorized access.

Twilio recommends using only API keys for production applications. If a bad actor gains access to your Account SID and Auth Token, then your Twilio Account is compromised.

You can create an API key either [in the Twilio Console](/docs/iam/api-keys/keys-in-console) or [using the API](/docs/iam/api-keys/key-resource-v1).

The API key types are `Main`, `Standard`, and `Restricted` (Key resource v1 only). The following table describes each type:

| Key type   | Access permissions                                                                                                                                                                                                                                 | Create in Console | Create with REST API |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------- |
| Main       | Full access to all Twilio API resources. Equivalent to using your Account SID and Auth Token for API requests.                                                                                                                                     | Yes               | No                   |
| Standard   | Access to all Twilio API resources, except for Accounts ([`/Accounts`](/docs/iam/api-keys/keys-in-console)) or Keys ([`/Accounts/{SID}/Keys`](/docs/iam/api-keys/key-resource-v2010), [`/v1/Keys`](/docs/iam/api-keys/key-resource-v1)) resources. | Yes               | Yes                  |
| Restricted | Customized, fine-grained access to specific Twilio API resources. Learn more about [Restricted API keys](/docs/iam/api-keys/restricted-api-keys).                                                                                                  | Yes               | Yes (**v1 only**)    |

When making an API request, use your API key as the username and your API key secret as the password.

**Note**: In the following example, you must use a `Main` API key.

```bash
curl -G https://api.twilio.com/2010-04-01/Accounts \
  -u $YOUR_API_KEY:$YOUR_API_KEY_SECRET
```

The user remains logged in for the duration of the request. Learn more about [how Twilio handles authentication](/docs/usage/security).

### Using your Account SID and Auth Token

For local testing, you can use your Account SID as the username and your Auth token as the password. You can find your Account SID and Auth Token in the [Twilio Console](https://www.twilio.com/console), under the **Account Dashboard**.

```bash
curl -G https://api.twilio.com/2010-04-01/Accounts \
  -u $YOUR_ACCOUNT_SID:$YOUR_AUTH_TOKEN
```

### Twilio SDKs

A Twilio SDK is a [server-side SDK](/docs/libraries) that helps you use Twilio's REST APIs, generate TwiML, and perform other common server-side programming tasks.

Twilio SDKs can handle credential management and simplify the authentication process. All Twilio SDKs come with a `Utilities` class that validates requests by passing your credentials to the library.

## HTTP methods for API interactions

Twilio APIs use standard RESTful HTTP methods to perform actions on resources. The following examples demonstrate the most common methods:

* `POST`: Create or update a resource.
* `GET`: Retrieve a resource.
* `DELETE`: Delete a resource.

## POST

POST a new SMS message

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(apiKey, apiSecret, { accountSid: accountSid });

async function createMessage() {
  const message = await client.messages.create({
    body: "Hello",
    from: "+14155552344",
    to: "+15558675310",
  });

  console.log(message.body);
}

createMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = os.environ["TWILIO_API_KEY"]
api_secret = os.environ["TWILIO_API_SECRET"]
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
client = Client(api_key, api_secret, account_sid)

message = client.messages.create(
    to="+15558675310", body="Hello", from_="+14155552344"
)

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string apiKey = Environment.GetEnvironmentVariable("TWILIO_API_KEY");
        string apiSecret = Environment.GetEnvironmentVariable("TWILIO_API_SECRET");
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");

        TwilioClient.Init(apiKey, apiSecret, accountSid);

        var message = await MessageResource.CreateAsync(
            to: new Twilio.Types.PhoneNumber("+15558675310"),
            body: "Hello",
            from: new Twilio.Types.PhoneNumber("+14155552344"));

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.type.PhoneNumber;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID at twilio.com/console
    // Provision API Keys at twilio.com/console/runtime/api-keys
    // and set the environment variables. See http://twil.io/secure
    public static final String API_KEY = System.getenv("TWILIO_API_KEY");
    public static final String API_SECRET = System.getenv("TWILIO_API_SECRET");
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");

    public static void main(String[] args) {
        Twilio.init(API_KEY, API_SECRET, ACCOUNT_SID);
        Message message = Message
                              .creator(new com.twilio.type.PhoneNumber("+15558675310"),
                                  new com.twilio.type.PhoneNumber("+14155552344"),
                                  "Hello")
                              .create();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID at twilio.com/console
	// Provision API Keys at twilio.com/console/runtime/api-keys
	// and set the environment variables. See http://twil.io/secure
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	apiKey := os.Getenv("TWILIO_API_KEY")
	apiSecret := os.Getenv("TWILIO_API_SECRET")
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username:   apiKey,
		Password:   apiSecret,
		AccountSid: accountSid,
	})

	params := &api.CreateMessageParams{}
	params.SetTo("+15558675310")
	params.SetBody("Hello")
	params.SetFrom("+14155552344")

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
$apiKey = getenv("TWILIO_API_KEY");
$apiSecret = getenv("TWILIO_API_SECRET");
$sid = getenv("TWILIO_ACCOUNT_SID");
$twilio = new Client($apiKey, $apiSecret, $sid);

$message = $twilio->messages->create(
    "+15558675310", // To
    [
        "body" => "Hello",
        "from" => "+14155552344",
    ]
);

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = ENV['TWILIO_API_KEY']
api_secret = ENV['TWILIO_API_SECRET']
account_sid = ENV['TWILIO_ACCOUNT_SID']
@client = Twilio::REST::Client.new(api_key, api_secret, account_sid)

message = @client
          .api
          .v2010
          .messages
          .create(
            to: '+15558675310',
            body: 'Hello',
            from: '+14155552344'
          )

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:create \
   --to +15558675310 \
   --body Hello \
   --from +14155552344
```

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "To=+15558675310" \
--data-urlencode "Body=Hello" \
--data-urlencode "From=+14155552344" \
-u $TWILIO_API_KEY:$TWILIO_API_SECRET
```

```json
{
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "api_version": "2010-04-01",
  "body": "Hello",
  "date_created": "Thu, 24 Aug 2023 05:01:45 +0000",
  "date_sent": "Thu, 24 Aug 2023 05:01:45 +0000",
  "date_updated": "Thu, 24 Aug 2023 05:01:45 +0000",
  "direction": "outbound-api",
  "error_code": null,
  "error_message": null,
  "from": "+14155552344",
  "num_media": "0",
  "num_segments": "1",
  "price": null,
  "price_unit": null,
  "messaging_service_sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sid": "SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "queued",
  "subresource_uris": {
    "media": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Media.json"
  },
  "to": "+15558675310",
  "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json"
}
```

## GET: List messages

GET a list of message

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(apiKey, apiSecret, { accountSid: accountSid });

async function listMessage() {
  const messages = await client.messages.list({ limit: 20 });

  messages.forEach((m) => console.log(m.body));
}

listMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = os.environ["TWILIO_API_KEY"]
api_secret = os.environ["TWILIO_API_SECRET"]
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
client = Client(api_key, api_secret, account_sid)

messages = client.messages.list(limit=20)

for record in messages:
    print(record.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string apiKey = Environment.GetEnvironmentVariable("TWILIO_API_KEY");
        string apiSecret = Environment.GetEnvironmentVariable("TWILIO_API_SECRET");
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");

        TwilioClient.Init(apiKey, apiSecret, accountSid);

        var messages = await MessageResource.ReadAsync(limit: 20);

        foreach (var record in messages) {
            Console.WriteLine(record.Body);
        }
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.base.ResourceSet;

public class Example {
    // Find your Account SID at twilio.com/console
    // Provision API Keys at twilio.com/console/runtime/api-keys
    // and set the environment variables. See http://twil.io/secure
    public static final String API_KEY = System.getenv("TWILIO_API_KEY");
    public static final String API_SECRET = System.getenv("TWILIO_API_SECRET");
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");

    public static void main(String[] args) {
        Twilio.init(API_KEY, API_SECRET, ACCOUNT_SID);
        ResourceSet<Message> messages = Message.reader().limit(20).read();

        for (Message record : messages) {
            System.out.println(record.getBody());
        }
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID at twilio.com/console
	// Provision API Keys at twilio.com/console/runtime/api-keys
	// and set the environment variables. See http://twil.io/secure
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	apiKey := os.Getenv("TWILIO_API_KEY")
	apiSecret := os.Getenv("TWILIO_API_SECRET")
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username:   apiKey,
		Password:   apiSecret,
		AccountSid: accountSid,
	})

	params := &api.ListMessageParams{}
	params.SetLimit(20)

	resp, err := client.Api.ListMessage(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		for record := range resp {
			if resp[record].Body != nil {
				fmt.Println(*resp[record].Body)
			} else {
				fmt.Println(resp[record].Body)
			}
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
$apiKey = getenv("TWILIO_API_KEY");
$apiSecret = getenv("TWILIO_API_SECRET");
$sid = getenv("TWILIO_ACCOUNT_SID");
$twilio = new Client($apiKey, $apiSecret, $sid);

$messages = $twilio->messages->read([], 20);

foreach ($messages as $record) {
    print $record->body;
}
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = ENV['TWILIO_API_KEY']
api_secret = ENV['TWILIO_API_SECRET']
account_sid = ENV['TWILIO_ACCOUNT_SID']
@client = Twilio::REST::Client.new(api_key, api_secret, account_sid)

messages = @client
           .api
           .v2010
           .messages
           .list(limit: 20)

messages.each do |record|
   puts record.body
end
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:list
```

```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json?PageSize=20" \
-u $TWILIO_API_KEY:$TWILIO_API_SECRET
```

```json
{
  "end": 1,
  "first_page_uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages.json?To=%2B123456789&From=%2B987654321&DateSent%3E=2008-01-02&PageSize=2&Page=0",
  "next_page_uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages.json?To=%2B123456789&From=%2B987654321&DateSent%3E=2008-01-02&PageSize=2&Page=1&PageToken=PAMMc26223853f8c46b4ab7dfaa6abba0a26",
  "page": 0,
  "page_size": 2,
  "previous_page_uri": null,
  "messages": [
    {
      "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "api_version": "2010-04-01",
      "body": "testing",
      "date_created": "Fri, 24 May 2019 17:44:46 +0000",
      "date_sent": "Fri, 24 May 2019 17:44:50 +0000",
      "date_updated": "Fri, 24 May 2019 17:44:50 +0000",
      "direction": "outbound-api",
      "error_code": null,
      "error_message": null,
      "from": "+12019235161",
      "messaging_service_sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "num_media": "0",
      "num_segments": "1",
      "price": "-0.00750",
      "price_unit": "USD",
      "sid": "SMded05904ccb347238880ca9264e8fe1c",
      "status": "sent",
      "subresource_uris": {
        "media": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMded05904ccb347238880ca9264e8fe1c/Media.json",
        "feedback": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMded05904ccb347238880ca9264e8fe1c/Feedback.json"
      },
      "to": "+18182008801",
      "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMded05904ccb347238880ca9264e8fe1c.json"
    },
    {
      "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "api_version": "2010-04-01",
      "body": "look mom I have media!",
      "date_created": "Fri, 24 May 2019 17:44:46 +0000",
      "date_sent": "Fri, 24 May 2019 17:44:49 +0000",
      "date_updated": "Fri, 24 May 2019 17:44:49 +0000",
      "direction": "inbound",
      "error_code": 30004,
      "error_message": "Message blocked",
      "from": "+12019235161",
      "messaging_service_sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "num_media": "3",
      "num_segments": "1",
      "price": "-0.00750",
      "price_unit": "USD",
      "sid": "MMc26223853f8c46b4ab7dfaa6abba0a26",
      "status": "received",
      "subresource_uris": {
        "media": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/MMc26223853f8c46b4ab7dfaa6abba0a26/Media.json",
        "feedback": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/MMc26223853f8c46b4ab7dfaa6abba0a26/Feedback.json"
      },
      "to": "+18182008801",
      "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/MMc26223853f8c46b4ab7dfaa6abba0a26.json"
    }
  ],
  "start": 0,
  "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages.json?To=%2B123456789&From=%2B987654321&DateSent%3E=2008-01-02&PageSize=2&Page=0"
}
```

## GET: Retrieve a message

GET a specific message

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(apiKey, apiSecret, { accountSid: accountSid });

async function fetchMessage() {
  const message = await client
    .messages("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .fetch();

  console.log(message.body);
}

fetchMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = os.environ["TWILIO_API_KEY"]
api_secret = os.environ["TWILIO_API_SECRET"]
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
client = Client(api_key, api_secret, account_sid)

message = client.messages("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").fetch()

print(message.body)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string apiKey = Environment.GetEnvironmentVariable("TWILIO_API_KEY");
        string apiSecret = Environment.GetEnvironmentVariable("TWILIO_API_SECRET");
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");

        TwilioClient.Init(apiKey, apiSecret, accountSid);

        var message =
            await MessageResource.FetchAsync(pathSid: "SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(message.Body);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID at twilio.com/console
    // Provision API Keys at twilio.com/console/runtime/api-keys
    // and set the environment variables. See http://twil.io/secure
    public static final String API_KEY = System.getenv("TWILIO_API_KEY");
    public static final String API_SECRET = System.getenv("TWILIO_API_SECRET");
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");

    public static void main(String[] args) {
        Twilio.init(API_KEY, API_SECRET, ACCOUNT_SID);
        Message message = Message.fetcher("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").fetch();

        System.out.println(message.getBody());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID at twilio.com/console
	// Provision API Keys at twilio.com/console/runtime/api-keys
	// and set the environment variables. See http://twil.io/secure
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	apiKey := os.Getenv("TWILIO_API_KEY")
	apiSecret := os.Getenv("TWILIO_API_SECRET")
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username:   apiKey,
		Password:   apiSecret,
		AccountSid: accountSid,
	})

	params := &api.FetchMessageParams{}

	resp, err := client.Api.FetchMessage("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.Body != nil {
			fmt.Println(*resp.Body)
		} else {
			fmt.Println(resp.Body)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
$apiKey = getenv("TWILIO_API_KEY");
$apiSecret = getenv("TWILIO_API_SECRET");
$sid = getenv("TWILIO_ACCOUNT_SID");
$twilio = new Client($apiKey, $apiSecret, $sid);

$message = $twilio->messages("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")->fetch();

print $message->body;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = ENV['TWILIO_API_KEY']
api_secret = ENV['TWILIO_API_SECRET']
account_sid = ENV['TWILIO_ACCOUNT_SID']
@client = Twilio::REST::Client.new(api_key, api_secret, account_sid)

message = @client
          .api
          .v2010
          .messages('SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
          .fetch

puts message.body
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:fetch \
   --sid SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json" \
-u $TWILIO_API_KEY:$TWILIO_API_SECRET
```

```json
{
  "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "api_version": "2010-04-01",
  "body": "testing",
  "date_created": "Fri, 24 May 2019 17:18:27 +0000",
  "date_sent": "Fri, 24 May 2019 17:18:28 +0000",
  "date_updated": "Fri, 24 May 2019 17:18:28 +0000",
  "direction": "outbound-api",
  "error_code": 30007,
  "error_message": "Carrier violation",
  "from": "+12019235161",
  "messaging_service_sid": "MGaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "num_media": "0",
  "num_segments": "1",
  "price": "-0.00750",
  "price_unit": "USD",
  "sid": "SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "sent",
  "subresource_uris": {
    "media": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMb7c0a2ce80504485a6f653a7110836f5/Media.json",
    "feedback": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMb7c0a2ce80504485a6f653a7110836f5/Feedback.json"
  },
  "to": "+18182008801",
  "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Messages/SMb7c0a2ce80504485a6f653a7110836f5.json"
}
```

## DELETE

DELETE a message

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(apiKey, apiSecret, { accountSid: accountSid });

async function deleteMessage() {
  await client.messages("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").remove();
}

deleteMessage();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = os.environ["TWILIO_API_KEY"]
api_secret = os.environ["TWILIO_API_SECRET"]
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
client = Client(api_key, api_secret, account_sid)

client.messages("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").delete()
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string apiKey = Environment.GetEnvironmentVariable("TWILIO_API_KEY");
        string apiSecret = Environment.GetEnvironmentVariable("TWILIO_API_SECRET");
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");

        TwilioClient.Init(apiKey, apiSecret, accountSid);

        await MessageResource.DeleteAsync(pathSid: "SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;

public class Example {
    // Find your Account SID at twilio.com/console
    // Provision API Keys at twilio.com/console/runtime/api-keys
    // and set the environment variables. See http://twil.io/secure
    public static final String API_KEY = System.getenv("TWILIO_API_KEY");
    public static final String API_SECRET = System.getenv("TWILIO_API_SECRET");
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");

    public static void main(String[] args) {
        Twilio.init(API_KEY, API_SECRET, ACCOUNT_SID);
        Message.deleter("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").delete();
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"os"
)

func main() {
	// Find your Account SID at twilio.com/console
	// Provision API Keys at twilio.com/console/runtime/api-keys
	// and set the environment variables. See http://twil.io/secure
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	apiKey := os.Getenv("TWILIO_API_KEY")
	apiSecret := os.Getenv("TWILIO_API_SECRET")
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username:   apiKey,
		Password:   apiSecret,
		AccountSid: accountSid,
	})

	params := &api.DeleteMessageParams{}

	err := client.Api.DeleteMessage("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID at twilio.com/console
// Provision API Keys at twilio.com/console/runtime/api-keys
// and set the environment variables. See http://twil.io/secure
$apiKey = getenv("TWILIO_API_KEY");
$apiSecret = getenv("TWILIO_API_SECRET");
$sid = getenv("TWILIO_ACCOUNT_SID");
$twilio = new Client($apiKey, $apiSecret, $sid);

$twilio->messages("SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")->delete();
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID at twilio.com/console
# Provision API Keys at twilio.com/console/runtime/api-keys
# and set the environment variables. See http://twil.io/secure
api_key = ENV['TWILIO_API_KEY']
api_secret = ENV['TWILIO_API_SECRET']
account_sid = ENV['TWILIO_ACCOUNT_SID']
@client = Twilio::REST::Client.new(api_key, api_secret, account_sid)

@client
  .api
  .v2010
  .messages('SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  .delete
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:core:messages:remove \
   --sid SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X DELETE "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages/SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json" \
-u $TWILIO_API_KEY:$TWILIO_API_SECRET
```

## Content type requirements

Twilio APIs expect the API request content type to be `application/x-www-form-urlencoded` or `multipart/form-data`. Using an unsupported content type might cause unexpected behavior or errors.

## Global Edge Locations and network entry

Twilio global infrastructure allows you to optimize request routing for better performance. You can specify which Twilio network edge your API request uses to ingress Twilio network, and the processing region for your request. Learn more about [Edge Locations](/docs/global-infrastructure/understanding-edge-locations#inbound-connectivity).

## Vanity URLs and security requirements

Twilio has specific security requirements for accessing voice recording media files. Twilio doesn't support unauthenticated access to HTTP Voice recording media URLs using Canonical Name (CNAME) records. Use HTTPS endpoints and Transport-Layer-Security (TLS) protocols when accessing voice recordings media files from your account. For more information, see the [Changelog](https://www.twilio.com/en-us/changelog/upcoming-security-changes--http-voice-recording-media-endpoint-c).

## How the Twilio APIs handle webhooks

[Webhooks](/docs/glossary/what-is-a-webhook) are user-defined HTTP callbacks triggered by an event in a web application. Twilio uses webhooks to let your application know when events happen, like getting an incoming call or receiving an SMS message. Webhooks are triggered asynchronously.

When a webhook event occurs, Twilio makes an HTTP request, such as `POST` or `GET`, to the URL you configured for your webhook. Twilio's request to your application includes details of the event like the body of an incoming message or an incoming phone number. Your application can then process the event and reply to Twilio with a response containing the instructions you'd like Twilio to perform.

To handle a webhook when you use Twilio, you need to build a web application that can accept HTTP requests. Check out the [Twilio SDKs](/docs/libraries) to get up and running quickly.

## Next steps

After you understand how to make requests to Twilio APIs, explore these resources:

* [Twilio SDKs](/docs/libraries): Get started with server-side libraries.
* [API Key Management](/docs/iam/api-keys): Learn about creating and managing API keys.
* [Twilio CLI](/docs/twilio-cli/general-usage): Work with Twilio from your terminal.
* [Webhook Security](/docs/usage/security): Secure your webhook endpoints.
* [Global Infrastructure](/docs/global-infrastructure): Optimize performance with Edge Locations.

# Monitor REST API: Alerts

An Alert resource instance represents a single log entry for an error or warning encountered when Twilio makes a webhook request to your server, or when your application makes a request to the REST API.

These can be very useful for debugging purposes, and you can configure new email or webhook notifications using [Alarms](https://console.twilio.com/any/monitor/alarms/).

## Alert Properties

> \[!WARNING]
>
> The maximum number of Alert resources you can fetch per request to this API is 10,000.

> \[!WARNING]
>
> Unlike other parts of the REST API, the representation of an Alert instance is different from the Alert representations within responses from the list resource. Due to the potentially very large amount of data in an alert, the full HTTP request and response data is only returned in the Alert instance resource representation.

```json
{"type":"object","refName":"monitor.v1.alert","modelName":"monitor_v1_alert","properties":{"account_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^AC[0-9a-fA-F]{32}$","nullable":true,"description":"The SID of the [Account](/docs/iam/api/account) that created the Alert resource."},"alert_text":{"type":"string","nullable":true,"description":"The text of the alert."},"api_version":{"type":"string","nullable":true,"description":"The API version used when the alert was generated.  Can be empty for events that don't have a specific API version."},"date_created":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the resource was created specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format."},"date_generated":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the alert was generated specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#UTC) format.  Due to buffering, this can be different than `date_created`."},"date_updated":{"type":"string","format":"date-time","nullable":true,"description":"The date and time in GMT when the resource was last updated specified in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format."},"error_code":{"type":"string","nullable":true,"description":"The error code for the condition that generated the alert. See the [Error Dictionary](/docs/api/errors) for possible causes and solutions to the error."},"log_level":{"type":"string","nullable":true,"description":"The log level.  Can be: `error`, `warning`, `notice`, or `debug`."},"more_info":{"type":"string","nullable":true,"description":"The URL of the page in our [Error Dictionary](/docs/api/errors) with more information about the error condition."},"request_method":{"type":"string","format":"http-method","enum":["GET","POST"],"nullable":true,"description":"The method used by the request that generated the alert. If the alert was generated by a request we made to your server, this is the method we used. If the alert was generated by a request from your application to our API, this is the method your application used."},"request_url":{"type":"string","nullable":true,"description":"The URL of the request that generated the alert. If the alert was generated by a request we made to your server, this is the URL on your server that generated the alert. If the alert was generated by a request from your application to our API, this is the URL of the resource requested."},"resource_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^[a-zA-Z]{2}[0-9a-fA-F]{32}$","nullable":true,"description":"The SID of the resource for which the alert was generated.  For instance, if your server failed to respond to an HTTP request during the flow of a particular call, this value would be the SID of the server.  This value is empty if the alert was not generated for a particular resource."},"sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^NO[0-9a-fA-F]{32}$","nullable":true,"description":"The unique string that we created to identify the Alert resource."},"url":{"type":"string","format":"uri","nullable":true,"description":"The absolute URL of the Alert resource."},"service_sid":{"type":"string","minLength":34,"maxLength":34,"pattern":"^[a-zA-Z]{2}[0-9a-fA-F]{32}$","nullable":true,"description":"The SID of the service or resource that generated the alert. Can be `null`."},"request_variables":{"type":"string","nullable":true,"description":"The variables passed in the request that generated the alert. This value is only returned when a single Alert resource is fetched."},"response_body":{"type":"string","nullable":true,"description":"The response body of the request that generated the alert. This value is only returned when a single Alert resource is fetched."},"response_headers":{"type":"string","nullable":true,"description":"The response headers of the request that generated the alert. This value is only returned when a single Alert resource is fetched."},"request_headers":{"type":"string","nullable":true,"description":"The request headers of the request that generated the alert. This value is only returned when a single Alert resource is fetched."}}}
```

## Fetch an Alert resource

`GET https://monitor.twilio.com/v1/Alerts/{Sid}`

### Path parameters

```json
[{"name":"Sid","in":"path","description":"The SID of the Alert resource to fetch.","schema":{"type":"string","minLength":34,"maxLength":34,"pattern":"^NO[0-9a-fA-F]{32}$"},"required":true}]
```

Fetch an Alert

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function fetchAlert() {
  const alert = await client.monitor.v1
    .alerts("NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    .fetch();

  console.log(alert.accountSid);
}

fetchAlert();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

alert = client.monitor.v1.alerts("NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").fetch()

print(alert.account_sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Monitor.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var alert = await AlertResource.FetchAsync(pathSid: "NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        Console.WriteLine(alert.AccountSid);
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.monitor.v1.Alert;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        Alert alert = Alert.fetcher("NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").fetch();

        System.out.println(alert.getAccountSid());
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	resp, err := client.MonitorV1.FetchAlert("NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		if resp.AccountSid != nil {
			fmt.Println(*resp.AccountSid)
		} else {
			fmt.Println(resp.AccountSid)
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$alert = $twilio->monitor->v1
    ->alerts("NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ->fetch();

print $alert->accountSid;
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

alert = @client
        .monitor
        .v1
        .alerts('NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
        .fetch

puts alert.account_sid
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:monitor:v1:alerts:fetch \
   --sid NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

```bash
curl -X GET "https://monitor.twilio.com/v1/Alerts/NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "alert_text": "alert_text",
  "api_version": "2010-04-01",
  "date_created": "2015-07-30T20:00:00Z",
  "date_generated": "2015-07-30T20:00:00Z",
  "date_updated": "2015-07-30T20:00:00Z",
  "error_code": "error_code",
  "log_level": "log_level",
  "more_info": "more_info",
  "request_method": "GET",
  "request_url": "http://www.example.com",
  "request_variables": "request_variables",
  "resource_sid": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "response_body": "response_body",
  "response_headers": "response_headers",
  "request_headers": "request_headers",
  "sid": "NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "url": "https://monitor.twilio.com/v1/Alerts/NOaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "service_sid": "PNe2cd757cd5257b0217a447933a0290d2"
}
```

## Read multiple Alert resources

`GET https://monitor.twilio.com/v1/Alerts`

Returns a list of alerts generated for an account. The list includes [paging information](/docs/usage/twilios-response#pagination).

### Query parameters

```json
[{"name":"LogLevel","in":"query","description":"Only show alerts for this log-level.  Can be: `error`, `warning`, `notice`, or `debug`.","schema":{"type":"string"},"examples":{"readEmpty":{"value":"log_level"},"readFull":{"value":"log_level"}}},{"name":"StartDate","in":"query","description":"Only include alerts that occurred on or after this date and time. Specify the date and time in GMT and format as `YYYY-MM-DD` or `YYYY-MM-DDThh:mm:ssZ`. Queries for alerts older than 30 days are not supported.","schema":{"type":"string","format":"date-time"},"examples":{"readEmpty":{"value":"2016-01-01"},"readFull":{"value":"2016-01-01"}}},{"name":"EndDate","in":"query","description":"Only include alerts that occurred on or before this date and time. Specify the date and time in GMT and format as `YYYY-MM-DD` or `YYYY-MM-DDThh:mm:ssZ`. Queries for alerts older than 30 days are not supported.","schema":{"type":"string","format":"date-time"},"examples":{"readEmpty":{"value":"2016-01-01"},"readFull":{"value":"2016-01-01"}}},{"name":"PageSize","in":"query","description":"How many resources to return in each list page. The default is 50, and the maximum is 1000.","schema":{"type":"integer","format":"int64","minimum":1,"maximum":1000}},{"name":"Page","in":"query","description":"The page index. This value is simply for client state.","schema":{"type":"integer","minimum":0}},{"name":"PageToken","in":"query","description":"The page token. This is provided by the API.","schema":{"type":"string"}}]
```

List all alerts

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function listAlert() {
  const alerts = await client.monitor.v1.alerts.list({ limit: 20 });

  alerts.forEach((a) => console.log(a.accountSid));
}

listAlert();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

alerts = client.monitor.v1.alerts.list(limit=20)

for record in alerts:
    print(record.account_sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Monitor.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var alerts = await AlertResource.ReadAsync(limit: 20);

        foreach (var record in alerts) {
            Console.WriteLine(record.AccountSid);
        }
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import com.twilio.Twilio;
import com.twilio.rest.monitor.v1.Alert;
import com.twilio.base.ResourceSet;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        ResourceSet<Alert> alerts = Alert.reader().limit(20).read();

        for (Alert record : alerts) {
            System.out.println(record.getAccountSid());
        }
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	monitor "github.com/twilio/twilio-go/rest/monitor/v1"
	"os"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &monitor.ListAlertParams{}
	params.SetLimit(20)

	resp, err := client.MonitorV1.ListAlert(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		for record := range resp {
			if resp[record].AccountSid != nil {
				fmt.Println(*resp[record].AccountSid)
			} else {
				fmt.Println(resp[record].AccountSid)
			}
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$alerts = $twilio->monitor->v1->alerts->read([], 20);

foreach ($alerts as $record) {
    print $record->accountSid;
}
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

alerts = @client
         .monitor
         .v1
         .alerts
         .list(limit: 20)

alerts.each do |record|
   puts record.account_sid
end
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:monitor:v1:alerts:list
```

```bash
curl -X GET "https://monitor.twilio.com/v1/Alerts?PageSize=20" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "alerts": [],
  "meta": {
    "first_page_url": "https://monitor.twilio.com/v1/Alerts?LogLevel=log_level&StartDate=2016-01-01T00:00:00Z&EndDate=2016-01-01T00:00:00Z&PageSize=50&Page=0",
    "key": "alerts",
    "next_page_url": null,
    "page": 0,
    "page_size": 50,
    "previous_page_url": null,
    "url": "https://monitor.twilio.com/v1/Alerts?LogLevel=log_level&StartDate=2016-01-01T00:00:00Z&EndDate=2016-01-01T00:00:00Z&PageSize=50&Page=0"
  }
}
```

Date range example

```js
// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function listAlert() {
  const alerts = await client.monitor.v1.alerts.list({
    endDate: new Date("2009-07-06 20:30:00"),
    logLevel: "warning",
    startDate: new Date("2009-07-06 20:30:00"),
    limit: 20,
  });

  alerts.forEach((a) => console.log(a.accountSid));
}

listAlert();
```

```python
# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client
from datetime import datetime

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = os.environ["TWILIO_ACCOUNT_SID"]
auth_token = os.environ["TWILIO_AUTH_TOKEN"]
client = Client(account_sid, auth_token)

alerts = client.monitor.v1.alerts.list(
    log_level="warning",
    start_date=datetime(2009, 7, 6, 20, 30, 0),
    end_date=datetime(2009, 7, 6, 20, 30, 0),
    limit=20,
)

for record in alerts:
    print(record.account_sid)
```

```csharp
// Install the C# / .NET helper library from twilio.com/docs/csharp/install

using System;
using Twilio;
using Twilio.Rest.Monitor.V1;
using System.Threading.Tasks;

class Program {
    public static async Task Main(string[] args) {
        // Find your Account SID and Auth Token at twilio.com/console
        // and set the environment variables. See http://twil.io/secure
        string accountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID");
        string authToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN");

        TwilioClient.Init(accountSid, authToken);

        var alerts = await AlertResource.ReadAsync(
            logLevel: "warning",
            startDate: new DateTime(2009, 7, 6, 20, 30, 0),
            endDate: new DateTime(2009, 7, 6, 20, 30, 0),
            limit: 20);

        foreach (var record in alerts) {
            Console.WriteLine(record.AccountSid);
        }
    }
}
```

```java
// Install the Java helper library from twilio.com/docs/java/install

import java.time.ZoneId;
import java.time.ZonedDateTime;
import com.twilio.Twilio;
import com.twilio.rest.monitor.v1.Alert;
import com.twilio.base.ResourceSet;

public class Example {
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    public static final String ACCOUNT_SID = System.getenv("TWILIO_ACCOUNT_SID");
    public static final String AUTH_TOKEN = System.getenv("TWILIO_AUTH_TOKEN");

    public static void main(String[] args) {
        Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
        ResourceSet<Alert> alerts = Alert.reader()
                                        .setLogLevel("warning")
                                        .setStartDate(ZonedDateTime.of(2009, 7, 6, 20, 30, 0, 0, ZoneId.of("UTC")))
                                        .setEndDate(ZonedDateTime.of(2009, 7, 6, 20, 30, 0, 0, ZoneId.of("UTC")))
                                        .limit(20)
                                        .read();

        for (Alert record : alerts) {
            System.out.println(record.getAccountSid());
        }
    }
}
```

```go
// Download the helper library from https://www.twilio.com/docs/go/install
package main

import (
	"fmt"
	"github.com/twilio/twilio-go"
	monitor "github.com/twilio/twilio-go/rest/monitor/v1"
	"os"
	"time"
)

func main() {
	// Find your Account SID and Auth Token at twilio.com/console
	// and set the environment variables. See http://twil.io/secure
	// Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN exists in your environment
	client := twilio.NewRestClient()

	params := &monitor.ListAlertParams{}
	params.SetLogLevel("warning")
	params.SetStartDate(time.Date(2009, 7, 6, 20, 30, 0, 0, time.UTC))
	params.SetEndDate(time.Date(2009, 7, 6, 20, 30, 0, 0, time.UTC))
	params.SetLimit(20)

	resp, err := client.MonitorV1.ListAlert(params)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	} else {
		for record := range resp {
			if resp[record].AccountSid != nil {
				fmt.Println(*resp[record].AccountSid)
			} else {
				fmt.Println(resp[record].AccountSid)
			}
		}
	}
}
```

```php
<?php

// Update the path below to your autoload.php,
// see https://getcomposer.org/doc/01-basic-usage.md
require_once "/path/to/vendor/autoload.php";

use Twilio\Rest\Client;

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
$sid = getenv("TWILIO_ACCOUNT_SID");
$token = getenv("TWILIO_AUTH_TOKEN");
$twilio = new Client($sid, $token);

$alerts = $twilio->monitor->v1->alerts->read(
    [
        "logLevel" => "warning",
        "startDate" => new \DateTime("2009-07-06T20:30:00Z"),
        "endDate" => new \DateTime("2009-07-06T20:30:00Z"),
    ],
    20
);

foreach ($alerts as $record) {
    print $record->accountSid;
}
```

```ruby
# Download the helper library from https://www.twilio.com/docs/ruby/install
require 'twilio-ruby'

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = ENV['TWILIO_ACCOUNT_SID']
auth_token = ENV['TWILIO_AUTH_TOKEN']
@client = Twilio::REST::Client.new(account_sid, auth_token)

alerts = @client
         .monitor
         .v1
         .alerts
         .list(
           log_level: 'warning',
           start_date: Time.new(2009, 7, 6, 20, 30, 0),
           end_date: Time.new(2009, 7, 6, 20, 30, 0),
           limit: 20
         )

alerts.each do |record|
   puts record.account_sid
end
```

```bash
# Install the twilio-cli from https://twil.io/cli

twilio api:monitor:v1:alerts:list \
   --log-level warning \
   --start-date 2016-07-31 \
   --end-date 2016-07-31
```

```bash
curl -X GET "https://monitor.twilio.com/v1/Alerts?LogLevel=warning&StartDate=2016-07-31&EndDate=2016-07-31&PageSize=20" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

```json
{
  "alerts": [],
  "meta": {
    "first_page_url": "https://monitor.twilio.com/v1/Alerts?LogLevel=log_level&StartDate=2016-01-01T00:00:00Z&EndDate=2016-01-01T00:00:00Z&PageSize=50&Page=0",
    "key": "alerts",
    "next_page_url": null,
    "page": 0,
    "page_size": 50,
    "previous_page_url": null,
    "url": "https://monitor.twilio.com/v1/Alerts?LogLevel=log_level&StartDate=2016-01-01T00:00:00Z&EndDate=2016-01-01T00:00:00Z&PageSize=50&Page=0"
  }
}
```

