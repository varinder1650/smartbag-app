import { RootState } from '@/store/store';
import api from '@/utils/client';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

type NotificationContextType = {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    decrementUnreadCount: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const user = useSelector((state: RootState) => state.auth.user);
    const refreshUnreadCount = async () => {

        if (!user) {
            setUnreadCount(0);
            return;
        }
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.data) {
                setUnreadCount(res.data.count || res.data.unread_count || 0);
            }
        } catch (error) {
            if (__DEV__) console.error("Failed to fetch unread count:", error);
        }
    };

    const decrementUnreadCount = () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        refreshUnreadCount();

        // Poll every 30 seconds
        const interval = setInterval(refreshUnreadCount, 30000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, decrementUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}