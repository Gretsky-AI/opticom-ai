# OptiCom - AI Agent Communication Platform 🤖

OptiCom is an advanced AI agent management system that orchestrates intelligent conversations between different types of AI agents. It leverages the power of large language models to create dynamic, goal-oriented interactions between specialized AI agents.

## Features 🌟

### Intelligent Agent Types
- **Learning Agents** 📚: Adaptive AI that grows from interactions, analyzes patterns, and evolves their knowledge base
- **Assistant Agents** 💼: Task-focused AI specializing in specific operations and process optimization
- **Specialist Agents** 🎯: Expert AI with deep domain knowledge in particular fields

### Advanced Conversation Management
- Create multi-agent conversations with specific goals and contexts
- Real-time monitoring of conversation progress
- Dynamic goal achievement tracking
- Contextual environment simulation
- Automatic conversation state management (active, paused, completed)

### AI Analytics & Insights
- Detailed conversation analytics
- Agent performance metrics
- Interaction pattern analysis
- Goal achievement statistics
- Communication effectiveness tracking

### Smart Features
- Automatic personality adaptation based on agent type
- Context-aware responses
- Goal-oriented conversation steering
- Environment-sensitive interactions
- Multi-participant conversation orchestration

## Project Structure 📁

```
src/
├── config/           # Configuration and environment setup
├── data/
│   └── repositories/ # Data persistence layer implementations
├── database/
│   └── entities/     # Database entity definitions
├── domain/
│   └── models/       # Core business logic and data models
├── menu/
│   └── submenus/     # UI menu system components
├── services/         # Business logic and service layer
│   ├── agentService.ts        # Agent management logic
│   ├── conversationService.ts # Conversation handling
│   └── openaiService.ts      # AI integration
├── types/            # TypeScript type definitions
└── utils/            # Utility functions and helpers
```

## Getting Started 🚀

### Prerequisites

1. Node.js Installation
   ```bash
   # For macOS using Homebrew
   brew install node

   # For Windows using Chocolatey
   choco install nodejs

   # For Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Verify Installation
   ```bash
   node --version
   npm --version
   ```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/opticom.git
   cd opticom
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Running the Application

1. Start in development mode
   ```bash
   npm run dev
   ```

2. Start in production mode
   ```bash
   npm run build
   npm start
   OR
   npm run start:prod
   ```

### Quick Start Guide

1. Launch the application
2. Use the "Add Sandbox Data" option to create example agents and conversations
3. Explore the agent management and conversation features
4. Monitor interactions through the AI logs
5. View system statistics to analyze performance

### Sandbox Environment 🎮

The sandbox feature provides pre-configured agents and conversations to demonstrate the system's capabilities. Here's what gets created:

#### Available Agents

1. **Sophia** (Learning Agent) 🧠
   - Curious and adaptive AI that absorbs knowledge to tackle any challenge
   - Excels at pattern recognition and knowledge synthesis
   - Perfect for exploratory discussions and brainstorming

2. **Maxwell** (Assistant Agent) 📋
   - Organized and reliable task manager
   - Specializes in streamlining daily operations
   - Excellent at process optimization and workflow management

3. **Iris** (Specialist Agent) 🎨
   - Creative problem solver focused on design and UX
   - Deep expertise in user experience principles
   - Brings aesthetic and functional perspectives to discussions

4. **Aria** (Learning Agent) 📊
   - Data-driven decision maker
   - Specializes in pattern analysis and trend identification
   - Thrives on making informed, analytical choices

5. **Leo** (Assistant Agent) ⏰
   - Scheduling and reminder specialist
   - Manages time-sensitive tasks efficiently
   - Expert at coordination and time management

6. **Vera** (Specialist Agent) 🔒
   - Cybersecurity expert
   - Focuses on data protection and threat prevention
   - Ensures secure and compliant solutions

7. **Eli** (Learning Agent) 📚
   - Perpetual learner with broad knowledge interests
   - Adapts and expands expertise continuously
   - Excellent at connecting different domains of knowledge

#### Sample Conversations

1. **Design Dilemma**
   - **Participants**: Iris (UX Specialist) & Maxwell (Assistant)
   - **Topic**: User-friendly dashboard interface design
   - **Goal**: Balance functionality with aesthetic appeal
   - **Setting**: Virtual meeting room with shared interactive whiteboard
   - **Purpose**: Demonstrates collaboration between design expertise and practical implementation

2. **Cybersecurity Framework**
   - **Participants**: Vera (Security Specialist), Sophia (Learner), & Leo (Assistant)
   - **Topic**: Data security and access control
   - **Goal**: Create comprehensive security plan
   - **Setting**: High-tech conference room with real-time data displays
   - **Purpose**: Shows how different agent types approach security challenges:
     - Vera provides expert security guidance
     - Sophia learns and adapts security concepts
     - Leo helps implement practical security measures

These sandbox conversations showcase:
- Multi-agent collaboration
- Different agent type interactions
- Goal-oriented discussions
- Real-world problem-solving scenarios
- Various communication styles and approaches

## Environment Requirements 🔧

- Node.js >= 16.x
- TypeScript >= 4.x
- OpenAI API key
- SQLite (included) or other compatible database

## Note 📝

This project requires an OpenAI API key to function properly. The AI agents' communication capabilities depend on access to OpenAI's language models. Make sure to keep your API key secure and never commit it to version control. 