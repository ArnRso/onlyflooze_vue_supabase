import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { supabase } from "@/supabase";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/types/supabase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(true);
  const profile = ref<Tables<"profiles"> | null>(null);

  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null;
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.value.id)
      .single();
    if (error) {
      console.error("Erreur lors de la récupération du profil:", error.message);
      profile.value = null;
    } else {
      profile.value = data;
    }
  };

  watch(user, () => {
    fetchProfile();
  });

  const signIn = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Error signing in:", error.message);
      return null;
    }
    user.value = data.user;
    return data.user;
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    user.value = null;
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Error signing up:", error.message);
      return null;
    }
    user.value = data.user;
    return data.user;
  };

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    user.value = session?.user ?? null;
  };

  const listenToAuthChanges = () => {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null;
    });
  };

  async function doneInit() {
    try {
      await checkSession();
    } catch (error) {
      console.error("Error during session check:", error);
    } finally {
      listenToAuthChanges();
      loading.value = false;
    }
  }

  doneInit();

  return {
    user,
    loading,
    profile,
    signIn,
    signOut,
    signUp,
    checkSession,
    listenToAuthChanges,
    fetchProfile,
  };
});
