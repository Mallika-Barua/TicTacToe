import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TouchableOpacity, Text, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { useSession } from '@/Share/ctx';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const { signOut } = useSession();

  // Play the sound
  async function playSound() {
    try {
      console.log('Loading sound...');
      const { sound } = await Audio.Sound.createAsync(require('./assets/Hello.mp3'));
      setSound(sound);

      console.log('Playing sound...');
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log('Playback finished, unloading sound...');
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error while playing sound:', error);
      Alert.alert('Playback Error', 'Failed to play the sound.');
    }
  }

  // Start recording
  async function startRecording() {
    try {
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        console.log('Requesting permission...');
        const response = await requestPermission();
        if (!response.granted) {
          Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Could not start recording.');
    }
  }

  // Stop recording
  async function stopRecording() {
    try {
      if (recording) {
        console.log('Stopping recording...');
        await recording.stopAndUnloadAsync();
  
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
  
        const uri = recording.getURI(); // This is the recorded file URI
        console.log('Recording stopped and stored at:', uri);
  
        // Optionally, alert the user
        alert(`Audio saved at: ${uri}. Conversion may be required.`);
  
        // Here you can send the URI to a backend server for MP3 conversion
        // or use a library like react-native-ffmpeg for local conversion (requires bare workflow).
  
        setRecording(undefined); // Clear recording state
      } else {
        console.log('No recording to stop');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Could not stop recording.');
    }
  }

  // Cleanup resources
  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound...');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      {/* Recording Button */}
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />

      {/* Play Sound Button */}
      <Button title="Play Sound" onPress={playSound} />

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
      >
        <Text style={styles.buttonText}>Already Signed Up? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6200ea',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
