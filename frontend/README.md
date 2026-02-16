# Nexus Protocol

> "The system is never secure. It's just waiting for the right key."

**Nexus Protocol** is an immersive, real-time multiplayer cyber-heist experience. Players form teams, assign specialized roles (Hacker, Infiltrator, Analyst), and collaborate to breach secure systems, retrieve data shards, and complete high-stakes missions.

## 🚀 Features

- **Real-Time Multiplication**: Built on top of [Supabase Realtime](https://supabase.com/docs/guides/realtime) for instant state synchronization between team members.
- **Role-Based Gameplay**:
  - **👨‍💻 Hacker**: Breaches firewalls and decrypts nodes.
  - **🕵️ Infiltrator**: Navigates physical/digital spaces to retrieve assets.
  - **📊 Analyst**: Monitors security feeds and coordinates the team.
- **Cinematic Experience**:
  - Custom "Trailer" intro sequence.
  - High-fidelity animations using [GSAP](https://gsap.com/).
  - Smooth scrolling and polished UI with [Lenis](https://lenis.studiofreight.com/).
- **Modern Tech Stack**: Built with the latest web technologies for performance and scale.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Realtime**: [Supabase](https://supabase.com/)
- **Animations**: [GSAP](https://gsap.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: ESLint

## 📂 Project Structure

```bash
nexus-protocol/
├── src/
│   ├── components/       # Shared UI components (Trailer, etc.)
│   ├── context/          # Global state (MultiplayerContext)
│   ├── features/         # Feature-specific modules
│   │   ├── Onboarding/   # Lobby & Team Creation
│   │   └── Mission/      # Core Gameplay UI
│   ├── lib/              # Utilities (Supabase client, GSAP config)
│   ├── App.tsx           # Main application shell
│   └── main.tsx          # Entry point
├── supabase/             # Database schemas and config
└── public/               # Static assets
```

## ⚡ Deployment & Setup

### Prerequisites

- Node.js (v18+)
- npm / yarn / bun
- A Supabase project (for the backend)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/nexus-protocol.git
    cd nexus-protocol
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    Run the SQL scripts located in `supabase/schema.sql` in your Supabase SQL Editor to set up the necessary tables (`teams`, `users`, `progress`, `live_activity`).

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🎮 How to Play

1.  **Enter the Protocol**: Watch the briefing trailer.
2.  **Lobby**:
    - **Create Team**: Generate a unique team code.
    - **Join Team**: Enter an existing code to join your squad.
3.  **Select Role**: Choose your specialization (Hacker, Infiltrator, Analyst).
4.  **Execute Mission**: Collaborate in real-time to complete objectives.

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
