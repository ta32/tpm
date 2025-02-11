'use client';
import React, { useEffect } from 'react';
import { useUser } from 'contexts/user.context';
import { UserStatus } from 'contexts/reducers/user.reducer';
import { useRouter } from 'next/navigation';
import PasswordManager from 'components/dashboard/PasswordManager';
import { Routes, useLocation } from 'contexts/location.context';

export default function Dashboard() {
  const [location] = useLocation();
  const [user] = useUser();
  const router = useRouter();

  // Navigation
  useEffect(() => {
    if (user.status === UserStatus.OFFLINE || location === Routes.HOME) {
      router.push('/');
    }
  }, [user.status, router, location]);

  return (
    <PasswordManager />
  );
}
