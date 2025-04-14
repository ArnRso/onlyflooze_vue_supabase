import { ref, onMounted, watchEffect } from "vue";
import { supabase } from "@/supabase.js";

export default function useAuth() {
  const user = ref(null);
  const loading = ref(true);

  // Fonction pour se connecter
  const signIn = async (email, password) => {
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
  const signOut = async () => {
    await supabase.auth.signOut();
    user.value = null;
  };

  // Fonction pour s'inscrire
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Error signing up:", error.message);
      return null;
    }
    user.value = data.user;
    return data.user;
  };

  // Vérifie l'état de l'utilisateur au montage du composant
  onMounted(async () => {
    const {
      data: { user: authenticatedUser },
    } = await supabase.auth.getUser();
    user.value = authenticatedUser;
    loading.value = false;
  });

  // Met à jour l'utilisateur sur chaque changement d'authentification
  watchEffect(() => {
    const { data, error } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (error) {
          console.error("Error in auth state change:", error.message);
        }
        user.value = session?.user || null;
      }
    );
  });

  return {
    user,
    loading,
    signIn,
    signOut,
    signUp,
  };
}
