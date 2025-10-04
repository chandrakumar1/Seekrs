import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../lib/supabase';
import { authService } from '../services/authService';

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, role: 'teacher' | 'student') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getUserProfile()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));

    authService.onAuthStateChange((newProfile) => {
      setProfile(newProfile);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    await authService.signIn(email, password);
    const userProfile = await authService.getUserProfile();
    setProfile(userProfile);
  };

  const signUp = async (email: string, password: string, username: string, role: 'teacher' | 'student') => {
    await authService.signUp(email, password, username, role);
    const userProfile = await authService.getUserProfile();
    setProfile(userProfile);
  };

  const signOut = async () => {
    await authService.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
