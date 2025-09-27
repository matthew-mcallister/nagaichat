<p align="center">
  <img src="/nagai.svg" height="200">
</p>

## NagaiChat

NagaiChat is a multimodal, multi-model LLM chat UI. It provides a similar user
experience to Google AI Studio or ChatGPT, but it supports a several inference
APIs powered by your API keys. NagaiChat is designed to support multiple use
cases, such as conversation, fiction, coding, and image editing.

### Features

- Integrations with multiple APIs and models (including all OpenAI-compatible
  APIs).
- Presets for quickly switching between use cases or personalities
- Conversation editing and branching
- Markdown formatting
- Image input and output

### Running

#### Production

```bash
npm i
npm run build && npm run start
```

#### Development

```bash
npm i
npm run start
```

### TODO features

- Code highlighting (easy)
- Image gallery (easy)
- Audio output (easy)
- Audio input (medium)
- Response streaming (harder)
- Postgres support (harder)
- Multitenancy/security (hard)
- Finetuning (hard)

### Legal disclaimer

By using NagaiChat, you acknowledge that the developers will not be liable for
any material consequences of your interactions with third parties, in particular
your interactions with AI software vendors through their APIs. You are
responsible for any action taken against you as a result of your interactions,
including but not limited to suspension or termination of accounts, civil suit,
or criminal liability.

tl;dr: It is your responsibility to comply with third parties' terms of service
and local law in your jurisdiction. Please chat responsibly!
