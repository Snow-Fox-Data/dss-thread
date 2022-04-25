import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Common from './common/common';
import Home from "./pages/home";
import Catalog from "./pages/catalog";
import NotFound from "./pages/notfound"

ReactDOM.render(
  // <React.StrictMode>
  <BrowserRouter basename={App.BASE_PATH}>
    <Routes>
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="dss" element={<Home />} >
          <Route path=":id" element={<Home />} />
        </Route>
        <Route path="catalog" element={<Catalog />} />
      </Route>
    </Routes>
  </BrowserRouter>,
  // </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
