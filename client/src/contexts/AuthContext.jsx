
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let authSubscription = null;

        // Safe session check
        const initAuth = async () => {
            // Safety timeout: if auth takes more than 3 seconds, force stop loading
            const timeoutId = setTimeout(() => {
                if (loading) {
                    console.warn("Auth initialization timed out, proceeding anyway.");
                    setLoading(false);
                }
            }, 3000);

            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (data?.session) {
                    setUser(data.session.user);
                    await fetchProfile(data.session.user.id);
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
            }
        };

        const setupListener = async () => {
            const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("Auth Event:", event);
                if (session) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }
                setLoading(false);
            });
            authSubscription = data.subscription;
        };

        setupListener();
        initAuth();

        return () => {
            if (authSubscription) authSubscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        console.log('Fetching profile for:', userId);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    client:client_id (
                        id,
                        phone,
                        name,
                        points_balance,
                        user_type
                    )
                `)
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // If it's a "no rows" error, maybe we should create a default one?
                if (error.code === 'PGRST116') {
                    console.warn('Profile not found, creating default client profile.');
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([{ id: userId, role: 'client' }])
                        .select()
                        .single();
                    if (!createError) {
                        setProfile(newProfile);
                        return;
                    }
                }
                setProfile(null);
            } else {
                console.log('Profile loaded:', data);

                // Sync role from client user_type if available
                if (data.client?.user_type && data.role !== data.client.user_type) {
                    console.log('Syncing role from client user_type:', data.client.user_type);
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ role: data.client.user_type })
                        .eq('id', userId);

                    if (!updateError) {
                        data.role = data.client.user_type;
                    }
                }

                setProfile(data);
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        }
    };

    const login = async (email, password) => {
        // Sign out first to ensure a clean state
        await supabase.auth.signOut();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        try {
            console.log("Logging out...");
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setProfile(null);
        } catch (err) {
            console.error("Error during logout:", err);
            // Even if there's an error, clear local state
            setUser(null);
            setProfile(null);
        }
    };

    const value = {
        user,
        profile,
        loading,
        login,
        signUp,
        logout,
        isAdmin: profile?.role === 'admin',
        isClient: profile?.role === 'client'
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="loading-screen">Cargando...</div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
