> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# X API

> Programmatic access to X's posts, users, spaces, and more

export const Button = ({href, children}) => {
  return <div className="not-prose group">
    <a href={href}>
      <button className="flex items-center space-x-2.5 py-1 px-4 bg-primary-dark dark:bg-white text-white dark:text-gray-950 rounded-full group-hover:opacity-[0.9] font-medium">
        <span>
          {children}
        </span>
        <svg width="3" height="24" viewBox="0 -9 3 24" class="h-6 rotate-0 overflow-visible"><path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
      </button>
    </a>
  </div>;
};

The X API gives you programmatic access to X's public conversation. Read posts, publish content, manage users, and analyze trends—all through modern REST endpoints with flexible pay-per-usage pricing.

<CardGroup cols={3}>
  <Card title="Get started" icon="rocket" href="/x-api/getting-started/make-your-first-request">
    Create an app and make your first request in minutes.
  </Card>

  <Card title="API reference" icon="code" href="/x-api/posts/create-post">
    Explore all available endpoints.
  </Card>

  <Card title="SDKs" icon="cube" href="/xdks/overview">
    Official Python and TypeScript libraries.
  </Card>
</CardGroup>

***

## What you can build

<CardGroup cols={3}>
  <Card title="Posts" icon="message" href="/x-api/posts/lookup/introduction">
    Search, retrieve, and publish posts. Access timelines, threads, and quote posts.
  </Card>

  <Card title="Users" icon="user" href="/x-api/users/lookup/introduction">
    Look up users, manage follows, blocks, and mutes.
  </Card>

  <Card title="Spaces" icon="microphone" href="/x-api/spaces/lookup/introduction">
    Find live audio conversations and their participants.
  </Card>

  <Card title="Direct Messages" icon="envelope" href="/x-api/direct-messages/lookup/introduction">
    Send and receive private messages.
  </Card>

  <Card title="Lists" icon="list" href="/x-api/lists/list-lookup/introduction">
    Create and manage curated lists of accounts.
  </Card>

  <Card title="Trends" icon="arrow-trend-up" href="/x-api/trends/trends-by-woeid/introduction">
    Access trending topics by location.
  </Card>
</CardGroup>

***

## Pricing

The X API uses **pay-per-usage** pricing. No subscriptions—pay only for what you use.

<CardGroup cols={2}>
  <Card title="Flexible scaling" icon="chart-line">
    Start small and grow. Costs scale with your actual usage.
  </Card>

  <Card title="No commitments" icon="unlock">
    No contracts or minimum spend. Stop anytime.
  </Card>

  <Card title="Real-time tracking" icon="gauge-high">
    Monitor usage and costs live in the Developer Console.
  </Card>

  <Card title="Credit-based" icon="coins">
    Purchase credits upfront. Deducted as you use the API.
  </Card>
</CardGroup>

