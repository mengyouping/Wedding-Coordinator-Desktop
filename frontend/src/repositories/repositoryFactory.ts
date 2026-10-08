import {appConfig} from '../config/appConfig';import type {WeddingRepository} from './WeddingRepository';import {jsonWeddingRepository} from './jsonWeddingRepository';import {httpWeddingRepository} from './httpWeddingRepository';
export function createWeddingRepository():WeddingRepository{return appConfig.dataMode==='api'?httpWeddingRepository:jsonWeddingRepository}
