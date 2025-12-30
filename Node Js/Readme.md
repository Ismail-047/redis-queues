# Email Queue System Documentation

This document explains how the email queue system works, what each file handles, and how they are connected together.

## Overview

The email queue system uses **BullMQ** (a Redis-based queue manager) to handle asynchronous email sending. This architecture ensures that email sending doesn't block the main application thread and provides retry mechanisms for failed email deliveries.

## Architecture Flow

```
EmailService → EmailQueue → Redis → EmailWorker → Resend API
```

1. **EmailService** adds email jobs to the queue
2. **EmailQueue** stores jobs in Redis
3. **EmailWorker** picks up jobs from Redis and processes them
4. **Resend API** sends the actual emails

## File Structure and Responsibilities

### 1. `src/lib/redis.ts`
**Purpose**: Establishes the Redis connection that BullMQ uses as its backend.

**Key Features**:
- Creates a Redis client using `ioredis`
- Configures connection settings (host, port from environment variables)
- **Critical Configuration**: `maxRetriesPerRequest: null` - This is required for BullMQ because it uses blocking Redis commands. Automatic retries would interfere with BullMQ's blocking behavior and cause timeouts.
- Includes connection event handlers for logging success/failure

**Connection**: Used by both `email.queue.ts` and `email.worker.ts` to connect to the same Redis instance.

---

### 2. `src/utlis/email-queue/email.d.ts`
**Purpose**: TypeScript type definition for email job data structure.

**Structure**:
```typescript
interface EmailJob {
    to: string;      // Recipient email address
    subject: string; // Email subject line
    html: string;    // HTML content of the email
}
```

**Usage**: Ensures type safety across all email queue files.

---

### 3. `src/utlis/email-queue/email.queue.ts`
**Purpose**: Creates and configures the BullMQ queue instance for email jobs.

**Key Responsibilities**:
- Initializes a BullMQ `Queue` named "email"
- Configures job retry behavior:
  - **3 attempts** if a job fails
  - **Exponential backoff**: Waits 5 seconds, then 10 seconds, then 20 seconds between retries
- Job cleanup:
  - **removeOnComplete: true** - Deletes successful jobs from Redis to keep it clean
  - **removeOnFail**: Keeps last 100 failed jobs for 24 hours for debugging

**Connection**: Uses the Redis client from `redis.ts` to store and manage jobs.

---

### 4. `src/utlis/email-queue/email.service.ts`
**Purpose**: Service layer that provides methods to add email jobs to the queue.

**Key Methods**:
- `sendEmail(data: EmailJob)` - Core method that adds any email job to the queue
- `sendVerificationEmail(to, code)` - Convenience method for sending verification emails
- `sendPasswordResetEmail(to, token)` - Convenience method for sending password reset emails

**How it works**:
- Methods accept email data and call `emailQueue.add("send", data)` to enqueue the job
- Jobs are added asynchronously and return immediately (non-blocking)
- The actual email sending happens later by the worker

**Connection**: Imports and uses `emailQueue` from `email.queue.ts`.

---

### 5. `src/utlis/email-queue/email.worker.ts`
**Purpose**: Processes email jobs from the queue and sends them via the Resend API.

**Key Responsibilities**:
- Creates a BullMQ `Worker` that listens to the "email" queue
- Automatically processes jobs when they appear in the queue
- Sends emails using the Resend API
- Handles errors and triggers retry logic

**Configuration**:
- **Concurrency: 2** - Processes maximum 2 email jobs concurrently (matches Resend API rate limit)
- **Rate Limiting**: Maximum 2 emails per second (Resend API limit)
- **Lock Duration**: 30 seconds - Maximum time a job can be processed before being considered stuck

**Error Handling**:
- If email sending fails, throws an error which triggers BullMQ's retry mechanism
- Logs failed jobs after all retry attempts are exhausted
- Successful emails are logged to console

**Resend API Integration**:
- Uses Resend API to send emails
- Requires `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN` environment variables
- Sends emails from: `Auth App <auth@${RESEND_EMAIL_DOMAIN}>`

**Connection**: 
- Uses Redis client from `redis.ts` to connect to the queue
- Listens to the same "email" queue created in `email.queue.ts`

---

### 6. `src/index.ts`
**Purpose**: Application entry point that initializes the email queue system.

**Initialization Steps**:
1. Imports `./lib/redis.js` - This executes the Redis connection setup
2. Imports `./utlis/email-queue/email.worker.js` - This starts the worker process, which begins listening for jobs

**Important**: The worker must be imported/started when the application starts, otherwise jobs will be queued but never processed.

---

## How They Work Together

### Complete Flow Example: Sending a Verification Email

1. **Application calls** `EmailService.sendVerificationEmail("user@example.com", "123456")`

2. **EmailService** calls `emailQueue.add("send", { to, subject, html })`

3. **EmailQueue** stores the job in Redis with retry configuration

4. **EmailWorker** (running in background) detects the new job in Redis

5. **EmailWorker** processes the job:
   - Extracts `to`, `subject`, and `html` from job data
   - Calls Resend API to send the email
   - If successful: Job is removed from Redis
   - If failed: Error is thrown, triggering retry logic

6. **Retry Logic** (if email fails):
   - Wait 5 seconds → Retry attempt 1
   - If fails: Wait 10 seconds → Retry attempt 2
   - If fails: Wait 20 seconds → Retry attempt 3
   - If all attempts fail: Job is marked as failed and logged

### Key Benefits

- **Non-blocking**: Email sending doesn't block the main application
- **Resilient**: Automatic retries handle temporary failures
- **Rate-limited**: Respects Resend API limits (2 emails/second)
- **Scalable**: Can handle high volumes of emails without overwhelming the API
- **Clean**: Automatically removes completed jobs from Redis

## Environment Variables Required

- `REDIS_HOST` - Redis server host (default: "localhost")
- `REDIS_PORT` - Redis server port (default: 6379)
- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_EMAIL_DOMAIN` - Your verified domain with Resend
- `FRONTEND_URL` - Frontend URL for password reset links (used in email.service.ts)

## Dependencies

- **bullmq**: Queue management library
- **ioredis**: Redis client for Node.js
- **resend**: Email sending service API

