// Las pruebas e2e corren con logs en silencio y sin base de datos real.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'secreto-solo-para-pruebas-e2e-0123456789';
