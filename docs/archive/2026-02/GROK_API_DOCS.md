# Grok API Documentation
Please paste any helpful Grok API documentation below! Specifically, keep an eye out for the currently available `model` IDs (e.g., `grok-1`, `grok-2`, `grok-2-mini`, etc.) and the structure of the Chat Completions endpoint array.

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

# PaginatedResponse

Paginated response interface

Represents the structure of a paginated API response from the X API.

## Type parameters

| Name | Description                       |
| :--- | :-------------------------------- |
| `T`  | The type of items in the response |

## Properties

<ResponseField name="data" type="T[]" required>
  Array of items in the current page
</ResponseField>

<ResponseField name="meta" type="Object">
  Pagination metadata

  <Expandable title="properties">
    <ResponseField name="Name" type="Type | Description" required />

    <ResponseField name="resultCount" type="number | Number of results in the current page" />

    <ResponseField name="nextToken" type="string | Token for fetching the next page" />

    <ResponseField name="previousToken" type="string | Token for fetching the previous page" />
  </Expandable>
</ResponseField>

<ResponseField name="includes" type="Record<string, any>">
  Additional included objects (users, tweets, etc.)
</ResponseField>

<ResponseField name="errors" type="any[]">
  Any errors in the response
</ResponseField>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# PaginationMeta

Pagination metadata

## Properties

<ResponseField name="nextToken" type="string">
  Next page token
</ResponseField>

<ResponseField name="previousToken" type="string">
  Previous page token
</ResponseField>

<ResponseField name="totalCount" type="number">
  Total count
</ResponseField>

<ResponseField name="resultCount" type="number">
  Result count
</ResponseField>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# RequestOptions

Request options for API calls

## Properties

<ParamField name="timeout" type="number">
  Request timeout in milliseconds
</ParamField>

<ParamField name="headers" type="Record<string, string>">
  Additional headers
</ParamField>

<ParamField name="signal" type="AbortSignal">
  Request signal for cancellation
</ParamField>

<ParamField name="body" type="string">
  Request body
</ParamField>

<ParamField name="raw" type="boolean">
  Return raw HTTP wrapper instead of parsed body
</ParamField>

<ParamField name="security" type="Record<string, string[]>[]">
  Security requirements for the endpoint (from OpenAPI spec) - used for smart auth selection
</ParamField>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivityStreamingResponse

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivityStreamingResponse

## Properties

<ResponseField name="data" type="Record<string, any>" />

<ResponseField name="errors" type="Problem[]" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscription

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscription

## Properties

<ResponseField name="createdAt" type="string" required />

<ResponseField name="eventType" type="string" required />

<ResponseField name="filter" type="ActivitySubscriptionFilter" required />

<ResponseField name="subscriptionId" type="string" required />

<ResponseField name="tag" type="string" />

<ResponseField name="updatedAt" type="string" required />

<ResponseField name="webhookId" type="string" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscriptionCreateRequest

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscriptionCreateRequest

## Properties

<ResponseField name="eventType" type="&#x22;profile.update.bio&#x22; | &#x22;profile.update.profile_picture&#x22; | &#x22;profile.update.banner_picture&#x22; | &#x22;profile.update.screenname&#x22; | &#x22;profile.update.geo&#x22; | &#x22;profile.update.url&#x22; | &#x22;profile.update.verified_badge&#x22; | &#x22;news.new&#x22; | &#x22;follow.follow&#x22; | &#x22;follow.unfollow&#x22; | &#x22;ProfileBioUpdate&#x22; | &#x22;ProfilePictureUpdate&#x22; | &#x22;ProfileBannerPictureUpdate&#x22; | &#x22;ProfileScreennameUpdate&#x22; | &#x22;ProfileGeoUpdate&#x22; | &#x22;ProfileUrlUpdate&#x22; | &#x22;ProfileVerifiedBadgeUpdate&#x22; | &#x22;NewsNew&#x22; | &#x22;FollowFollow&#x22; | &#x22;FollowUnfollow&#x22;" required />

<ResponseField name="filter" type="ActivitySubscriptionFilter" required />

<ResponseField name="tag" type="string" />

<ResponseField name="webhookId" type="string" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscriptionCreateResponse

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscriptionCreateResponse

## Properties

<ResponseField name="data" type="Record<string, any>" />

<ResponseField name="errors" type="Problem[]" />

<ResponseField name="meta" type="Record<string, any>" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscriptionDeleteResponse

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscriptionDeleteResponse

## Properties

<ResponseField name="data" type="Record<string, any>" />

<ResponseField name="errors" type="Problem[]" />

<ResponseField name="meta" type="Record<string, any>" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscriptionFilter

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscriptionFilter

## Properties

<ResponseField name="keyword" type="string" />

<ResponseField name="userId" type="string" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscriptionGetResponse

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscriptionGetResponse

## Properties