<Tip>
  Earn free [xAI API](https://docs.x.ai) credits when you purchase X API credits—up to 20% back based on your spend. [Learn more](/x-api/getting-started/pricing#free-xai-api-credits)
</Tip>

<Note>
  Pay-per-usage plans are subject to a monthly cap of 2 million Post reads. If you need higher volume, consider an [Enterprise plan](/forms/enterprise-api-interest).
</Note>

<div className="mt-6 flex gap-4">
  <Button href="/x-api/getting-started/pricing">Pricing details</Button>
  <Button href="https://console.x.com">Purchase credits</Button>
</div>

***

## Key features

<Tabs>
  <Tab title="Data access">
    ### Rich data objects

    Access detailed, structured data for posts, users, media, and more:

    * **Posts**: Full text, metrics, entities, annotations, conversation threads
    * **Users**: Profiles, follower counts, verification status
    * **Media**: Images, videos, GIFs with metadata
    * **Polls**: Options and vote counts

    Customize responses with [fields](/x-api/fundamentals/fields) and [expansions](/x-api/fundamentals/expansions) to get exactly the data you need.
  </Tab>

  <Tab title="Near real-time streaming">
    ### Filtered stream

    Get posts delivered in near real-time as they're published. Define up to 1,000 filtering rules to receive only matching posts.

    ```bash  theme={null}
    # Add a rule
    curl -X POST "https://api.x.com/2/tweets/search/stream/rules" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"add": [{"value": "from:xdevelopers"}]}'

    # Connect to stream
    curl "https://api.x.com/2/tweets/search/stream" \
      -H "Authorization: Bearer $TOKEN"
    ```

    [Learn more about filtered stream →](/x-api/posts/filtered-stream/introduction)
  </Tab>

  <Tab title="Search & analytics">
    ### Full-archive search

    Search the complete history of public posts—back to 2006. Build queries with operators for users, keywords, dates, and more.

    ```bash  theme={null}
    curl "https://api.x.com/2/tweets/search/all?query=AI%20lang:en" \
      -H "Authorization: Bearer $TOKEN"
    ```

    ### Metrics

    Access engagement metrics including impressions, likes, reposts, replies, and video views.

    [Learn more about search →](/x-api/posts/search/introduction)
  </Tab>
</Tabs>

***

## API versions

| Version        | Status    | Description                                          |
| :------------- | :-------- | :--------------------------------------------------- |
| **v2**         | Current   | Modern endpoints, flexible pricing, all new features |
| **Enterprise** | Available | High-volume access with dedicated support            |

<Tip>
  Use **X API v2** for all new projects. It's where all new features and improvements are released.
</Tip>

***

## Quick start

<Steps>
  <Step title="Create a developer account">
    Sign up at [console.x.com](https://console.x.com) and create an app.
  </Step>

  <Step title="Get your credentials">
    Generate your Bearer Token for app-only requests.
  </Step>

  <Step title="Make a request">
    Try looking up a user:

    ```bash  theme={null}
    curl "https://api.x.com/2/users/by/username/xdevelopers" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Step>
</Steps>

<Button href="/x-api/getting-started/make-your-first-request">Full quickstart guide</Button>

***

## Tools & libraries

<CardGroup cols={3}>
  <Card title="Python SDK" icon="python" href="/xdks/python/overview">
    Official Python library with async support.
  </Card>

  <Card title="TypeScript SDK" icon="js" href="/xdks/typescript/overview">
    Official TypeScript/JavaScript library.
  </Card>

  <Card title="Postman" icon="server" href="https://www.postman.com/xapidevelopers/x-api-public-workspace/collection/34902927-2efc5689-99c6-4ab6-8091-996f35c2fd80">
    Interactive API explorer.
  </Card>
</CardGroup>

[Browse all libraries →](/x-api/tools-and-libraries/overview)

***

## Support

<CardGroup cols={2}>
  <Card title="Developer Forum" icon="comments" href="https://devcommunity.x.com">
    Get help from the community and X team.
  </Card>

  <Card title="Support Hub" icon="circle-question" href="https://developer.x.com/en/support/twitter-api.html">
    FAQs and troubleshooting guides.
  </Card>
</CardGroup>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# About the X API

> Overview of X API capabilities, versions, and resources

The X API provides programmatic access to X's public conversation. Retrieve posts, analyze trends, build integrations, and create new experiences on the platform.

***

## What you can do

| Capability             | Description                                      |
| :--------------------- | :----------------------------------------------- |
| **Read posts**         | Search, look up, and stream posts in real-time   |
| **Publish content**    | Create posts, replies, and threads               |
| **Manage users**       | Look up users, manage follows, blocks, and mutes |
| **Analyze data**       | Access metrics, trends, and engagement analytics |
| **Build integrations** | Send DMs, manage lists, and interact with Spaces |

***

## API versions

<Tabs>
  <Tab title="X API v2 (Recommended)">
    The current version of the X API with modern features and flexible pricing.

    **Why use v2:**

    * Pay-per-usage pricing
    * Modern JSON response format
    * Flexible [fields](/x-api/fundamentals/fields) and [expansions](/x-api/fundamentals/expansions)
    * Advanced features: annotations, conversation tracking, edit history
    * All new endpoints and features

    **Getting started:**

    1. Sign up at [console.x.com](https://console.x.com)
    2. Create an app and get credentials
    3. [Make your first request](/x-api/getting-started/make-your-first-request)
  </Tab>

  <Tab title="X API v1.1 (Legacy)">
    The previous version of the X API. Limited support; use v2 for new projects.

    **Still available:**

    * Some media upload endpoints
    * Legacy streaming (deprecated)
    * Some specialized endpoints

    **Migrating to v2:**
    See the [migration guide](/x-api/migrate/overview) for endpoint mapping and data format changes.
  </Tab>

  <Tab title="Enterprise">
    High-volume access for businesses with advanced needs.

    **Features:**

    * Complete firehose access
    * Historical data backfill
    * Dedicated support
    * Custom rate limits
    * Compliance streams

    [Contact enterprise sales →](/enterprise/forms/enterprise-api-interest)
  </Tab>
</Tabs>

***

## Available resources

The X API provides access to these resource types:

<CardGroup cols={3}>
  <Card title="Posts" icon="message">
    Search, retrieve, create, and delete posts. Access timelines, threads, and quote posts.
  </Card>

  <Card title="Users" icon="user">
    Look up profiles, manage relationships, and access follower data.
  </Card>

  <Card title="Spaces" icon="microphone">
    Discover live audio conversations and participants.
  </Card>

  <Card title="Direct Messages" icon="envelope">
    Send and receive private messages between users.
  </Card>

  <Card title="Lists" icon="list">
    Create and manage curated lists of accounts.
  </Card>

  <Card title="Trends" icon="arrow-trend-up">
    Access trending topics by location.
  </Card>
</CardGroup>

***

## v2 highlights

<Accordion title="Fields and expansions">
  Request only the data you need. Use `fields` parameters to select specific attributes and `expansions` to include related objects.

  ```bash  theme={null}
  curl "https://api.x.com/2/tweets/123?tweet.fields=created_at,public_metrics&expansions=author_id&user.fields=username" \
    -H "Authorization: Bearer $TOKEN"
  ```

  [Learn more about fields →](/x-api/fundamentals/fields)
</Accordion>

<Accordion title="Post annotations">
  Posts include semantic annotations identifying people, places, products, and topics. Filter streams and searches by topic.

  [Learn more about annotations →](/x-api/fundamentals/post-annotations)
</Accordion>

<Accordion title="Engagement metrics">
  Access public metrics (likes, reposts, replies) and private metrics (impressions, clicks) for your own posts.

  [Learn more about metrics →](/x-api/fundamentals/metrics)
</Accordion>

<Accordion title="Conversation tracking">
  Reconstruct entire conversation threads using `conversation_id`. Track replies across the full thread.

  [Learn more about conversation tracking →](/x-api/fundamentals/conversation-id)
</Accordion>

<Accordion title="Edit history">
  Access the edit history of posts, including all previous versions and edit metadata.

  [Learn more about edit posts →](/x-api/fundamentals/edit-posts)
</Accordion>

***

## Pricing

X API v2 uses **pay-per-usage** pricing:

| Benefit                | Description                                                    |
| :--------------------- | :------------------------------------------------------------- |
| **No subscriptions**   | Pay only for what you use                                      |
| **Credit-based**       | Purchase credits, deducted per request                         |
| **Real-time tracking** | Monitor usage in the Developer Console                         |
| **Deduplication**      | Same resource requested twice in 24 hours is only charged once |

<Note>
  Pay-per-usage plans are subject to a monthly cap of 2 million Post reads. If you need higher volume, consider an [Enterprise plan](/forms/enterprise-api-interest).
</Note>

[View pricing details →](/x-api/getting-started/pricing)

***

## Next steps

<CardGroup cols={2}>
  <Card title="Get access" icon="key" href="/x-api/getting-started/getting-access">
    Sign up and create your first app.
  </Card>

  <Card title="Make your first request" icon="rocket" href="/x-api/getting-started/make-your-first-request">
    Call the API in minutes.
  </Card>
</CardGroup>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting Access

> Sign up for API access and get your credentials

export const Button = ({href, children}) => {
  return <div className="not-prose group">
    <a href={href}>
      <button className="flex items-center space-x-2.5 py-1 px-4 bg-primary-dark dark:bg-white text-white dark:text-gray-950 rounded-full group-hover:opacity-[0.9] font-medium">
        <span>
          {children}
        </span>
        <svg width="3" height="24" viewBox="0 -9 3 24" class="h-6 rotate-0 overflow-visible"><path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
      </button>
    </a>
  </div>;
};

Get started with the X API in three steps: sign up, create an app, and save your credentials.

<Button href="https://console.x.com">Sign up now</Button>

***

## Step 1: Create a developer account

<Steps>
  <Step title="Go to the Developer Console">
    Visit [console.x.com](https://console.x.com) and sign in with your X account.
  </Step>

  <Step title="Accept the Developer Agreement">
    Review and accept the Developer Agreement and Policy.
  </Step>

  <Step title="Complete your profile">
    Provide basic information about how you'll use the API.
  </Step>
</Steps>

***

## Step 2: Create an app

After signing up, create an app to get your API credentials:

<Steps>
  <Step title="Click 'New App'">
    From the Developer Console dashboard, create a new app.
  </Step>

  <Step title="Enter app details">
    Provide a name, description, and use case for your app.
  </Step>

  <Step title="Generate credentials">
    The console will generate your API keys and tokens.
  </Step>
</Steps>

***

## Step 3: Save your credentials

You'll receive several credentials depending on your authentication needs:

| Credential                | Purpose                                                                  |
| :------------------------ | :----------------------------------------------------------------------- |
| **API Key & Secret**      | Identify your app. Used to generate tokens and sign OAuth 1.0a requests. |
| **Bearer Token**          | App-only authentication for reading public data.                         |
| **Access Token & Secret** | Make requests on behalf of your own account (OAuth 1.0a).                |
| **Client ID & Secret**    | OAuth 2.0 authentication for user-context requests.                      |

<Warning>
  **Save immediately.** Credentials are only displayed once. Store them in a password manager or secure vault. If you lose them, you'll need to regenerate (which invalidates the old ones).
</Warning>

***

## Which credentials do you need?

<Tabs>
  <Tab title="Reading public data">
    Use the **Bearer Token** for simple, read-only access to public data.

    ```bash  theme={null}
    curl "https://api.x.com/2/users/by/username/xdevelopers" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```

    Best for: Searching posts, looking up users, reading trends.
  </Tab>

  <Tab title="Acting as a user">
    Use **OAuth 2.0** (recommended) or **OAuth 1.0a** to act on behalf of users.

    OAuth 2.0 offers fine-grained scopes—request only the permissions you need.

    Best for: Posting, liking, following, accessing DMs.

    [OAuth 2.0 guide →](/resources/fundamentals/authentication/oauth-2-0/overview)
  </Tab>

  <Tab title="Acting as yourself">
    Use your **Access Token & Secret** to make requests as your own account.

    These tokens represent the account that owns the app.

    Best for: Testing, personal bots, your own automation.
  </Tab>
</Tabs>

***

## Credential security best practices

<CardGroup cols={2}>
  <Card title="Use environment variables" icon="terminal">
    Never hardcode credentials in your source code.
  </Card>

  <Card title="Don't commit to git" icon="code-branch">
    Add credential files to `.gitignore`.
  </Card>

  <Card title="Rotate regularly" icon="arrows-rotate">
    Regenerate credentials periodically as a security measure.
  </Card>

  <Card title="Use minimal scopes" icon="shield-check">
    Only request the OAuth permissions your app needs.
  </Card>
</CardGroup>

***

## Next steps

<CardGroup cols={2}>
  <Card title="Make your first request" icon="rocket" href="/x-api/getting-started/make-your-first-request">
    Call the API with your new credentials.
  </Card>

  <Card title="Learn about authentication" icon="key" href="/resources/fundamentals/authentication/overview">
    Understand OAuth 1.0a and OAuth 2.0.
  </Card>
</CardGroup>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Make Your First Request

> Get up and running with the X API in minutes

export const Button = ({href, children}) => {
  return <div className="not-prose group">
    <a href={href}>
      <button className="flex items-center space-x-2.5 py-1 px-4 bg-primary-dark dark:bg-white text-white dark:text-gray-950 rounded-full group-hover:opacity-[0.9] font-medium">
        <span>
          {children}
        </span>
        <svg width="3" height="24" viewBox="0 -9 3 24" class="h-6 rotate-0 overflow-visible"><path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
      </button>
    </a>
  </div>;
};

This guide walks you through making your first X API request. You'll need a [developer account with app credentials](/x-api/getting-started/getting-access) before starting.

***

## Quick start with cURL

The fastest way to test the API is with cURL. Let's look up a user:

```bash  theme={null}
curl "https://api.x.com/2/users/by/username/xdevelopers" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

Replace `$BEARER_TOKEN` with your actual Bearer Token. You'll get a response like:

```json  theme={null}
{
  "data": {
    "id": "2244994945",
    "name": "X Developers",
    "username": "xdevelopers"
  }
}
```

***

## Step-by-step guide

<Steps>
  <Step title="Get your Bearer Token">
    In the [Developer Console](https://console.x.com), navigate to your app and copy the Bearer Token.
  </Step>

  <Step title="Choose an endpoint">
    Start with one of these beginner-friendly endpoints:

    | Endpoint                                          | What it does                       |
    | :------------------------------------------------ | :--------------------------------- |
    | [User lookup](/x-api/users/lookup/introduction)   | Get user profile by username or ID |
    | [Post lookup](/x-api/posts/lookup/introduction)   | Get post by ID                     |
    | [Recent search](/x-api/posts/search/introduction) | Search posts from the last 7 days  |
  </Step>

  <Step title="Make the request">
    Use cURL, Postman, or your preferred HTTP client:

    ```bash  theme={null}
    # Look up a user by username
    curl "https://api.x.com/2/users/by/username/xdevelopers" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Step>

  <Step title="Parse the response">
    Responses are JSON. The primary data is in the `data` field:

    ```json  theme={null}
    {
      "data": {
        "id": "2244994945",
        "name": "X Developers",
        "username": "xdevelopers"
      }
    }
    ```
  </Step>
</Steps>

***

## Request more data with fields

By default, endpoints return minimal fields. Use the `fields` parameter to request additional data:

```bash  theme={null}
curl "https://api.x.com/2/users/by/username/xdevelopers?user.fields=created_at,description,public_metrics" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

Response:

```json  theme={null}
{
  "data": {
    "id": "2244994945",
    "name": "X Developers",
    "username": "xdevelopers",
    "created_at": "2013-12-14T04:35:55.000Z",
    "description": "The voice of the X Developer Platform",
    "public_metrics": {
      "followers_count": 570842,
      "following_count": 2048,
      "tweet_count": 14052,
      "listed_count": 1672
    }
  }
}
```

[Learn more about fields →](/x-api/fundamentals/fields)

***

## More examples

<Tabs>
  <Tab title="Look up a post">
    ```bash  theme={null}
    curl "https://api.x.com/2/tweets/1460323737035677698?tweet.fields=created_at,public_metrics" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Tab>

  <Tab title="Search recent posts">
    ```bash  theme={null}
    curl "https://api.x.com/2/tweets/search/recent?query=from:xdevelopers&tweet.fields=created_at" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Tab>

  <Tab title="Get user's posts">
    ```bash  theme={null}
    curl "https://api.x.com/2/users/2244994945/tweets?max_results=5" \
      -H "Authorization: Bearer $BEARER_TOKEN"
    ```
  </Tab>
</Tabs>

***

## Using code instead of cURL

<Tabs>
  <Tab title="Python">
    ```python  theme={null}
    import requests

    bearer_token = "YOUR_BEARER_TOKEN"
    url = "https://api.x.com/2/users/by/username/xdevelopers"

    headers = {"Authorization": f"Bearer {bearer_token}"}
    response = requests.get(url, headers=headers)

    print(response.json())
    ```
  </Tab>

  <Tab title="JavaScript">
    ```javascript  theme={null}
    const bearerToken = "YOUR_BEARER_TOKEN";
    const url = "https://api.x.com/2/users/by/username/xdevelopers";

    fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` }
    })
      .then(res => res.json())
      .then(data => console.log(data));
    ```
  </Tab>

  <Tab title="Official SDKs">
    For production use, we recommend the official SDKs:

    * [Python SDK](/xdks/python/overview)
    * [TypeScript SDK](/xdks/typescript/overview)

    They handle authentication, pagination, and rate limiting automatically.
  </Tab>
</Tabs>

***

## Tools for testing

<CardGroup cols={3}>
  <Card title="Postman" icon="server" href="/tutorials/postman-getting-started">
    Visual API testing with our collection.
  </Card>

  <Card title="Sample code" icon="github" href="https://github.com/xdevplatform/Twitter-API-v2-sample-code">
    Examples in multiple languages.
  </Card>

  <Card title="API reference" icon="code" href="/x-api/posts/lookup/introduction">
    Full endpoint documentation.
  </Card>
</CardGroup>

***

## Troubleshooting

<Accordion title="401 Unauthorized">
  * Check that your Bearer Token is correct
  * Ensure the token hasn't been regenerated
  * Verify the `Authorization` header format: `Bearer YOUR_TOKEN`
</Accordion>

<Accordion title="403 Forbidden">
  * Your app may not have access to this endpoint
  * Some endpoints require user-context authentication (OAuth 1.0a or 2.0)
  * Check your app's permissions in the Developer Console
</Accordion>

<Accordion title="429 Too Many Requests">
  * You've hit a rate limit
  * Check the `x-rate-limit-reset` header for when to retry
  * Implement exponential backoff in your code
</Accordion>

[Full error reference →](/x-api/fundamentals/response-codes-and-errors)

***

## Next steps

<CardGroup cols={2}>
  <Card title="Learn authentication" icon="key" href="/resources/fundamentals/authentication/overview">
    Understand OAuth for user-context requests.
  </Card>

  <Card title="Explore endpoints" icon="compass" href="/x-api/posts/search/introduction">
    Discover what you can build.
  </Card>

  <Card title="Use an SDK" icon="cube" href="/xdks/overview">
    Faster development with official libraries.
  </Card>

  <Card title="Build something" icon="hammer" href="/x-api/what-to-build">
    Ideas for what to create.
  </Card>
</CardGroup>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Important Resources

> Key documentation, tools, and community resources

Bookmark these essential resources for X API development.

***

## Documentation

<CardGroup cols={2}>
  <Card title="API Reference" icon="code" href="/x-api/introduction">
    Complete endpoint documentation with parameters and examples.
  </Card>

  <Card title="Data Dictionary" icon="book" href="/x-api/fundamentals/data-dictionary">
    Object schemas for posts, users, media, and more.
  </Card>

  <Card title="Authentication" icon="key" href="/resources/fundamentals/authentication/overview">
    OAuth 1.0a and OAuth 2.0 implementation guides.
  </Card>

  <Card title="Rate Limits" icon="gauge-high" href="/x-api/fundamentals/rate-limits">
    Per-endpoint limits and best practices.
  </Card>
</CardGroup>

***

## Tools

| Tool                                                                                                                                         | Description                           |
| :------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| [Developer Console](https://console.x.com)                                                                                                   | Manage apps, credentials, and billing |
| [Postman Collection](https://www.postman.com/xapidevelopers/x-api-public-workspace/collection/34902927-2efc5689-99c6-4ab6-8091-996f35c2fd80) | Interactive API testing               |
| [Python SDK](/xdks/python/overview)                                                                                                          | Official Python library               |
| [TypeScript SDK](/xdks/typescript/overview)                                                                                                  | Official TypeScript library           |
| [OpenAPI Spec](https://api.x.com/2/openapi.json)                                                                                             | Machine-readable API specification    |

***

## Learning

<CardGroup cols={2}>
  <Card title="Tutorials" icon="graduation-cap" href="/tutorials">
    Step-by-step guides for common use cases.
  </Card>

  <Card title="Sample Code" icon="github" href="https://github.com/xdevplatform">
    Example apps and code samples.
  </Card>

  <Card title="What to Build" icon="lightbulb" href="/x-api/what-to-build">
    Ideas and inspiration for projects.
  </Card>

  <Card title="Migration Guide" icon="route" href="/x-api/migrate/overview">
    Upgrade from v1.1 to v2.
  </Card>
</CardGroup>

***

## Community & Support

<CardGroup cols={2}>
  <Card title="Developer Forum" icon="comments" href="https://devcommunity.x.com">
    Ask questions and share solutions with the community.
  </Card>

  <Card title="Support Hub" icon="circle-question" href="https://developer.x.com/en/support">
    FAQs, troubleshooting, and contact options.
  </Card>

  <Card title="@XDevelopers" icon="x-twitter" href="https://x.com/XDevelopers">
    Official updates and announcements.
  </Card>

  <Card title="@API" icon="x-twitter" href="https://x.com/api">
    API-specific news and tips.
  </Card>
</CardGroup>

***

## Stay updated

| Resource                                                             | What you'll get                      |
| :------------------------------------------------------------------- | :----------------------------------- |
| [Changelog](/changelog)                                              | All platform changes and updates     |
| [Newsletter](/newsletter)                                            | Monthly roundup of news and features |
| [Forum Announcements](https://devcommunity.x.com/c/announcements/22) | Important platform notices           |
| [API Status](/status)                                                | Real-time service availability       |

<Tip>
  Follow [@XDevelopers](https://x.com/XDevelopers) and turn on notifications to catch breaking changes and new features.
</Tip>

***

## Quick reference

### Response structure

All v2 responses follow this structure:

```json  theme={null}
{
  "data": { ... },      // Primary object(s)
  "includes": { ... },  // Expanded objects (if requested)
  "meta": { ... },      // Pagination info
  "errors": [ ... ]     // Partial errors (if any)
}
```

### Common parameters

| Parameter          | Use                          |
| :----------------- | :--------------------------- |
| `tweet.fields`     | Request specific post fields |
| `user.fields`      | Request specific user fields |
| `expansions`       | Include related objects      |
| `max_results`      | Limit results per page       |
| `pagination_token` | Get next/previous page       |

### Authentication methods

| Method       | Use case                                |
| :----------- | :-------------------------------------- |
| Bearer Token | Read-only public data                   |
| OAuth 2.0    | User actions with fine-grained scopes   |
| OAuth 1.0a   | User actions (legacy, full permissions) |

[Full authentication guide →](/resources/fundamentals/authentication/overview)

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Tools & Libraries

> Official and community libraries for the X API

export const Button = ({href, children}) => {
  return <div className="not-prose group">
    <a href={href}>
      <button className="flex items-center space-x-2.5 py-1 px-4 bg-primary-dark dark:bg-white text-white dark:text-gray-950 rounded-full group-hover:opacity-[0.9] font-medium">
        <span>
          {children}
        </span>
        <svg width="3" height="24" viewBox="0 -9 3 24" class="h-6 rotate-0 overflow-visible"><path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
      </button>
    </a>
  </div>;
};

Speed up your development with official SDKs, community libraries, and developer tools.

***

## Official SDKs

X provides official SDKs for TypeScript and Python with full X API v2 support:

<CardGroup cols={2}>
  <Card title="Python SDK" icon="python" href="/xdks/python/overview">
    Async support, type hints, and automatic token refresh. Perfect for data analysis and automation.
  </Card>

  <Card title="TypeScript SDK" icon="js" href="/xdks/typescript/overview">
    Full type safety and ESM support. Works in Node.js and modern bundlers.
  </Card>
</CardGroup>

***

## Official tools

| Tool                                                                                                                                         | Description                                    |
| :------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| [Postman Collection](https://www.postman.com/xapidevelopers/x-api-public-workspace/collection/34902927-2efc5689-99c6-4ab6-8091-996f35c2fd80) | Interactive API testing for all v2 endpoints   |
| [OpenAPI Spec](https://api.x.com/2/openapi.json)                                                                                             | Machine-readable API specification             |
| [twitter-text](https://github.com/twitter/twitter-text)                                                                                      | Parse and validate post text, count characters |

***

## Community libraries

These community-maintained libraries support X API v2. Check each library's documentation for current API coverage.

<Tabs>
  <Tab title="Python">
    | Library                                                      | Description                            |
    | :----------------------------------------------------------- | :------------------------------------- |
    | [tweepy](https://github.com/tweepy/tweepy)                   | Popular Python library with v2 support |
    | [twarc](https://twarc-project.readthedocs.io/)               | CLI and library for data collection    |
    | [python-twitter](https://github.com/sns-sdks/python-twitter) | Simple Python wrapper                  |
    | [TwitterAPI](https://github.com/geduldig/TwitterAPI)         | Minimal Python wrapper                 |
  </Tab>

  <Tab title="JavaScript/TypeScript">
    | Library                                                              | Description                                  |
    | :------------------------------------------------------------------- | :------------------------------------------- |
    | [node-twitter-api-v2](https://github.com/PLhery/node-twitter-api-v2) | Strongly-typed, full-featured Node.js client |
    | [twitter.js](https://github.com/twitterjs/twitter.js)                | Object-oriented Node.js library              |
    | [twitter-v2](https://github.com/HunterLarco/twitter-v2)              | Async client library                         |
  </Tab>

  <Tab title="Go">
    | Library                                                         | Description             |
    | :-------------------------------------------------------------- | :---------------------- |
    | [go-twitter](https://github.com/g8rswimmer/go-twitter)          | Go library for v2 API   |
    | [gotwi](https://github.com/michimani/gotwi)                     | Go wrapper for v2       |
    | [twitter-stream](https://github.com/Fallenstedt/twitter-stream) | Filtered stream wrapper |
  </Tab>

  <Tab title="Java/Kotlin">
    | Library                                               | Description            |
    | :---------------------------------------------------- | :--------------------- |
    | [twittered](https://github.com/redouane59/twittered)  | Java client for v2     |
    | [twitter4j-v2](https://github.com/takke/twitter4j-v2) | Twitter4J v2 wrapper   |
    | [KTweet](https://github.com/ChromasIV/KTweet)         | Kotlin v2 library      |
    | [Tweedle](https://github.com/tyczj/Tweedle)           | Kotlin Android library |
  </Tab>

  <Tab title="PHP">
    | Library                                                           | Description           |
    | :---------------------------------------------------------------- | :-------------------- |
    | [twitter-api-v2-php](https://github.com/noweh/twitter-api-v2-php) | PHP v2 client         |
    | [bird-elephant](https://github.com/danieldevine/bird-elephant)    | PHP v2 library        |
    | [twitteroauth](https://github.com/abraham/twitteroauth)           | Popular OAuth library |
  </Tab>

  <Tab title="Ruby">
    | Library                                                           | Description       |
    | :---------------------------------------------------------------- | :---------------- |
    | [tweetkit](https://github.com/julianfssen/tweetkit)               | Ruby v2 client    |
    | [twitter\_oauth2](https://github.com/nov/twitter_oauth2)          | OAuth 2.0 library |
    | [omniauth-twitter2](https://github.com/unasuke/omniauth-twitter2) | OmniAuth strategy |
  </Tab>

  <Tab title="Other">
    | Language       | Library                                                                                                    |
    | :------------- | :--------------------------------------------------------------------------------------------------------- |
    | **C#/.NET**    | [Tweetinvi](https://github.com/linvi/tweetinvi), [LinqToTwitter](https://github.com/JoeMayo/LinqToTwitter) |
    | **Rust**       | [twitter-v2](https://github.com/jpopesculian/twitter-v2-rs)                                                |
    | **Swift**      | [Twift](https://github.com/daneden/Twift/), [TwitterAPIKit](https://github.com/mironal/TwitterAPIKit)      |
    | **R**          | [academictwitteR](https://github.com/cjbarrie/academictwitteR)                                             |
    | **PowerShell** | [BluebirdPS](https://github.com/thedavecarroll/BluebirdPS)                                                 |
  </Tab>
</Tabs>

<Note>
  Community libraries are not maintained by X. Check their repositories for support and current status.
</Note>

***

## Code samples

Find examples on GitHub:

* [X API v2 Sample Code](https://github.com/xdevplatform/Twitter-API-v2-sample-code) — Examples in Python, JavaScript, Ruby, and more
* [X Developer GitHub](https://github.com/xdevplatform) — Official repos and tools
* [Glitch Examples](https://glitch.com/@twitter) — Interactive, remixable apps
* [Replit Examples](https://replit.com/@twitter) — Browser-based coding

***

## Building a library?

If you've built an X API library, share it with the community:

1. Post in the [Libraries & SDKs forum](https://devcommunity.x.com/c/libraries-and-sdks/63)
2. We may add it to this page!

***

## Getting help

<Card title="Developer Forum" icon="comments" href="https://devcommunity.x.com">
  Get help from the community.
</Card>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Python XDK

The Python XDK (X Developer Kit) is our official client library for interacting with the X API v2 using Python. It allows developers to get started with our API quickly and build applications with it. It is generated based on our official [OpenAPI specification](https://api.x.com/2/openapi.json). It abstracts away low-level HTTP details while providing fine-grained control when needed.

## Key Features

* 🔐 **OAuth Support**: Full support for Bearer Token (app-only) auth, OAuth 2.0 with PKCE (user context), and OAuth 1.0.
* 🔄 **Pagination**: Automatically page through large results. The XDK takes care of pagination without requiring you to make multiple API calls using the `next_token`.
* 📡 **Streaming**: Supports real-time data streaming for endpoints like filtered stream that require persistent http connection.
* 🎯 **Comprehensive Coverage**: Supports all X API v2 endpoints including such as search, timelines, filtered-stream and more.
  **Version Compatibility**: Python 3.8+. Tested on CPython and PyPy.
  **License**: [MIT License](https://github.com/xdevplatform/xdk/blob/main/LICENSE)
  For detailed code examples using the Python XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/python).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Install

The XDK Python SDK is available directly from the GitHub repository and can be installed via `pip`.

## Prerequisites

* Python 3.8 or higher.
* `pip` and `venv` for virtual environments (recommended).

## Quick Install

Install the XDK from the GitHub subdirectory:

```bash  theme={null}
pip install xdk
```

This fetches the latest generated version from the `main` branch.

## Development Install

For development or contributing:

1. Clone the repository:
   ```bash  theme={null}
   git clone https://github.com/xdevplatform/xdk.git
   cd xdk/python
   ```
2. Install dependencies in editable mode:
   ```bash  theme={null}
   pip install -e .
   ```
   This installs the SDK and its runtime dependencies.
3. (Optional) Install dev dependencies for testing/linting:
   ```bash  theme={null}
   pip install -e .[dev]
   ```

## Verification

Test the installation:

```python  theme={null}
import xdk
print(xdk.__version__)  # Should print the XDK version
```

**Note:** Since the XDK is generated using the OpenAPI spec, always check the [X API changelog](https://docs.x.com/changelog) and XDK release notes in the repo for any changes.
For detailed code examples using the Python XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/python).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

This example showcases how to quickly search for Posts using the XDK using Bearer Token authentication.

## Step 1: Install the SDK

```bash  theme={null}
pip install xdk
```

## Step 2: Get Your Bearer Token

1. Log in to the [X Developer Console](https://developer.x.com/en/portal/dashboard).
2. Create or select an app.
3. Under "Keys and Tokens," generate a Bearer Token (app-only auth).

## Step 3: Write and Run Your First Script

Create a file `quickstart.py`:

```python  theme={null}
# Import the client
from xdk import Client
# Replace with your actual Bearer Token
client = Client(bearer_token="YOUR_BEARER_TOKEN_HERE")
# Fetch recent Posts mentioning "api"
# search_recent returns an Iterator, so iterate over it
for page in client.posts.search_recent(query="api", max_results=10):
    if page.data and len(page.data) > 0:
        # Access first Post - Pydantic models support both attribute and dict access
        first_post = page.data[0]
        post_text = first_post.text if hasattr(first_post, 'text') else first_post.get('text', '')
        print(f"Latest Post: {post_text}")
        break
    else:
        print("No Posts found.")
        break
