import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    flaskToken?: string;
    user: {
      id: string;
      name: string;
      email: string;
      userType: 'candidate';
      avatar?: string;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    userType: 'candidate';
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    userType: 'candidate';
    avatar?: string;
  }
}
