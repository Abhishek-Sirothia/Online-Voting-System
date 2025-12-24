SecureVote | Biometric Online Voting System
SecureVote is a secure, full-stack online voting platform designed to ensure the integrity of elections through advanced facial recognition technology and real-time analytics. Built with React, TypeScript, and Supabase, it provides a seamless experience for voters while offering robust management tools for administrators.

🚀 Key Features
For Voters
Biometric Identity Verification: Secure face registration and verification using live camera capture to prevent fraud.

Encrypted Balloting: Ensures ballot secrecy and anonymity.

User-Friendly Interface: Responsive design enabling voting from mobile or desktop devices.

Real-time Confirmation: Verified receipt generation after casting a vote.

Multi-language Support: Accessible interface with internationalization support.

For Administrators
Comprehensive Dashboard: Manage elections, candidates, and voters from a central hub.

Live Analytics: Visualize voter turnout and results in real-time using interactive charts.

Audit Logs: Track all administrative actions and system events for transparency.

Candidate Management: Add and update candidate profiles and manifestos.

🛠️ Tech Stack
Frontend
Framework: React (via Vite)

Language: TypeScript

Styling: Tailwind CSS

UI Components: Shadcn/ui (Radix UI)

Icons: Lucide React

Charts: Recharts for analytics

State Management: TanStack Query (React Query)

Forms: React Hook Form + Zod validation

Backend & Services
BaaS (Backend as a Service): Supabase

Authentication: User management and secure sessions.

Database: PostgreSQL for storing election data.

Storage: Storing candidate images and biometric data.

Real-time: Subscriptions for live updates.

⚙️ Installation & Setup
Follow these steps to set up the project locally.

Prerequisites
Node.js (v18 or higher)

npm or yarn

A Supabase account

1. Clone the Repository
Bash

git clone https://github.com/Abhishek-Sirothia/Online-Voting-System.git
cd secure-vote

2. Install Dependencies
Bash

npm install
# or
yarn install

3. Environment Configuration
Create a .env file in the root directory and add your Supabase credentials:

Code snippet

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Database Setup
Ensure your Supabase project is set up with the required tables (profiles, face_data, elections, votes, etc.). You may need to run the SQL migration scripts located in the supabase/migrations folder.

5. Run the Application
Bash

npm run dev
The application will start at http://localhost:8080 (or the port shown in your terminal).

📂 Project Structure
Bash

src/
├── components/        # Reusable UI components (buttons, cards, etc.)
│   └── ui/           # Shadcn UI primitives
├── hooks/             # Custom React hooks (use-toast, use-mobile)
├── integrations/      # Third-party integrations (Supabase client)
├── pages/             # Application views
│   ├── admin/        # Admin dashboard, analytics, management pages
│   ├── Landing.tsx   # Home/Landing page
│   ├── FaceRegistration.tsx # Biometric capture logic
│   └── ...           # Auth, Vote, Results pages
├── lib/               # Utility functions
└── App.tsx            # Main routing configuration
🔒 Security Measures
Role-Based Access Control (RBAC): Distinct access levels for Voters and Administrators.

Face Recognition: Utilizes browser MediaStream API to capture and verify voter identity against stored profiles.

Row Level Security (RLS): Supabase RLS policies ensure users can only access data permitted by their role.

🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.

Create a feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📄 License
Distributed under the MIT License. See LICENSE for more information.
