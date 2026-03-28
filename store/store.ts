import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import addressReducer from '../slices/addressSlice';
import authReducer from '../slices/authSlice';
import cartReducer from '../slices/cartSlice';
import checkoutAddressReducer from '../slices/checkoutAddressSlice';
import addressSelectionReducer from '../slices/porterAddressSlice';
import priceReducer from '../slices/priceSlice';
import { persistConfig } from './persistConfig';
import { setStoreRef } from './storeRef';

import mapPickerReducer from '../slices/mapPickerSlice';
import shopStatusReducer from '../slices/shopStatusSlice';

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
    checkoutAddress: checkoutAddressReducer,
    price: priceReducer,
    shopStatus: shopStatusReducer,
    mapPicker: mapPickerReducer,
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