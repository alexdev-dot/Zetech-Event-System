# Zetech Events Hub

A comprehensive campus events management platform for Zetech University, built with modern web technologies to help students discover, register, and attend campus events.

## 🚀 Features

- **Event Discovery**: Browse and search through upcoming campus events
- **Event Registration**: Easy registration system for students
- **Event Management**: Admin panel for event organizers
- **Real-time Updates**: Live event updates and notifications
- **Responsive Design**: Mobile-first approach for all devices
- **User Authentication**: Secure login and registration system
- **Social Integration**: WhatsApp sharing and social media connectivity
- **Interactive UI**: Modern components with smooth animations
- **Data Visualization**: Analytics dashboard with charts
- **Form Validation**: Robust form handling with Zod schema validation

## 🛠️ Technologies Used

### Core Framework

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm/Bun

### UI & Styling

- **Styling**: Tailwind CSS with custom theme
- **UI Components**: shadcn/ui (Radix UI based)
- **Icons**: Lucide React & React Icons
- **Animations**: Tailwind CSS Animate
- **Typography**: Tailwind CSS Typography plugin

### State Management & Data

- **State Management**: React Query (TanStack Query)
- **Server State**: Supabase client
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query with caching

### Routing & Navigation

- **Routing**: React Router DOM v6
- **Navigation**: Radix UI Navigation Menu

### UI Components & Interactions

- **Dialogs**: Radix UI Dialog & Alert Dialog
- **Forms**: Radix UI components (Label, Checkbox, Radio Group, Select)
- **Navigation**: Radix UI Navigation Menu, Menubar, Tabs
- **Feedback**: Radix UI Toast, Progress, Alert
- **Layout**: Radix UI Accordion, Collapsible, Separator
- **Input**: Radix UI Slider, Switch, Toggle
- **Display**: Radix UI Avatar, Aspect Ratio, Hover Card
- **Utilities**: Class Variance Authority, clsx, tailwind-merge

### Data Visualization

- **Charts**: Recharts
- **Date Handling**: date-fns
- **Calendar**: React Day Picker

### Development

- **Linting**: ESLint with React plugins
- **Type Checking**: TypeScript
- **Build Tools**: Vite with SWC compilation

### Database & Backend

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions

### Additional Libraries

- **Carousels**: Embla Carousel React
- **Command Palette**: cmdk
- **Themes**: next-themes for dark mode
- **Notifications**: Sonner for toast notifications
- **Modals**: Vaul for drawer modals
- **Input**: input-otp for OTP inputs
- **Resizable**: react-resizable-panels

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm, yarn, or bun package manager
- Git for version control

## 🚀 Getting Started

Follow these steps to set up the project locally:

1. **Clone the repository**

   ```bash
   git clone <your-repository-url>
   cd zetech-event-hub-main
   ```

2. **Install dependencies**

   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install

   # Using bun
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase configuration
   ```

   Required environment variables:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key
   ```

4. **Start the development server**

   ```bash
   # Using npm
   npm run dev

   # Using yarn
   yarn dev

   # Using bun
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

## 📁 Project Structure

```
zetech-event-hub-main/
├── public/                 # Static assets and icons
│   ├── assets/            # Images, logos, and static files
│   ├── favicon.ico        # Site favicon
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── icons/        # Custom icon components
│   │   ├── EventCard.tsx # Event card component
│   │   ├── HeroSection.tsx # Hero section
│   │   ├── Layout.tsx    # Main layout component
│   │   └── ...           # Other components
│   ├── pages/            # Page components
│   │   ├── Events.tsx    # Events listing page
│   │   ├── Dashboard.tsx # Admin dashboard
│   │   ├── Profile.tsx   # User profile
│   │   └── ...           # Other pages
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.tsx   # Authentication hook
│   │   ├── use-mobile.tsx # Mobile detection
│   │   └── use-toast.ts  # Toast notifications
│   ├── lib/              # Utility functions and configurations
│   │   └── supabase.ts   # Supabase client configuration
│   ├── data/             # Static data and mock data
│   │   └── events.ts     # Sample events data
│   ├── integrations/     # Third-party integrations
│   ├── test/             # (removed) Test files and utilities
│   ├── assets/           # React assets (images, etc.)
│   ├── App.tsx           # Main App component
│   ├── main.tsx          # Application entry point
│   ├── App.css           # App-specific styles
│   └── index.css         # Global styles
├── supabase/             # Database migrations and config
│   ├── migrations/       # SQL migration files
│   └── config.toml       # Supabase configuration
├── .env                  # Environment variables (gitignored)
├── .gitignore           # Git ignore rules
├── package.json         # Project dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── components.json      # shadcn/ui configuration
└── README.md            # This file
```

## 🛠️ Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run preview` - Preview production build locally

