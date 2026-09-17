// Using a valid UUID format for database compatibility
export const MOCK_USER = {
  id: "ec82eb48-e580-4273-a080-cd5b093bf210",
  email: "ayush1337@hotmail.com",
  name: "Ayush Singh",
  google_id: "107064316296359862884",
  first_name: null,
  last_name: null,
  avatar_url:
    "https://lh3.googleusercontent.com/a/ACg8ocJx4VGCebB8fNknJZwzfriofLk1RhmC1DBSGZF4m2oaZLv9r2so=s96-c",
};

export const mockAuth = {
  user: MOCK_USER,
  isAuthenticated: true,
  loading: false,
  signInWithGoogle: async () => {},
  logout: () => {
    console.log("Mock logout - no action taken");
  },
};
