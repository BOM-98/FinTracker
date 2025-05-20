'use client';

import { Amplify } from 'aws-amplify';
import amplifyAppConfig from './amplifyconfiguration';

Amplify.configure({ ...amplifyAppConfig }, { ssr: true });

export default function ConfigureAmplifyClientSide() {
  return null;
}