<ResponseField name="data" type="ActivitySubscription[]" />

<ResponseField name="errors" type="Problem[]" />

<ResponseField name="meta" type="Record<string, any>" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ActivitySubscriptionUpdateRequest

[Schemas](/xdks/typescript/reference/modules/Schemas).ActivitySubscriptionUpdateRequest

## Properties

<ResponseField name="tag" type="string" />

<ResponseField name="webhookId" type="string" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# CashtagFields

[Schemas](/xdks/typescript/reference/modules/Schemas).CashtagFields

## Properties

<ResponseField name="tag" type="string" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# ClientAppUsage

[Schemas](/xdks/typescript/reference/modules/Schemas).ClientAppUsage

## Properties

<ResponseField name="clientAppId" type="string" />

<ResponseField name="usage" type="UsageFields[]" />

<ResponseField name="usageResultCount" type="number" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Connection

[Schemas](/xdks/typescript/reference/modules/Schemas).Connection

## Properties

<ResponseField name="clientIp" type="string" />

<ResponseField name="connectedAt" type="string" required />

<ResponseField name="disconnectReason" type="string" />

<ResponseField name="disconnectedAt" type="string" />

<ResponseField name="endpointName" type="string" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# CreateDmConversationRequest

[Schemas](/xdks/typescript/reference/modules/Schemas).CreateDmConversationRequest

## Properties

<ResponseField name="conversationType" type="&#x22;Group&#x22;" required />

<ResponseField name="message" type="any" required />

<ResponseField name="participantIds" type="DmParticipants" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# DmMediaAttachment

[Schemas](/xdks/typescript/reference/modules/Schemas).DmMediaAttachment

## Properties

<ResponseField name="mediaId" type="string" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Engagement

[Schemas](/xdks/typescript/reference/modules/Schemas).Engagement

## Properties

<ResponseField name="errors" type="Record<string, any>[]" />

<ResponseField name="measurement" type="Record<string, any>" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Geo

[Schemas](/xdks/typescript/reference/modules/Schemas).Geo

## Properties

<ResponseField name="bbox" type="number[]" required />

<ResponseField name="geometry" type="Point" />

<ResponseField name="properties" type="Record<string, any>" required />

<ResponseField name="type" type="&#x22;Feature&#x22;" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# News

[Schemas](/xdks/typescript/reference/modules/Schemas).News

## Properties

<ResponseField name="category" type="string" />

<ResponseField name="clusterPostsResults" type="Record<string, any>[]" />

<ResponseField name="contexts" type="Record<string, any>" />

<ResponseField name="disclaimer" type="string" />

<ResponseField name="hook" type="string" />

<ResponseField name="keywords" type="string[]" />

<ResponseField name="lastUpdatedAtMs" type="string" />

<ResponseField name="name" type="string" />

<ResponseField name="restId" type="string" required />

<ResponseField name="summary" type="string" />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Rule

[Schemas](/xdks/typescript/reference/modules/Schemas).Rule

## Properties

<ResponseField name="id" type="string" />

<ResponseField name="tag" type="string" />

<ResponseField name="value" type="string" required />

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.x.com/llms.txt
> Use this file to discover all available pages before exploring further.

# User

[Schemas](/xdks/typescript/reference/modules/Schemas).User

## Properties

<ResponseField name="affiliation" type="Record<string, any>" />

<ResponseField name="connectionStatus" type="(&#x22;following&#x22; | &#x22;follow_request_received&#x22; | &#x22;follow_request_sent&#x22; | &#x22;blocking&#x22; | &#x22;followed_by&#x22; | &#x22;muting&#x22;)[]" />

<ResponseField name="createdAt" type="string" />

<ResponseField name="description" type="string" />

<ResponseField name="entities" type="Record<string, any>" />

<ResponseField name="id" type="string" required />

<ResponseField name="location" type="string" />

<ResponseField name="mostRecentTweetId" type="string" />

<ResponseField name="name" type="string" required />

<ResponseField name="pinnedTweetId" type="string" />

<ResponseField name="profileBannerUrl" type="string" />

<ResponseField name="profileImageUrl" type="string" />

<ResponseField name="protected" type="boolean" />

<ResponseField name="publicMetrics" type="Record<string, any>" />

<ResponseField name="receivesYourDm" type="boolean" />

<ResponseField name="subscriptionType" type="&#x22;Basic&#x22; | &#x22;Premium&#x22; | &#x22;PremiumPlus&#x22; | &#x22;None&#x22;" />

<ResponseField name="url" type="string" />

<ResponseField name="username" type="string" required />

<ResponseField name="verified" type="boolean" />

<ResponseField name="verifiedType" type="&#x22;blue&#x22; | &#x22;government&#x22; | &#x22;business&#x22; | &#x22;none&#x22;" />

<ResponseField name="withheld" type="UserWithheld" />
