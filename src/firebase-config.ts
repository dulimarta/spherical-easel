import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDNA-9m5KvjcxAeTE6ixr_bhXr2Hs2zNys",
  authDomain: "spherical-easel.firebaseapp.com",
  projectId: "spherical-easel",
  storageBucket: "spherical-easel.appspot.com",
  messagingSenderId: "157369820516",
  appId: "1:157369820516:web:70391e3fea4b7d6ef7c671"
};

firebase.initializeApp(firebaseConfig);

// Allow all .vue components to access Firebase Auth, Firestore, and Storage
// via new instance variables this.$appAuth, this.$appDB, this.$appStorage
export const appAuth  = firebase.auth();
export const appDB = firebase.firestore();
export const appStorage = firebase.storage();