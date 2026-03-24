# SmartBag App

Welcome to **SmartBag**, a hyper-local service and e-commerce application built with Expo.

## What does this app do?

SmartBag is a comprehensive mobile application that offers various services to its users in a seamless experience. Key features include:

- **Product Ordering:** Browse and order products easily with an integrated cart and checkout system.
- **Printouts & Tickets:** Upload documents to request printouts (integrates PDF processing) and acquire tickets.
- **Porter Services:** Request porter services for logistics and moving goods.
- **Delivery Partner Mode:** Built-in capabilities and views for delivery personnel to view active orders, accept available orders, and track routing.
- **Order Tracking:** Real-time visibility into active and past orders.
- **Address & Profile Management:** Save addresses and manage user profiles directly from the app.

## Environment Variables

To run this project locally, you will need to create a `.env` file in the root directory based on `.env.example` (if provided) or add the following required environment variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL_DEV=your_dev_api_url_here
EXPO_PUBLIC_API_URL=your_production_api_url_here

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here

# Cloudinary (Optional - for file uploads like printouts)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset_here
```

## Tech Stack

This project is built using modern, standard tools in the React Native ecosystem:

- **Framework:** [React Native](https://reactnative.dev/) powered by [Expo](https://expo.dev/)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing
- **UI & Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/) and [`redux-persist`](https://github.com/rt2zz/redux-persist) for persisting state across sessions
- **Data Fetching:** [Axios](https://axios-http.com/)
- **Authentication:** [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/) (For Google Sign-In)
- **PDF Manipulation:** `pdf-lib` for handling printout requirements
- **Error Tracking & Monitoring:** [Sentry](https://docs.sentry.io/platforms/react-native/) (`@sentry/react-native`)
- **Storage:** React Native Async Storage and Expo Secure Store

## Architecture

The project's architecture is structured to separate concerns, making it highly modular and scalable:

1. **File-Based Routing (`app/`):** Utilizes Expo Router. The `app/` folder dictates the navigation flow, supporting separate hierarchies like authentication flows `(auth)`, customer tabs `(tabs)`, delivery screens `(delivery)`, and order flows `(orders)`.
2. **Feature Components (`components/`):** React components are organized by domain/feature (e.g., `components/delivery/`, `components/printout/`, `components/Checkout/`). This encapsulates UI markup naturally.
3. **State Slices (`slices/` & `store/`):** Redux logic is divided into feature slices (like `cart.thunks.ts`), separating the business logic of data caching and mutations from the UI layer.
4. **Custom Hooks (`hooks/`):** Reusable business logic, such as data fetching (e.g., `useProducts`), is abstracted into React custom hooks.
5. **Secure Storage & Offline Capability:** Makes use of `redux-persist` alongside Async Storage for state persistence, giving users a responsive offline-aware experience.

## Getting Started

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file with the specified keys above.

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. You can open the app on an Android emulator, iOS simulator, or a physical device using the Expo Go app.
