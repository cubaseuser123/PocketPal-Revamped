export type AuthProviderProps = {
  children: React.ReactNode;
};

export type AuthContextValue = {
  authenticated: boolean;
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  logout: () => Promise<void>;
};

export type RequestProps = {
  method: string;
  url: string;
  data?: any;
};

export type HttpResponse = {
  status: number;
  headers: Record<string, string>;
  data: any;
  url: string;
};

export type SendOtpProps = {
  name: string;
  phone: string;
  baseUrl: string;
};

export type VerifyOtpProps = {
  phone: string;
  otp: string;
  baseUrl: string;
};
