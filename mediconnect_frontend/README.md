# MediConnect Frontend

This is the Flutter frontend application for the MediConnect referral platform, built following the architecture specifications.

## Project Structure
- `lib/core/`: Contains app configurations, routing (GoRouter), and custom themes.
- `lib/features/`: Feature-sliced architecture. Contains feature modules like `auth`, `agent`, `doctor`, and `admin`. Inside each feature, you will find `data`, `domain`, and `presentation` layers.

## Tech Stack
- **Framework:** Flutter (using Material 3)
- **State Management:** Riverpod
- **Routing:** GoRouter
- **HTTP Client:** Dio
- **Theming:** Google Fonts (Poppins), Custom Tailwind-inspired theme configuration.

## Getting Started

If you have the Flutter SDK installed on your machine, simply run:

```bash
flutter pub get
flutter run
```

If you do NOT have Flutter installed yet, you can test these files out by dragging the `lib` folder and `pubspec.yaml` into [FlutLab](https://flutlab.io/) or [Project IDX](https://idx.dev/).
