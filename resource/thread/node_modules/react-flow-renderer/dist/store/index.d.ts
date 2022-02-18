import { Store } from 'redux';
import { ReactFlowState } from '../types';
export declare const initialState: ReactFlowState;
declare const store: Store;
export declare type ReactFlowDispatch = typeof store.dispatch;
export default store;
