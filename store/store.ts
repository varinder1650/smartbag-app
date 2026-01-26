// import { configureStore } from '@reduxjs/toolkit';
// import { persistReducer, persistStore } from 'redux-persist';
// import addressReducer from '../slices/addressSlice';
// import authReducer from '../slices/authSlice';
// import cartReducer from '../slices/cartSlice';
// import addressSelectionReducer from '../slices/porterAddressSlice';
// import priceReducer from '../slices/priceSlice';
// import { persistConfig } from './persistConfig';

// const persistCartReducer = persistReducer(
//   persistConfig,
//   cartReducer
// );

// export const store = configureStore({
//   reducer: {
//     cart: persistCartReducer,
//     auth: authReducer,
//     address: addressReducer,
//     addressSelection: addressSelectionReducer,
//     price: priceReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// });

// export const persistor = persistStore(store);

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;


import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import addressReducer from '../slices/addressSlice';
import authReducer from '../slices/authSlice';
import cartReducer from '../slices/cartSlice';
import addressSelectionReducer from '../slices/porterAddressSlice';
import priceReducer from '../slices/priceSlice';
import { persistConfig } from './persistConfig';
import { setStoreRef } from './storeRef'; // Import this

import shopStatusReducer from '../slices/Shopstatusslice';

const persistCartReducer = persistReducer(
  persistConfig,
  cartReducer
);

export const store = configureStore({
  reducer: {
    cart: persistCartReducer,
    auth: authReducer,
    address: addressReducer,
    addressSelection: addressSelectionReducer,
    price: priceReducer,
    shopStatus: shopStatusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Set store reference AFTER creating store
setStoreRef(store);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;