import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import {DataProvider} from "./src/contexts/DataContext";

const App = () => {
    console.log('Rendering App');
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
    },
});

registerRootComponent(App);
export default App;