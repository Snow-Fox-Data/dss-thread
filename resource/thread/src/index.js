import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Common from './common/common';
import Home from "./pages/home";
import Catalog from "./pages/catalog";

ReactDOM.render(
  // <React.StrictMode>
  <BrowserRouter basename={App.CURRENT_URL}>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
      </Route>
    </Routes>
    {/* <App /> */}
  </BrowserRouter>,
  // </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
