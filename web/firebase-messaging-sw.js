importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDDz9KIuH4iCan7GqVvcjgImawUMg3wjlQ",
  authDomain: "xlcare-partner.firebaseapp.com",
  projectId: "xlcare-partner",
  storageBucket: "xlcare-partner.firebasestorage.app",
  messagingSenderId: "269800696958",
  appId: "1:269800696958:web:cc94ebcb99bb59fb4f7c2f",
  measurementId: "G-BH9CB8NVQG"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
