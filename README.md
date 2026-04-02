# HireGeniX - Admin Portal

React-based admin frontend for the HireGeniX platform. Provides administrators with tools to manage users, approve/reject recruiters, manage industries and skills, and monitor platform activity.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: react-router-dom v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Toastify

## Prerequisites

- Node.js >= 18
- npm or yarn
- Backend API running (see backend repo)

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/Ochieng2000/adminhiregenix.git
   cd adminhiregenix
   npm install
   ```

2. **Configure environment**

   Create a `.env` file in the project root:
   ```
   VITE_BASE_URL=http://localhost:6565/api/v1
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Opens on `http://localhost:5173` by default. If other portals are running, Vite auto-assigns the next port (5174 or 5175).

4. **Build for production**
   ```bash
   npm run build
   ```

## User Manual

### Login

1. Navigate to the admin portal URL
2. Log in with your admin credentials (email + password)
3. Admin accounts are created directly in the database with the ADMIN role
4. After login, you are redirected to the admin dashboard

> **Note**: There is no public registration for admin accounts. Admins are provisioned by a system administrator.

### Dashboard

The **Dashboard** provides a real-time overview of the platform:

**User Stats:**
- **Total Users** count
- **Total Recruiters** count (approved and pending)
- **Total Job Seekers** count

**Platform Stats** (loaded from the dedicated `/admin/stats` endpoint for fast counting):
- **Total Industries** - active flattened industries (priority=1) in the system (currently 7,366)
- **Total Skills** - skills available for matching (currently 4,773)
- **Total Jobs** - all job postings (currently 10,036)
- **Skill Mappings** - flattened industry-to-skill associations (priority=1 industries only, currently 1.38M)

- Visual charts showing user growth and distribution

All stats are fetched live from the API.

**Subscription Expiry:**
- The backend automatically marks expired subscriptions (trial and paid) as EXPIRED via an hourly cron job
- This ensures admin stats and user listings reflect accurate subscription statuses
- On server startup, any subscriptions that expired while the server was down are immediately cleaned up

### User Management

Navigate to **Users** from the sidebar. This is the primary admin tool.

**Tabs:**
- **All Users** - Browse all registered users with search and filters
- **Pending Recruiters** - View recruiters awaiting approval

**Searching & Filtering:**
- Search by name or email
- Filter by role (Job Seeker, Recruiter, Admin)
- Filter by status (Active, Suspended)
- Paginated results

**Viewing User Details:**
- Click on any user to expand their details
- See: name, email, phone, roles, registration date
- For recruiters: company name, website, approval status, status logs

**Approving Recruiters:**

1. Go to the **Pending Recruiters** tab
2. Click on a pending recruiter to view their details and company info
3. Click **Approve** to activate their account
4. Optionally add an approval reason
5. This sets their status to ACTIVE and verifies their company

**Rejecting Recruiters:**

1. Click **Reject** on a pending recruiter
2. Enter a rejection reason (required for audit trail)
3. Confirm the rejection
4. This sets their status to DEACTIVATED with the reason logged

**Suspending Users:**

1. Click the suspend icon on any active user
2. Confirm the suspension
3. The user loses access to the platform immediately
4. Their `isActive` flag is set to `false`

**Reactivating Users:**

1. Click the reactivate icon on any suspended user
2. Confirm reactivation
3. The user regains access

**Edit & Delete Users:**
- Edit user details (name, email) via Edit button
- Delete users with confirmation

**Recruiter Jobs:**
- When clicking the eye icon on a recruiter, the detail modal now shows a "Posted Jobs" section listing all their jobs with status badges, applicant counts, and action buttons (Publish, Suspend, Close, Delete)

> **Safety**: You cannot suspend your own admin account.

### Industry Management

Navigate to **Industries** from the sidebar.

