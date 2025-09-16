# Kavra Bot

A modern AI-powered chatbot built with Next.js, LangGraph, and GPT-4o-mini. Features real-time streaming conversations, persistent chat history, and a beautiful user interface.

## Features

- **LangGraph Backend**: Pure LangGraph workflow engine with GPT-4o-mini
- **Real-time Chat**: Streaming AI responses with Server-Sent Events
- **Authentication**: Secure user authentication with NextAuth.js
- **Chat History**: Persistent chat history with PostgreSQL
- **Modern UI**: Clean interface built with shadcn/ui and Tailwind CSS
- **Responsive Design**: Mobile-first design with dark/light theme support
- **State Management**: Advanced workflow state management with LangGraph

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: LangGraph, OpenAI GPT-4o-mini
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS, shadcn/ui
- **Deployment**: Vercel (recommended)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/burak5198/kavra_bot.git
cd kavra_bot
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment setup**
Create a `.env.local` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
AUTH_SECRET=your_random_secret_string
POSTGRES_URL=your_postgresql_connection_string
NEXTAUTH_URL=http://localhost:3000
```

4. **Database setup**
```bash
pnpm db:migrate
```

5. **Start development server**
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to start chatting!


## LangGraph Integration

The bot uses a custom LangGraph workflow with these nodes:

1. **process_input** - Processes user input and prepares context
2. **analyze_intent** - Analyzes user intent and determines response strategy
3. **use_tools** - Executes any necessary tools or functions
4. **generate_response** - Generates the final AI response using GPT-4o-mini

### Workflow Files

- `lib/langgraph/workflow.ts` - Main workflow definition
- `lib/langgraph/nodes.ts` - Individual node implementations
- `lib/langgraph/config.ts` - OpenAI model configuration
- `lib/langgraph/state.ts` - Workflow state management

## Configuration

### OpenAI Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file as `OPENAI_API_KEY`

### Database Setup

**Option 1: Local PostgreSQL**
```bash
createdb kavra_bot
```

**Option 2: Cloud Database (Recommended)**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Railway](https://railway.app) - Database hosting

## Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
```bash
npx vercel
```

2. **Set Environment Variables**
```bash
vercel env add OPENAI_API_KEY
vercel env add AUTH_SECRET
vercel env add POSTGRES_URL
```

3. **Deploy**
```bash
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Customization

### Branding

Update the following files to customize your bot:

- `app/layout.tsx` - Browser title and meta description
- `components/app-sidebar.tsx` - Sidebar branding
- `components/chat-header.tsx` - Header customization

### Model Configuration

Modify `lib/ai/models.ts` to change available models:

```typescript
export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini-chat',
    name: 'GPT-4o Mini Chat',
    description: 'Your custom description here',
  },
];
```

### Workflow Customization

Edit `lib/langgraph/nodes.ts` to customize the AI behavior:

```typescript
export async function generateResponse(state: WorkflowState): Promise<Partial<WorkflowState>> {
  // Your custom AI logic here
}
```

## Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open database studio

# Testing
pnpm test         # Run tests
pnpm test:e2e     # Run end-to-end tests
```

## Monitoring

### LangGraph Monitoring

Monitor your LangGraph workflows:

1. Check API logs in your deployment platform
2. Monitor database for chat history and user activity
3. Track OpenAI usage in the OpenAI dashboard

### Performance Metrics

- Response time monitoring
- Token usage tracking
- User engagement metrics
- Error rate monitoring

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [LangGraph](https://langchain-ai.github.io/langgraph/) - Workflow orchestration
- [OpenAI](https://openai.com) - AI model provider
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Vercel AI SDK](https://ai-sdk.dev) - AI integration

---

Built with ❤️ using Next.js, LangGraph, and GPT-4o-mini
