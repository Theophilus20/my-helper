# Privacy Policy

Effective date: July 18, 2026

## Overview

My Helper is a Chrome extension that helps people use ChatGPT and learn Codex skills through page guidance, prompt coaching, language options, voice support, and accessibility tools.

## Information kept on your device

My Helper stores language and voice preferences, accessibility settings, learning progress, achievements, assistant position, and authenticated session information in Chrome extension storage on your device. This lets your preferences remain available after a page refresh.

## Google account and synchronized data

My Helper requires Google sign-in before coaching features can be used. It receives the basic account information needed to identify your My Helper account, including your email address and display name. Supabase stores the account record and synchronizes selected preferences, learning progress, and achievements to that account.

## Support messages

Support is available only after you sign in. When you choose to send a support message, My Helper processes the category you select, the message you write, and the email address connected to your My Helper account so the support team can investigate and reply. The request is stored in Supabase and is sent through a secure server-side function to the My Helper support inbox. My Helper may also send you an automatic confirmation email.

My Helper never automatically includes your ChatGPT conversations, chat history, uploaded files, screenshots, or unsent drafts in a support request.

## Information sent for AI features

My Helper sends information only when you choose an AI feature. When you select **Coach this prompt**, the prompt you choose is sent to the My Helper coach server. When you ask a question, request a guided lesson, use **Explain this page**, or choose a non-English interface language, My Helper may send your request, current page context, visible-control labels, or interface text to be translated.

My Helper does not automatically send ChatGPT conversations, chat history, uploaded files, account settings, or messages that you have not chosen to coach.

## Visual analysis

Visual analysis is optional. When you enable it and request a page explanation, My Helper may capture a temporary image of the visible browser tab and send it with that request to an OpenRouter vision model. The image is not stored in your My Helper profile or learning progress. My Helper does not keep a separate copy after the request is completed, although OpenRouter processes the request according to its own service terms and privacy practices.

## Voice

My Helper first uses voices installed on your device. If a suitable device voice is unavailable and cloud voice is configured, the text you choose to hear may be sent to OpenAI's `tts-1` speech service to generate audio. Voice questions are sent to the My Helper coach server only after you choose to speak or submit a voice request.

## Service providers

My Helper uses the OpenRouter API with the `openai/gpt-5.4-mini` model for requested AI coaching, explanations, interface translations, and guided learning. This model is accessed through OpenRouter, not directly through the OpenAI API.

My Helper uses Supabase for Google sign-in, account records, synchronization, support requests, and account deletion. The My Helper coach server is hosted on Render. When cloud speech is needed and configured, My Helper uses OpenAI's `tts-1` speech service. Resend is used to deliver support-ticket notifications and confirmation emails for support messages you choose to submit.

These providers process information only as needed to provide their part of the My Helper service and under their applicable terms and privacy practices.

## Data sharing and retention

My Helper does not sell personal data or use it for advertising. It does not use or transfer user data for purposes unrelated to My Helper's coaching and learning features, and it does not use user data to determine creditworthiness or for lending purposes.

Local preferences remain until you remove the extension or clear its extension data. Synchronized account information, progress, achievements, and support records remain until you permanently delete your My Helper account or the information is no longer needed to operate the service. Support messages are rate-limited to help protect the service from abuse.

## Your choices and account deletion

You can manage preferences in My Helper settings, remove the extension, clear extension storage, or permanently delete your My Helper account after signing in. Deleting your My Helper account deletes its Supabase sign-in record and synchronized My Helper data. It does not delete your Google account or information retained independently by service providers under their own obligations.

## Security

My Helper uses HTTPS for network requests. Private provider keys are kept on the server and are not included in the Chrome extension package.

## Changes to this policy

We may update this policy when My Helper's data practices change. The current version will always be available at the privacy-policy link in the Chrome Web Store listing.
