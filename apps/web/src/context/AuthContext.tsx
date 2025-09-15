// apps/web/src/context/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Definimos la estructura de los datos que compartiremos
interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Creamos el contexto con un valor inicial por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creamos el Proveedor, un componente que envolverá nuestra aplicación
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Para manejar la carga inicial
  const router = useRouter();

  // Efecto para verificar si hay un token en localStorage al cargar la app
  useEffect(() => {
    const storedToken = localStorage.getItem('primus_token');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('primus_token', newToken);
    router.push('/dashboard'); // Redirigir al dashboard después del login
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('primus_token');
    router.push('/login'); // Redirigir al login después del logout
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Creamos un "hook" personalizado para usar nuestro contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
