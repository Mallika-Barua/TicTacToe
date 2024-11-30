import { Slot } from 'expo-router';
import { SessionProvider } from '../Share/ctx';

export default function Root() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}