```

Run it:

```bash  theme={null}
python quickstart.py
```

**Expected Output**:

```
Latest Post: Exciting updates on XDK Python SDK!
```

**Troubleshooting**: If you get a 401 error, double-check your Bearer Token. For rate limits (429), wait and retry.

## Next Steps

* Explore [Authentication](/xdks/python/authentication) to understand how to use Bearer Token (app-only) auth, OAuth 2.0 with PKCE (user context), and OAuth 1.0a (legacy user context).
* Learn about [Pagination](/xdks/python/pagination) for use-cases where you want large number of results returned without worrying about making multiple API calls.
* Dive into [Streaming](/xdks/python/streaming) to learn how to work with real-time data.
  For detailed code examples using the Python XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/python).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication

The X API requires authentication for all endpoints. The XDK supports three authentication methods:

1. Bearer Token (app-only)
2. OAuth 2.0 with PKCE
3. OAuth 1.0a (User Context)

* **Bearer Token**: Use this for read-only access for endpoints that support app-auth (e.g., searching Post's, streaming endpoints).
* **OAuth 2.0 PKCE**: Secure authentication for scope-based, user-authorized access (e.g. getting authenticated user's Post non\_public metrics)
* **OAuth 1.0a**: Legacy authentication for user-specific operations (e.g., posting on behalf of a user, managing lists)
  Obtain credentials from the [X Developer Console](https://developer.x.com/en/portal/dashboard). You'll need an approved developer account and an app with appropriate permissions (e.g., Read + Write).

## Creating a Client

All authentication flows create a `Client` instance:

```python  theme={null}
from xdk import Client
```

### 1. Bearer Token (App-Only)

For read-only operations without user context.
**Steps**:

1. In the Developer Console, generate a Bearer Token for your app.
2. Pass it to the `Client`.
   **Example**:

```python  theme={null}
client = Client(bearer_token="XXXXX")
```

**Usage**:

```python  theme={null}
# search_recent returns an Iterator, so iterate over it
for page in client.posts.search_recent(query="python", max_results=10):
    if page.data and len(page.data) > 0:
        first_post = page.data[0]
        post_text = first_post.text if hasattr(first_post, 'text') else first_post.get('text', '')
        print(post_text)  # Access first Post
        break
```

### 2. OAuth 2.0 with PKCE (User Context)

This example shows how to use OAuth 2.0 with Proof Key for Code Exchange (PKCE). Use this for user-specific access (e.g. posting on behalf of a user), uploading media for a user etc.).
**Steps**:

1. In the Developer Console, register your app with a redirect URI (e.g., `http://localhost:8080/callback`).
2. Get Client ID (no secret needed for PKCE).
3. Initiate the flow, direct user to auth URL and handle callback.
   **Example** (using a web server for callback):

```python  theme={null}
from xdk.oauth2_auth import OAuth2PKCEAuth
from urllib.parse import urlparse
import webbrowser
# Step 1: Create PKCE instance
auth = OAuth2PKCEAuth(
    client_id="YOUR_CLIENT_ID",
    redirect_uri="YOUR_CALLBACK_URL",
    scope="tweet.read users.read offline.access"
)
# Step 2: Get authorization URL
auth_url = auth.get_authorization_url()
print(f"Visit this URL to authorize: {auth_url}")
webbrowser.open(auth_url)
# Step 3: Handle callback (in a real app, use a web framework like Flask)
# Assume callback_url = "http://localhost:8080/callback?code=AUTH_CODE_HERE"
callback_url = input("Paste the full callback URL here: ")
# Step 4: Exchange code for tokens
tokens = auth.fetch_token(authorization_response=callback_url)
access_token = tokens["access_token"]
refresh_token = tokens["refresh_token"]  # Store for renewal
# Step 5: Create client
# Option 1: Use bearer_token (OAuth2 access tokens work as bearer tokens)
client = Client(bearer_token=access_token)
# Option 2: Pass the full token dict for automatic refresh support
# client = Client(token=tokens)
```

**Token Refresh** (automatic in SDK for long-lived sessions):

```python  theme={null}
# If access token expires, refresh using stored refresh_token
# The refresh_token method uses the stored token from the OAuth2PKCEAuth instance
tokens = auth.refresh_token()
# Use the refreshed token
client = Client(bearer_token=tokens["access_token"])
# Or pass the full token dict: client = Client(token=tokens)
```

### 3. OAuth 1.0a (User Context)

For legacy applications or specific use cases that require OAuth 1.0a authentication:
**Steps**:

1. In the Developer Console, get your API Key and API Secret.
2. If you already have access tokens, use them directly. Otherwise, complete the OAuth 1.0a flow to obtain them.
3. Create an OAuth1 instance and pass it to the Client.
   **Example** (with existing access tokens):

```python  theme={null}
from xdk import Client
from xdk.oauth1_auth import OAuth1
# Step 1: Create OAuth1 instance with credentials
oauth1 = OAuth1(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    callback="http://localhost:8080/callback",
    access_token="YOUR_ACCESS_TOKEN",
    access_token_secret="YOUR_ACCESS_TOKEN_SECRET"
)
# Step 2: Create client with OAuth1
client = Client(auth=oauth1)
# Step 3: Use the client
response = client.users.get_me()
me = response.data
print(me)
```

**Example** (complete OAuth 1.0a flow):