### Quality Assurance

- `npm run lint` - Run ESLint for code quality checks

## 🎨 Customization

### Theming

The application uses Tailwind CSS with a custom dark theme. You can modify the theme in `tailwind.config.ts`:

```typescript
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        // ... more color definitions
      },
    },
  },
};
```

### Components

UI components are built using shadcn/ui. You can find components in the `src/components/ui` directory. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Environment Variables

Key environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Update navigation in `src/components/Layout.tsx`

### Database Schema

Database migrations are stored in the `supabase/migrations/` directory. To create new migrations:

```sql
-- Create your SQL migration file
-- Example: supabase/migrations/20240101000000_create_events_table.sql
```

## 🚀 Deployment

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Deploying to Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

### Deploying to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables in Netlify dashboard

### Deploying to Railway/Render

1. Connect your repository
2. Set build command: `npm run build`
3. Set start command: `npm run preview` or use static site deployment
4. Configure environment variables

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**

   ```bash
   git fork https://github.com/your-username/zetech-event-hub.git
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/your-username/zetech-event-hub.git
   cd zetech-event-hub
   ```

3. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Follow the existing code style
   - Update documentation as needed

5. **Run linting**

   ```bash
   npm run lint
   ```

6. **Commit your changes**

   ```bash
   git commit -m 'feat: add amazing feature'
   ```

7. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open a Pull Request**
   - Provide a clear description of your changes
   - Link any relevant issues
   - Ensure CI checks pass

### Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add proper error handling

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation**
   - Review this README file
   - Check component documentation in `src/components/ui/`

2. **Search existing issues**
   - Check the [Issues](../../issues) page for similar problems
   - Look for closed issues that might have solutions

3. **Create a new issue**
   - Use the provided issue templates
   - Include detailed information about your environment
   - Provide steps to reproduce the issue
   - Include relevant error messages and screenshots

4. **Contact the development team**
   - Email: support@zetech.ac.ke
   - Discord: [Zetech Dev Community](https://discord.gg/zetech)

## 🎯 Roadmap

### Current Development

- [x] Basic event discovery and registration
- [x] User authentication with Supabase
- [x] Responsive design with Tailwind CSS
- [x] Admin dashboard for event management
- [x] Social media integration (WhatsApp sharing)

### Upcoming Features (Q1 2024)

- [ ] **Mobile App Development**
  - React Native app for iOS and Android
  - Push notifications for event reminders
  - Offline event browsing

- [ ] **Advanced Analytics Dashboard**
  - Event attendance tracking
  - User engagement metrics
  - Revenue and performance analytics
  - Export reports (PDF, Excel)

- [ ] **Event Ticketing System**
  - Integrated payment processing
  - QR code ticket generation
  - Tiered pricing and early bird discounts
  - Refund management

### Future Enhancements (Q2-Q3 2024)

- [ ] **Student Information System Integration**
  - Automatic student verification
  - Academic calendar integration
  - Course-related event recommendations

- [ ] **Push Notifications**
  - Event reminders and updates
  - Personalized recommendations
  - Emergency announcements

- [ ] **AI-Powered Features**
  - Smart event recommendations
  - Automated event categorization
  - Chatbot for event assistance

- [ ] **Advanced Collaboration Tools**
  - Event planning workspaces
  - Team registration management
  - Volunteer coordination system

### Long-term Vision (2024+)

- [ ] Multi-campus support
- [ ] Event livestreaming capabilities
- [ ] Sponsor and vendor management
- [ ] Advanced networking features
- [ ] Integration with external calendar systems

## 🏆 Acknowledgments

- **Zetech University** for supporting this initiative
- **Supabase** for the generous open-source plan
- **shadcn/ui** for the excellent component library
- **Vercel** for hosting and deployment support
- **Contributors** who help improve this platform

---

Built with ❤️ for Zetech University students by the Campus Tech Team
