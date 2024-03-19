// userAccountStore.ts
import { defineStore } from 'pinia';
import { db } from "@/firebase-config";
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';

export const useUserAccountStore = defineStore('userAccount', {
  state: () => ({
    userProfile: null as UserProfile | null,
  }),
  actions: {
    async fetchUserProfile(uid: string) {
      const userDocRef = doc(db, 'users', uid); // Use the Firestore instance here
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        this.userProfile = userDocSnap.data();
      } else {
        console.log("No such user profile!");
      }
    }
  }
});