```python  theme={null}
from xdk import Client
from xdk.oauth1_auth import OAuth1
import webbrowser
# Step 1: Create OAuth1 instance
oauth1 = OAuth1(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    callback="http://localhost:8080/callback"
)
# Step 2: Get request token
request_token = oauth1.get_request_token()
# Step 3: Get authorization URL
auth_url = oauth1.get_authorization_url(login_with_x=False)
print(f"Visit this URL to authorize: {auth_url}")
webbrowser.open(auth_url)
# Step 4: User authorizes and you receive oauth_verifier
# In a real app, handle this via callback URL
oauth_verifier = input("Enter the OAuth verifier from the callback: ")
# Step 5: Exchange for access token
access_token = oauth1.get_access_token(oauth_verifier)
# Step 6: Create client
client = Client(auth=oauth1)
# Now you can use the client
response = client.users.get_me()
```

**Note**:

* Never hardcode secrets in production; use environment variables or secret managers (e.g., `os.getenv("X_BEARER_TOKEN")`).
* For PKCE, ensure HTTPS for redirect URIs in production.
* The SDK validates tokens and raises `xdk.AuthenticationError` on failures.
  For detailed code examples using the Python XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/python).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Pagination

The X API uses pagination for endpoints that return multiple pages of results (e.g. timelines, search etc.). Each API call response includes a `meta` object with `result_count`, `previous_token`, and `next_token`. The XDK takes care of making multiple API calls using the `next_token` so developers can just specify how much data they are looking for without having to make multiple calls.
The SDK simplifies this with:

* **Built-in Iterators**: Use generator functions for seamless multi-page fetching.
* **Explicit Token Handling**: For flexible manual control when needed by passing `pagination_token` when needed.
* **Max Results Enforcement**: Respect `max_results` per call (up to API limits, e.g., 100 for search).

## Automatic Pagination (Recommended)

Use the `iterate()` method on paginated responses to fetch all results lazily.
**Example: Paginated Search**

```python  theme={null}
from xdk import Client
client = Client(bearer_token="your_bearer_token")
# Search with automatic pagination
all_posts = []
for page in client.posts.search_recent(
    query="python",
    max_results=100,  # Per page
    tweet_fields=["created_at", "author_id"]  # Optional expansions
):
    all_posts.extend(page.data)
    print(f"Fetched {len(page.data)} Posts (total: {len(all_posts)})")
print(f"Total tweets: {len(all_posts)}")
```

* The iterator handles `next_token` automatically.
* Stops when no `next_token` is present.
* Supports rate limit backoff to avoid 429 errors.

## Manual Pagination

If you require control over the results for some custom logic (e.g. processing page-by-page), you can still use the `next_token` and do the pagination manually as shown below:

```python  theme={null}
# Get first page - search_recent returns an Iterator
first_page = next(client.posts.search_recent(
    query="xdk python sdk",
    max_results=100,
    pagination_token=None  # First page
))
print(f"First page: {len(first_page.data) if first_page.data else 0} Posts")
# Extract next_token from meta
next_token = None
if hasattr(first_page, 'meta') and first_page.meta:
    if hasattr(first_page.meta, 'next_token'):
        next_token = first_page.meta.next_token
    elif isinstance(first_page.meta, dict):
        next_token = first_page.meta.get('next_token')
if next_token:
    second_page = next(client.posts.search_recent(
        query="xdk python sdk",
        max_results=100,
        pagination_token=next_token
    ))
    print(f"Second page: {len(second_page.data) if second_page.data else 0} Posts")
```

**Tips**:

* Always specify `max_results` to optimize (default varies by endpoint).
* Monitor `meta.result_count` for debugging.
* For very large queries, consider async iteration to avoid blocking.
  For detailed code examples using the Python XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/python).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming

The X API supports real-time data via endpoints like the [Filtered Stream Endpoint](https://docs.x.com/x-api/posts/filtered-stream/introduction), delivering matching Posts as they occur. This requires making a persistent http connection.

## Setup and Basic Streaming

### Synchronous

```python  theme={null}
from xdk import Client
# Initialize client
client = Client(bearer_token="your_bearer_token")
# Stream posts (make sure you have rules set up first)
for post_response in client.stream.posts():
    data = post_response.model_dump() if hasattr(post_response, 'model_dump') else dict(post_response)
    if 'data' in data and data['data']:
        tweet = data['data']
        post_text = tweet.get('text', '') if isinstance(tweet, dict) else (tweet.text if hasattr(tweet, 'text') else '')
        print(f"Post: {post_text}")
```

### Async

```python  theme={null}
import asyncio
from asyncio import Queue
import threading
from xdk import Client
async def stream_posts_async(client: Client):
    queue = Queue()
    loop = asyncio.get_event_loop()
    stop = threading.Event()
    def run_stream():
        for post in client.stream.posts():
            if stop.is_set():
                break
            asyncio.run_coroutine_threadsafe(queue.put(post), loop)
        asyncio.run_coroutine_threadsafe(queue.put(None), loop)
    threading.Thread(target=run_stream, daemon=True).start()
    while True:
        post = await queue.get()
        if post is None:
            break
        data = post.model_dump()
        if 'data' in data and data['data']:
            print(f"Post: {data['data'].get('text', '')}")
    stop.set()
async def main():
    client = Client(bearer_token="your_bearer_token")
    await stream_posts_async(client)
asyncio.run(main())
```

## Rule Management

Rules define filters on what specific data you are looking for(e.g. keywords, users etc). You can learn more about how to build rules using [this guide](https://docs.x.com/x-api/posts/filtered-stream/integrate/build-a-rule)
**Adding Rules**:

```python  theme={null}
from xdk.stream.models import UpdateRulesRequest
# Add a rule
add_rules = {
    "add": [
        {"value": "from:xdevelopers", "tag": "official_updates"}
    ]
}
request_body = UpdateRulesRequest(**add_rules)
response = client.stream.update_rules(body=request_body)
```

**Deleting Rules**:

```python  theme={null}
from xdk.stream.models import UpdateRulesRequest
delete_rules = {
    "delete": {
        "ids": ["rule_id_1", "rule_id_2"]
    }
}
request_body = UpdateRulesRequest(**delete_rules)
response = client.stream.update_rules(body=request_body)
```

**Listing Rules**:

```python  theme={null}
# get_rules returns an Iterator, so iterate over it
for page in client.stream.get_rules():
    if page.data:
        for rule in page.data:
            # Access rule attributes - Pydantic models support both attribute and dict access
            rule_id = rule.id if hasattr(rule, 'id') else rule.get('id', '')
            rule_value = rule.value if hasattr(rule, 'value') else rule.get('value', '')
            rule_tag = rule.tag if hasattr(rule, 'tag') else rule.get('tag', '')
            print(f"ID: {rule_id}, Value: {rule_value}, Tag: {rule_tag}")
    break  # Remove break to get all pages
```

For full rule syntax, see [X Streaming Rules Docs](https://developer.x.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule).

## Troubleshooting

* **403 Forbidden**: Invalid auth or insufficient permissions.
* **420 Enhance Your Calm**: Rate limited; wait and retry.
* **No Data**: Check rules with `get_rules()`; ensure matching Posts exist.
  For detailed code examples using the Python XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/python).
  For more examples and API reference, see the inline docstrings (e.g., `help(client.tweets.search_recent)`) or the generated stubs in the source. Contribute feedback via the [GitHub repo](https://github.com/xdevplatform/xdk/tree/main/xdk/python).

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# xdk

<AccordionGroup>
  <Accordion title="Packages">
    <Accordion title="Account Activity">
      * [Client](/xdks/python/reference/xdk.account_activity.client)
      * [Core](/xdks/python/reference/xdk.account_activity)
      * [Models](/xdks/python/reference/xdk.account_activity.models)
    </Accordion>

    <Accordion title="Activity">
      * [Client](/xdks/python/reference/xdk.activity.client)
      * [Core](/xdks/python/reference/xdk.activity)
      * [Models](/xdks/python/reference/xdk.activity.models)
    </Accordion>

    <Accordion title="Client">
      * [Client](/xdks/python/reference/xdk.client)
    </Accordion>

    <Accordion title="Communities">
      * [Client](/xdks/python/reference/xdk.communities.client)
      * [Core](/xdks/python/reference/xdk.communities)
      * [Models](/xdks/python/reference/xdk.communities.models)
    </Accordion>

    <Accordion title="Community Notes">
      * [Client](/xdks/python/reference/xdk.community_notes.client)
      * [Core](/xdks/python/reference/xdk.community_notes)
      * [Models](/xdks/python/reference/xdk.community_notes.models)
    </Accordion>

    <Accordion title="Compliance">
      * [Client](/xdks/python/reference/xdk.compliance.client)
      * [Core](/xdks/python/reference/xdk.compliance)
      * [Models](/xdks/python/reference/xdk.compliance.models)
    </Accordion>

    <Accordion title="Connections">
      * [Client](/xdks/python/reference/xdk.connections.client)
      * [Core](/xdks/python/reference/xdk.connections)
      * [Models](/xdks/python/reference/xdk.connections.models)
    </Accordion>

    <Accordion title="Direct Messages">
      * [Client](/xdks/python/reference/xdk.direct_messages.client)
      * [Core](/xdks/python/reference/xdk.direct_messages)
      * [Models](/xdks/python/reference/xdk.direct_messages.models)
    </Accordion>

    <Accordion title="General">
      * [Client](/xdks/python/reference/xdk.general.client)
      * [Core](/xdks/python/reference/xdk.general)
      * [Models](/xdks/python/reference/xdk.general.models)
    </Accordion>

    <Accordion title="Lists">
      * [Client](/xdks/python/reference/xdk.lists.client)
      * [Core](/xdks/python/reference/xdk.lists)
      * [Models](/xdks/python/reference/xdk.lists.models)
    </Accordion>

    <Accordion title="Media">
      * [Client](/xdks/python/reference/xdk.media.client)
      * [Core](/xdks/python/reference/xdk.media)
      * [Models](/xdks/python/reference/xdk.media.models)
    </Accordion>

    <Accordion title="News">
      * [Client](/xdks/python/reference/xdk.news.client)
      * [Core](/xdks/python/reference/xdk.news)
      * [Models](/xdks/python/reference/xdk.news.models)
    </Accordion>

    <Accordion title="Oauth1 Auth">
      * [Core](/xdks/python/reference/xdk.oauth1_auth)
    </Accordion>

    <Accordion title="Oauth2 Auth">
      * [Core](/xdks/python/reference/xdk.oauth2_auth)
    </Accordion>

    <Accordion title="Paginator">
      * [Core](/xdks/python/reference/xdk.paginator)
    </Accordion>

    <Accordion title="Posts">
      * [Client](/xdks/python/reference/xdk.posts.client)
      * [Core](/xdks/python/reference/xdk.posts)
      * [Models](/xdks/python/reference/xdk.posts.models)
    </Accordion>

    <Accordion title="Spaces">
      * [Client](/xdks/python/reference/xdk.spaces.client)
      * [Core](/xdks/python/reference/xdk.spaces)
      * [Models](/xdks/python/reference/xdk.spaces.models)
    </Accordion>

    <Accordion title="Stream">
      * [Client](/xdks/python/reference/xdk.stream.client)
      * [Core](/xdks/python/reference/xdk.stream)
      * [Models](/xdks/python/reference/xdk.stream.models)
    </Accordion>

    <Accordion title="Streaming">
      * [Core](/xdks/python/reference/xdk.streaming)
    </Accordion>

    <Accordion title="Trends">
      * [Client](/xdks/python/reference/xdk.trends.client)
      * [Core](/xdks/python/reference/xdk.trends)
      * [Models](/xdks/python/reference/xdk.trends.models)
    </Accordion>

    <Accordion title="Usage">
      * [Client](/xdks/python/reference/xdk.usage.client)
      * [Core](/xdks/python/reference/xdk.usage)
      * [Models](/xdks/python/reference/xdk.usage.models)
    </Accordion>

    <Accordion title="Users">
      * [Client](/xdks/python/reference/xdk.users.client)
      * [Core](/xdks/python/reference/xdk.users)
      * [Models](/xdks/python/reference/xdk.users.models)
    </Accordion>

    <Accordion title="Webhooks">
      * [Client](/xdks/python/reference/xdk.webhooks.client)
      * [Core](/xdks/python/reference/xdk.webhooks)
      * [Models](/xdks/python/reference/xdk.webhooks.models)
    </Accordion>

    <Accordion title="Xdk">
      * [Core](/xdks/python/reference/xdk)
    </Accordion>
  </Accordion>
</AccordionGroup>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# AccountActivityClient

## AccountActivityClient

<Badge color="blue">Class</Badge>

<Badge color="gray">Bases: object</Badge>

Client for account activity operations

## Constructors

### `__init__`

#### Parameters

<ParamField path="path.client" type="Client" />

### `create_replay_job`

Create replay job
Creates a replay job to retrieve activities from up to the past 5 days for all subscriptions associated with a given webhook.

#### Parameters

<ParamField path="path.webhook_id" type="Any">
  The unique identifier for the webhook configuration.
</ParamField>

<ParamField path="path.from_date" type="str">
  The oldest (starting) UTC timestamp (inclusive) from which events will be provided, in yyyymmddhhmm format.
</ParamField>

<ParamField path="path.to_date" type="str">
  The latest (ending) UTC timestamp (exclusive) up to which events will be provided, in yyyymmddhhmm format.
</ParamField>

#### Returns

`CreateReplayJobResponse` - Response data

### `create_subscription`

Create subscription
Creates an Account Activity subscription for the user and the given webhook.

#### Parameters

<ParamField path="path.webhook_id" type="Any">
  The webhook ID to check subscription against.
</ParamField>

<ParamField path="body.body" type="CreateSubscriptionRequest">
  Request body
</ParamField>

### `delete_subscription`

Delete subscription
Deletes an Account Activity subscription for the given webhook and user ID.

#### Parameters

<ParamField path="path.webhook_id" type="Any">
  The webhook ID to check subscription against.
</ParamField>

<ParamField path="path.user_id" type="Any">
  User ID to unsubscribe from.
</ParamField>

#### Returns

`DeleteSubscriptionResponse` - Response data

### `get_subscription_count`

Get subscription count
Retrieves a count of currently active Account Activity subscriptions.
:returns: Response data
:rtype: GetSubscriptionCountResponse

#### Returns

`GetSubscriptionCountResponse`

### `get_subscriptions`

Get subscriptions
Retrieves a list of all active subscriptions for a given webhook.

#### Parameters

<ParamField path="path.webhook_id" type="Any">
  The webhook ID to pull subscriptions for.
</ParamField>

#### Returns

`GetSubscriptionsResponse` - Response data

### `validate_subscription`

Validate subscription
Checks a user’s Account Activity subscription for a given webhook.

#### Parameters

<ParamField path="path.webhook_id" type="Any">
  The webhook ID to check subscription against.
</ParamField>

#### Returns

`ValidateSubscriptionResponse` - Response data

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# TypeScript XDK

A comprehensive TypeScript SDK for the X API (formerly Twitter API) with advanced features including smart pagination, multiple authentication methods, real-time streaming, and full type safety.

## Key Features

* **🔐 Authentication**: User Context (OAuth1.0a, OAuth2.0), and App-Only (Bearer token) authentication
* **🔄 Pagination**: Automatic pagination with async iteration support
* **📡 Streaming**: Event-driven streaming with automatic reconnection
* **📚 Type Safety**: Complete TypeScript definitions for all endpoints and parameters
* **🎯 Full X API Support**: Users, Posts, Lists, Bookmarks, Communities, and more

## Quick Start

<CodeGroup dropdown>
  ```typescript quickstart.ts theme={null} theme={null}
  import { 
      Client, 
      type ClientConfig,
      type Users
  } from '@xdevplatform/xdk';

  const config: ClientConfig = { bearerToken: 'your-bearer-token' };

  const client: Client = new Client(config);

  async function main(): Promise<void> {
    const userResponse: Users.GetByUsernameResponse = await client.users.getByUsername('XDevelopers');
    const username: string = userResponse.data?.username!;
    console.log(username);
  }

  main();
  ```

  ```javascript quickstart.js theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';

  const client = new Client({ bearerToken: 'your-bearer-token' });

  const userResponse = await client.users.getByUsername('XDevelopers');
  const username = userResponse.data.username;
  console.log(username);
  ```
</CodeGroup>

<Info>
  For detailed code examples using the Javascript/TypeScript XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/javascript).
</Info>

## What's Next?

* [Installation Guide](/xdks/typescript/install) - Set up the SDK in your project
* [Authentication](/xdks/typescript/authentication) - Learn about different auth methods
* [Pagination](/xdks/typescript/pagination) - Learn about data pagination
* [Streaming](/xdks/typescript/streaming) - Learn about real-time data streaming
* [API Reference](/xdks/typescript/reference/Client) - Read the complete API documentation

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Installation

Get started with the TypeScript SDK for X API in your project.

## Install

<CodeGroup>
  ```bash npm theme={null} theme={null}
  npm install @xdevplatform/xdk
  ```

  ```bash yarn theme={null} theme={null}
  yarn add @xdevplatform/xdk
  ```

  ```bash pnpm theme={null} theme={null}
  pnpm add @xdevplatform/xdk
  ```
</CodeGroup>

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions. No additional type packages are required.

## Requirements

* Node.js 16+
* TypeScript 4.5+ (if using TypeScript)

## Next Steps

* [Authentication](/xdks/typescript/authentication) - Set up authentication
* [Quick Start](/xdks/typescript/overview) - Your first API call

<Info>
  For detailed code examples using the Javascript/TypeScript XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/javascript).
</Info>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication

The TypeScript SDK supports multiple authentication methods for different use cases.

## Bearer Token (App-Only Auth)

For read-only operations and public data access:

<CodeGroup dropdown>
  ```typescript quickstart.ts theme={null} theme={null}
  import { 
    Client, 
    type ClientConfig,
    type Users
  } from '@xdevplatform/xdk';

  const config: ClientConfig = { bearerToken: 'your-bearer-token' };

  const client: Client = new Client(config);

  async function main(): Promise<void> {
    const userResponse: Users.GetByUsernameResponse = await client.users.getByUsername('XDevelopers');
    const username: string = userResponse.data?.username!;
    console.log(username);
  }

  main();
  ```

  ```javascript quickstart.js theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';

  const client = new Client({ bearerToken: 'your-bearer-token' });

  const userResponse = await client.users.getByUsername('XDevelopers');
  const username = userResponse.data.username;
  console.log(username);
  ```
</CodeGroup>

## OAuth 1.0a (User Context)

For legacy applications or specific use cases:

<CodeGroup dropdown>
  ```typescript oauth1.ts theme={null} theme={null}
  import { 
    Client, 
    OAuth1,
    type OAuth1Config,
    type ClientConfig,
    type Users
  } from '@xdevplatform/xdk';

  const oauth1Config: OAuth1Config = {
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    accessToken: 'user-access-token',
    accessTokenSecret: 'user-access-token-secret'
  };

  const oauth1: OAuth1 = new OAuth1(oauth1Config);

  const config: ClientConfig = {
    oauth1: oauth1,
  };

  const client: Client = new Client(config);

  async function main(): Promise<void> {
    const response: Users.GetMeResponse = await client.users.getMe();

    const me = response.data;
    console.log(me);
  }

  main();

  ```

  ```javascript oauth1.js theme={null} theme={null}
  import { Client, OAuth1 } from '@xdevplatform/xdk';

  const oauth1 = new OAuth1({
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    accessToken: 'user-access-token',
    accessTokenSecret: 'user-access-token-secret'
  });

  const client = new Client({ oauth1: oauth1 });

  const response = await client.users.getMe();
  const me = response.data;
  console.log(me);

  ```
</CodeGroup>

## OAuth 2.0 (User Context)

For user-specific operations:

<CodeGroup dropdown>
  ```typescript oauth2.ts theme={null} theme={null}
  import { 
    Client, 
    OAuth2,
    generateCodeVerifier,
    generateCodeChallenge,
    type OAuth2Config,
    type ClientConfig,
    type OAuth2Token
  } from '@xdevplatform/xdk';

  (async (): Promise<void> => {
    const oauth2Config: OAuth2Config = {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      redirectUri: 'https://example.com',
      scope: ['tweet.read', 'users.read', 'offline.access'],
    };

    const oauth2: OAuth2 = new OAuth2(oauth2Config);

    const state: string = 'example-state';
    const codeVerifier: string = generateCodeVerifier();
    const codeChallenge: string = await generateCodeChallenge(codeVerifier);
    
    oauth2.setPkceParameters(codeVerifier, codeChallenge);
    
    const authUrl: string = await oauth2.getAuthorizationUrl(state);

    // User visits authUrl and authorizes the app
    // After authorization, user is redirected back with a code parameter
    // Extract the code from the callback URL (e.g., from query params)
    const authCode: string = 'code-from-callback-url'; // Replace with actual code from OAuth callback

    const tokens: OAuth2Token = await oauth2.exchangeCode(authCode, codeVerifier);

    const config: ClientConfig = {
      accessToken: tokens.access_token,
    };

    const client: Client = new Client(config);
  });

  ```

  ```javascript oauth2.js theme={null} theme={null}
  import { Client, OAuth2, generateCodeVerifier, generateCodeChallenge } from '@xdevplatform/xdk';

  (async () => {
    const oauth2 = new OAuth2({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      redirectUri: 'https://example.com',
      scope: ['tweet.read', 'users.read', 'offline.access'],
    });

    const state = 'example-state';
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    oauth2.setPkceParameters(codeVerifier, codeChallenge);
    const authUrl = await oauth2.getAuthorizationUrl(state);

    // User visits authUrl and authorizes the app
    // After authorization, user is redirected back with a code parameter
    // Extract the code from the callback URL (e.g., from query params)
    const authCode = 'code-from-callback-url'; // Replace with actual code from OAuth callback

    const tokens = await oauth2.exchangeCode(authCode, codeVerifier);

    const client = new Client({ accessToken: tokens.access_token });

    const response = await client.users.getMe();
    const me = response.data;
    console.log(me);
  });
  ```
</CodeGroup>

## Environment Variables

Store sensitive credentials in environment variables:

```bash  theme={null}
# .env
X_API_BEARER_TOKEN=your-bearer-token
X_API_CLIENT_ID=your-client-id
X_API_CLIENT_SECRET=your-client-secret
```

<CodeGroup dropdown>
  ```typescript env.ts theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';

  const client = new Client({ bearerToken: process.env.X_API_BEARER_TOKEN });
  ```

  ```javascript env.js theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';

  const client = new Client({ bearerToken: process.env.X_API_BEARER_TOKEN });
  ```
</CodeGroup>

<Info>
  For detailed code examples using the Javascript/TypeScript XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/javascript).
