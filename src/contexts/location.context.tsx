import { createContext, ReactNode, useContext, useState } from 'react';

export enum Routes {
  HOME = '/',
  DASHBOARD = '/dashboard',
}

type LocationContextType = [Routes, (newLocation: Routes) => void];

export const LocationContext = createContext<LocationContextType>([Routes.HOME, () => {}]);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Routes>(Routes.HOME);

  return <LocationContext.Provider value={[location, setLocation]}>{children}</LocationContext.Provider>;
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('locationContext must be used within a LocationProvider');
  }
  return context;
};
