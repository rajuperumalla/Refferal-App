# MediReferral — Referral Agent Partner App

A comprehensive Flutter mobile application for healthcare referral agents/partners to manage patient leads, track surgical journeys, and monitor commission earnings.

---

## 🚀 Features

### ✅ Authentication
- Phone number login with OTP verification
- Country code selector (+91 India default)
- "Remember Me" functionality
- Biometric login support (fingerprint/face ID)
- JWT token management with auto-refresh

### 📊 Dashboard
- Month's earnings overview with growth indicator
- Stats grid: Active Patients, Pending Surgeries, Conversion Rate, Avg Commission
- Real-time recent activity feed
- Quick Add Patient FAB

### 👥 Patient Management
- Full patient list with search and multi-filter chips
- Status filters: All / New / Contacted / OPD / IPD / Completed / Lost
- Color-coded status indicators
- Patient detail view with 4 tabs:
  - **Overview** — contact, medical, financial, and date info
  - **Timeline** — visual journey from lead creation to commission payment
  - **Documents** — bills, prescriptions, reports
  - **Notes** — add/view comments
- Quick Call & WhatsApp actions from card

### ➕ Add Patient Lead
- 3-step guided form:
  1. **Basic Info** — name, phone, age, gender
  2. **Medical Details** — specialty, procedure, city, urgency
  3. **Financial** — budget range, insurance, notes
- Inline validation with error messages
- Confirmation dialog before submission

### 💰 Earnings / Commissions
- Monthly earnings card with % growth from previous month
- Bar chart — 6-month breakdown (powered by fl_chart)
- Top earning procedures ranking
- **Pending** tab — commissions awaiting verification
- **Paid** tab — payment history with UTR numbers

### 🔔 Notifications
- Categorized: All / Commission / Patients / Appointments / Alerts
- Read/unread state
- Push notification integration (FCM)

### 👤 Profile & Settings
- Performance stats (total leads, conversion rate)
- Profile & bank details management
- App settings: notifications, biometric, dark mode toggles
- Support & help links
- Logout with confirmation

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flutter 3.10+ |
| Language | Dart 3.0+ |
| State Management | Riverpod 2.x |
| Navigation | Go Router 14.x |
| HTTP Client | Dio 5.x |
| Local Storage | SharedPreferences |
| Charts | FL Chart |
| OTP Input | Pinput |
| Timeline | timeline_tile |
| Animations | flutter_animate |
| Push Notifications | Firebase Cloud Messaging |

---

## 📁 Project Structure

```
lib/
├── main.dart                    # App entry point
├── app.dart                     # App widget + Go Router config
├── core/
│   ├── constants/
│   │   ├── app_colors.dart      # Color palette
│   │   ├── app_strings.dart     # All string constants
│   │   └── api_constants.dart   # API endpoints + storage keys
│   ├── theme/
│   │   └── app_theme.dart       # Material 3 light/dark themes
│   ├── network/
│   │   └── dio_client.dart      # Dio setup + interceptors + Mock API
│   └── utils/
│       └── formatters.dart      # Currency, date, phone formatters
├── features/
│   ├── auth/
│   │   ├── models/user_model.dart
│   │   ├── providers/auth_provider.dart
│   │   └── screens/
│   │       ├── splash_screen.dart
│   │       ├── login_screen.dart
│   │       └── otp_screen.dart
│   ├── dashboard/
│   │   └── screens/dashboard_screen.dart
│   ├── patients/
│   │   ├── models/patient_model.dart
│   │   ├── providers/patients_provider.dart
│   │   └── screens/
│   │       ├── patients_screen.dart
│   │       ├── add_patient_screen.dart
│   │       └── patient_details_screen.dart
│   ├── earnings/
│   │   └── screens/earnings_screen.dart
│   ├── notifications/
│   │   └── screens/notifications_screen.dart
│   └── profile/
│       └── screens/profile_screen.dart
└── shared/
    └── widgets/
        ├── main_shell.dart      # Bottom nav shell
        ├── custom_button.dart   # Reusable buttons
        ├── stat_card.dart       # Stats widget
        └── patient_card.dart    # Patient list card
```

---

## 🚦 Getting Started

### Prerequisites
- Flutter SDK >= 3.10.0
- Dart >= 3.0.0
- Android Studio / VS Code
- Android SDK 21+ / iOS 12+

### Installation

```bash
# 1. Clone or copy the project
cd referral_agent_app

# 2. Install dependencies
flutter pub get

# 3. Run on device/emulator
flutter run

# 4. Build APK for Android
flutter build apk --release

# 5. Build for iOS
flutter build ios --release
```

### Demo Mode
The app runs with **mock data** out of the box (no backend needed):
- Enter any phone number → OTP is sent (mock)
- Enter any 6-digit OTP (e.g., `123456`) → logged in
- All data is pre-populated with realistic sample patients

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary Blue | `#2563EB` |
| Success Green | `#10B981` |
| Warning Amber | `#F59E0B` |
| Error Red | `#EF4444` |
| Background | `#F9FAFB` |
| Heading Font | Poppins Bold |
| Body Font | Inter Regular |

### Patient Status Colors
| Status | Color |
|--------|-------|
| 🔵 New | Blue |
| 🟡 Contacted | Amber |
| 🟢 OPD Scheduled | Green |
| 🟣 IPD Confirmed | Purple |
| ✅ Completed | Dark Green |
| ❌ Lost | Red |

---

## 🔌 API Integration

Replace mock data in `lib/core/network/dio_client.dart` with real API calls:

```dart
// Change base URL in api_constants.dart
static const String baseUrl = 'https://your-api.com';

// Implement real methods in DioClient
// The MockApiService class shows the expected response shape
```

### Expected Endpoints
```
POST /api/auth/send-otp
POST /api/auth/verify-otp
GET  /api/agent/dashboard
GET  /api/agent/patients?status=all&search=&sort=recent
POST /api/agent/leads
GET  /api/agent/patients/{id}
GET  /api/agent/commissions/summary
GET  /api/agent/commissions/pending
GET  /api/agent/commissions/paid
GET  /api/agent/notifications
```

---

## 📱 Screenshots Flow

```
Splash → Login → OTP → Dashboard
                         ├── Add Patient (FAB)
                         ├── Patients Tab
                         │    └── Patient Details (Overview | Timeline | Documents | Notes)
                         ├── Earnings Tab (Overview | Pending | Paid)
                         ├── Notifications Tab
                         └── Profile Tab
```

---

## 🗺 Roadmap

- [ ] Firebase push notifications (FCM)
- [ ] Offline caching with Hive
- [ ] Document upload (camera + gallery)
- [ ] Biometric authentication
- [ ] PDF bill viewer
- [ ] Referral sharing via deep link
- [ ] Dark mode
- [ ] Multi-language (Hindi, Telugu, Tamil)

---

## 📄 License

Proprietary — Mediciti Healthcare © 2024
