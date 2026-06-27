import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {authService, FirstAccessRequiredError} from '../services/authService';
import {userService} from '../services/userService';
import {UserDTO} from '../types';
import {extractUserIdFromToken, parseJwt} from '../utils/jwt';

interface AuthContextType {
    user: UserDTO | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    completeFirstAccess: (
        userId: number,
        newPassword: string,
        email: string,
        userName?: string,
    ) => Promise<void>;
    loginWithToken: (token: string, email: string, userName?: string) => void;
    logout: () => void;
    updateUser: (id: number, name: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const handleLogout = () => logout();
        document.addEventListener('auth:logout', handleLogout);

        try {
            const storedProfile = localStorage.getItem('currentUserProfile');
            const token = localStorage.getItem('hf_token');

            if (token) {
                const profile: UserDTO = storedProfile
                    ? JSON.parse(storedProfile)
                    : {name: '', email: ''};

                // Garante que o id do usuário (vindo das claims do JWT) esteja presente
                // mesmo quando o perfil salvo no storage não o contém.
                if (profile.id == null) {
                    const idFromToken = extractUserIdFromToken(token);
                    if (idFromToken != null) {
                        profile.id = idFromToken;
                        localStorage.setItem('currentUserProfile', JSON.stringify(profile));
                    }
                }

                if (profile.email || profile.name) {
                    setUser(profile);
                } else {
                    logout();
                }
            } else {
                logout();
            }
        } finally {
            setIsLoading(false);
        }

        return () => {
            document.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    const buildProfileFromToken = (token: string, fallback: UserDTO): UserDTO => {
        const claims = parseJwt(token);
        const idFromToken = extractUserIdFromToken(token);

        return {
            ...fallback,
            id: fallback.id ?? idFromToken,
            name: fallback.name || (typeof claims?.name === 'string' ? claims.name : '') || fallback.email.split('@')[0],
            email: fallback.email || (typeof claims?.email === 'string' ? claims.email : typeof claims?.sub === 'string' ? claims.sub : ''),
            permissions: Array.isArray(claims?.permissions) ? claims.permissions : [], // <-- aqui
        };
    };

    const persistSession = (token: string, profile: UserDTO) => {
        localStorage.setItem('hf_token', token);
        setUser(profile);
        localStorage.setItem('currentUserProfile', JSON.stringify(profile));
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await authService.login({email, password});
            const profile = buildProfileFromToken(response.token, {
                name: email.split('@')[0],
                email,
            });
            persistSession(response.token, profile);
            return true;
        } catch (error) {
            if (error instanceof FirstAccessRequiredError) {
                throw error;
            }
            console.error('Login failed:', error);
            throw error;
        }
    };

    const completeFirstAccess = async (
        userId: number,
        newPassword: string,
        email: string,
        userName?: string,
    ) => {
        const response = await authService.changePassword({userId, newPassword});
        const profile = buildProfileFromToken(response.token, {
            id: userId,
            name: userName ?? email.split('@')[0],
            email,
        });
        persistSession(response.token, profile);
    };

    const loginWithToken = (token: string, email: string, userName?: string) => {
        const profile = buildProfileFromToken(token, {
            name: userName ?? email.split('@')[0],
            email,
        });
        persistSession(token, profile);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('hf_token');
        localStorage.removeItem('currentUserProfile');
    };

    const updateUser = async (id: number, name: string, email: string) => {
        try {
            if (!user) return;

            const updatedUser = await userService.updateUser(id, {name, email});
            setUser(updatedUser);
            localStorage.setItem('currentUserProfile', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Update failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{user, isLoading, login, completeFirstAccess, loginWithToken, logout, updateUser}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}