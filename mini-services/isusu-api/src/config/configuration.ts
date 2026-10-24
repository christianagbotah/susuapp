const configuration = () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'isusu-pro-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
});

export default configuration;