**Viewing Industries:**
- Server-side paginated list (20 per page) with total count from the stats API
- Each industry shows its name, slug, and skill count badge
- **Search** industries by name (server-side, debounced) - filters across all 7,366 industries instantly
- **Pagination** controls at the bottom to navigate through pages

**Creating an Industry:**
1. Click **Add Industry**
2. Enter the industry name (e.g., "Information Technology")
3. The slug is auto-generated (e.g., "information-technology")
4. Save

**Adding Skills to an Industry:**
1. Click on an industry to expand it
2. Click **Add Skills**
3. Search and select skills from a searchable modal (skills are loaded on demand)
4. Save the association

### Skill Management

Navigate to **Skills** from the sidebar.

**Viewing Skills:**
- Server-side paginated list (20 per page) with total count from the stats API
- Each skill shows its name and associated industry count badge
- **Search** skills by name (server-side, debounced) - filters across all 4,773 skills
- **Filter by Industry** - dropdown to show only skills belonging to a specific industry
- **Pagination** controls at the bottom to navigate through pages

**Creating a Skill:**
1. Click **Add Skill**
2. Enter the skill name (e.g., "React", "Project Management")
3. Search and select industries from a searchable modal
4. Save

**Deleting a Skill:**
1. Click the delete icon on any skill
2. Confirm the deletion in the modal
3. The skill is permanently removed from the system

Skills created here become available to:
- Job seekers (for their profiles and AI CV Builder)
- Recruiters (for job posting requirements)
- The AI matching engine (for candidate ranking)
- The CV extraction engine (for industry-agnostic skill detection)

> **Tip**: Create skills across all industries the platform serves. The backend CV extractor automatically recognizes certifications and skills from tech, healthcare, legal, finance, construction, hospitality, education, HR, marketing, logistics, and more.

### Job Management

Navigate to **Job Management** from the sidebar.

**Stats Cards:** Total Jobs, Published, Draft, Closed, Suspended, Applications

**Search & Filters:**
- Search by job title, company name, recruiter name, or recruiter email
- Filter by status (Published, Draft, Closed, Suspended)
- Filter by industry or recruiter
- Paginated results (20 per page)

**Job Details:** Click any job to view full details including description, requirements, salary, company, recruiter info, and application status breakdown.

**Actions per job:**
- View details (eye icon)
- Edit job fields (title, description, status, salary, etc.)
- Suspend/unsuspend a job
- Delete a job (with confirmation)

**Bulk Actions:**
- Delete All Closed Jobs — removes all closed jobs and their related records (applications, saves, rankings)

**Recruiter Jobs in User Management:**
- When viewing a recruiter's details in User Management, their posted jobs are displayed
- Admin can Publish, Suspend, Close, or Delete any recruiter's job directly from the user detail modal

### Profile

Navigate to **Profile** from the sidebar:
- View your admin account information (name, email)
- Information is read from your session data

### Messaging

Navigate to **Messages** from the sidebar to communicate with job seekers and recruiters.

**Admin Messaging Privileges:**
- Admins can initiate conversations with **both** job seekers and recruiters
- Admin messages bypass contact info filtering — emails and phone numbers are not stripped
- Role filter buttons (All / Job Seekers / Recruiters) help narrow user search when starting a new conversation

**Starting a Conversation:**
1. Click the **New Conversation** button
2. Use the role filter to narrow by user type
3. Search by name or email
4. Click a user to open or create a conversation

**Chat Features:**
- Real-time messaging via WebSocket (Socket.io)
- Typing indicators and read receipts
- Unread message count badges
- Conversation list sorted by most recent activity
- Mobile responsive layout

### Payment Management

Navigate to **Payment Management** from the sidebar to monitor all platform payment activity.

**Transactions Tab:**
- View all payment transactions across the platform (paginated, 20 per page)
- Each transaction shows: user, amount, status, date, payment method
- Filter and search through transaction history

**Generate Link Tab:**
- Create payment links for users who need to subscribe manually
- Select a user and subscription plan
- Generate a payment URL that can be shared with the user

