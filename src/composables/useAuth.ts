import { ref, onMounted, Ref } from "vue";
import { supabase } from "@/supabase";
import type { User } from "@supabase/supabase-js";

const user: Ref<User | null> = ref(null);

export default function useAuth() {
  const loading = ref(true);

  // Fonction pour se connecter
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

  // Fonction pour se déconnecter
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    user.value = null;
  };

  // Fonction pour s'inscrire
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

  return {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    checkSession,
    listenToAuthChanges,
  };
}
