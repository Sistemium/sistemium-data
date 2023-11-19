import axios from 'axios';
import type { AxiosRequestConfig } from 'axios'
// @ts-ignore
import settleUntyped from 'axios/lib/core/settle';

type SettleCallback = (response: any) => void
export type AxiosSettle = (resolve: SettleCallback, reject: SettleCallback, response: any) => void

export default axios.create();

export function axiosInstance(config: AxiosRequestConfig) {
  return axios.create(config);
}

const settle: AxiosSettle = settleUntyped

export { axios, settle };
