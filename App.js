import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { MessageProvider } from "./contexts/MessageContext";


const App = () => {
  return (<MessageProvider><AppNavigator /></MessageProvider>);
};

export default App;