export interface AppConfig {

  app: {
    name: string;
    version: string;
    description: string;
    aircraft: string;
  };

  copyright: {
    year: string;
    disclaimer: string;
  };

  donations: {
    enabled: boolean;
    upi: {
      id: string;
      displayName: string;
      note: string;
    };
  };

  metar: {
    primary: 'checkwx' | 'aviationweather';
    corsProxy: string;
    aviationWeather: {
      baseUrl: string;
    };
    checkwx: {
      key: string;
      baseUrl: string;
    };
  };

  contactus: {
    emailjs: {
      serviceId: string;
      templateId: string;
      publicKey: string;
    };
    social: {
      linkedin: string;
      github: string;
      stackoverflow: string;
      twitter: string;
      githubIssues: string;
    };
  };

  tracking: {
    enabled: boolean;
    logEvents: boolean;
    supabase: {
      url: string;
      anonKey: string;
      usersTable: string;
      eventsTable: string;
    };
  };

  developer: {
    name: string;
    email: string;
    hamCallsign: string;
    pilotLicense: string;
    location: string;
  };

  debug: {
    enabled: boolean;
  };
}
