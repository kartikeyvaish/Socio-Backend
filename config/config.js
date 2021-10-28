const DB_URLS = {
  development: `mongodb://${process.env.host}:${process.env.DB_PORT}/${process.env.DB_Name}`,
  production: process.env.atlas_url,
};

const Configuration = {
  Port: process.env.PORT || 3000,
  db_url: DB_URLS[process.env.NODE_ENV],
  db_config: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

module.exports = Configuration;
