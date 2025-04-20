const firebaseConfig = {
  apiKey: "AIzaSyDTdnXdYB3kxvSfcUtJ4muj7twOWRlWIOQ",
  authDomain: "arduinotempmonitor.firebaseapp.com",
  databaseURL: "https://arduinotempmonitor-default-rtdb.firebaseio.com",
  projectId: "arduinotempmonitor",
  storageBucket: "arduinotempmonitor.appspot.com",
  messagingSenderId: "147978830807",
  appId: "1:147978830807:web:394e09cdc252819cc04192",
  measurementId: "G-PS1X0CKN2G"
};

firebase.initializeApp(firebaseConfig);

// session tracking and login logging
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const uid = user.uid;

    const sessionRef = firebase.database().ref("sessions/" + uid);
    sessionRef.set({
      email: user.email,
      status: "active",
      timestamp: Date.now()
    });
    sessionRef.onDisconnect().remove();

    firebase.database().ref("activityLogs/" + uid).push({
      event: "login",
      timestamp: Date.now(),
      email: user.email
    });
  }
});
