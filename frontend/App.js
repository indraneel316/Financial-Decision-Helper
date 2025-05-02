import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import { AuthProvider } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
    console.log('Rendering App with padding: top=40, bottom=20'); // Debug padding

    return (
        <SafeAreaView style={styles.container}>
            <AuthProvider>
                <DataProvider>
                    <AppNavigator />
                </DataProvider>
            </AuthProvider>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingTop: 40, // Approximate status bar/notch height
        paddingBottom: 20, // Approximate navigation bar/home indicator height
    },
});

registerRootComponent(App);
export default App;