</Info>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Pagination

The SDK provides generic paginator utilities you can use with any endpoint that returns paginated responses. Methods return plain responses; you wrap them with a paginator.

### Basic Pagination

<CodeGroup dropdown>
  ```typescript quick-start.ts theme={null} theme={null}
  import { Client, UserPaginator, PaginatedResponse, Schemas } from '@xdevplatform/xdk';

  const client: Client = new Client({ bearerToken: 'your-bearer-token' });

  // Wrap any list endpoint with proper typing
  const followers: UserPaginator = new UserPaginator(
    async (token?: string): Promise<PaginatedResponse<Schemas.User>> => {
      const res = await client.users.getFollowers('<userId>', {
        maxResults: 100,
        paginationToken: token,
        userFields: ['id','name','username'],
      });
      return { 
        data: res.data ?? [], 
        meta: res.meta, 
        includes: res.includes, 
        errors: res.errors 
      };
    }
  );
  ```

  ```javascript quick-start.js theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';
  import { UserPaginator } from '@xdevplatform/xdk';

  const client = new Client({ bearerToken: 'your-bearer-token' });

  const followers = new UserPaginator(async (token) => {
    const res = await client.users.getFollowers('<userId>', {
      maxResults: 100,
      paginationToken: token,
      userFields: ['id','name','username'],
    });
    return { data: res.data ?? [], meta: res.meta, includes: res.includes, errors: res.errors };
  });
  ```
</CodeGroup>

### Manual paging

<CodeGroup>
  ```typescript manual.ts theme={null} theme={null}
  import { UserPaginator, Schemas } from '@xdevplatform/xdk';

  await followers.fetchNext();          // first page
  while (!followers.done) {
    await followers.fetchNext();        // subsequent pages
  }

  const userCount: number = followers.users.length;  // all fetched users
  const firstUser: Schemas.User | undefined = followers.users[0];
  const nextToken: string | undefined = followers.meta?.nextToken;
  ```

  ```javascript manual.js theme={null} theme={null}
  await followers.fetchNext();
  while (!followers.done) await followers.fetchNext();
  console.log(followers.items.length);
  ```
</CodeGroup>

### Async iteration

<CodeGroup>
  ```typescript async.ts theme={null} theme={null}
  import { Schemas } from '@xdevplatform/xdk';

  for await (const user of followers) {
    const typedUser: Schemas.User = user;
    console.log(typedUser.username);  // fully typed access
  }
  ```

  ```javascript async.js theme={null} theme={null}
  for await (const user of followers) {
    console.log(user.username);
  }
  ```
</CodeGroup>

### Next page as a new instance

<CodeGroup>
  ```typescript next.ts theme={null} theme={null}
  import { UserPaginator } from '@xdevplatform/xdk';

  await followers.fetchNext();
  if (!followers.done) {
    const page2: UserPaginator = await followers.next(); // independent paginator starting at next page
    await page2.fetchNext();
    console.log(page2.users.length);  // items from second page
  }
  ```

  ```javascript next.js theme={null} theme={null}
  await followers.fetchNext();
  if (!followers.done) {
    const page2 = await followers.next();
    await page2.fetchNext();
  }
  ```
</CodeGroup>

### Error handling and rate limits

<CodeGroup>
  ```typescript errors.ts theme={null} theme={null}
  import { UserPaginator, Schemas } from '@xdevplatform/xdk';

  try {
    for await (const item of followers) {
      const user: Schemas.User = item;
      // process user...
    }
  } catch (err: unknown) {
    if (followers.rateLimited) {
      console.error('Rate limited, backoff required');
      // backoff / retry later
    } else {
      console.error('Pagination error:', err);
      throw err;
    }
  }
  ```

  ```javascript errors.js theme={null} theme={null}
  try {
    for await (const item of followers) {
      // ...
    }
  } catch (err) {
    if (followers.rateLimited) {
      // backoff / retry later
    } else {
      throw err;
    }
  }
  ```
</CodeGroup>

<Info>
  For detailed code examples using the Javascript/TypeScript XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/javascript).
</Info>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming

The TypeScript SDK provides real-time streaming capabilities for live data feeds.

## Basic Streaming

Connect to real-time sampled posts:

<CodeGroup>
  ```typescript stream.ts theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';

  const client: Client = new Client({ bearerToken: 'your-bearer-token' });

  // 1% sampled public posts
  const stream = await client.stream.postsSample({
    tweetFields: ['id','text','created_at'],
    expansions: ['author_id'],
    userFields: ['id','username','name']
  });

  // Listen to events
  stream.on('data', (event) => {
    // event is the parsed JSON line (data/includes/matching_rules)
    console.log('New data:', event);
  });

  stream.on('error', (e) => console.error('Stream error:', e));
  stream.on('close', () => console.log('Stream closed'));
  ```

  ```javascript stream.js theme={null} theme={null}
  import { Client } from '@xdevplatform/xdk';

  const client = new Client({ bearerToken: 'your-bearer-token' });
  const stream = await client.stream.postsSample({ tweetFields: ['id','text'] });

  stream.on('data', (event) => {
    console.log('New data:', event);
  });
  stream.on('error', (e) => console.error('Stream error:', e));
  stream.on('close', () => console.log('Stream closed'));
  ```
</CodeGroup>

## Async Iteration

Consume the stream with async iteration:

