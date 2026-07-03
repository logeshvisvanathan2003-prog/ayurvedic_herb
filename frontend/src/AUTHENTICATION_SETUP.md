# Authentication System Setup

## Overview
A complete authentication system has been implemented with role-based access control for Farmer, Consumer, Laboratory, and Admin users.

## Features Implemented

### 1. Authentication Store (Zustand)
- **File**: `/src/stores/authStore.ts`
- Manages user authentication state globally
- Stores: `userRole`, `userEmail`, `isAuthenticated`
- Methods: `login()`, `logout()`, `setUserRole()`
- Persists data to localStorage

### 2. Header Component Updates
- **File**: `/src/components/Header.tsx`
- Displays logged-in user's role in top-right corner
- Shows user email on hover
- Logout button in dropdown menu
- Responsive design for mobile and desktop

### 3. Login Pages (Updated)
All login pages now integrate with the auth store:
- `/src/components/pages/FarmerLoginPage.tsx`
- `/src/components/pages/ConsumerLoginPage.tsx`
- `/src/components/pages/LaboratoryLoginPage.tsx`
- `/src/components/pages/AdminLoginPage.tsx`

**Features**:
- Email and password validation
- "Register here" link for new users
- Auto-login on successful authentication
- Redirect to respective portal after login

### 4. Registration Pages (New)
Complete registration flows for all user types:

#### Farmer Registration
- **File**: `/src/components/pages/FarmerRegisterPage.tsx`
- Fields: Full Name, Email, Password, Farm Name, Collector ID
- Auto-login after registration
- Redirects to Farmer Portal

#### Consumer Registration
- **File**: `/src/components/pages/ConsumerRegisterPage.tsx`
- Fields: Full Name, Email, Password, Phone, Address
- Auto-login after registration
- Redirects to Consumer Portal

#### Laboratory Registration
- **File**: `/src/components/pages/LaboratoryRegisterPage.tsx`
- Fields: Lab Name, Email, Password, Lab Code, Contact Person, Phone
- Auto-login after registration
- Redirects to Laboratory Testing Portal

#### Admin Registration
- **File**: `/src/components/pages/AdminRegisterPage.tsx`
- Fields: Full Name, Email, Password, Admin Code, Organization
- Auto-login after registration
- Redirects to Home

### 5. Protected Portal Pages
All portal pages now require authentication:

#### Farmer Portal
- **File**: `/src/components/pages/FarmerPortalPage.tsx`
- Requires: `isAuthenticated && userRole === 'farmer'`
- Redirects to login if not authenticated

#### Consumer Portal
- **File**: `/src/components/pages/ConsumerPortalPage.tsx`
- Requires: `isAuthenticated && userRole === 'consumer'`
- Redirects to login if not authenticated

#### Laboratory Testing Portal
- **File**: `/src/components/pages/LaboratoryTestingPage.tsx`
- Requires: `isAuthenticated && userRole === 'lab'`
- Redirects to login if not authenticated

### 6. Router Updates
- **File**: `/src/components/Router.tsx`
- Added routes for all registration pages:
  - `/farmer-register`
  - `/consumer-register`
  - `/laboratory-register`
  - `/admin-register`

## User Flow

### New User Registration
1. User clicks "LOGIN" in header
2. Selects their role (Farmer, Consumer, Lab, Admin)
3. Clicks "Register here" link
4. Fills registration form
5. System validates and creates account
6. Auto-login occurs
7. User is redirected to their portal

### Existing User Login
1. User clicks "LOGIN" in header
2. Selects their role
3. Enters email and password
4. System validates credentials
5. User is logged in
6. User is redirected to their portal

### Logout
1. User clicks on their role badge in top-right corner
2. Hovers to see dropdown
3. Clicks "Logout"
4. User is logged out
5. Header returns to "LOGIN" state

## Access Control

### Portal Access
- **Farmer Portal**: Only accessible to authenticated farmers
- **Consumer Portal**: Only accessible to authenticated consumers
- **Laboratory Portal**: Only accessible to authenticated lab users
- **Admin Portal**: Only accessible to authenticated admins

If a user tries to access a portal without proper authentication or role, they are redirected to the appropriate login page.

## Data Storage
- User credentials are stored in localStorage
- Auth state persists across page refreshes
- Logout clears all auth data

## Security Notes
- Passwords are validated (minimum 8 characters)
- Email format validation
- Password confirmation required on registration
- Admin login includes 2FA (two-factor authentication)

## Testing the System

### Test Farmer Flow
1. Go to `/farmer-login`
2. Click "Register here"
3. Fill in farmer registration form
4. Submit
5. Should see success message and redirect to Farmer Portal
6. Check header - should show "Farmer" badge

### Test Consumer Flow
1. Go to `/consumer-login`
2. Click "Register here"
3. Fill in consumer registration form
4. Submit
5. Should see success message and redirect to Consumer Portal
6. Check header - should show "Consumer" badge

### Test Lab Flow
1. Go to `/laboratory-login`
2. Click "Register here"
3. Fill in lab registration form
4. Submit
5. Should see success message and redirect to Laboratory Portal
6. Check header - should show "Lab" badge

### Test Admin Flow
1. Go to `/admin-login`
2. Click "Register here"
3. Fill in admin registration form
4. Submit
5. Should see success message and redirect to Home
6. Check header - should show "Admin" badge

### Test Access Control
1. Login as Farmer
2. Try to access `/consumer-portal` - should redirect to consumer login
3. Try to access `/laboratory-testing` - should redirect to lab login
4. Logout and verify header returns to "LOGIN"

## Future Enhancements
- Backend API integration for real authentication
- Email verification
- Password reset functionality
- Role-based dashboard customization
- User profile management
- Session timeout handling
