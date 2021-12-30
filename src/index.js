import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { ThirdwebWeb3Provider } from '@3rdweb/hooks';

//Chains supported: 4 = Rinkeby
const supportedChainIds = [4]

//Wallets supported: Metamask = injected wallet
const connectors = {
  injected: {},
}

// Render the App component to the DOM, wrapped with Thirdweb provider
ReactDOM.render(
  <React.StrictMode>
    <ThirdwebWeb3Provider
      connectors={connectors}
      supportedChainIds={supportedChainIds}
    >
      <App />
    </ThirdwebWeb3Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
