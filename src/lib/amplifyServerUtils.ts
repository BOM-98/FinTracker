import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

import baseAppConfig from '@/amplifyconfiguration';

// This is the Amplify configuration for the server - server specific additions can happen here
const serverConfig = {
  ...baseAppConfig,
  ssr: true
};

export const { runWithAmplifyServerContext } = createServerRunner({
  config: serverConfig
});

// Optional: Export a pre-configured getCurrentUser for convenience in Server Components/Route Handlers
// import { getCurrentUser as getCurrentUserServer } from 'aws-amplify/auth/server';
// import { cookies } from 'next/headers';

// export async function AuthGetCurrentUserServer() {
//   try {
//     const currentUser = await runWithAmplifyServerContext({
//       nextServerContext: { cookies },
//       operation: (contextSpec) => getCurrentUserServer(contextSpec)
//     });
//     return currentUser;
//   } catch (error) {
//     console.error('Error fetching current user (server):', error);
//     return null;
//   }
// }
