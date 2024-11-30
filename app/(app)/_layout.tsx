import { Text } from 'react-native';
import { Redirect, Slot } from 'expo-router';

import { useSession } from '../../Share/ctx';

export default function AppLayout() {
  const { session, isLoading } = useSession();
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }
  return <Slot />;
}
