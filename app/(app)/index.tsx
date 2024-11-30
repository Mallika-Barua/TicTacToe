import { Button, Text, View } from 'react-native';

import { useSession } from '../../Share/ctx';
import { router } from 'expo-router';

export default function Index() {
  const { signOut } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button 
        onPress={() => {signOut();
          router.replace('/sign-in');}}
        title='Sign Out'
      />
    </View>
  );
}
