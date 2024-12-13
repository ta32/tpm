import React, { useEffect } from 'react';
import { useUser } from 'contexts/use-user';
import { UserStatus } from 'contexts/reducers/user-reducer';
import { useRouter } from 'next/router';
import DashboardContent from 'components/dashboard/DashboardContent';

export default function Dashboard() {
  const [user] = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user.status === UserStatus.OFFLINE) {
      router.push('/').catch((error) => console.error('Failed to navigate to the root page:', error));
    }
  }, [user.status, router]);

  return (
    <DashboardContent />
  );
}
