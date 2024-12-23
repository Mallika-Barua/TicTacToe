import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TouchableOpacity, Text, Alert, FlatList, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { useSession } from '@/Share/ctx';
import * as FileSystem from 'expo-file-system';
import { setStorageItemAsync } from '@/Share/useStorageState';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [recordings, setRecordings] = useState<string[]>([]); // Ensure this is initialized as an empty array
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const { signOut } = useSession();
  const [playStatus, setPlayStatus] = useState<string>("Play");

  // Play a specific sound
  async function playSound(uri: string, selector: any) {
    try {
      console.log('Loading sound from URI:', uri);
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);
      setPlayStatus("Playing");
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayStatus("Play");
          console.log('Playback finished, unloading sound...');
          sound.unloadAsync();
        }
      });
    } catch (error) {
      setPlayStatus("Play");
      console.error('Error while playing sound:', error);
      alert('Failed to play the sound.');
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
  // async function stopRecording() {
  //   try {
  //     if (recording) {
  //       console.log('Stopping recording...');
  //       await recording.stopAndUnloadAsync();

  //       await Audio.setAudioModeAsync({
  //         allowsRecordingIOS: false,
  //       });

  //       const uri = recording.getURI(); // Get the URI of the recorded file
  //       console.log('Recording stopped and stored at:', uri);

  //       // Add the new URI to the recordings list
  //       setRecordings((prev) => [...prev, uri]);

  //       setRecording(undefined); // Clear recording state
  //       saveRecordings(recordings);
  //       console.log('recordings',recordings);
  //     } else {
  //       console.log('No recording to stop');
  //     }
  //   } catch (error) {
  //     console.error('Failed to stop recording:', error);
  //     Alert.alert('Recording Error', 'Could not stop recording.');
  //   }
  // }

  async function stopRecording() {
    try {
      if (recording) {
        console.log('Stopping recording...');
        await recording.stopAndUnloadAsync();
  
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
  
        const uri = recording.getURI(); // Get the URI of the recorded file
        console.log('Recording stopped and stored at:', uri);
  
        if (Platform.OS === 'web') {
          // Fetch the file and create a Blob
          const response = await fetch(uri!);
          const blob = await response.blob();
  
          // Generate a download link
          const fileName = `recording_${Date.now()}.m4a`;
          const url = URL.createObjectURL(blob);
  
          // Trigger file download
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
  
          console.log('Recording downloaded as:', fileName);
  
          // Add the Blob URL to recordings
          setRecordings((prev) => [...prev, uri!]);
        } else {
          // Native platforms: Move file to permanent storage
          const fileName = `recording_${Date.now()}.m4a`;
          const targetPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.moveAsync({
            from: uri!,
            to: targetPath,
          });
  
          console.log('File saved to disk at:', targetPath);
  
          setRecordings((prev) => [...prev, targetPath]);
        }
  
        setRecording(undefined); // Clear recording state
      } else {
        console.log('No recording to stop');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Could not stop recording.');
    }
  }
  

  async function saveRecordings(recordings : string[]) {
    try {
      await localStorage.setItem('recording', recordings.join(',')); // Save as comma-separated values
      console.log('recordings.',recordings);
      console.log('Recordings saved successfully.');
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  }
  
  async function loadRecordings() {
    try {
      const recordingsString = await localStorage.getItem('recording');
      if (recordingsString) {
        setRecordings(recordingsString.split(',')); // Convert back to an array
        console.log('Recordings loaded:', recordingsString.split(','));
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  }

  // Cleanup resources
  useEffect(() => {
    loadRecordings();
  },[]);

  return (
    <View style={styles.container}>
      {/* Recording Button */}
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />

      {/* List of Recorded Files */}
      <FlatList
        data={recordings || []} // Safeguard: Use an empty array if recordings is null
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.listItem}>
            <Text style={styles.listText}>Recording {index + 1}</Text>
            <Button title={playStatus} onPress={() => playSound(item,this)} />
          </View>
        )}
      />

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  listText: {
    fontSize: 16,
  },
});