<CodeGroup>
  ```typescript async.ts theme={null} theme={null}
  const stream = await client.stream.postsSample();
  for await (const event of stream) {
    // Each event is a parsed JSON line (data/includes/matching_rules)
    console.log(event);
  }
  ```

  ```javascript async.js theme={null} theme={null}
  const stream = await client.stream.postsSample();
  for await (const event of stream) {
    console.log(event);
  }
  ```
</CodeGroup>

## Stream Management

Control lifecycle from the event-driven stream:

```typescript  theme={null}
// Close the stream
stream.close();

// Auto-reconnect (if enabled by your wrapper)
// The default EventDrivenStream exposes basic reconnect hooks
```

## Error Handling

Handle streaming errors and reconnections:

```typescript  theme={null}
stream.on('error', (event) => {
  const err = event.error || event;
  console.error('Stream error:', err);
});

stream.on('keepAlive', () => {
  // heartbeat event
});
```

<Info>
  For detailed code examples using the Javascript/TypeScript XDK, check out our [code samples GitHub repo](https://github.com/xdevplatform/samples/tree/main/javascript).
</Info>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# X API SDK v2.152 - v0.4.0

<AccordionGroup>
  <Accordion title="Interfaces">
    <Accordion title="Client">
      * [ClientConfig](/xdks/typescript/reference/interfaces/ClientConfig)
    </Accordion>

    <Accordion title="Http">
      * [HttpClientRequestOptions](/xdks/typescript/reference/interfaces/HttpClientRequestOptions)
      * [HttpResponse](/xdks/typescript/reference/interfaces/HttpResponse)
    </Accordion>

    <Accordion title="Misc">
      * [ApiResponse](/xdks/typescript/reference/interfaces/ApiResponse)
      * [PaginatedResponse](/xdks/typescript/reference/interfaces/PaginatedResponse)
      * [PaginationMeta](/xdks/typescript/reference/interfaces/PaginationMeta)
      * [RequestOptions](/xdks/typescript/reference/interfaces/RequestOptions)
      * [Schemas.ActivityStreamingResponse](/xdks/typescript/reference/interfaces/Schemas.ActivityStreamingResponse)
      * [Schemas.ActivitySubscription](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscription)
      * [Schemas.ActivitySubscriptionCreateRequest](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionCreateRequest)
      * [Schemas.ActivitySubscriptionCreateResponse](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionCreateResponse)
      * [Schemas.ActivitySubscriptionDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionDeleteResponse)
      * [Schemas.ActivitySubscriptionFilter](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionFilter)
      * [Schemas.ActivitySubscriptionGetResponse](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionGetResponse)
      * [Schemas.ActivitySubscriptionUpdateRequest](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionUpdateRequest)
      * [Schemas.ActivitySubscriptionUpdateResponse](/xdks/typescript/reference/interfaces/Schemas.ActivitySubscriptionUpdateResponse)
      * [Schemas.AddOrDeleteRulesResponse](/xdks/typescript/reference/interfaces/Schemas.AddOrDeleteRulesResponse)
      * [Schemas.AddRulesRequest](/xdks/typescript/reference/interfaces/Schemas.AddRulesRequest)
      * [Schemas.AllowDownloadStatus](/xdks/typescript/reference/interfaces/Schemas.AllowDownloadStatus)
      * [Schemas.AltText](/xdks/typescript/reference/interfaces/Schemas.AltText)
      * [Schemas.Analytics](/xdks/typescript/reference/interfaces/Schemas.Analytics)
      * [Schemas.AppRulesCount](/xdks/typescript/reference/interfaces/Schemas.AppRulesCount)
      * [Schemas.AudiencePolicy](/xdks/typescript/reference/interfaces/Schemas.AudiencePolicy)
      * [Schemas.BookmarkAddRequest](/xdks/typescript/reference/interfaces/Schemas.BookmarkAddRequest)
      * [Schemas.BookmarkFolderPostsResponse](/xdks/typescript/reference/interfaces/Schemas.BookmarkFolderPostsResponse)
      * [Schemas.BookmarkFoldersResponse](/xdks/typescript/reference/interfaces/Schemas.BookmarkFoldersResponse)
      * [Schemas.BookmarkMutationResponse](/xdks/typescript/reference/interfaces/Schemas.BookmarkMutationResponse)
      * [Schemas.CashtagFields](/xdks/typescript/reference/interfaces/Schemas.CashtagFields)
      * [Schemas.ClientAppUsage](/xdks/typescript/reference/interfaces/Schemas.ClientAppUsage)
      * [Schemas.Community](/xdks/typescript/reference/interfaces/Schemas.Community)
      * [Schemas.ComplianceJob](/xdks/typescript/reference/interfaces/Schemas.ComplianceJob)
      * [Schemas.Connection](/xdks/typescript/reference/interfaces/Schemas.Connection)
      * [Schemas.ContentExpiration](/xdks/typescript/reference/interfaces/Schemas.ContentExpiration)
      * [Schemas.ContextAnnotation](/xdks/typescript/reference/interfaces/Schemas.ContextAnnotation)
      * [Schemas.ContextAnnotationDomainFields](/xdks/typescript/reference/interfaces/Schemas.ContextAnnotationDomainFields)
      * [Schemas.ContextAnnotationEntityFields](/xdks/typescript/reference/interfaces/Schemas.ContextAnnotationEntityFields)
      * [Schemas.CreateAttachmentsMessageRequest](/xdks/typescript/reference/interfaces/Schemas.CreateAttachmentsMessageRequest)
      * [Schemas.CreateComplianceJobRequest](/xdks/typescript/reference/interfaces/Schemas.CreateComplianceJobRequest)
      * [Schemas.CreateComplianceJobResponse](/xdks/typescript/reference/interfaces/Schemas.CreateComplianceJobResponse)
      * [Schemas.CreateDmConversationRequest](/xdks/typescript/reference/interfaces/Schemas.CreateDmConversationRequest)
      * [Schemas.CreateDmEventResponse](/xdks/typescript/reference/interfaces/Schemas.CreateDmEventResponse)
      * [Schemas.CreateNoteRequest](/xdks/typescript/reference/interfaces/Schemas.CreateNoteRequest)
      * [Schemas.CreateNoteResponse](/xdks/typescript/reference/interfaces/Schemas.CreateNoteResponse)
      * [Schemas.CreateTextMessageRequest](/xdks/typescript/reference/interfaces/Schemas.CreateTextMessageRequest)
      * [Schemas.DeleteDmResponse](/xdks/typescript/reference/interfaces/Schemas.DeleteDmResponse)
      * [Schemas.DeleteNoteResponse](/xdks/typescript/reference/interfaces/Schemas.DeleteNoteResponse)
      * [Schemas.DeleteRulesRequest](/xdks/typescript/reference/interfaces/Schemas.DeleteRulesRequest)
      * [Schemas.DmEvent](/xdks/typescript/reference/interfaces/Schemas.DmEvent)
      * [Schemas.DmMediaAttachment](/xdks/typescript/reference/interfaces/Schemas.DmMediaAttachment)
      * [Schemas.DomainRestrictions](/xdks/typescript/reference/interfaces/Schemas.DomainRestrictions)
      * [Schemas.Engagement](/xdks/typescript/reference/interfaces/Schemas.Engagement)
      * [Schemas.EntityIndicesInclusiveExclusive](/xdks/typescript/reference/interfaces/Schemas.EntityIndicesInclusiveExclusive)
      * [Schemas.EntityIndicesInclusiveInclusive](/xdks/typescript/reference/interfaces/Schemas.EntityIndicesInclusiveInclusive)
      * [Schemas.Error](/xdks/typescript/reference/interfaces/Schemas.Error)
      * [Schemas.EvaluateNoteRequest](/xdks/typescript/reference/interfaces/Schemas.EvaluateNoteRequest)
      * [Schemas.EvaluateNoteResponse](/xdks/typescript/reference/interfaces/Schemas.EvaluateNoteResponse)
      * [Schemas.Expansions](/xdks/typescript/reference/interfaces/Schemas.Expansions)
      * [Schemas.FilteredStreamingTweetResponse](/xdks/typescript/reference/interfaces/Schemas.FilteredStreamingTweetResponse)
      * [Schemas.FollowActivityResponsePayload](/xdks/typescript/reference/interfaces/Schemas.FollowActivityResponsePayload)
      * [Schemas.FoundMediaOrigin](/xdks/typescript/reference/interfaces/Schemas.FoundMediaOrigin)
      * [Schemas.FullTextEntities](/xdks/typescript/reference/interfaces/Schemas.FullTextEntities)
      * [Schemas.Geo](/xdks/typescript/reference/interfaces/Schemas.Geo)
      * [Schemas.Get2CommunitiesIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2CommunitiesIdResponse)
      * [Schemas.Get2CommunitiesSearchResponse](/xdks/typescript/reference/interfaces/Schemas.Get2CommunitiesSearchResponse)
      * [Schemas.Get2ComplianceJobsIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ComplianceJobsIdResponse)
      * [Schemas.Get2ComplianceJobsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ComplianceJobsResponse)
      * [Schemas.Get2ConnectionsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ConnectionsResponse)
      * [Schemas.Get2DmConversationsIdDmEventsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2DmConversationsIdDmEventsResponse)
      * [Schemas.Get2DmConversationsWithParticipantIdDmEventsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2DmConversationsWithParticipantIdDmEventsResponse)
      * [Schemas.Get2DmEventsEventIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2DmEventsEventIdResponse)
      * [Schemas.Get2DmEventsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2DmEventsResponse)
      * [Schemas.Get2FdxAccountsAccountidContactResponse](/xdks/typescript/reference/interfaces/Schemas.Get2FdxAccountsAccountidContactResponse)
      * [Schemas.Get2FdxAccountsAccountidPayment\_networksResponse](/xdks/typescript/reference/interfaces/Schemas.Get2FdxAccountsAccountidPayment_networksResponse)
      * [Schemas.Get2FdxAccountsAccountidResponse](/xdks/typescript/reference/interfaces/Schemas.Get2FdxAccountsAccountidResponse)
      * [Schemas.Get2FdxAccountsAccountidTransactionsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2FdxAccountsAccountidTransactionsResponse)
      * [Schemas.Get2FdxCustomersCurrentResponse](/xdks/typescript/reference/interfaces/Schemas.Get2FdxCustomersCurrentResponse)
      * [Schemas.Get2Insights28hrResponse](/xdks/typescript/reference/interfaces/Schemas.Get2Insights28hrResponse)
      * [Schemas.Get2InsightsHistoricalResponse](/xdks/typescript/reference/interfaces/Schemas.Get2InsightsHistoricalResponse)
      * [Schemas.Get2LikesFirehoseStreamResponse](/xdks/typescript/reference/interfaces/Schemas.Get2LikesFirehoseStreamResponse)
      * [Schemas.Get2LikesSample10StreamResponse](/xdks/typescript/reference/interfaces/Schemas.Get2LikesSample10StreamResponse)
      * [Schemas.Get2ListsIdFollowersResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ListsIdFollowersResponse)
      * [Schemas.Get2ListsIdMembersResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ListsIdMembersResponse)
      * [Schemas.Get2ListsIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ListsIdResponse)
      * [Schemas.Get2ListsIdTweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2ListsIdTweetsResponse)
      * [Schemas.Get2MediaAnalyticsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2MediaAnalyticsResponse)
      * [Schemas.Get2MediaMediaKeyResponse](/xdks/typescript/reference/interfaces/Schemas.Get2MediaMediaKeyResponse)
      * [Schemas.Get2MediaResponse](/xdks/typescript/reference/interfaces/Schemas.Get2MediaResponse)
      * [Schemas.Get2NewsIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2NewsIdResponse)
      * [Schemas.Get2NewsSearchResponse](/xdks/typescript/reference/interfaces/Schemas.Get2NewsSearchResponse)
      * [Schemas.Get2NotesSearchNotesWrittenResponse](/xdks/typescript/reference/interfaces/Schemas.Get2NotesSearchNotesWrittenResponse)
      * [Schemas.Get2NotesSearchPostsEligibleForNotesResponse](/xdks/typescript/reference/interfaces/Schemas.Get2NotesSearchPostsEligibleForNotesResponse)
      * [Schemas.Get2SpacesByCreatorIdsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2SpacesByCreatorIdsResponse)
      * [Schemas.Get2SpacesIdBuyersResponse](/xdks/typescript/reference/interfaces/Schemas.Get2SpacesIdBuyersResponse)
      * [Schemas.Get2SpacesIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2SpacesIdResponse)
      * [Schemas.Get2SpacesIdTweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2SpacesIdTweetsResponse)
      * [Schemas.Get2SpacesResponse](/xdks/typescript/reference/interfaces/Schemas.Get2SpacesResponse)
      * [Schemas.Get2SpacesSearchResponse](/xdks/typescript/reference/interfaces/Schemas.Get2SpacesSearchResponse)
      * [Schemas.Get2TrendsByWoeidWoeidResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TrendsByWoeidWoeidResponse)
      * [Schemas.Get2TweetsAnalyticsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsAnalyticsResponse)
      * [Schemas.Get2TweetsCountsAllResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsCountsAllResponse)
      * [Schemas.Get2TweetsCountsRecentResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsCountsRecentResponse)
      * [Schemas.Get2TweetsFirehoseStreamLangEnResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsFirehoseStreamLangEnResponse)
      * [Schemas.Get2TweetsFirehoseStreamLangJaResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsFirehoseStreamLangJaResponse)
      * [Schemas.Get2TweetsFirehoseStreamLangKoResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsFirehoseStreamLangKoResponse)
      * [Schemas.Get2TweetsFirehoseStreamLangPtResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsFirehoseStreamLangPtResponse)
      * [Schemas.Get2TweetsFirehoseStreamResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsFirehoseStreamResponse)
      * [Schemas.Get2TweetsIdLikingUsersResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsIdLikingUsersResponse)
      * [Schemas.Get2TweetsIdQuoteTweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsIdQuoteTweetsResponse)
      * [Schemas.Get2TweetsIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsIdResponse)
      * [Schemas.Get2TweetsIdRetweetedByResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsIdRetweetedByResponse)
      * [Schemas.Get2TweetsIdRetweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsIdRetweetsResponse)
      * [Schemas.Get2TweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsResponse)
      * [Schemas.Get2TweetsSample10StreamResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsSample10StreamResponse)
      * [Schemas.Get2TweetsSampleStreamResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsSampleStreamResponse)
      * [Schemas.Get2TweetsSearchAllResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsSearchAllResponse)
      * [Schemas.Get2TweetsSearchRecentResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsSearchRecentResponse)
      * [Schemas.Get2TweetsSearchStreamResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsSearchStreamResponse)
      * [Schemas.Get2TweetsSearchStreamRulesCountsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2TweetsSearchStreamRulesCountsResponse)
      * [Schemas.Get2UsageTweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsageTweetsResponse)
      * [Schemas.Get2UsersByResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersByResponse)
      * [Schemas.Get2UsersByUsernameUsernameResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersByUsernameUsernameResponse)
      * [Schemas.Get2UsersIdBlockingResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdBlockingResponse)
      * [Schemas.Get2UsersIdBookmarksResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdBookmarksResponse)
      * [Schemas.Get2UsersIdFollowedListsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdFollowedListsResponse)
      * [Schemas.Get2UsersIdFollowersResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdFollowersResponse)
      * [Schemas.Get2UsersIdFollowingResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdFollowingResponse)
      * [Schemas.Get2UsersIdLikedTweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdLikedTweetsResponse)
      * [Schemas.Get2UsersIdListMembershipsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdListMembershipsResponse)
      * [Schemas.Get2UsersIdMentionsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdMentionsResponse)
      * [Schemas.Get2UsersIdMutingResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdMutingResponse)
      * [Schemas.Get2UsersIdOwnedListsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdOwnedListsResponse)
      * [Schemas.Get2UsersIdPinnedListsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdPinnedListsResponse)
      * [Schemas.Get2UsersIdResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdResponse)
      * [Schemas.Get2UsersIdTimelinesReverseChronologicalResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdTimelinesReverseChronologicalResponse)
      * [Schemas.Get2UsersIdTweetsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersIdTweetsResponse)
      * [Schemas.Get2UsersMeResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersMeResponse)
      * [Schemas.Get2UsersPersonalizedTrendsResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersPersonalizedTrendsResponse)
      * [Schemas.Get2UsersRepostsOfMeResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersRepostsOfMeResponse)
      * [Schemas.Get2UsersResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersResponse)
      * [Schemas.Get2UsersSearchResponse](/xdks/typescript/reference/interfaces/Schemas.Get2UsersSearchResponse)
      * [Schemas.Get2WebhooksResponse](/xdks/typescript/reference/interfaces/Schemas.Get2WebhooksResponse)
      * [Schemas.HashtagFields](/xdks/typescript/reference/interfaces/Schemas.HashtagFields)
      * [Schemas.KillAllConnectionsResponse](/xdks/typescript/reference/interfaces/Schemas.KillAllConnectionsResponse)
      * [Schemas.LikeComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.LikeComplianceSchema)
      * [Schemas.LikeWithTweetAuthor](/xdks/typescript/reference/interfaces/Schemas.LikeWithTweetAuthor)
      * [Schemas.List](/xdks/typescript/reference/interfaces/Schemas.List)
      * [Schemas.ListAddUserRequest](/xdks/typescript/reference/interfaces/Schemas.ListAddUserRequest)
      * [Schemas.ListCreateRequest](/xdks/typescript/reference/interfaces/Schemas.ListCreateRequest)
      * [Schemas.ListCreateResponse](/xdks/typescript/reference/interfaces/Schemas.ListCreateResponse)
      * [Schemas.ListDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.ListDeleteResponse)
      * [Schemas.ListFollowedRequest](/xdks/typescript/reference/interfaces/Schemas.ListFollowedRequest)
      * [Schemas.ListFollowedResponse](/xdks/typescript/reference/interfaces/Schemas.ListFollowedResponse)
      * [Schemas.ListMutateResponse](/xdks/typescript/reference/interfaces/Schemas.ListMutateResponse)
      * [Schemas.ListPinnedRequest](/xdks/typescript/reference/interfaces/Schemas.ListPinnedRequest)
      * [Schemas.ListPinnedResponse](/xdks/typescript/reference/interfaces/Schemas.ListPinnedResponse)
      * [Schemas.ListUnpinResponse](/xdks/typescript/reference/interfaces/Schemas.ListUnpinResponse)
      * [Schemas.ListUpdateRequest](/xdks/typescript/reference/interfaces/Schemas.ListUpdateRequest)
      * [Schemas.ListUpdateResponse](/xdks/typescript/reference/interfaces/Schemas.ListUpdateResponse)
      * [Schemas.ManagementInfo](/xdks/typescript/reference/interfaces/Schemas.ManagementInfo)
      * [Schemas.Media](/xdks/typescript/reference/interfaces/Schemas.Media)
      * [Schemas.MediaAnalytics](/xdks/typescript/reference/interfaces/Schemas.MediaAnalytics)
      * [Schemas.MediaMetrics](/xdks/typescript/reference/interfaces/Schemas.MediaMetrics)
      * [Schemas.MediaTimestampedMetrics](/xdks/typescript/reference/interfaces/Schemas.MediaTimestampedMetrics)
      * [Schemas.MediaUploadAppendResponse](/xdks/typescript/reference/interfaces/Schemas.MediaUploadAppendResponse)
      * [Schemas.MediaUploadConfigRequest](/xdks/typescript/reference/interfaces/Schemas.MediaUploadConfigRequest)
      * [Schemas.MediaUploadRequestOneShot](/xdks/typescript/reference/interfaces/Schemas.MediaUploadRequestOneShot)
      * [Schemas.MediaUploadResponse](/xdks/typescript/reference/interfaces/Schemas.MediaUploadResponse)
      * [Schemas.MentionFields](/xdks/typescript/reference/interfaces/Schemas.MentionFields)
      * [Schemas.MetadataCreateRequest](/xdks/typescript/reference/interfaces/Schemas.MetadataCreateRequest)
      * [Schemas.MetadataCreateResponse](/xdks/typescript/reference/interfaces/Schemas.MetadataCreateResponse)
      * [Schemas.Metrics](/xdks/typescript/reference/interfaces/Schemas.Metrics)
      * [Schemas.MuteUserMutationResponse](/xdks/typescript/reference/interfaces/Schemas.MuteUserMutationResponse)
      * [Schemas.MuteUserRequest](/xdks/typescript/reference/interfaces/Schemas.MuteUserRequest)
      * [Schemas.News](/xdks/typescript/reference/interfaces/Schemas.News)
      * [Schemas.NewsActivityResponsePayload](/xdks/typescript/reference/interfaces/Schemas.NewsActivityResponsePayload)
      * [Schemas.Note](/xdks/typescript/reference/interfaces/Schemas.Note)
      * [Schemas.NoteInfo](/xdks/typescript/reference/interfaces/Schemas.NoteInfo)
      * [Schemas.NoteTestResult](/xdks/typescript/reference/interfaces/Schemas.NoteTestResult)
      * [Schemas.PersonalizedTrend](/xdks/typescript/reference/interfaces/Schemas.PersonalizedTrend)
      * [Schemas.Place](/xdks/typescript/reference/interfaces/Schemas.Place)
      * [Schemas.PlaidAccount](/xdks/typescript/reference/interfaces/Schemas.PlaidAccount)
      * [Schemas.PlaidAccountContact](/xdks/typescript/reference/interfaces/Schemas.PlaidAccountContact)
      * [Schemas.PlaidAccountPaymentNetwork](/xdks/typescript/reference/interfaces/Schemas.PlaidAccountPaymentNetwork)
      * [Schemas.PlaidAccountTransaction](/xdks/typescript/reference/interfaces/Schemas.PlaidAccountTransaction)
      * [Schemas.PlaidAddress](/xdks/typescript/reference/interfaces/Schemas.PlaidAddress)
      * [Schemas.PlaidCurrency](/xdks/typescript/reference/interfaces/Schemas.PlaidCurrency)
      * [Schemas.PlaidCustomer](/xdks/typescript/reference/interfaces/Schemas.PlaidCustomer)
      * [Schemas.PlaidName](/xdks/typescript/reference/interfaces/Schemas.PlaidName)
      * [Schemas.PlaidTelephone](/xdks/typescript/reference/interfaces/Schemas.PlaidTelephone)
      * [Schemas.Point](/xdks/typescript/reference/interfaces/Schemas.Point)
      * [Schemas.Poll](/xdks/typescript/reference/interfaces/Schemas.Poll)
      * [Schemas.PollOption](/xdks/typescript/reference/interfaces/Schemas.PollOption)
      * [Schemas.PreviewImage](/xdks/typescript/reference/interfaces/Schemas.PreviewImage)
      * [Schemas.Problem](/xdks/typescript/reference/interfaces/Schemas.Problem)
      * [Schemas.ProcessingInfo](/xdks/typescript/reference/interfaces/Schemas.ProcessingInfo)
      * [Schemas.ProfileUpdateActivityResponsePayload](/xdks/typescript/reference/interfaces/Schemas.ProfileUpdateActivityResponsePayload)
      * [Schemas.ReplayJobCreateResponse](/xdks/typescript/reference/interfaces/Schemas.ReplayJobCreateResponse)
      * [Schemas.Rule](/xdks/typescript/reference/interfaces/Schemas.Rule)
      * [Schemas.RuleNoId](/xdks/typescript/reference/interfaces/Schemas.RuleNoId)
      * [Schemas.RulesCount](/xdks/typescript/reference/interfaces/Schemas.RulesCount)
      * [Schemas.RulesLookupResponse](/xdks/typescript/reference/interfaces/Schemas.RulesLookupResponse)
      * [Schemas.RulesResponseMetadata](/xdks/typescript/reference/interfaces/Schemas.RulesResponseMetadata)
      * [Schemas.SearchCount](/xdks/typescript/reference/interfaces/Schemas.SearchCount)
      * [Schemas.SensitiveMediaWarning](/xdks/typescript/reference/interfaces/Schemas.SensitiveMediaWarning)
      * [Schemas.SharedInfo](/xdks/typescript/reference/interfaces/Schemas.SharedInfo)
      * [Schemas.Space](/xdks/typescript/reference/interfaces/Schemas.Space)
      * [Schemas.Sticker](/xdks/typescript/reference/interfaces/Schemas.Sticker)
      * [Schemas.StickerInfo](/xdks/typescript/reference/interfaces/Schemas.StickerInfo)
      * [Schemas.StreamingLikeResponseV2](/xdks/typescript/reference/interfaces/Schemas.StreamingLikeResponseV2)
      * [Schemas.StreamingTweetResponse](/xdks/typescript/reference/interfaces/Schemas.StreamingTweetResponse)
      * [Schemas.SubscriptionsCountGetResponse](/xdks/typescript/reference/interfaces/Schemas.SubscriptionsCountGetResponse)
      * [Schemas.SubscriptionsCreateResponse](/xdks/typescript/reference/interfaces/Schemas.SubscriptionsCreateResponse)
      * [Schemas.SubscriptionsDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.SubscriptionsDeleteResponse)
      * [Schemas.SubscriptionsGetResponse](/xdks/typescript/reference/interfaces/Schemas.SubscriptionsGetResponse)
      * [Schemas.SubscriptionsListGetResponse](/xdks/typescript/reference/interfaces/Schemas.SubscriptionsListGetResponse)
      * [Schemas.Subtitles](/xdks/typescript/reference/interfaces/Schemas.Subtitles)
      * [Schemas.SubtitlesCreateRequest](/xdks/typescript/reference/interfaces/Schemas.SubtitlesCreateRequest)
      * [Schemas.SubtitlesCreateResponse](/xdks/typescript/reference/interfaces/Schemas.SubtitlesCreateResponse)
      * [Schemas.SubtitlesDeleteRequest](/xdks/typescript/reference/interfaces/Schemas.SubtitlesDeleteRequest)
      * [Schemas.SubtitlesDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.SubtitlesDeleteResponse)
      * [Schemas.TimestampedMetrics](/xdks/typescript/reference/interfaces/Schemas.TimestampedMetrics)
      * [Schemas.Topic](/xdks/typescript/reference/interfaces/Schemas.Topic)
      * [Schemas.Trend](/xdks/typescript/reference/interfaces/Schemas.Trend)
      * [Schemas.Tweet](/xdks/typescript/reference/interfaces/Schemas.Tweet)
      * [Schemas.TweetComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetComplianceSchema)
      * [Schemas.TweetCreateRequest](/xdks/typescript/reference/interfaces/Schemas.TweetCreateRequest)
      * [Schemas.TweetCreateResponse](/xdks/typescript/reference/interfaces/Schemas.TweetCreateResponse)
      * [Schemas.TweetDeleteComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetDeleteComplianceSchema)
      * [Schemas.TweetDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.TweetDeleteResponse)
      * [Schemas.TweetDropComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetDropComplianceSchema)
      * [Schemas.TweetEditComplianceObjectSchema](/xdks/typescript/reference/interfaces/Schemas.TweetEditComplianceObjectSchema)
      * [Schemas.TweetEditComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetEditComplianceSchema)
      * [Schemas.TweetHideRequest](/xdks/typescript/reference/interfaces/Schemas.TweetHideRequest)
      * [Schemas.TweetHideResponse](/xdks/typescript/reference/interfaces/Schemas.TweetHideResponse)
      * [Schemas.TweetNotice](/xdks/typescript/reference/interfaces/Schemas.TweetNotice)
      * [Schemas.TweetNoticeSchema](/xdks/typescript/reference/interfaces/Schemas.TweetNoticeSchema)
      * [Schemas.TweetTakedownComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetTakedownComplianceSchema)
      * [Schemas.TweetUndropComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetUndropComplianceSchema)
      * [Schemas.TweetUnviewable](/xdks/typescript/reference/interfaces/Schemas.TweetUnviewable)
      * [Schemas.TweetUnviewableSchema](/xdks/typescript/reference/interfaces/Schemas.TweetUnviewableSchema)
      * [Schemas.TweetWithheld](/xdks/typescript/reference/interfaces/Schemas.TweetWithheld)
      * [Schemas.TweetWithheldComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.TweetWithheldComplianceSchema)
      * [Schemas.UnlikeComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UnlikeComplianceSchema)
      * [Schemas.UploadSource](/xdks/typescript/reference/interfaces/Schemas.UploadSource)
      * [Schemas.UrlFields](/xdks/typescript/reference/interfaces/Schemas.UrlFields)
      * [Schemas.UrlImage](/xdks/typescript/reference/interfaces/Schemas.UrlImage)
      * [Schemas.Usage](/xdks/typescript/reference/interfaces/Schemas.Usage)
      * [Schemas.UsageFields](/xdks/typescript/reference/interfaces/Schemas.UsageFields)
      * [Schemas.User](/xdks/typescript/reference/interfaces/Schemas.User)
      * [Schemas.UserComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserComplianceSchema)
      * [Schemas.UserDeleteComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserDeleteComplianceSchema)
      * [Schemas.UserProfileModificationComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserProfileModificationComplianceSchema)
      * [Schemas.UserProfileModificationObjectSchema](/xdks/typescript/reference/interfaces/Schemas.UserProfileModificationObjectSchema)
      * [Schemas.UserProtectComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserProtectComplianceSchema)
      * [Schemas.UserScrubGeoObjectSchema](/xdks/typescript/reference/interfaces/Schemas.UserScrubGeoObjectSchema)
      * [Schemas.UserScrubGeoSchema](/xdks/typescript/reference/interfaces/Schemas.UserScrubGeoSchema)
      * [Schemas.UserSuspendComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserSuspendComplianceSchema)
      * [Schemas.UserTakedownComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserTakedownComplianceSchema)
      * [Schemas.UserUndeleteComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserUndeleteComplianceSchema)
      * [Schemas.UserUnprotectComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserUnprotectComplianceSchema)
      * [Schemas.UserUnsuspendComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserUnsuspendComplianceSchema)
      * [Schemas.UserWithheld](/xdks/typescript/reference/interfaces/Schemas.UserWithheld)
      * [Schemas.UserWithheldComplianceSchema](/xdks/typescript/reference/interfaces/Schemas.UserWithheldComplianceSchema)
      * [Schemas.UsersDMBlockCreateResponse](/xdks/typescript/reference/interfaces/Schemas.UsersDMBlockCreateResponse)
      * [Schemas.UsersDMUnBlockCreateResponse](/xdks/typescript/reference/interfaces/Schemas.UsersDMUnBlockCreateResponse)
      * [Schemas.UsersFollowingCreateRequest](/xdks/typescript/reference/interfaces/Schemas.UsersFollowingCreateRequest)
      * [Schemas.UsersFollowingCreateResponse](/xdks/typescript/reference/interfaces/Schemas.UsersFollowingCreateResponse)
      * [Schemas.UsersFollowingDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.UsersFollowingDeleteResponse)
      * [Schemas.UsersLikesCreateRequest](/xdks/typescript/reference/interfaces/Schemas.UsersLikesCreateRequest)
      * [Schemas.UsersLikesCreateResponse](/xdks/typescript/reference/interfaces/Schemas.UsersLikesCreateResponse)
      * [Schemas.UsersLikesDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.UsersLikesDeleteResponse)
      * [Schemas.UsersRetweetsCreateRequest](/xdks/typescript/reference/interfaces/Schemas.UsersRetweetsCreateRequest)
      * [Schemas.UsersRetweetsCreateResponse](/xdks/typescript/reference/interfaces/Schemas.UsersRetweetsCreateResponse)
      * [Schemas.UsersRetweetsDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.UsersRetweetsDeleteResponse)
      * [Schemas.Variant](/xdks/typescript/reference/interfaces/Schemas.Variant)
      * [Schemas.WebhookConfig](/xdks/typescript/reference/interfaces/Schemas.WebhookConfig)
      * [Schemas.WebhookConfigCreateRequest](/xdks/typescript/reference/interfaces/Schemas.WebhookConfigCreateRequest)
      * [Schemas.WebhookConfigCreateResponse](/xdks/typescript/reference/interfaces/Schemas.WebhookConfigCreateResponse)
      * [Schemas.WebhookConfigDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.WebhookConfigDeleteResponse)
      * [Schemas.WebhookConfigPutResponse](/xdks/typescript/reference/interfaces/Schemas.WebhookConfigPutResponse)
      * [Schemas.WebhookLinksCreateResponse](/xdks/typescript/reference/interfaces/Schemas.WebhookLinksCreateResponse)
      * [Schemas.WebhookLinksDeleteResponse](/xdks/typescript/reference/interfaces/Schemas.WebhookLinksDeleteResponse)
      * [Schemas.WebhookLinksGetResponse](/xdks/typescript/reference/interfaces/Schemas.WebhookLinksGetResponse)
      * [Schemas.WebhookReplayCreateRequest](/xdks/typescript/reference/interfaces/Schemas.WebhookReplayCreateRequest)
    </Accordion>
  </Accordion>

  <Accordion title="Classes">
    <Accordion title="AccountActivity">
      * [AccountActivityClient](/xdks/typescript/reference/classes/AccountActivityClient)
    </Accordion>

    <Accordion title="Activity">
      * [ActivityClient](/xdks/typescript/reference/classes/ActivityClient)
    </Accordion>

    <Accordion title="Client">
      * [Client](/xdks/typescript/reference/classes/Client)
    </Accordion>

    <Accordion title="Clients">
      * [NewsClient](/xdks/typescript/reference/classes/NewsClient)
    </Accordion>

    <Accordion title="Communities">
      * [CommunitiesClient](/xdks/typescript/reference/classes/CommunitiesClient)
    </Accordion>

    <Accordion title="CommunityNotes">
      * [CommunityNotesClient](/xdks/typescript/reference/classes/CommunityNotesClient)
    </Accordion>

    <Accordion title="Compliance">
      * [ComplianceClient](/xdks/typescript/reference/classes/ComplianceClient)
    </Accordion>

    <Accordion title="Connections">
      * [ConnectionsClient](/xdks/typescript/reference/classes/ConnectionsClient)
    </Accordion>

    <Accordion title="Core">
      * [ApiError](/xdks/typescript/reference/classes/ApiError)
    </Accordion>

    <Accordion title="DirectMessages">
      * [DirectMessagesClient](/xdks/typescript/reference/classes/DirectMessagesClient)
    </Accordion>

    <Accordion title="General">
      * [GeneralClient](/xdks/typescript/reference/classes/GeneralClient)
    </Accordion>

    <Accordion title="Http">
      * [HttpClient](/xdks/typescript/reference/classes/HttpClient)
    </Accordion>

    <Accordion title="Lists">
      * [ListsClient](/xdks/typescript/reference/classes/ListsClient)
    </Accordion>

    <Accordion title="Media">
      * [MediaClient](/xdks/typescript/reference/classes/MediaClient)
    </Accordion>

    <Accordion title="Pagination">
      * [EventPaginator](/xdks/typescript/reference/classes/EventPaginator)
      * [PostPaginator](/xdks/typescript/reference/classes/PostPaginator)
      * [UserPaginator](/xdks/typescript/reference/classes/UserPaginator)
    </Accordion>

    <Accordion title="Paginator">
      * [Paginator](/xdks/typescript/reference/classes/Paginator)
    </Accordion>

    <Accordion title="Posts">
      * [PostsClient](/xdks/typescript/reference/classes/PostsClient)
    </Accordion>

    <Accordion title="Spaces">
      * [SpacesClient](/xdks/typescript/reference/classes/SpacesClient)
    </Accordion>

    <Accordion title="Stream">
      * [StreamClient](/xdks/typescript/reference/classes/StreamClient)
    </Accordion>

    <Accordion title="Trends">
      * [TrendsClient](/xdks/typescript/reference/classes/TrendsClient)
    </Accordion>

    <Accordion title="Usage">
      * [UsageClient](/xdks/typescript/reference/classes/UsageClient)
    </Accordion>

    <Accordion title="Users">
      * [UsersClient](/xdks/typescript/reference/classes/UsersClient)
    </Accordion>

    <Accordion title="Webhooks">
      * [WebhooksClient](/xdks/typescript/reference/classes/WebhooksClient)
    </Accordion>
  </Accordion>
</AccordionGroup>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ClientConfig

Configuration options for the X API client

## Properties

<ResponseField name="baseUrl" type="string">
  Base URL for API requests
</ResponseField>

<ResponseField name="bearerToken" type="string">
  Bearer token for authentication
</ResponseField>

<ResponseField name="accessToken" type="string">
  OAuth2 access token
</ResponseField>

<ResponseField name="oauth1" type="any">
  OAuth1 instance for authentication
</ResponseField>

<ResponseField name="headers" type="Record<string, string>">
  Custom headers to include in requests
</ResponseField>

<ResponseField name="timeout" type="number">
  Request timeout in milliseconds
</ResponseField>

<ResponseField name="retry" type="boolean">
  Whether to automatically retry failed requests
</ResponseField>

<ResponseField name="maxRetries" type="number">
  Maximum number of retry attempts
</ResponseField>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# HttpClientRequestOptions

## Properties

<ParamField name="method" type="string" />

<ParamField name="headers" type="Record<string, string> | Headers" />

<ParamField name="body" type="string | Buffer | ArrayBuffer | ArrayBufferView" />

<ParamField name="signal" type="AbortSignal" />

<ParamField name="timeout" type="number" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# HttpResponse

## Properties

<ResponseField name="ok" type="boolean" required />

<ResponseField name="status" type="number" required />

<ResponseField name="statusText" type="string" required />

<ResponseField name="headers" type="Headers" required />

<ResponseField name="url" type="string" required />

<ResponseField name="json" type="Promise<any>" required />

<ResponseField name="text" type="Promise<string>" required />

<ResponseField name="arrayBuffer" type="Promise<ArrayBuffer>" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ApiResponse

Response wrapper with metadata

## Type parameters

| Name | Type  |
| :--- | :---- |
| `T`  | `any` |

## Properties

<ResponseField name="body" type="T" required>
  Response body
</ResponseField>

<ResponseField name="headers" type="Headers" required>
  Response headers
</ResponseField>

<ResponseField name="status" type="number" required>
  HTTP status code
</ResponseField>

<ResponseField name="statusText" type="string" required>
  HTTP status text
</ResponseField>

<ResponseField name="url" type="string" required>
  Response URL
</ResponseField>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Build for businesses

> Use X's powerful APIs to help your business listen, act, and discover.

## Listen to the conversation on x

<CardGroup>
  <Card title="Monitor your brand" icon="eye" iconType="solid">
    Understand, track, and benchmark the conversations and perceptions surrounding your brand.

    [**Learn more**](https://developer.x.com/en/use-cases/build-for-businesses/brand-monitoring) <Icon icon="arrow-right" />
  </Card>

  <Card title="Track events" icon="calendar" iconType="solid">
    Stay on top of breaking news and events to spot crises early that might impact your business and brand reputation.

    [**Learn more**](https://developer.x.com/en/use-cases/build-for-businesses/track-events) <Icon icon="arrow-right" />
  </Card>
</CardGroup>

## Use insights from X

<CardGroup>
  <Card title="Manage your social media" icon="share-nodes" iconType="solid">
    Manage and track every aspect of your social presence with targeted tooling and real-time ROI.

    [**Learn more**](https://developer.x.com/en/use-cases/build-for-businesses/manage-social-media) <Icon icon="arrow-right" />
  </Card>

  <Card title="Oversee customer care" icon="globe" iconType="solid">
    Directly engage with your customers to quickly answer questions, resolve their issues, and provide exceptional service.

    [**Learn more**](https://developer.x.com/en/use-cases/build-for-businesses/customer-care-management) <Icon icon="arrow-right" />
  </Card>
</CardGroup>

## Discover new trends and opportunities

<CardGroup>
  <Card title="Uncover consumer insights" icon="magnifying-glass-chart" iconType="solid">
    Inform your business strategy with insights into emerging trends, customer preferences, and feedback.
  </Card>

  <Card title="Inform search results" icon="magnifying-glass" iconType="solid">
    Enhance your search results with what’s happening on X.
  </Card>

  <Card title="Research markets and audiences" icon="users" iconType="solid">
    Understand your audience and what they value by uncovering trends and surfacing important conversations on X.

    [**Learn more**](https://developer.x.com/en/use-cases/build-for-businesses/market-research) <Icon icon="arrow-right" />
  </Card>
</CardGroup>

## Expand what’s possible with X Ads

<CardGroup>
  <Card
    title="Enrich advertising solutions on X
"
    icon="bullhorn"
    iconType="solid"
  >
    Enhance the X Ads experience with unique innovations and efficiencies for advertisers.

    [**Learn more**](https://developer.x.com/en/use-cases/build-for-businesses/advertise) <Icon icon="arrow-right" />
  </Card>
</CardGroup>

## Build for publishers

<CardGroup>
  <Card title="Embed X content" icon="code" iconType="solid">
    Engage your users with live X content that brings context to what’s happening and links to the source. Amplify your efforts on X by embedding your X content into your website or app.

    [**Learn more**](https://developer.x.com/en/products/x-for-websites) <Icon icon="arrow-right" />
  </Card>
</CardGroup>

