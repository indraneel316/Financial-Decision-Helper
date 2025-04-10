import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import BudgetCycleScreen from '../screens/BudgetCycleScreen';
import TransactionScreen from '../screens/TransactionScreen';
import RecommendationScreen from '../screens/RecommendationScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import {View,Text} from "react-native";

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
                <Text>Loading...</Text>
            </View>
        ); // Show loading UI instead of null
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={user ? 'Home' : 'SignIn'}
                screenOptions={{
                    headerStyle: { backgroundColor: '#4CAF50' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                {user ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="BudgetCycle" component={BudgetCycleScreen} options={{ title: 'Budget Cycle' }} />
                        <Stack.Screen name="Transactions" component={TransactionScreen} options={{ title: 'Transactions' }} />
                        <Stack.Screen name="Recommendations" component={RecommendationScreen} options={{ title: 'AI Recommendations' }} />
                        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
                        <Stack.Screen name="Settings" component={UserSettingsScreen} options={{ title: 'Settings' }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;