### Testimonial Management

Navigate to **Testimonials** from the sidebar.
- View all user-submitted testimonials
- Approve or reject testimonials (approved ones appear on the public site)
- Delete testimonials
- Filter by status

### Lead Management

Navigate to **Lead Captures** from the sidebar.
- View all lead capture form submissions
- Each lead shows: name, email, phone, CV, submission date
- **Status column** shows time-based labels: New (last 6hrs), Today (last 24hrs), This Week, Last Week, This Month, Last Month, This Year, Last Year, Older
- Download lead's CV
- Mark leads as reviewed
- Delete leads
- Paginated with search

### Subscription Management

Navigate to **Subscriptions** from the sidebar.
- **User Plans tab:** Browse all users with pagination (10 per page), search by name/email, view subscription status
- Click a user to view/change their subscription plan
- **Recruiter Plans tab:** View and manage Diamond subscription plans
- Edit plan details: name, amount, billing interval (monthly/yearly), features
- Create new subscription plans

### Security Settings

Navigate to **Security** from the sidebar:
- **Change Password** - update your admin password (requires current password)
- **Two-Factor Authentication (2FA)** - enable/disable TOTP-based 2FA with authenticator app
  - Scan QR code with Google Authenticator, Authy, or similar
  - Enter the 6-digit code to verify and enable 2FA
  - 2FA adds an extra verification step on login

### Notification Badge

- The **bell icon** in the navbar shows the count of unread messages
- Click the bell to navigate directly to the Messages page
- Unread count updates automatically every 15 seconds

### Navigation & Sign Out

The **Sidebar** provides quick access to:
- Dashboard
- Users
- Industries
- Skills
- Job Management
- Messages
- Payment Management
- Testimonials
- Lead Captures
- Subscriptions
- Profile
- Security
- **Sign Out** - clears your session and redirects to login

### Theme

- Toggle between **Light** and **Dark** mode from the navbar

## Deployment

### Docker
```bash
docker build -t adminhiregenix .
docker run -p 80:80 adminhiregenix
```

### Vercel
Includes `vercel.json` for SPA routing. Deploy directly from GitHub.

### Manual
```bash
npm run build
# Serve dist/ with nginx, Apache, or any static server
```

## Project Structure

```
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, logos
│   ├── auth/            # Login, ProtectedRoute
│   ├── components/
│   │   ├── DashboardOverview.jsx  # Platform stats dashboard
│   │   ├── Users.jsx              # User management (approve/reject/suspend)
│   │   ├── Industries.jsx         # Industry CRUD
│   │   ├── Skills.jsx             # Skill CRUD
│   │   ├── Profile.jsx            # Admin profile view
│   │   ├── Messaging.jsx           # In-app messaging with all users
│   │   ├── JobManagement.jsx      # Job listing, details, edit, suspend, delete
│   │   ├── PaymentManagement.jsx  # Transaction history + payment link generation
│   │   ├── TestimonialManagement.jsx  # Approve/reject/delete testimonials
│   │   ├── LeadManagement.jsx     # Lead capture submissions, CV download, review
│   │   ├── SubscriptionManagement.jsx # User/recruiter plan management
│   │   ├── SecuritySettings.jsx   # Password change + 2FA setup
│   │   ├── CookieConsent.jsx      # Cookie consent banner
│   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   ├── NavBar.jsx             # Top navigation bar (with notification badge)
│   │   ├── Modal.jsx              # Reusable modal component
│   │   └── Pagination.jsx         # Reusable pagination
│   ├── layouts/         # Dashboard & public layouts
│   ├── pages/           # Page-level components
│   ├── themes/          # Theme context (dark/light)
│   ├── utilities/       # Toast helpers
│   ├── App.jsx          # Route definitions
│   ├── BaseUrl.jsx      # API base URL config
│   └── main.jsx         # Entry point
├── dist/                # Production build output
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── vercel.json
```
