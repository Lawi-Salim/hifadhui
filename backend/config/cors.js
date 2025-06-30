const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://hifadhui.vercel.app'
  // Ajoutez d'autres origines autorisées si nécessaire
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

export { corsOptions };
