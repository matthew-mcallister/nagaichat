<p align="center">
  <img src="/nagai.svg" height="200">
</p>

## NagaiChat

NagaiChat is a multimodal, multi-model LLM chat UI. It provides a similar user
experience to Google AI Studio or ChatGPT, but it supports a several inference
APIs powered by your API keys. NagaiChat is designed to support multiple use
cases, such as conversation, fiction, coding, and image editing.

The name was inspired by Japanese artist Hiroshi Nagai.

### Features

- Integrations with multiple APIs and models (including all OpenAI-compatible
  APIs).
- Presets for quickly switching between use cases or personalities
- Conversation editing and branching
- Conversation tree view
- Markdown formatting
- Image input and output

### Starting the server

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

### Usage

To use NagaiChat, start the server and visit http://localhost:3000.

#### Adding an integration

Before you can start chatting, you'll have to input a key for the API that you
want to use. If you've never used an API before, you can get a free API key
from [Google AI studio](https://aistudio.google.com) as of October 2025.

Once you've obtained an API key, you'll have to visit the _Integrations_ page
in NagaiChat and click _Add integration_. To create an integration, you not
only need to paste in your API key, you also must choose the correct
_interface_ for the API you are using and, sometimes, the correct _base
URL_
from the API's documentation.

Here's a rundown of the currently implemented interfaces:

- **OpenAI**: Supports both OpenAI/GPT as well as any API that advertises
  itself as "OpenAI-compatible". APIs that offer OpenAI compatibility include
  Claude, DeepSeek, and Qwen. If the base URL is left blank, OpenAI will be
  used. Note that OpenAI itself lacks support for some features, such as image
  generation or disabling thinking.
- **DeepSeek/Qwen**: A modified version of the OpenAI interface that supports
  DeepSeek and Qwen's extensions to OpenAI's API. The correct base URL must be
  specified.
- **Gemini**: Google's Gemini API. Supports the broadest set of features at the
  moment. Use Nano Banana for image generation.

### TODO features

- Code highlighting (easy)
- Image gallery (easy)
- Audio input/output (medium)
- Response streaming (harder)
- Postgres support (harder)
- User accounts/security (hard)
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
